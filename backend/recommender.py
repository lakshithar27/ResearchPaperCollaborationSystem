from typing import List, Dict, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from database import execute_query

class SemanticRecommender:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            sublinear_tf=True
        )

    def get_recommendations_for_user(self, user_id: Optional[int] = None, top_k: int = 10) -> List[Dict[str, Any]]:
        # Fetch all papers with topics and authors
        papers = execute_query(
            """
            SELECT p.PaperID, p.Title, p.Abstract, p.PublicationYear, p.DOI, p.Venue, p.CitationCount,
                   GROUP_CONCAT(DISTINCT t.TopicName SEPARATOR ', ') AS Topics
            FROM Papers p
            LEFT JOIN Paper_Topics pt ON pt.PaperID = p.PaperID
            LEFT JOIN Topics t ON t.TopicID = pt.TopicID
            GROUP BY p.PaperID
            ORDER BY p.CitationCount DESC
            """
        )

        if not papers:
            return []

        # If user_id is provided, fetch user profile and papers
        user_area = ""
        user_authored_paper_ids = set()
        if user_id:
            user = execute_query(
                "SELECT ResearchArea FROM Researchers WHERE ResearcherID = %s",
                (user_id,),
                fetch_one=True
            )
            if user:
                user_area = user.get("ResearchArea") or ""
            
            authored = execute_query(
                "SELECT PaperID FROM Paper_Authors WHERE ResearcherID = %s",
                (user_id,)
            )
            user_authored_paper_ids = {a["PaperID"] for a in authored}

        # Build paper corpus
        corpus = []
        paper_list = []
        for p in papers:
            title = p.get("Title") or ""
            abstract = p.get("Abstract") or ""
            topics = p.get("Topics") or ""
            doc = f"{title}. {abstract} {topics}".strip()
            corpus.append(doc)
            paper_list.append(p)

        # Build query profile
        query_text = user_area
        if user_id and user_authored_paper_ids:
            # Add text from authored papers
            authored_docs = [
                f"{p['Title']}. {p.get('Abstract') or ''}"
                for p in papers if p["PaperID"] in user_authored_paper_ids
            ]
            if authored_docs:
                query_text = f"{user_area} " + " ".join(authored_docs)

        recommendations = []

        if query_text.strip() and len(corpus) > 0:
            try:
                # Compute TF-IDF matrix
                tfidf_matrix = self.vectorizer.fit_transform(corpus)
                query_vec = self.vectorizer.transform([query_text.strip()])
                scores = cosine_similarity(query_vec, tfidf_matrix).flatten()

                # Rank papers
                ranked_indices = scores.argsort()[::-1]

                for idx in ranked_indices:
                    paper = paper_list[idx]
                    paper_id = paper["PaperID"]

                    # Optionally skip already authored papers
                    if paper_id in user_authored_paper_ids and len(paper_list) > len(user_authored_paper_ids):
                        continue

                    score = round(float(scores[idx]), 3)
                    # Normalize score for display
                    display_score = max(score, 0.45) if score > 0 else 0.50

                    reason = f"High semantic alignment with {user_area}" if user_area else "Top recommendation based on semantic discovery"
                    recommendations.append({
                        "paper_raw": paper,
                        "similarityScore": display_score,
                        "reason": reason
                    })

                    if len(recommendations) >= top_k:
                        break
            except Exception:
                pass

        # Fallback to citation and recency ranking if not enough recommendations
        if len(recommendations) < top_k:
            existing_ids = {r["paper_raw"]["PaperID"] for r in recommendations}
            for p in paper_list:
                if p["PaperID"] not in existing_ids:
                    recommendations.append({
                        "paper_raw": p,
                        "similarityScore": 0.50,
                        "reason": "Popular and trending paper in the research community"
                    })
                    if len(recommendations) >= top_k:
                        break

        return recommendations

recommender = SemanticRecommender()
