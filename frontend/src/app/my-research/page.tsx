"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Eye,
  Trash2,
  Calendar,
  Quote,
  RefreshCw,
} from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import Loading from "@/components/common/Loading";
import ErrorMessage from "@/components/common/ErrorMessage";
import EmptyState from "@/components/common/EmptyState";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Paper, PaperListResponse } from "@/types";

export default function MyResearchPage() {
  const { token } = useAuth();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadPapers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<PaperListResponse>(
        "/users/me/papers",
        { token: token || undefined }
      );

      setPapers(response.papers);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your research papers."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadPapers();
  }, [loadPapers]);

  async function handleDelete(paper: Paper) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${paper.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(paper.id);
    setError("");

    try {
      await apiRequest<void>(`/papers/${paper.id}`, {
        method: "DELETE",
        token: token || undefined,
      });

      setPapers((current) =>
        current.filter((item) => item.id !== paper.id)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete this paper."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-8">

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                <BookOpen size={25} />
              </div>

              <h1 className="text-3xl font-bold text-slate-900">
                My Research
              </h1>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Manage and keep track of your research contributions.
            </p>
          </div>

          <Link
            href="/papers/new"
            className="btn-3d inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold text-white shadow-md"
          >
            <Plus size={18} />
            Add Research Paper
          </Link>
        </div>

        {error && (
          <ErrorMessage message={error} />
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card-3d p-6">
            <p className="text-sm text-slate-500">My Publications</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading ? "—" : papers.length}
            </p>
          </div>

          <div className="card-3d p-6">
            <p className="text-sm text-slate-500">Total Citations</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading
                ? "—"
                : papers.reduce(
                    (total, paper) => total + (paper.citationCount || 0),
                    0
                  )}
            </p>
          </div>

          <div className="card-3d p-6">
            <p className="text-sm text-slate-500">Research Topics</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading
                ? "—"
                : new Set(
                    papers.flatMap((paper) =>
                      paper.topics.map((topic) => topic.id)
                    )
                  ).size}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Your Publications
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Papers linked to your researcher profile.
            </p>
          </div>

          <button
            onClick={loadPapers}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {loading ? (
          <Loading message="Loading your publications..." />
        ) : papers.length === 0 ? (
          <EmptyState
            title="No research papers yet"
            description="Your publications will appear here once they are linked to your researcher profile."
          />
        ) : (
          <div className="space-y-4">
            {papers.map((paper) => (
              <article
                key={paper.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/papers/${paper.id}`}
                      className="text-lg font-bold text-slate-900 transition hover:text-blue-600"
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
                  </div>

                  <div className="flex shrink-0 items-start gap-2">
                    <Link
                      href={`/papers/${paper.id}`}
                      title="View paper"
                      className="rounded-lg border border-slate-200 p-2.5 text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Eye size={18} />
                    </Link>

                    <button
                      onClick={() => handleDelete(paper)}
                      disabled={deletingId === paper.id}
                      title="Delete paper"
                      className="rounded-lg border border-slate-200 p-2.5 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      {deletingId === paper.id ? (
                        <span className="block h-[18px] w-[18px] animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

      </div>
    </AppLayout>
  );
}