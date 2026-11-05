from fastapi import APIRouter
from graph_db import neo4j_service
from database import execute_query

router = APIRouter(prefix="/graph", tags=["Graph Knowledge Base"])

@router.get("/stats")
def get_graph_statistics():
    return neo4j_service.get_graph_stats()

@router.get("/coauthors/{researcher_id}")
def get_coauthors(researcher_id: int):
    # Relational & graph co-authorship query (Advanced SQL concept: Self-join and Aggregation)
    rows = execute_query(
        """
        SELECT r.ResearcherID AS id, r.Name AS name, r.Affiliation AS affiliation,
               COUNT(DISTINCT pa1.PaperID) AS sharedPapers
        FROM Paper_Authors pa1
        JOIN Paper_Authors pa2 ON pa1.PaperID = pa2.PaperID AND pa1.ResearcherID != pa2.ResearcherID
        JOIN Researchers r ON r.ResearcherID = pa2.ResearcherID
        WHERE pa1.ResearcherID = %s
        GROUP BY r.ResearcherID, r.Name, r.Affiliation
        ORDER BY sharedPapers DESC
        """,
        (researcher_id,)
    )
    return {
        "researcherId": researcher_id,
        "coAuthors": rows,
        "total": len(rows)
    }

@router.post("/sync")
def sync_graph():
    return neo4j_service.sync_all_from_mysql()
