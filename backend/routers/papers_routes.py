from fastapi import APIRouter, HTTPException, status, Depends, Query, Response
from typing import Optional, List
from models import Paper, PaperListResponse, CreatePaperRequest, UpdatePaperRequest
from auth import get_optional_current_user, get_current_user
from database import execute_query, execute_modify, get_db
from helpers import build_paper_object, get_paper_by_id
from graph_db import neo4j_service

router = APIRouter(prefix="/papers", tags=["Papers"])

@router.get("", response_model=PaperListResponse)
def list_papers(
    query: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: Optional[str] = Query("year"),
    sort_order: Optional[str] = Query("desc")
):
    where_clauses = []
    params = []

    # Full-text / term search
    if query and query.strip():
        # Match using full-text index or LIKE fallback
        where_clauses.append("(MATCH(p.Title, p.Abstract) AGAINST (%s IN NATURAL LANGUAGE MODE) OR p.Title LIKE %s)")
        params.append(query.strip())
        params.append(f"%{query.strip()}%")

    if year:
        where_clauses.append("p.PublicationYear = %s")
        params.append(year)

    if topic and topic.strip() and topic.strip().lower() != "all":
        where_clauses.append("EXISTS (SELECT 1 FROM Paper_Topics pt JOIN Topics t ON t.TopicID = pt.TopicID WHERE pt.PaperID = p.PaperID AND (t.TopicName = %s OR t.TopicID = %s))")
        params.append(topic.strip())
        params.append(topic.strip())

    where_str = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    # Sort mapping
    sort_column = "p.PublicationYear"
    if sort_by == "title":
        sort_column = "p.Title"
    elif sort_by == "citations":
        sort_column = "p.CitationCount"

    direction = "DESC" if (sort_order or "").lower() == "desc" else "ASC"

    # Count total
    count_sql = f"SELECT COUNT(DISTINCT p.PaperID) AS total FROM Papers p {where_str}"
    count_res = execute_query(count_sql, tuple(params), fetch_one=True)
    total = count_res["total"] if count_res else 0

    # Fetch paginated papers
    offset = (page - 1) * page_size
    fetch_sql = f"""
        SELECT p.*
        FROM Papers p
        {where_str}
        ORDER BY {sort_column} {direction}, p.PaperID DESC
        LIMIT %s OFFSET %s
    """
    fetch_params = tuple(params + [page_size, offset])
    rows = execute_query(fetch_sql, fetch_params)

    papers = [build_paper_object(r) for r in rows]

    return PaperListResponse(
        papers=papers,
        total=total,
        page=page,
        pageSize=page_size
    )

@router.post("", response_model=Paper, status_code=status.HTTP_201_CREATED)
def create_paper(req: CreatePaperRequest, current_user: Optional[dict] = Depends(get_optional_current_user)):
    uploaded_by = current_user["id"] if current_user else None

    # Check for duplicate DOI if provided
    if req.doi and req.doi.strip():
        existing = execute_query("SELECT PaperID FROM Papers WHERE DOI = %s", (req.doi.strip(),), fetch_one=True)
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A research paper with this DOI already exists.")

    with get_db() as conn:
        with conn.cursor() as cursor:
            # 1. Insert Paper
            cursor.execute(
                """
                INSERT INTO Papers (Title, Abstract, PublicationYear, DOI, Venue, UploadedBy)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (req.title.strip(), req.abstract.strip(), req.publicationYear, req.doi.strip() if req.doi else None, req.venue.strip() if req.venue else None, uploaded_by)
            )
            paper_id = cursor.lastrowid

            # 2. Insert Authors
            author_ids = list(req.authorIds or [])
            if uploaded_by and uploaded_by not in author_ids:
                author_ids.insert(0, uploaded_by)

            # Ensure at least one author
            if not author_ids and uploaded_by:
                author_ids = [uploaded_by]

            for order, author_id in enumerate(author_ids, 1):
                cursor.execute(
                    "INSERT IGNORE INTO Paper_Authors (PaperID, ResearcherID, AuthorOrder) VALUES (%s, %s, %s)",
                    (paper_id, author_id, order)
                )

            # 3. Insert Topics
            for topic_id in (req.topicIds or []):
                cursor.execute(
                    "INSERT IGNORE INTO Paper_Topics (PaperID, TopicID) VALUES (%s, %s)",
                    (paper_id, topic_id)
                )

    paper_obj = get_paper_by_id(paper_id)
    if not paper_obj:
        raise HTTPException(status_code=500, detail="Failed to retrieve newly created paper.")

    # Synchronize graph to Neo4j if available
    try:
        neo4j_service.sync_all_from_mysql()
    except Exception:
        pass

    return paper_obj

@router.get("/{paper_id}", response_model=Paper)
def get_paper(paper_id: int):
    paper = get_paper_by_id(paper_id)
    if not paper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Research paper not found.")
    return paper

@router.put("/{paper_id}", response_model=Paper)
def update_paper(paper_id: int, req: UpdatePaperRequest, current_user: dict = Depends(get_current_user)):
    paper = get_paper_by_id(paper_id)
    if not paper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Research paper not found.")

    updates = []
    params = []
    if req.title is not None:
        updates.append("Title = %s")
        params.append(req.title.strip())
    if req.abstract is not None:
        updates.append("Abstract = %s")
        params.append(req.abstract.strip())
    if req.publicationYear is not None:
        updates.append("PublicationYear = %s")
        params.append(req.publicationYear)
    if req.doi is not None:
        updates.append("DOI = %s")
        params.append(req.doi.strip() if req.doi else None)
    if req.venue is not None:
        updates.append("Venue = %s")
        params.append(req.venue.strip() if req.venue else None)

    with get_db() as conn:
        with conn.cursor() as cursor:
            if updates:
                params.append(paper_id)
                sql = f"UPDATE Papers SET {', '.join(updates)} WHERE PaperID = %s"
                cursor.execute(sql, tuple(params))

            if req.topicIds is not None:
                cursor.execute("DELETE FROM Paper_Topics WHERE PaperID = %s", (paper_id,))
                for t_id in req.topicIds:
                    cursor.execute("INSERT IGNORE INTO Paper_Topics (PaperID, TopicID) VALUES (%s, %s)", (paper_id, t_id))

    return get_paper_by_id(paper_id)

@router.delete("/{paper_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_paper(paper_id: int, current_user: Optional[dict] = Depends(get_optional_current_user)):
    existing = execute_query("SELECT PaperID FROM Papers WHERE PaperID = %s", (paper_id,), fetch_one=True)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Research paper not found.")

    execute_modify("DELETE FROM Papers WHERE PaperID = %s", (paper_id,))
    return Response(status_code=status.HTTP_204_NO_CONTENT)
