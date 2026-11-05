"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Users,
  BookOpen,
  Building2,
  Mail,
  ArrowRight,
  RefreshCw,
  UserRound,
} from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import Loading from "@/components/common/Loading";
import ErrorMessage from "@/components/common/ErrorMessage";
import EmptyState from "@/components/common/EmptyState";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Researcher, ResearcherListResponse } from "@/types";

export default function ResearchersPage() {
  const { token } = useAuth();

  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [areaFilter, setAreaFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadResearchers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<ResearcherListResponse>(
        "/researchers",
        { token: token || undefined }
      );

      setResearchers(response.researchers);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load researchers."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadResearchers();
  }, [loadResearchers]);

  const researchAreas = useMemo(
    () =>
      Array.from(
        new Set(
          researchers
            .map((researcher) => researcher.researchArea)
            .filter((area): area is string => Boolean(area))
        )
      ).sort(),
    [researchers]
  );

  const filteredResearchers = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();

    return researchers.filter((researcher) => {
      const matchesSearch =
        !searchTerm ||
        researcher.name.toLowerCase().includes(searchTerm) ||
        researcher.email.toLowerCase().includes(searchTerm) ||
        (researcher.affiliation || "").toLowerCase().includes(searchTerm) ||
        (researcher.researchArea || "").toLowerCase().includes(searchTerm);

      const matchesRole =
        roleFilter === "All" || researcher.role === roleFilter;

      const matchesArea =
        areaFilter === "All" || researcher.researchArea === areaFilter;

      return matchesSearch && matchesRole && matchesArea;
    });
  }, [researchers, search, roleFilter, areaFilter]);

  return (
    <AppLayout>
      <div className="space-y-8">

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                <Users size={25} />
              </div>

              <h1 className="text-3xl font-bold text-slate-900">
                Researchers
              </h1>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Discover researchers, explore their interests and connect
              through shared research.
            </p>
          </div>

          <button
            onClick={loadResearchers}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="card-3d p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                <Users size={21} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Researchers</p>
                <p className="text-2xl font-bold text-slate-900">
                  {loading ? "—" : researchers.length}
                </p>
              </div>
            </div>
          </div>

          <div className="card-3d p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
                <BookOpen size={21} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Research Areas</p>
                <p className="text-2xl font-bold text-slate-900">
                  {loading ? "—" : researchAreas.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="card-3d p-6">
          <div className="grid gap-4 md:grid-cols-3">

            <div className="relative md:col-span-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email or affiliation..."
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="All">All Roles</option>
              <option value="Student">Students</option>
              <option value="Researcher">Researchers</option>
              <option value="Admin">Administrators</option>
            </select>

            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="All">All Research Areas</option>
              {researchAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>

          </div>
        </section>

        {error && <ErrorMessage message={error} />}

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Research Community
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Loading researchers..."
                : `${filteredResearchers.length} researcher(s) found`}
            </p>
          </div>
        </div>

        {loading ? (
          <Loading message="Loading researcher profiles..." />
        ) : filteredResearchers.length === 0 ? (
          <EmptyState
            title="No researchers found"
            description="Try changing your search term or filters."
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredResearchers.map((researcher) => (
              <article
                key={researcher.id}
                className="card-3d p-6 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700">
                    <UserRound size={27} />
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {researcher.role}
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  {researcher.name}
                </h3>

                <div className="mt-3 space-y-2">
                  <p className="flex items-center gap-2 break-all text-sm text-slate-500">
                    <Mail size={15} className="shrink-0" />
                    {researcher.email}
                  </p>

                  {researcher.affiliation && (
                    <p className="flex items-center gap-2 text-sm text-slate-500">
                      <Building2 size={15} className="shrink-0" />
                      {researcher.affiliation}
                    </p>
                  )}
                </div>

                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Research Area
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {researcher.researchArea || "Not specified"}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div>
                    <p className="text-xs text-slate-400">Publications</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {researcher.paperCount ?? "—"}
                    </p>
                  </div>

                  <Link
                    href={`/researchers/${researcher.id}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    View Profile
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

      </div>
    </AppLayout>
  );
}