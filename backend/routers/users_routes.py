from fastapi import APIRouter, Depends
from models import User, UpdateProfileRequest, PaperListResponse
from auth import get_current_user
from database import execute_query, execute_modify
from helpers import build_paper_object

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=User)
def get_my_profile(current_user: dict = Depends(get_current_user)):
    return User(**current_user)

@router.put("/me", response_model=User)
def update_my_profile(req: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    updates = []
    params = []
    if req.name is not None:
        updates.append("Name = %s")
        params.append(req.name.strip())
    if req.affiliation is not None:
        updates.append("Affiliation = %s")
        params.append(req.affiliation.strip())
    if req.researchArea is not None:
        updates.append("ResearchArea = %s")
        params.append(req.researchArea.strip())

    if updates:
        params.append(current_user["id"])
        sql = f"UPDATE Researchers SET {', '.join(updates)} WHERE ResearcherID = %s"
        execute_modify(sql, tuple(params))

    # Fetch updated user
    updated = execute_query(
        "SELECT ResearcherID, Name, Email, Affiliation, ResearchArea, Role, JoinedDate FROM Researchers WHERE ResearcherID = %s",
        (current_user["id"],),
        fetch_one=True
    )
    return User(
        id=updated["ResearcherID"],
        name=updated["Name"],
        email=updated["Email"],
        affiliation=updated.get("Affiliation") or "",
        researchArea=updated.get("ResearchArea") or "",
        role=updated["Role"],
        joinedDate=str(updated.get("JoinedDate") or "")
    )

@router.get("/me/papers", response_model=PaperListResponse)
def get_my_papers(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    # Get all papers where user is author or uploader
    rows = execute_query(
        """
        SELECT DISTINCT p.*
        FROM Papers p
        LEFT JOIN Paper_Authors pa ON pa.PaperID = p.PaperID
        WHERE pa.ResearcherID = %s OR p.UploadedBy = %s
        ORDER BY p.PublicationYear DESC, p.PaperID DESC
        """,
        (user_id, user_id)
    )
    papers = [build_paper_object(r) for r in rows]
    return PaperListResponse(
        papers=papers,
        total=len(papers),
        page=1,
        pageSize=max(len(papers), 1)
    )
