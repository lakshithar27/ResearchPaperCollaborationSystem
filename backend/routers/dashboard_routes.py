from fastapi import APIRouter
from models import DashboardStats
from database import execute_query

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats():
    papers_c = execute_query("SELECT COUNT(*) AS c FROM Papers", fetch_one=True)["c"]
    researchers_c = execute_query("SELECT COUNT(*) AS c FROM Researchers", fetch_one=True)["c"]
    topics_c = execute_query("SELECT COUNT(*) AS c FROM Topics", fetch_one=True)["c"]
    citations_c = execute_query("SELECT COUNT(*) AS c FROM Citations", fetch_one=True)["c"]

    return DashboardStats(
        totalPapers=papers_c,
        totalResearchers=researchers_c,
        totalTopics=topics_c,
        totalCitations=citations_c
    )
