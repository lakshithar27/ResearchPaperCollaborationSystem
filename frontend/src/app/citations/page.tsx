"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Network,
  Quote,
  BookOpen,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import Loading from "@/components/common/Loading";
import ErrorMessage from "@/components/common/ErrorMessage";
import EmptyState from "@/components/common/EmptyState";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Paper } from "@/types";

interface CitationNetworkResponse {
  paper: Paper;
  citedBy: Paper[];
  references: Paper[];
}

export default function CitationsPage() {
  const { token } = useAuth();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPaperId, setSelectedPaperId] = useState("");
  const [network, setNetwork] = useState<CitationNetworkResponse | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [networkLoading, setNetworkLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPapers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<{ papers: Paper[]; total: number }>(
        "/papers?page=1&page_size=100",
        { token: token || undefined }
      );

      setPapers(response.papers);

      if (response.papers.length > 0) {
        setSelectedPaperId(String(response.papers[0].id));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load papers."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadPapers();
  }, [loadPapers]);

  const loadNetwork = useCallback(async () => {
    if (!selectedPaperId) return;

    setNetworkLoading(true);
    setError("");

    try {
      const response = await apiRequest<CitationNetworkResponse>(
        `/citations/network?paper_id=${selectedPaperId}`,
        { token: token || undefined }
      );

      setNetwork(response);
    } catch (err) {
      setNetwork(null);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load citation network."
      );
    } finally {
      setNetworkLoading(false);
    }
  }, [selectedPaperId, token]);

  useEffect(() => {
    loadNetwork();
  }, [loadNetwork]);

  const filteredPapers = papers.filter((paper) =>
    paper.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-8">

        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-100 p-3 text-purple-700">
              <Network size={26} />
            </div>

            <h1 className="text-3xl font-bold text-slate-900">
              Citation Explorer
            </h1>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Explore relationships between research papers and discover
            how academic publications reference one another.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">
              Select a Research Paper
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose a paper to explore its citation relationships.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">

            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search papers..."
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={selectedPaperId}
              onChange={(e) => setSelectedPaperId(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:opacity-50"
            >
              <option value="">Select a paper</option>

              {filteredPapers.map((paper) => (
                <option key={paper.id} value={paper.id}>
                  {paper.title}
                </option>
              ))}
            </select>

          </div>

          {selectedPaperId && (
            <button
              onClick={loadNetwork}
              disabled={networkLoading}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={networkLoading ? "animate-spin" : ""}
              />
              Refresh Citation Network
            </button>
          )}
        </section>

        {error && <ErrorMessage message={error} />}

        {loading ? (
          <Loading message="Loading research papers..." />
        ) : papers.length === 0 ? (
          <EmptyState
            title="No papers available"
            description="Add research papers before exploring their citation relationships."
          />
        ) : networkLoading ? (
          <Loading message="Exploring citation relationships..." />
        ) : network ? (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                  <BookOpen size={24} />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Selected Paper
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    {network.paper.title}
                  </h2>
                </div>
              </div>

              <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                {network.paper.abstract}
              </p>

              <Link
                href={`/papers/${network.paper.id}`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
              >
                View Paper Details
                <ExternalLink size={15} />
              </Link>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-green-100 p-3 text-green-700">
                    <ArrowDownLeft size={22} />
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      Cited By
                    </p>
                    <p className="text-3xl font-bold text-slate-900">
                      {network.citedBy.length}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-400">
                  Papers that reference this publication.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-purple-100 p-3 text-purple-700">
                    <ArrowUpRight size={22} />
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      References
                    </p>
                    <p className="text-3xl font-bold text-slate-900">
                      {network.references.length}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-400">
                  Papers referenced by this publication.
                </p>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <ArrowDownLeft className="text-green-600" size={21} />
                  <h2 className="text-lg font-bold text-slate-900">
                    Papers Citing This Work
                  </h2>
                </div>

                {network.citedBy.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                    No papers currently cite this publication.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {network.citedBy.map((paper) => (
                      <Link
                        key={paper.id}
                        href={`/papers/${paper.id}`}
                        className="block rounded-xl border border-slate-100 p-4 transition hover:border-green-200 hover:bg-green-50"
                      >
                        <p className="text-sm font-semibold text-slate-800">
                          {paper.title}
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                          {paper.publicationYear} · {paper.citationCount} citations
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <ArrowUpRight className="text-purple-600" size={21} />
                  <h2 className="text-lg font-bold text-slate-900">
                    Referenced Papers
                  </h2>
                </div>

                {network.references.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                    This publication has no recorded references.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {network.references.map((paper) => (
                      <Link
                        key={paper.id}
                        href={`/papers/${paper.id}`}
                        className="block rounded-xl border border-slate-100 p-4 transition hover:border-purple-200 hover:bg-purple-50"
                      >
                        <p className="text-sm font-semibold text-slate-800">
                          {paper.title}
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                          {paper.publicationYear} · {paper.citationCount} citations
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

            </section>
          </>
        ) : (
          <EmptyState
            title="Citation network unavailable"
            description="Select a paper to explore its citation relationships."
          />
        )}

      </div>
    </AppLayout>
  );
}