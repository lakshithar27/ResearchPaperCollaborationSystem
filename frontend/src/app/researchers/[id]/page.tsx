"use client";

import { Suspense } from 'react';
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  UserRound,
  Mail,
  Building2,
  BookOpen,
  Calendar,
  Quote,
  ExternalLink,
} from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import Loading from "@/components/common/Loading";
import ErrorMessage from "@/components/common/ErrorMessage";
import EmptyState from "@/components/common/EmptyState";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Researcher, PaperListResponse } from "@/types";

interface ResearcherProfileResponse {
  researcher: Researcher;
  papers: PaperListResponse;
}

function ResearcherProfileContent() {
  const params = useParams();
  const researcherId = params.id as string;
  const { token } = useAuth();

  const [researcher, setResearcher] = useState<Researcher | null>(null);
  const [papers, setPapers] = useState<PaperListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const response = await apiRequest<ResearcherProfileResponse>(
          `/researchers/${researcherId}`,
          { token: token || undefined }
        );

        setResearcher(response.researcher);
        setPapers(response.papers);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load researcher profile."
        );
      } finally {
        setLoading(false);
      }
    }

    if (researcherId) loadProfile();
  }, [researcherId, token]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-7">

        <Link
          href="/researchers"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
        >
          <ArrowLeft size={17} />
          Back to Researchers
        </Link>

        {error && <ErrorMessage message={error} />}

        {loading ? (
          <Loading message="Loading researcher profile..." />
        ) : !researcher ? (
          <EmptyState
            title="Researcher not found"
            description="This researcher profile could not be found."
          />
        ) : (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700">
                  <UserRound size={46} />
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-bold text-slate-900">
                      {researcher.name}
                    </h1>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {researcher.role}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3 text-sm text-slate-500">
                    <p className="flex items-center gap-2">
                      <Mail size={16} />
                      {researcher.email}
                    </p>

                    {researcher.affiliation && (
                      <p className="flex items-center gap-2">
                        <Building2 size={16} />
                        {researcher.affiliation}
                      </p>
                    )}

                    {researcher.joinedDate && (
                      <p className="flex items-center gap-2">
                        <Calendar size={16} />
                        Joined{" "}
                        {new Date(researcher.joinedDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                  Research Interests
                </h2>

                <p className="mt-3 text-base font-medium text-slate-800">
                  {researcher.researchArea || "No research area specified."}
                </p>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <BookOpen className="text-blue-600" size={22} />
                <p className="mt-3 text-sm text-slate-500">Publications</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {papers?.total ?? researcher.paperCount ?? 0}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <Quote className="text-purple-600" size={22} />
                <p className="mt-3 text-sm text-slate-500">Total Citations</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {papers?.papers.reduce(
                    (sum, paper) => sum + (paper.citationCount || 0),
                    0
                  ) ?? 0}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <Building2 className="text-green-600" size={22} />
                <p className="mt-3 text-sm text-slate-500">Research Role</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {researcher.role}
                </p>
              </div>
            </section>

            <section>
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900">
                  Published Research
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Publications associated with this researcher.
                </p>
              </div>

              {!papers || papers.papers.length === 0 ? (
                <EmptyState
                  title="No publications found"
                  description="This researcher has no linked publications yet."
                />
              ) : (
                <div className="space-y-4">
                  {papers.papers.map((paper) => (
                    <article
                      key={paper.id}
                      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                    >
                      <Link
                        href={`/papers/${paper.id}`}
                        className="text-lg font-bold text-slate-900 hover:text-blue-600"
                      >
                        {paper.title}
                      </Link>

                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                        {paper.abstract}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          {paper.publicationYear}
                        </span>

                        <span className="flex items-center gap-1.5">
                          <Quote size={14} />
                          {paper.citationCount} citations
                        </span>

                        {paper.venue && <span>{paper.venue}</span>}
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

                      <Link
                        href={`/papers/${paper.id}`}
                        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Read Paper
                        <ExternalLink size={15} />
                      </Link>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppLayout>
  );
}

export default function ResearcherProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading researcher profile...
        </div>
      }
    >
      <ResearcherProfileContent />
    </Suspense>
  );
}