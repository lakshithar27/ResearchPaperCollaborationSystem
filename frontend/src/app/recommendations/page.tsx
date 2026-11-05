"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BrainCircuit,
  Sparkles,
  RefreshCw,
  BookOpen,
  Quote,
  Calendar,
  ArrowRight,
  Lightbulb,
  TrendingUp,
} from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import Loading from "@/components/common/Loading";
import ErrorMessage from "@/components/common/ErrorMessage";
import EmptyState from "@/components/common/EmptyState";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  PaperRecommendation,
  RecommendationResponse,
} from "@/types";

export default function RecommendationsPage() {
  const { token } = useAuth();

  const [recommendations, setRecommendations] = useState<
    PaperRecommendation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadRecommendations = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await apiRequest<RecommendationResponse>(
        "/recommendations",
        {
          token: token || undefined,
        }
      );

      setRecommendations(response.recommendations);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load personalized recommendations."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  function formatSimilarity(score: number) {
    const percentage = score <= 1 ? score * 100 : score;
    return `${Math.max(0, Math.min(100, percentage)).toFixed(1)}%`;
  }

  return (
    <AppLayout>
      <div className="space-y-8">

        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-100 p-3 text-purple-700">
                <BrainCircuit size={26} />
              </div>

              <h1 className="text-3xl font-bold text-slate-900">
                Smart Recommendations
              </h1>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Discover research papers related to your interests using
              intelligent semantic similarity.
            </p>
          </div>

          <button
            onClick={() => loadRecommendations(true)}
            disabled={loading || refreshing}
            className="btn-3d-light inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold text-slate-800 transition disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh Recommendations
          </button>
        </div>

        {/* Explanation banner */}
        <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-7 text-white shadow-md sm:p-9">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">
                <Sparkles size={14} />
                AI-POWERED DISCOVERY
              </div>

              <h2 className="text-2xl font-bold sm:text-3xl">
                Find research beyond keywords.
              </h2>

              <p className="mt-3 text-sm leading-7 text-blue-100">
                ResearchHub uses semantic embeddings and vector similarity
                search to identify papers with related concepts and research
                ideas, even when they use different terminology.
              </p>
            </div>

            <div className="flex h-24 w-24 shrink-0 items-center justify-center self-center rounded-2xl bg-white/15 md:self-auto">
              <BrainCircuit size={52} />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="card-3d p-6">
          <div className="mb-5 flex items-center gap-2">
            <Lightbulb size={20} className="text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900">
              How recommendations work
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <BookOpen size={20} />
              </div>
              <h3 className="font-semibold text-slate-800">
                1. Understand research
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Paper titles and abstracts are converted into numerical
                embeddings using a sentence-transformer model.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                <BrainCircuit size={20} />
              </div>
              <h3 className="font-semibold text-slate-800">
                2. Find similar papers
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Embeddings are stored and searched in a vector database
                to identify semantically similar research.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-700">
                <TrendingUp size={20} />
              </div>
              <h3 className="font-semibold text-slate-800">
                3. Get recommendations
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Relevant papers are ranked and presented with similarity
                scores to support research discovery.
              </p>
            </div>
          </div>
        </section>

        {/* Recommendations */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Recommended for You
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Research papers selected based on semantic relevance.
              </p>
            </div>

            {!loading && (
              <span className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700">
                {recommendations.length} results
              </span>
            )}
          </div>

          {error && (
            <ErrorMessage message={error} />
          )}

          {loading ? (
            <Loading message="Finding research papers relevant to your interests..." />
          ) : recommendations.length === 0 ? (
            <EmptyState
              title="No recommendations available yet"
              description="Add research papers and associate them with your researcher profile. Personalized recommendations will appear when the recommendation service has enough research data."
            />
          ) : (
            <div className="space-y-4">
              {recommendations.map((recommendation, index) => {
                const paper = recommendation.paper;

                return (
                  <article
                    key={paper.id}
                    className="recommend-card-3d p-6"
                  >
                    <div className="flex flex-col justify-between gap-5 sm:flex-row">

                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                            Recommendation #{index + 1}
                          </span>

                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                            <Sparkles size={12} />
                            {formatSimilarity(recommendation.similarityScore)} similarity
                          </span>
                        </div>

                        <Link
                          href={`/papers/${paper.id}`}
                          className="text-lg font-bold text-slate-900 transition hover:text-purple-700"
                        >
                          {paper.title}
                        </Link>

                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                          {paper.abstract}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar size={14} />
                            {paper.publicationYear}
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <Quote size={14} />
                            {paper.citationCount} citations
                          </span>

                          {paper.venue && (
                            <span>{paper.venue}</span>
                          )}
                        </div>

                        {paper.authors.length > 0 && (
                          <p className="mt-3 text-xs text-slate-500">
                            <span className="font-semibold text-slate-700">
                              Authors:{" "}
                            </span>
                            {paper.authors
                              .map((author) => author.name)
                              .join(", ")}
                          </p>
                        )}

                        {paper.topics.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {paper.topics.map((topic) => (
                              <span
                                key={topic.id}
                                className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                              >
                                {topic.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {recommendation.reason && (
                          <div className="mt-4 rounded-xl bg-purple-50 p-4">
                            <p className="mb-1 text-xs font-bold text-purple-800">
                              WHY THIS PAPER?
                            </p>
                            <p className="text-sm leading-6 text-purple-700">
                              {recommendation.reason}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center sm:items-start">
                        <Link
                          href={`/papers/${paper.id}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
                        >
                          View Paper
                          <ArrowRight size={16} />
                        </Link>
                      </div>

                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </AppLayout>
  );
}