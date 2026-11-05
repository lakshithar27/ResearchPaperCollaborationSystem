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
  Network,
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
    color: "bg-blue-50 text-blue-600 border border-blue-200/80",
    borderAccent: "hover:border-blue-400",
  },
  {
    key: "totalResearchers" as const,
    label: "Researchers",
    icon: Users,
    color: "bg-purple-50 text-purple-600 border border-purple-200/80",
    borderAccent: "hover:border-purple-400",
  },
  {
    key: "totalTopics" as const,
    label: "Research Topics",
    icon: Tags,
    color: "bg-emerald-50 text-emerald-600 border border-emerald-200/80",
    borderAccent: "hover:border-emerald-400",
  },
  {
    key: "totalCitations" as const,
    label: "Total Citations",
    icon: Quote,
    color: "bg-amber-50 text-amber-600 border border-amber-200/80",
    borderAccent: "hover:border-amber-400",
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
        apiRequest<PaperListResponse>("/papers?page=1&page_size=6", {
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

        {/* 1. HERO SECTION (Clean 3D White & Slate Blue Banner) */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-8 py-10 text-white shadow-xl sm:px-10 border-b-4 border-blue-900">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-wide text-blue-100 backdrop-blur-md uppercase mb-3 border border-white/20">
              <Sparkles size={13} />
              Research Collaboration Platform
            </div>

            <h1 className="text-3xl font-black sm:text-4xl tracking-tight text-white">
              Discover. Connect. Innovate.
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base font-normal">
              Explore 40 peer-reviewed research publications across 12 disciplines, connect with
              collaborators, and discover relevant academic work through intelligent recommendations.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/papers"
                className="btn-3d-light inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-slate-800 transition"
              >
                <Search size={16} className="text-blue-600" />
                Explore Papers
              </Link>

              <Link
                href="/citations"
                className="btn-3d-light inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-slate-800 transition"
              >
                <Network size={16} className="text-purple-600" />
                Citation Explorer
              </Link>

              <Link
                href="/papers/new"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 hover:bg-white/20 px-5 py-3 text-sm font-bold text-white transition backdrop-blur-md"
              >
                <Plus size={16} />
                Add Publication
              </Link>
            </div>
          </div>

          <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full border-[35px] border-white/10 pointer-events-none" />
          <div className="absolute -bottom-32 right-32 h-72 w-72 rounded-full border-[35px] border-white/10 pointer-events-none" />
        </section>

        {/* 2. 4 WHITE & GRAY 3D STAT CARDS */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Research Overview
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 font-medium">
                Live metrics across all publications and active researchers.
              </p>
            </div>

            <button
              onClick={loadDashboard}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition"
            >
              Refresh Stats
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
                    className={`card-3d p-6 relative overflow-hidden ${card.borderAccent}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`rounded-2xl p-3 ${card.color} shadow-sm`}>
                        <Icon size={22} />
                      </div>
                      <TrendingUp size={18} className="text-slate-300" />
                    </div>

                    <p className="mt-5 text-4xl font-black tracking-tight text-slate-900">
                      {(stats?.[card.key] ?? 0).toLocaleString()}
                    </p>

                    <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                      {card.label}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 3. RECENT PUBLICATIONS & SMART DISCOVERY (WHITE 3D CARDS) */}
        <section className="grid gap-6 lg:grid-cols-3">

          {/* Left Column: Recent Papers */}
          <div className="card-3d p-6 lg:col-span-2">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Recently Added Papers
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Explore recent academic publications and landmark research.
                </p>
              </div>

              <Link
                href="/papers"
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>

            {loading ? (
              <Loading message="Loading recent papers..." />
            ) : error ? (
              <p className="text-xs text-slate-500">
                Recent papers are currently unavailable.
              </p>
            ) : papers.length === 0 ? (
              <EmptyState
                title="No research papers yet"
                description="Once papers are added, they will appear here."
              />
            ) : (
              <div className="space-y-3">
                {papers.map((paper) => (
                  <div
                    key={paper.id}
                    className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition duration-150 hover:bg-white hover:border-blue-300 hover:shadow-md"
                  >
                    <Link
                      href={`/papers/${paper.id}`}
                      className="font-bold text-slate-900 hover:text-blue-600 text-sm transition"
                    >
                      {paper.title}
                    </Link>

                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600">
                      {paper.abstract}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{paper.publicationYear}</span>
                      <span>•</span>
                      <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                        {paper.citationCount} citations
                      </span>
                      {paper.venue && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-xs">{paper.venue}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Smart Discovery & Quick Actions */}
          <div className="space-y-6">
            <div className="card-3d p-6 relative overflow-hidden">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-purple-50 p-3 text-purple-600 border border-purple-200">
                  <Sparkles size={22} />
                </div>
                <h2 className="font-bold text-slate-900 text-base">
                  Smart Discovery
                </h2>
              </div>

              <p className="text-xs leading-relaxed text-slate-600">
                Discover research papers that match your interests using
                content-based similarity and intelligent vector recommendations.
              </p>

              <Link
                href="/recommendations"
                className="btn-3d mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 py-3 text-xs font-bold text-white transition shadow-md"
              >
                Explore Recommendations
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="card-3d p-6">
              <h2 className="font-bold text-slate-900 text-base">
                Quick Actions
              </h2>

              <div className="mt-4 space-y-2.5">
                <Link
                  href="/papers/new"
                  className="flex items-center gap-3 rounded-2xl bg-slate-50 hover:bg-blue-50/60 p-3 text-xs font-bold text-slate-700 transition hover:text-blue-700 border border-slate-200/60"
                >
                  <Plus size={16} className="text-blue-600" />
                  Add a research paper
                </Link>

                <Link
                  href="/researchers"
                  className="flex items-center gap-3 rounded-2xl bg-slate-50 hover:bg-blue-50/60 p-3 text-xs font-bold text-slate-700 transition hover:text-blue-700 border border-slate-200/60"
                >
                  <Users size={16} className="text-purple-600" />
                  Discover researchers
                </Link>

                <Link
                  href="/citations"
                  className="flex items-center gap-3 rounded-2xl bg-slate-50 hover:bg-blue-50/60 p-3 text-xs font-bold text-slate-700 transition hover:text-blue-700 border border-slate-200/60"
                >
                  <Network size={16} className="text-emerald-600" />
                  Explore citation network
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-slate-200/80 pt-5 text-center text-xs text-slate-400">
          ResearchHub — Research Collaboration & Recommendation System
          {user?.name ? ` · Welcome, ${user.name}` : ""}
        </footer>

      </div>
    </AppLayout>
  );
}
