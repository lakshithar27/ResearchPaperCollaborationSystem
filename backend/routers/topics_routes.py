from fastapi import APIRouter
from typing import List
from models import Topic
from database import execute_query

router = APIRouter(prefix="/topics", tags=["Topics"])

@router.get("", response_model=List[Topic])
def list_topics():
    rows = execute_query(
        """
        SELECT t.TopicID, t.TopicName, t.Description, COUNT(pt.PaperID) AS paperCount
        FROM Topics t
        LEFT JOIN Paper_Topics pt ON pt.TopicID = t.TopicID
        GROUP BY t.TopicID, t.TopicName, t.Description
        ORDER BY paperCount DESC, t.TopicName ASC
        """
    )
    return [
        Topic(
            id=r["TopicID"],
            name=r["TopicName"],
            description=r.get("Description") or "",
            paperCount=r["paperCount"]
        )
        for r in rows
    ]
