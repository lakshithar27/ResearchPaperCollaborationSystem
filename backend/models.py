from typing import List, Optional
from pydantic import BaseModel, Field

# User and Authentication
class User(BaseModel):
    id: int
    name: str
    email: str
    affiliation: Optional[str] = None
    researchArea: Optional[str] = None
    role: str
    joinedDate: Optional[str] = None

    class Config:
        populate_by_name = True

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    affiliation: Optional[str] = None
    researchArea: Optional[str] = None
    role: str = "Student"

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    affiliation: Optional[str] = None
    researchArea: Optional[str] = None

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

# Topic
class Topic(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    paperCount: Optional[int] = 0

# Researcher
class Researcher(BaseModel):
    id: int
    name: str
    email: str
    affiliation: Optional[str] = None
    researchArea: Optional[str] = None
    role: str
    joinedDate: Optional[str] = None
    paperCount: Optional[int] = 0

class ResearcherListResponse(BaseModel):
    researchers: List[Researcher]
    total: int

# Paper
class Paper(BaseModel):
    id: int
    title: str
    abstract: str
    publicationYear: int
    doi: Optional[str] = None
    venue: Optional[str] = None
    citationCount: int = 0
    authors: List[Researcher] = []
    topics: List[Topic] = []

class PaperListResponse(BaseModel):
    papers: List[Paper]
    total: int
    page: int
    pageSize: int

class CreatePaperRequest(BaseModel):
    title: str
    abstract: str
    publicationYear: int
    doi: Optional[str] = None
    venue: Optional[str] = None
    topicIds: List[int] = []
    authorIds: List[int] = []

class UpdatePaperRequest(BaseModel):
    title: Optional[str] = None
    abstract: Optional[str] = None
    publicationYear: Optional[int] = None
    doi: Optional[str] = None
    venue: Optional[str] = None
    topicIds: Optional[List[int]] = None

# Citations and Network
class CitationNetworkResponse(BaseModel):
    paper: Paper
    citedBy: List[Paper] = []
    references: List[Paper] = []

# Recommendations
class PaperRecommendation(BaseModel):
    paper: Paper
    similarityScore: float
    reason: Optional[str] = None

class RecommendationResponse(BaseModel):
    recommendations: List[PaperRecommendation]
    total: int

# Researcher Profile Response
class ResearcherProfileResponse(BaseModel):
    researcher: Researcher
    papers: PaperListResponse

# Stats
class DashboardStats(BaseModel):
    totalPapers: int
    totalResearchers: int
    totalTopics: int
    totalCitations: int

class AdminStats(BaseModel):
    totalResearchers: int
    totalPapers: int
    totalTopics: int
    totalCitations: int

class AdminUsersResponse(BaseModel):
    users: List[User]
    total: int

class AdminPapersResponse(BaseModel):
    papers: List[Paper]
    total: int
