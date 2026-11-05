"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Users,
  Tags,
  Quote,
  Plus,
  ArrowRight,
  Sparkles,
  Search,
  TrendingUp,
} from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import Loading from "@/components/common/Loading";
import EmptyState from "@/components/common/EmptyState";
import ErrorMessage from "@/components/common/ErrorMessage";

import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { DashboardStats, Paper, PaperListResponse } from "@/types";

const statCards = [
  {
    key: "totalPapers" as const,
    label: "Research Papers",
    icon: BookOpen,
    color: "bg-blue-50 text-blue-600",
  },
  {
    key: "totalResearchers" as const,
    label: "Researchers",
    icon: Users,
    color: "bg-purple-50 text-purple-600",
  },
  {
    key: "totalTopics" as const,
    label: "Research Topics",
    icon: Tags,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    key: "totalCitations" as const,
    label: "Total Citations",
    icon: Quote,
    color: "bg-orange-50 text-orange-600",
  },
];

export default function DashboardPage() {
  const { token, user } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [statsData, paperData] = await Promise.all([
        apiRequest<DashboardStats>("/dashboard/stats", { token: token || undefined }),
        apiRequest<PaperListResponse>("/papers?page=1&page_size=5", {
          token: token || undefined,
        }),
      ]);

      setStats(statsData);
      setPapers(paperData.papers);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard information."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [token]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-8">

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-8 py-10 text-white shadow-lg sm:px-10">
          <div className="relative z-10 max-w-2xl">
            <p className="mb-3 text-sm font-medium text-blue-100">
              YOUR RESEARCH WORKSPACE
            </p>

            <h1 className="text-3xl font-bold sm:text-4xl">
              Discover. Connect. Innovate.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
              Explore research publications, connect with fellow researchers,
              and discover relevant academic work through intelligent
              recommendations.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/papers"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                <Search size={17} />
                Explore Papers
              </Link>

              <Link
                href="/papers/new"
                className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <Plus size={17} />
                Add Research
              </Link>
            </div>
          </div>

          <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full border-[35px] border-white/10" />
          <div className="absolute -bottom-32 right-32 h-72 w-72 rounded-full border-[35px] border-white/10" />
        </section>

        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Research Overview
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                An overview of the ResearchHub community.
              </p>
            </div>

            <button
              onClick={loadDashboard}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <Loading message="Loading research statistics..." />
          ) : error ? (
            <ErrorMessage message={error} onRetry={loadDashboard} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((card) => {
                const Icon = card.icon;

                return (
                  <div
                    key={card.key}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`rounded-xl p-3 ${card.color}`}>
                        <Icon size={23} />
                      </div>
                      <TrendingUp size={18} className="text-slate-300" />
                    </div>

                    <p className="mt-5 text-3xl font-bold text-slate-900">
                      {(stats?.[card.key] ?? 0).toLocaleString()}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {card.label}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Recently Added Papers
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Explore the latest research publications.
                </p>
              </div>

              <Link
                href="/papers"
                className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
              >
                View all <ArrowRight size={16} />
              </Link>
            </div>

            {loading ? (
              <Loading message="Loading recent papers..." />
            ) : error ? (
              <p className="text-sm text-slate-500">
                Recent papers are currently unavailable.
              </p>
            ) : papers.length === 0 ? (
              <EmptyState
                title="No research papers yet"
                description="Once papers are added to ResearchHub, they will appear here."
              />
            ) : (
              <div className="space-y-4">
                {papers.map((paper) => (
                  <div
                    key={paper.id}
                    className="rounded-xl border border-slate-100 p-4 transition hover:border-blue-200 hover:bg-blue-50/30"
                  >
                    <Link
                      href={`/papers/${paper.id}`}
                      className="font-semibold text-slate-800 hover:text-blue-600"
                    >
                      {paper.title}
                    </Link>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                      {paper.abstract}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>{paper.publicationYear}</span>
                      <span>•</span>
                      <span>{paper.citationCount} citations</span>
                      {paper.venue && (
                        <>
                          <span>•</span>
                          <span>{paper.venue}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
                  <Sparkles size={22} />
                </div>
                <h2 className="font-bold text-slate-900">
                  Smart Discovery
                </h2>
              </div>

              <p className="text-sm leading-6 text-slate-500">
                Discover research papers that match your interests using
                content-based similarity and intelligent recommendations.
              </p>

              <Link
                href="/recommendations"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
              >
                Explore Recommendations
                <ArrowRight size={17} />
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-bold text-slate-900">
                Quick Actions
              </h2>

              <div className="mt-4 space-y-3">
                <Link
                  href="/papers/new"
                  className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  <Plus size={18} />
                  Add a research paper
                </Link>

                <Link
                  href="/researchers"
                  className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  <Users size={18} />
                  Discover researchers
                </Link>

                <Link
                  href="/citations"
                  className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  <Quote size={18} />
                  Explore citation network
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-200 pt-5 text-center text-xs text-slate-400">
          ResearchHub — Research Collaboration & Recommendation System
          {user?.name ? ` · Welcome, ${user.name}` : ""}
        </footer>

      </div>
    </AppLayout>
  );
}
