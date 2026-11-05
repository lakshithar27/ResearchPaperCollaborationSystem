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
      params.set("page_size", "20");

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
      // Topic filtering remains optional if the endpoint is unavailable.
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

        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              RESEARCH LIBRARY
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Explore Research Papers
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Discover academic publications and explore new research ideas.
            </p>
          </div>

          <Link
            href="/papers/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add New Paper
          </Link>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <SlidersHorizontal size={19} className="text-blue-600" />
            <h2 className="font-semibold text-slate-800">
              Search and Filters
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            <div className="relative xl:col-span-2">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search papers, authors or keywords..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>

            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">All publication years</option>
              {Array.from(
                { length: 30 },
                (_, index) => 2026 - index
              ).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">All research topics</option>
              {topics.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ArrowUpDown size={17} className="text-slate-400" />

              <span className="text-sm text-slate-500">Sort by:</span>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
              >
                <option value="year">Publication year</option>
                <option value="title">Title</option>
                <option value="citations">Citation count</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:underline"
              >
                <X size={16} />
                Clear filters
              </button>
            )}
          </div>
        </section>

        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Available Publications
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {loading
                  ? "Searching publications..."
                  : `${total} paper${total === 1 ? "" : "s"} found`}
              </p>
            </div>
          </div>

          {loading ? (
            <Loading message="Finding research papers..." />
          ) : error ? (
            <ErrorMessage message={error} onRetry={loadPapers} />
          ) : papers.length === 0 ? (
            <EmptyState
              title="No papers found"
              description="Try changing your search terms or clearing the filters."
            />
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {papers.map((paper) => (
                <article
                  key={paper.id}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                      <BookOpen size={22} />
                    </div>

                    <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {paper.publicationYear}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-bold leading-7 text-slate-900">
                    {paper.title}
                  </h3>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                    {paper.abstract}
                  </p>

                  {paper.authors?.length > 0 && (
                    <p className="mt-4 text-sm text-slate-600">
                      <span className="font-semibold">Authors: </span>
                      {paper.authors.map((author) => author.name).join(", ")}
                    </p>
                  )}

                  {paper.topics?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {paper.topics.map((item) => (
                        <span
                          key={item.id}
                          className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                        >
                          {item.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-5 mt-5">
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={15} />
                        {paper.publicationYear}
                      </span>

                      <span className="flex items-center gap-1">
                        <Quote size={15} />
                        {paper.citationCount} citations
                      </span>
                    </div>

                    <Link
                      href={`/papers/${paper.id}`}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                    >
                      View Details
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
