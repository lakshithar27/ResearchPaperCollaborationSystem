from fastapi import APIRouter, HTTPException, status
from models import Researcher, ResearcherListResponse, ResearcherProfileResponse, PaperListResponse
from database import execute_query
from helpers import build_paper_object

router = APIRouter(prefix="/researchers", tags=["Researchers"])

@router.get("", response_model=ResearcherListResponse)
def list_researchers():
    # Use the ResearcherPaperStats view from the DBMS schema!
    rows = execute_query(
        """
        SELECT r.ResearcherID, r.Name, r.Email, r.Affiliation, r.ResearchArea, r.Role, r.JoinedDate,
               COUNT(DISTINCT pa.PaperID) AS paperCount
        FROM Researchers r
        LEFT JOIN Paper_Authors pa ON pa.ResearcherID = r.ResearcherID
        GROUP BY r.ResearcherID, r.Name, r.Email, r.Affiliation, r.ResearchArea, r.Role, r.JoinedDate
        ORDER BY paperCount DESC, r.Name ASC
        """
    )

    researchers = [
        Researcher(
            id=r["ResearcherID"],
            name=r["Name"],
            email=r["Email"],
            affiliation=r.get("Affiliation") or "",
            researchArea=r.get("ResearchArea") or "",
            role=r["Role"],
            joinedDate=str(r.get("JoinedDate") or ""),
            paperCount=r["paperCount"]
        )
        for r in rows
    ]

    return ResearcherListResponse(
        researchers=researchers,
        total=len(researchers)
    )

@router.get("/{researcher_id}", response_model=ResearcherProfileResponse)
def get_researcher_profile(researcher_id: int):
    row = execute_query(
        """
        SELECT r.ResearcherID, r.Name, r.Email, r.Affiliation, r.ResearchArea, r.Role, r.JoinedDate,
               COUNT(DISTINCT pa.PaperID) AS paperCount
        FROM Researchers r
        LEFT JOIN Paper_Authors pa ON pa.ResearcherID = r.ResearcherID
        WHERE r.ResearcherID = %s
        GROUP BY r.ResearcherID
        """,
        (researcher_id,),
        fetch_one=True
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Researcher not found.")

    researcher = Researcher(
        id=row["ResearcherID"],
        name=row["Name"],
        email=row["Email"],
        affiliation=row.get("Affiliation") or "",
        researchArea=row.get("ResearchArea") or "",
        role=row["Role"],
        joinedDate=str(row.get("JoinedDate") or ""),
        paperCount=row["paperCount"]
    )

    # Fetch papers authored by researcher
    paper_rows = execute_query(
        """
        SELECT p.*
        FROM Papers p
        JOIN Paper_Authors pa ON pa.PaperID = p.PaperID
        WHERE pa.ResearcherID = %s
        ORDER BY p.PublicationYear DESC, p.PaperID DESC
        """,
        (researcher_id,)
    )

    papers = [build_paper_object(p) for p in paper_rows]

    return ResearcherProfileResponse(
        researcher=researcher,
        papers=PaperListResponse(
            papers=papers,
            total=len(papers),
            page=1,
            pageSize=max(len(papers), 1)
        )
    )
