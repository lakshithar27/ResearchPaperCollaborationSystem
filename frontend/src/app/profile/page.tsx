"use client";

import { useCallback, useEffect, useState } from "react";
import {
  UserCircle,
  Mail,
  Building2,
  FlaskConical,
  ShieldCheck,
  Save,
  RefreshCw,
} from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import Loading from "@/components/common/Loading";
import ErrorMessage from "@/components/common/ErrorMessage";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types";

export default function ProfilePage() {
  const { user, token, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [researchArea, setResearchArea] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProfile = useCallback(async () => {
    if (authLoading) return;

    if (!token) {
      setLoading(false);
      setError("Please log in to view your profile.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<User>("/users/me", {
        token,
      });

      setProfile(response);
      setName(response.name);
      setAffiliation(response.affiliation || "");
      setResearchArea(response.researchArea || "");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  }, [token, authLoading]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updatedProfile = await apiRequest<User>("/users/me", {
        method: "PUT",
        token: token || undefined,
        body: JSON.stringify({
          name: name.trim(),
          affiliation: affiliation.trim(),
          researchArea: researchArea.trim(),
        }),
      });

      setProfile(updatedProfile);
      setName(updatedProfile.name);
      setAffiliation(updatedProfile.affiliation || "");
      setResearchArea(updatedProfile.researchArea || "");
      setSuccess("Your profile has been updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <AppLayout>
        <Loading message="Loading your profile..." />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-8">

        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
              <UserCircle size={27} />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                My Profile
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage your researcher information and account details.
              </p>
            </div>
          </div>
        </div>

        {error && <ErrorMessage message={error} />}

        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
            {success}
          </div>
        )}

        {profile && (
          <>
            <section className="card-3d p-6">
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <UserCircle size={52} />
                </div>

                <div className="text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {profile.name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {profile.email}
                  </p>

                  <span className="mt-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {profile.role}
                  </span>
                </div>
              </div>
            </section>

            <section className="card-3d p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  Personal Information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update the information associated with your researcher account.
                </p>
              </div>

              <form onSubmit={handleSave} className="space-y-5">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Full Name
                  </label>

                  <div className="relative">
                    <UserCircle
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email Address
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-500"
                    />
                  </div>

                  <p className="mt-1 text-xs text-slate-400">
                    Your registered email address cannot be changed here.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Affiliation / Institution
                  </label>

                  <div className="relative">
                    <Building2
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      value={affiliation}
                      onChange={(e) => setAffiliation(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="University or research institution"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Research Area
                  </label>

                  <div className="relative">
                    <FlaskConical
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      value={researchArea}
                      onChange={(e) => setResearchArea(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="e.g. Machine Learning, Data Science"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row">

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={17} />
                    {saving ? "Saving Changes..." : "Save Changes"}
                  </button>

                  <button
                    type="button"
                    onClick={loadProfile}
                    disabled={saving || loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RefreshCw size={16} />
                    Reset Changes
                  </button>

                </div>
              </form>
            </section>

            <section className="card-3d p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-green-100 p-3 text-green-700">
                  <ShieldCheck size={23} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Account Information
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Your account role is managed by the platform.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-400">
                    Account Role
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {profile.role}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-400">
                    Member Since
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {profile.joinedDate
                      ? new Date(profile.joinedDate).toLocaleDateString()
                      : "Not available"}
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </AppLayout>
  );
}