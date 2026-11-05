"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  BookOpen,
  SlidersHorizontal,
  Quote,
  Calendar,
  X,
  ArrowUpDown,
  ExternalLink,
} from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import Loading from "@/components/common/Loading";
import EmptyState from "@/components/common/EmptyState";
import ErrorMessage from "@/components/common/ErrorMessage";

import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Paper, PaperListResponse, Topic } from "@/types";

export default function PapersPage() {
  const { token } = useAuth();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [topic, setTopic] = useState("");
  const [sortBy, setSortBy] = useState("year");
  const [sortOrder, setSortOrder] = useState("desc");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);

  async function loadPapers() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (search.trim()) params.set("query", search.trim());
      if (year) params.set("year", year);
      if (topic) params.set("topic", topic);

      params.set("sort_by", sortBy);
      params.set("sort_order", sortOrder);
      params.set("page", "1");
      params.set("page_size", "30");

      const response = await apiRequest<PaperListResponse>(
        `/papers?${params.toString()}`,
        { token: token || undefined }
      );

      setPapers(response.papers);
      setTotal(response.total);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load research papers."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadTopics() {
    try {
      const response = await apiRequest<Topic[]>("/topics", {
        token: token || undefined,
      });

      setTopics(response);
    } catch {
      // Optional topic fallback
    }
  }

  useEffect(() => {
    loadTopics();
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPapers();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, year, topic, sortBy, sortOrder, token]);

  function clearFilters() {
    setSearch("");
    setYear("");
    setTopic("");
    setSortBy("year");
    setSortOrder("desc");
  }

  const hasFilters = Boolean(search || year || topic);

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-7">

        {/* 1. PAGE HEADER */}
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/80 px-3 py-1 text-xs font-black uppercase tracking-wider text-blue-700 border border-blue-200 mb-2">
              <BookOpen size={13} />
              Peer-Reviewed Repository
            </div>

            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Explore Research Papers
            </h1>

            <p className="mt-1.5 text-xs text-slate-500 font-medium">
              Discover academic publications, view co-authorship credentials, and inspect citation vectors.
            </p>
          </div>

          <Link
            href="/papers/new"
            className="btn-3d inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white shadow-md"
          >
            <Plus size={18} />
            Add New Publication
          </Link>
        </section>

        {/* 2. 3D SEARCH & FILTERS PANEL */}
        <section className="card-3d p-6">
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-blue-600" />
            <h2 className="font-bold text-slate-900 text-sm">
              Search and Advanced Filters
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative xl:col-span-2">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, author, abstract or keywords..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-3 pl-11 pr-4 text-xs font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>

            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-500"
            >
              <option value="">All publication years</option>
              {Array.from({ length: 30 }, (_, index) => 2026 - index).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-500"
            >
              <option value="">All research topics</option>
              {topics.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2.5">
              <ArrowUpDown size={15} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500">Sort:</span>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 outline-none"
              >
                <option value="year">Publication year</option>
                <option value="title">Title</option>
                <option value="citations">Citation count</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 outline-none"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 transition"
              >
                <X size={14} />
                Clear filters
              </button>
            )}
          </div>
        </section>

        {/* 3. 3D RESEARCH PUBLICATIONS GRID */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Available Publications
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 font-medium">
                {loading
                  ? "Searching publications database..."
                  : `${total} paper${total === 1 ? "" : "s"} indexed in repository`}
              </p>
            </div>
          </div>

          {loading ? (
            <Loading message="Fetching research papers..." />
          ) : error ? (
            <ErrorMessage message={error} onRetry={loadPapers} />
          ) : papers.length === 0 ? (
            <EmptyState
              title="No papers found"
              description="Try changing your search keywords or clearing active filters."
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {papers.map((paper) => (
                <article
                  key={paper.id}
                  className="research-card-3d p-6 flex flex-col justify-between"
                >
                  <div>
                    {/* Header bar of 3D card */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center justify-center rounded-2xl bg-blue-50 border border-blue-200/90 p-2.5 text-blue-700 shadow-sm">
                        <BookOpen size={20} />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="badge-3d rounded-xl bg-slate-100 text-slate-700 font-black border border-slate-200 px-3 py-1 text-xs shadow-xs">
                          {paper.publicationYear}
                        </span>

                        <span className="badge-3d rounded-xl bg-emerald-50 text-emerald-800 font-black border border-emerald-200 px-2.5 py-1 text-xs shadow-xs flex items-center gap-1">
                          <Quote size={11} />
                          {paper.citationCount}
                        </span>
                      </div>
                    </div>

                    <h3 className="mt-4 text-base font-black leading-snug text-slate-900 hover:text-blue-600 transition">
                      <Link href={`/papers/${paper.id}`}>
                        {paper.title}
                      </Link>
                    </h3>

                    <p className="mt-2.5 line-clamp-3 text-xs leading-relaxed text-slate-600">
                      {paper.abstract}
                    </p>

                    {paper.authors?.length > 0 && (
                      <p className="mt-3 text-xs text-slate-600 font-medium">
                        <span className="font-bold text-slate-800">Authors: </span>
                        {paper.authors.map((author) => author.name).join(", ")}
                      </p>
                    )}

                    {paper.topics?.length > 0 && (
                      <div className="mt-3.5 flex flex-wrap gap-1.5">
                        {paper.topics.map((item) => (
                          <span
                            key={item.id}
                            className="badge-3d rounded-xl bg-slate-100 text-slate-700 border border-slate-200/90 px-2.5 py-0.5 text-[11px] font-semibold"
                          >
                            {item.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 3D Action Footer */}
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      {paper.venue ? (
                        <span className="truncate max-w-[220px] font-semibold text-slate-600">
                          {paper.venue}
                        </span>
                      ) : (
                        <span>Peer Reviewed</span>
                      )}
                    </div>

                    <Link
                      href={`/papers/${paper.id}`}
                      className="btn-3d inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white shadow-sm"
                    >
                      <span>View Details</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

      </div>
    </AppLayout>
  );
}
