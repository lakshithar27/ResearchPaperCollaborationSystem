// ==============================
// USER AND AUTHENTICATION
// ==============================

export type UserRole = "Student" | "Researcher" | "Admin";

export interface User {
  id: number;
  name: string;
  email: string;
  affiliation?: string;
  researchArea?: string;
  role: UserRole;
  joinedDate?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  affiliation?: string;
  researchArea?: string;
  role: UserRole;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ==============================
// RESEARCH PAPERS
// ==============================

export interface Paper {
  id: number;
  title: string;
  abstract: string;
  publicationYear: number;
  doi?: string;
  venue?: string;
  citationCount: number;
  authors: Researcher[];
  topics: Topic[];
}

export interface PaperListResponse {
  papers: Paper[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreatePaperRequest {
  title: string;
  abstract: string;
  publicationYear: number;
  doi?: string;
  venue?: string;
  topicIds: number[];
  authorIds: number[];
}

export interface UpdatePaperRequest {
  title?: string;
  abstract?: string;
  publicationYear?: number;
  doi?: string;
  venue?: string;
  topicIds?: number[];
}

// ==============================
// RESEARCHERS
// ==============================

export interface Researcher {
  id: number;
  name: string;
  email: string;
  affiliation?: string;
  researchArea?: string;
  role: UserRole;
  joinedDate?: string;
  paperCount?: number;
}

export interface ResearcherListResponse {
  researchers: Researcher[];
  total: number;
}

// ==============================
// RESEARCH TOPICS
// ==============================

export interface Topic {
  id: number;
  name: string;
  description?: string;
  paperCount?: number;
}

// ==============================
// CITATIONS
// ==============================

export interface Citation {
  citingPaperId: number;
  citedPaperId: number;
  citationDate?: string;
}

export interface CitationNetwork {
  paperId: number;
  title: string;
  citations: number;
  citedBy: number;
}

// ==============================
// RECOMMENDATIONS
// ==============================

export interface PaperRecommendation {
  paper: Paper;
  similarityScore: number;
  reason?: string;
}

export interface RecommendationResponse {
  recommendations: PaperRecommendation[];
  total: number;
}

// ==============================
// SEARCH
// ==============================

export interface PaperSearchParams {
  query?: string;
  topic?: string;
  year?: number;
  page?: number;
  pageSize?: number;
  sortBy?: "title" | "year" | "citations";
  sortOrder?: "asc" | "desc";
}

// ==============================
// DASHBOARD
// ==============================

export interface DashboardStats {
  totalPapers: number;
  totalResearchers: number;
  totalTopics: number;
  totalCitations: number;
}

export interface ApiError {
  detail?: string;
  message?: string;
}