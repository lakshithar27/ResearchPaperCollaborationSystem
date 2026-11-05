import math
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, status, Query
from models import CitationNetworkResponse
from database import execute_query
from helpers import get_paper_by_id, build_paper_object
from graph_db import neo4j_service

router = APIRouter(prefix="/citations", tags=["Citations"])

TOPIC_COLOR_PALETTE = {
    "Large Language Models": "#a855f7",       # Purple
    "Natural Language Processing": "#8b5cf6", # Indigo
    "Machine Learning": "#3b82f6",            # Blue
    "Computer Vision": "#10b981",             # Emerald
    "Database Systems": "#f59e0b",            # Amber
    "Distributed Systems": "#06b6d4",         # Cyan
    "Graph Neural Networks": "#ec4899",       # Pink
    "Cybersecurity & Privacy": "#ef4444",     # Red
    "Quantum Computing": "#6366f1",           # Indigo Neon
    "Recommendation Systems": "#14b8a6",      # Teal
    "Reinforcement Learning": "#f97316",      # Orange
    "Data Mining": "#84cc16"                  # Lime
}

@router.get("/graph/global")
def get_global_citation_graph():
    """
    Returns full 3D citation graph with precomputed spatial layout coordinates,
    topic clustering, node dimensions, and directed citation links.
    """
    papers = execute_query(
        """
        SELECT p.PaperID, p.Title, p.Abstract, p.PublicationYear, p.DOI, p.Venue, p.CitationCount,
               GROUP_CONCAT(DISTINCT t.TopicName SEPARATOR ', ') AS Topics,
               GROUP_CONCAT(DISTINCT r.Name SEPARATOR ', ') AS Authors
        FROM Papers p
        LEFT JOIN Paper_Topics pt ON pt.PaperID = p.PaperID
        LEFT JOIN Topics t ON t.TopicID = pt.TopicID
        LEFT JOIN Paper_Authors pa ON pa.PaperID = p.PaperID
        LEFT JOIN Researchers r ON r.ResearcherID = pa.ResearcherID
        GROUP BY p.PaperID
        ORDER BY p.CitationCount DESC;
        """
    )

    citations = execute_query(
        """
        SELECT CitingPaperID AS source, CitedPaperID AS target, CitationDate AS date
        FROM Citations
        ORDER BY CitationDate DESC;
        """
    )

    # Determine unique topics and assign orbital sectors
    unique_topics = list(TOPIC_COLOR_PALETTE.keys())
    topic_sector_map = {topic: i for i, topic in enumerate(unique_topics)}
    num_topics = len(unique_topics)

    nodes = []
    topic_counts: Dict[str, int] = {}

    for idx, p in enumerate(papers):
        raw_topics = (p.get("Topics") or "").split(", ")
        primary_topic = raw_topics[0] if raw_topics and raw_topics[0] else "Machine Learning"
        color = TOPIC_COLOR_PALETTE.get(primary_topic, "#64748b")
        topic_counts[primary_topic] = topic_counts.get(primary_topic, 0) + 1

        cit_count = int(p.get("CitationCount") or 0)
        # Sizing: between 9px and 26px based on citation count
        radius = max(9.0, min(26.0, 9.0 + 3.2 * math.sqrt(cit_count)))

        # 3D spatial spherical / galactic distribution:
        sector_idx = topic_sector_map.get(primary_topic, idx % num_topics)
        base_angle = (2.0 * math.pi * sector_idx) / num_topics
        # Jitter angle slightly based on paper index
        angle = base_angle + (float(idx % 5) - 2.0) * 0.18

        # Distance from center: higher citations gravitate closer to galactic core
        core_distance = max(110.0, 320.0 - (cit_count * 14.0) + (float(idx % 7) * 22.0))
        elevation_z = (float(idx % 9) - 4.0) * 45.0 + math.sin(angle * 2.0) * 35.0

        x = round(core_distance * math.cos(angle), 2)
        y = round(core_distance * math.sin(angle) * 0.75, 2)
        z = round(elevation_z, 2)

        author_names = [a.strip() for a in (p.get("Authors") or "").split(",") if a.strip()]

        nodes.append({
            "id": p["PaperID"],
            "title": p["Title"],
            "abstract": p["Abstract"] or "",
            "publicationYear": p["PublicationYear"],
            "venue": p["Venue"] or "Peer Reviewed",
            "doi": p["DOI"] or "",
            "citationCount": cit_count,
            "primaryTopic": primary_topic,
            "topics": raw_topics,
            "authors": author_names,
            "color": color,
            "radius": radius,
            "x": x,
            "y": y,
            "z": z
        })

    edges = [
        {
            "source": c["source"],
            "target": c["target"],
            "date": str(c["date"]) if c["date"] else None
        }
        for c in citations
    ]

    topics_summary = [
        {
            "name": tname,
            "color": TOPIC_COLOR_PALETTE.get(tname, "#64748b"),
            "count": count
        }
        for tname, count in sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    return {
        "nodes": nodes,
        "edges": edges,
        "topics": topics_summary,
        "stats": {
            "totalPapers": len(nodes),
            "totalCitations": len(edges),
            "maxCitations": max((n["citationCount"] for n in nodes), default=0)
        }
    }

@router.get("/live-stream")
def get_citation_live_stream(limit: int = 15):
    """Returns recent citation events for real-time activity feeds and notifications."""
    citations = execute_query(
        """
        SELECT c.CitingPaperID, p1.Title AS CitingTitle,
               c.CitedPaperID, p2.Title AS CitedTitle,
               c.CitationDate
        FROM Citations c
        JOIN Papers p1 ON p1.PaperID = c.CitingPaperID
        JOIN Papers p2 ON p2.PaperID = c.CitedPaperID
        ORDER BY c.CitationDate DESC, c.CitingPaperID DESC
        LIMIT %s;
        """,
        (limit,)
    )
    return {
        "status": "active",
        "recentCitations": citations or [],
        "total": len(citations or [])
    }

@router.get("/network", response_model=CitationNetworkResponse)
def get_citation_network(paper_id: int = Query(...)):
    target_paper = get_paper_by_id(paper_id)
    if not target_paper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Research paper not found.")

    # 1. Try Neo4j graph traversal first
    neo4j_data = neo4j_service.get_citation_network_neo4j(paper_id)
    if neo4j_data:
        cited_by_ids = [n["id"] for n in neo4j_data.get("citedBy", [])]
        ref_ids = [n["id"] for n in neo4j_data.get("references", [])]

        cited_by = [get_paper_by_id(pid) for pid in cited_by_ids if get_paper_by_id(pid)]
        references = [get_paper_by_id(pid) for pid in ref_ids if get_paper_by_id(pid)]

        return CitationNetworkResponse(
            paper=target_paper,
            citedBy=cited_by,
            references=references
        )

    # 2. Relational MySQL fallback (guaranteed ACID consistency)
    cited_by_rows = execute_query(
        """
        SELECT p.*
        FROM Citations c
        JOIN Papers p ON p.PaperID = c.CitingPaperID
        WHERE c.CitedPaperID = %s
        ORDER BY p.PublicationYear DESC
        """,
        (paper_id,)
    )

    references_rows = execute_query(
        """
        SELECT p.*
        FROM Citations c
        JOIN Papers p ON p.PaperID = c.CitedPaperID
        WHERE c.CitingPaperID = %s
        ORDER BY p.PublicationYear DESC
        """,
        (paper_id,)
    )

    cited_by = [build_paper_object(r) for r in cited_by_rows]
    references = [build_paper_object(r) for r in references_rows]

    return CitationNetworkResponse(
        paper=target_paper,
        citedBy=cited_by,
        references=references
    )
