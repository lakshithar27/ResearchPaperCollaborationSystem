from typing import Optional, List, Dict, Any
from database import execute_query
from models import Paper, Researcher, Topic

def build_paper_object(paper_dict: Dict[str, Any]) -> Paper:
    paper_id = paper_dict.get("PaperID") or paper_dict.get("id")
    
    # Fetch authors
    authors_raw = execute_query(
        """
        SELECT r.ResearcherID AS id, r.Name AS name, r.Email AS email,
               r.Affiliation AS affiliation, r.ResearchArea AS researchArea,
               r.Role AS role, r.JoinedDate AS joinedDate
        FROM Paper_Authors pa
        JOIN Researchers r ON r.ResearcherID = pa.ResearcherID
        WHERE pa.PaperID = %s
        ORDER BY pa.AuthorOrder ASC
        """,
        (paper_id,)
    )
    authors = [
        Researcher(
            id=a["id"],
            name=a["name"],
            email=a["email"],
            affiliation=a.get("affiliation") or "",
            researchArea=a.get("researchArea") or "",
            role=a["role"],
            joinedDate=str(a.get("joinedDate") or "")
        )
        for a in authors_raw
    ]

    # Fetch topics
    topics_raw = execute_query(
        """
        SELECT t.TopicID AS id, t.TopicName AS name, t.Description AS description
        FROM Paper_Topics pt
        JOIN Topics t ON t.TopicID = pt.TopicID
        WHERE pt.PaperID = %s
        ORDER BY t.TopicName ASC
        """,
        (paper_id,)
    )
    topics = [
        Topic(
            id=t["id"],
            name=t["name"],
            description=t.get("description") or ""
        )
        for t in topics_raw
    ]

    return Paper(
        id=paper_id,
        title=paper_dict["Title"] if "Title" in paper_dict else paper_dict.get("title", ""),
        abstract=paper_dict.get("Abstract") or paper_dict.get("abstract") or "",
        publicationYear=int(paper_dict.get("PublicationYear") or paper_dict.get("publicationYear") or 2024),
        doi=paper_dict.get("DOI") or paper_dict.get("doi") or None,
        venue=paper_dict.get("Venue") or paper_dict.get("venue") or None,
        citationCount=int(paper_dict.get("CitationCount") or paper_dict.get("citationCount") or 0),
        authors=authors,
        topics=topics
    )

def get_paper_by_id(paper_id: int) -> Optional[Paper]:
    p = execute_query(
        "SELECT * FROM Papers WHERE PaperID = %s",
        (paper_id,),
        fetch_one=True
    )
    if not p:
        return None
    return build_paper_object(p)
