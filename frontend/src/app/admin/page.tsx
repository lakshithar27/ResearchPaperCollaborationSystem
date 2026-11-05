"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ShieldCheck,
  Users,
  BookOpen,
  Tags,
  Quote,
  Trash2,
  RefreshCw,
  Search,
  AlertTriangle,
} from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import Loading from "@/components/common/Loading";
import ErrorMessage from "@/components/common/ErrorMessage";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { User, Paper } from "@/types";

interface AdminStats {
  totalResearchers: number;
  totalPapers: number;
  totalTopics: number;
  totalCitations: number;
}

interface AdminUsersResponse {
  users: User[];
  total: number;
}

interface AdminPapersResponse {
  papers: Paper[];
  total: number;
}

export default function AdminPage() {
  const { user, token, loading: authLoading } = useAuth();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "papers">("users");

  const loadAdminData = useCallback(async () => {
    if (authLoading) return;

    if (!token || user?.role !== "Admin") {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [statsResponse, usersResponse, papersResponse] =
        await Promise.all([
          apiRequest<AdminStats>("/admin/overview", { token }),
          apiRequest<AdminUsersResponse>("/admin/users", { token }),
          apiRequest<AdminPapersResponse>("/admin/papers", { token }),
        ]);

      setStats(statsResponse);
      setUsers(usersResponse.users);
      setPapers(papersResponse.papers);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load administrator data."
      );
    } finally {
      setLoading(false);
    }
  }, [token, user, authLoading]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  async function handleDeletePaper(paperId: number, title: string) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${title}"? This action cannot be undone.`
    );

    if (!confirmed || !token) return;

    try {
      await apiRequest(`/admin/papers/${paperId}`, {
        method: "DELETE",
        token,
      });

      setPapers((current) =>
        current.filter((paper) => paper.id !== paperId)
      );

      setStats((current) =>
        current
          ? { ...current, totalPapers: Math.max(0, current.totalPapers - 1) }
          : current
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete this paper."
      );
    }
  }

  const filteredUsers = users.filter((item) =>
    `${item.name} ${item.email} ${item.role}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const filteredPapers = papers.filter((paper) =>
    paper.title.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <AppLayout>
        <Loading message="Loading administrator dashboard..." />
      </AppLayout>
    );
  }

  if (!user || user.role !== "Admin") {
    return (
      <AppLayout>
        <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle size={32} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Access Denied
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            You do not have administrator permissions to access this page.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-100 p-3 text-purple-700">
                <ShieldCheck size={27} />
              </div>

              <h1 className="text-3xl font-bold text-slate-900">
                Admin Dashboard
              </h1>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Manage researchers, research papers and platform activity.
            </p>
          </div>

          <button
            onClick={loadAdminData}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh Data
          </button>
        </div>

        {error && <ErrorMessage message={error} />}

        {stats && (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {[
              {
                label: "Researchers",
                value: stats.totalResearchers,
                icon: Users,
                color: "blue",
              },
              {
                label: "Research Papers",
                value: stats.totalPapers,
                icon: BookOpen,
                color: "purple",
              },
              {
                label: "Research Topics",
                value: stats.totalTopics,
                icon: Tags,
                color: "orange",
              },
              {
                label: "Total Citations",
                value: stats.totalCitations,
                icon: Quote,
                color: "green",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="card-3d p-5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">
                      {item.label}
                    </p>

                    <div className={`rounded-xl bg-${item.color}-100 p-3 text-${item.color}-700`}>
                      <Icon size={21} />
                    </div>
                  </div>

                  <p className="mt-4 text-3xl font-bold text-slate-900">
                    {item.value.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </section>
        )}

        <section className="card-3d overflow-hidden">

          <div className="border-b border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Platform Management
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View registered users and manage research publications.
            </p>

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setActiveTab("users");
                    setSearch("");
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                    activeTab === "users"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Users ({users.length})
                </button>

                <button
                  onClick={() => {
                    setActiveTab("papers");
                    setSearch("");
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                    activeTab === "papers"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Papers ({papers.length})
                </button>
              </div>

              <div className="relative w-full sm:max-w-xs">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    activeTab === "users"
                      ? "Search users..."
                      : "Search papers..."
                  }
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {activeTab === "users" ? (
            filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No users found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Researcher</th>
                      <th className="px-6 py-4">Affiliation</th>
                      <th className="px-6 py-4">Research Area</th>
                      <th className="px-6 py-4">Role</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">
                            {item.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.email}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {item.affiliation || "Not provided"}
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {item.researchArea || "Not provided"}
                        </td>

                        <td className="px-6 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.role === "Admin"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {item.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : filteredPapers.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No research papers found.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredPapers.map((paper) => (
                <div
                  key={paper.id}
                  className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800">
                      {paper.title}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                      {paper.abstract}
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                      {paper.publicationYear} · {paper.citationCount} citations
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeletePaper(paper.id, paper.title)}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                    Delete Paper
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </AppLayout>
  );
}