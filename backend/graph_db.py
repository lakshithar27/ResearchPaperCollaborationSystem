import logging
import socket
import time
from typing import Dict, Any, List, Optional
from neo4j import GraphDatabase, exceptions as neo4j_exceptions
from config import NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD
from database import execute_query

logger = logging.getLogger("graph_db")

def _probe_neo4j_port(host="127.0.0.1", port=7687, timeout=0.15) -> bool:
    """Rapid non-blocking probe to avoid connection hangs when Neo4j is offline."""
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except (OSError, ConnectionRefusedError, TimeoutError):
        return False

class Neo4jService:
    def __init__(self):
        self._driver = None
        self._connected = False
        self._last_attempt_time = 0.0
        self._retry_interval = 60.0  # seconds between reconnection attempts

    def _connect(self):
        self._last_attempt_time = time.time()
        # Fast non-blocking socket check first
        if not _probe_neo4j_port("127.0.0.1", 7687, timeout=0.15):
            self._connected = False
            self._driver = None
            logger.info("Neo4j port 7687 is offline. Instant relational MySQL graph fallback active.")
            return

        try:
            self._driver = GraphDatabase.driver(
                NEO4J_URI,
                auth=(NEO4J_USER, NEO4J_PASSWORD),
                connection_timeout=1
            )
            self._driver.verify_connectivity()
            self._connected = True
            logger.info("Connected successfully to Neo4j at %s", NEO4J_URI)
        except Exception as e:
            self._connected = False
            self._driver = None
            logger.warning("Neo4j is currently unreachable (%s). Relational graph fallback is active.", str(e))

    def is_available(self) -> bool:
        if not self._connected:
            # Only retry if enough time has passed
            if time.time() - self._last_attempt_time > self._retry_interval:
                self._connect()
        return self._connected

    def close(self):
        if self._driver:
            self._driver.close()

    def sync_all_from_mysql(self) -> Dict[str, Any]:
        """Reads relational data from MySQL and synchronizes the Neo4j Knowledge Graph."""
        if not self.is_available():
            return {"status": "skipped", "message": "Neo4j is not connected. Start Neo4j to enable graph sync."}

        try:
            with self._driver.session() as session:
                # 1. Create constraints
                session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (r:Researcher) REQUIRE r.id IS UNIQUE")
                session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (p:Paper) REQUIRE p.id IS UNIQUE")
                session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (t:Topic) REQUIRE t.id IS UNIQUE")

                # 2. Sync Researchers
                researchers = execute_query("SELECT ResearcherID, Name, Email, Affiliation, ResearchArea, Role FROM Researchers")
                for r in researchers:
                    session.run(
                        """
                        MERGE (res:Researcher {id: $id})
                        SET res.name = $name,
                            res.email = $email,
                            res.affiliation = $affiliation,
                            res.researchArea = $researchArea,
                            res.role = $role
                        """,
                        id=r["ResearcherID"],
                        name=r["Name"],
                        email=r["Email"],
                        affiliation=r.get("Affiliation") or "",
                        researchArea=r.get("ResearchArea") or "",
                        role=r["Role"]
                    )

                # 3. Sync Topics
                topics = execute_query("SELECT TopicID, TopicName, Description FROM Topics")
                for t in topics:
                    session.run(
                        """
                        MERGE (top:Topic {id: $id})
                        SET top.name = $name,
                            top.description = $description
                        """,
                        id=t["TopicID"],
                        name=t["TopicName"],
                        description=t.get("Description") or ""
                    )

                # 4. Sync Papers
                papers = execute_query("SELECT PaperID, Title, Abstract, PublicationYear, DOI, Venue, CitationCount FROM Papers")
                for p in papers:
                    session.run(
                        """
                        MERGE (pap:Paper {id: $id})
                        SET pap.title = $title,
                            pap.abstract = $abstract,
                            pap.year = $year,
                            pap.doi = $doi,
                            pap.venue = $venue,
                            pap.citationCount = $citationCount
                        """,
                        id=p["PaperID"],
                        title=p["Title"],
                        abstract=p.get("Abstract") or "",
                        year=int(p["PublicationYear"]) if p.get("PublicationYear") else None,
                        doi=p.get("DOI") or "",
                        venue=p.get("Venue") or "",
                        citationCount=p.get("CitationCount") or 0
                    )

                # 5. Sync Paper_Authors [:AUTHORED]
                authorships = execute_query("SELECT PaperID, ResearcherID, AuthorOrder, AuthorRole FROM Paper_Authors")
                for a in authorships:
                    session.run(
                        """
                        MATCH (res:Researcher {id: $r_id})
                        MATCH (pap:Paper {id: $p_id})
                        MERGE (res)-[rel:AUTHORED {order: $order, role: $role}]->(pap)
                        """,
                        r_id=a["ResearcherID"],
                        p_id=a["PaperID"],
                        order=a["AuthorOrder"],
                        role=a.get("AuthorRole") or "Author"
                    )

                # 6. Sync Paper_Topics [:TAGGED_WITH]
                paper_topics = execute_query("SELECT PaperID, TopicID FROM Paper_Topics")
                for pt in paper_topics:
                    session.run(
                        """
                        MATCH (pap:Paper {id: $p_id})
                        MATCH (top:Topic {id: $t_id})
                        MERGE (pap)-[:TAGGED_WITH]->(top)
                        """,
                        p_id=pt["PaperID"],
                        t_id=pt["TopicID"]
                    )

                # 7. Sync Citations [:CITES]
                citations = execute_query("SELECT CitingPaperID, CitedPaperID, CitationDate FROM Citations")
                for c in citations:
                    session.run(
                        """
                        MATCH (c1:Paper {id: $citing_id})
                        MATCH (c2:Paper {id: $cited_id})
                        MERGE (c1)-[rel:CITES {date: $date}]->(c2)
                        """,
                        citing_id=c["CitingPaperID"],
                        cited_id=c["CitedPaperID"],
                        date=str(c.get("CitationDate") or "")
                    )

            stats = self.get_graph_stats()
            return {
                "status": "success",
                "message": "Neo4j Knowledge Graph synchronized from MySQL.",
                "stats": stats
            }
        except Exception as e:
            logger.error("Error synchronizing Neo4j: %s", str(e))
            return {"status": "error", "message": str(e)}

    def get_citation_network_neo4j(self, paper_id: int) -> Optional[Dict[str, Any]]:
        """Queries Neo4j for the citation graph surrounding paper_id."""
        if not self.is_available():
            return None

        try:
            with self._driver.session() as session:
                # Target paper
                res_paper = session.run("MATCH (p:Paper {id: $id}) RETURN p", id=paper_id).single()
                if not res_paper:
                    return None

                # Papers that cite this paper
                citing_result = session.run(
                    """
                    MATCH (citing:Paper)-[:CITES]->(target:Paper {id: $id})
                    RETURN citing.id AS id, citing.title AS title, citing.year AS year, citing.citationCount AS citationCount
                    """,
                    id=paper_id
                )
                cited_by_nodes = [dict(record) for record in citing_result]

                # Papers cited by this paper (references)
                cited_result = session.run(
                    """
                    MATCH (target:Paper {id: $id})-[:CITES]->(cited:Paper)
                    RETURN cited.id AS id, cited.title AS title, cited.year AS year, cited.citationCount AS citationCount
                    """,
                    id=paper_id
                )
                references_nodes = [dict(record) for record in cited_result]

                return {
                    "source": "neo4j",
                    "citedBy": cited_by_nodes,
                    "references": references_nodes
                }
        except Exception as e:
            logger.warning("Neo4j query failed, falling back to SQL: %s", str(e))
            return None

    def get_graph_stats(self) -> Dict[str, Any]:
        """Returns node and relationship counts from Neo4j or relational fallback."""
        if self.is_available():
            try:
                with self._driver.session() as session:
                    nodes = session.run("MATCH (n) RETURN count(n) AS count").single()["count"]
                    relationships = session.run("MATCH ()-[r]->() RETURN count(r) AS count").single()["count"]
                    citations = session.run("MATCH ()-[r:CITES]->() RETURN count(r) AS count").single()["count"]
                    authorships = session.run("MATCH ()-[r:AUTHORED]->() RETURN count(r) AS count").single()["count"]
                    return {
                        "engine": "Neo4j Graph Database",
                        "connected": True,
                        "totalNodes": nodes,
                        "totalRelationships": relationships,
                        "citationEdges": citations,
                        "authorshipEdges": authorships
                    }
            except Exception:
                pass

        # Relational fallback stats
        res_count = execute_query("SELECT COUNT(*) AS c FROM Researchers", fetch_one=True)["c"]
        pap_count = execute_query("SELECT COUNT(*) AS c FROM Papers", fetch_one=True)["c"]
        top_count = execute_query("SELECT COUNT(*) AS c FROM Topics", fetch_one=True)["c"]
        cit_count = execute_query("SELECT COUNT(*) AS c FROM Citations", fetch_one=True)["c"]
        aut_count = execute_query("SELECT COUNT(*) AS c FROM Paper_Authors", fetch_one=True)["c"]

        return {
            "engine": "MySQL Relational Graph Fallback (Neo4j driver ready)",
            "connected": False,
            "totalNodes": res_count + pap_count + top_count,
            "totalRelationships": cit_count + aut_count,
            "citationEdges": cit_count,
            "authorshipEdges": aut_count
        }

neo4j_service = Neo4jService()
