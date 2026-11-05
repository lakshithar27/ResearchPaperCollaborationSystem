from fastapi import APIRouter, Depends, HTTPException, status, Response
from typing import Dict, Any
from models import AdminStats, AdminUsersResponse, AdminPapersResponse, User, Paper
from auth import require_admin
from database import execute_query, execute_modify
from helpers import build_paper_object
from graph_db import neo4j_service

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/overview", response_model=AdminStats)
def get_admin_overview(admin_user: dict = Depends(require_admin)):
    papers_c = execute_query("SELECT COUNT(*) AS c FROM Papers", fetch_one=True)["c"]
    researchers_c = execute_query("SELECT COUNT(*) AS c FROM Researchers", fetch_one=True)["c"]
    topics_c = execute_query("SELECT COUNT(*) AS c FROM Topics", fetch_one=True)["c"]
    citations_c = execute_query("SELECT COUNT(*) AS c FROM Citations", fetch_one=True)["c"]

    return AdminStats(
        totalResearchers=researchers_c,
        totalPapers=papers_c,
        totalTopics=topics_c,
        totalCitations=citations_c
    )

@router.get("/users", response_model=AdminUsersResponse)
def get_admin_users(admin_user: dict = Depends(require_admin)):
    rows = execute_query("SELECT ResearcherID, Name, Email, Affiliation, ResearchArea, Role, JoinedDate FROM Researchers ORDER BY ResearcherID ASC")
    users = [
        User(
            id=r["ResearcherID"],
            name=r["Name"],
            email=r["Email"],
            affiliation=r.get("Affiliation") or "",
            researchArea=r.get("ResearchArea") or "",
            role=r["Role"],
            joinedDate=str(r.get("JoinedDate") or "")
        )
        for r in rows
    ]
    return AdminUsersResponse(users=users, total=len(users))

@router.get("/papers", response_model=AdminPapersResponse)
def get_admin_papers(admin_user: dict = Depends(require_admin)):
    rows = execute_query("SELECT * FROM Papers ORDER BY PaperID DESC")
    papers = [build_paper_object(r) for r in rows]
    return AdminPapersResponse(papers=papers, total=len(papers))

@router.delete("/papers/{paper_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_paper(paper_id: int, admin_user: dict = Depends(require_admin)):
    existing = execute_query("SELECT PaperID FROM Papers WHERE PaperID = %s", (paper_id,), fetch_one=True)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Research paper not found.")

    execute_modify("DELETE FROM Papers WHERE PaperID = %s", (paper_id,))
    
    # Sync with Neo4j
    try:
        neo4j_service.sync_all_from_mysql()
    except Exception:
        pass

    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/sync-neo4j")
def sync_neo4j(admin_user: dict = Depends(require_admin)):
    return neo4j_service.sync_all_from_mysql()
