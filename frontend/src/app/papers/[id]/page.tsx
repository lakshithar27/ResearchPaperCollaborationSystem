"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Quote,
  ExternalLink,
  Users,
  Tag,
} from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import Loading from "@/components/common/Loading";
import ErrorMessage from "@/components/common/ErrorMessage";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Paper } from "@/types";

function PaperDetailsContent() {
  const params = useParams();
  const paperId = params.id as string;
  const { token } = useAuth();

  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPaper() {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<Paper>(`/papers/${paperId}`, {
        token: token || undefined,
      });

      setPaper(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load paper details."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (paperId) loadPaper();
  }, [paperId, token]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-7">
        <Link
          href="/papers"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
        >
          <ArrowLeft size={17} />
          Back to Explore Papers
        </Link>

        {loading ? (
          <Loading message="Loading paper details..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={loadPaper} />
        ) : paper ? (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <BookOpen size={25} />
                </div>
                <span className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                  Research Publication
                </span>
              </div>

              <h1 className="text-3xl font-bold leading-tight text-slate-900">
                {paper.title}
              </h1>

              <div className="mt-6 flex flex-wrap gap-5 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                  <Calendar size={17} />
                  {paper.publicationYear}
                </span>

                <span className="flex items-center gap-2">
                  <Quote size={17} />
                  {paper.citationCount} citations
                </span>

                {paper.venue && <span>{paper.venue}</span>}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
              <h2 className="text-xl font-bold text-slate-900">
                Abstract
              </h2>

              <p className="mt-4 whitespace-pre-line text-sm leading-8 text-slate-600">
                {paper.abstract}
              </p>
            </section>

            <section className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                <div className="flex items-center gap-3">
                  <Users size={21} className="text-blue-600" />
                  <h2 className="text-lg font-bold text-slate-900">
                    Authors
                  </h2>
                </div>

                {paper.authors?.length ? (
                  <div className="mt-5 space-y-4">
                    {paper.authors.map((author) => (
                      <div
                        key={author.id}
                        className="rounded-xl bg-slate-50 p-4"
                      >
                        <Link
                          href={`/researchers/${author.id}`}
                          className="font-semibold text-slate-800 hover:text-blue-600"
                        >
                          {author.name}
                        </Link>

                        {author.affiliation && (
                          <p className="mt-1 text-sm text-slate-500">
                            {author.affiliation}
                          </p>
                        )}

                        {author.researchArea && (
                          <p className="mt-1 text-xs text-slate-400">
                            {author.researchArea}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-slate-500">
                    No author information available.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                <div className="flex items-center gap-3">
                  <Tag size={21} className="text-purple-600" />
                  <h2 className="text-lg font-bold text-slate-900">
                    Research Topics
                  </h2>
                </div>

                {paper.topics?.length ? (
                  <div className="mt-5 flex flex-wrap gap-3">
                    {paper.topics.map((topic) => (
                      <span
                        key={topic.id}
                        className="rounded-xl bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700"
                      >
                        {topic.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-slate-500">
                    No topics assigned to this paper.
                  </p>
                )}

                <div className="mt-8 border-t border-slate-100 pt-6">
                  <h3 className="font-semibold text-slate-800">
                    Publication Information
                  </h3>

                  <div className="mt-4 space-y-3 text-sm">
                    <div>
                      <p className="text-slate-400">Publication Year</p>
                      <p className="mt-1 font-medium text-slate-700">
                        {paper.publicationYear}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">Venue</p>
                      <p className="mt-1 font-medium text-slate-700">
                        {paper.venue || "Not specified"}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">DOI</p>
                      {paper.doi ? (
                        <a
                          href={`https://doi.org/${paper.doi}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-2 font-medium text-blue-600 hover:underline"
                        >
                          {paper.doi}
                          <ExternalLink size={14} />
                        </a>
                      ) : (
                        <p className="mt-1 text-slate-700">
                          Not available
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </AppLayout>
  );
}

export default function PaperDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading paper details...
        </div>
      }
    >
      <PaperDetailsContent />
    </Suspense>
  );
}