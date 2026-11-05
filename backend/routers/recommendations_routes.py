from fastapi import APIRouter, Depends
from typing import Optional
from models import RecommendationResponse, PaperRecommendation
from auth import get_optional_current_user
from recommender import recommender
from helpers import build_paper_object

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

@router.get("", response_model=RecommendationResponse)
def get_recommendations(current_user: Optional[dict] = Depends(get_optional_current_user)):
    user_id = current_user["id"] if current_user else None
    raw_recommendations = recommender.get_recommendations_for_user(user_id=user_id, top_k=10)

    recommendations = []
    for item in raw_recommendations:
        paper_obj = build_paper_object(item["paper_raw"])
        recommendations.append(
            PaperRecommendation(
                paper=paper_obj,
                similarityScore=item["similarityScore"],
                reason=item.get("reason") or "Semantic relevance match"
            )
        )

    return RecommendationResponse(
        recommendations=recommendations,
        total=len(recommendations)
    )
