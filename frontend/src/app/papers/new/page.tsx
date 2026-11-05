"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  FilePlus2,
  Users,
  Tag,
  Send,
} from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import Loading from "@/components/common/Loading";
import ErrorMessage from "@/components/common/ErrorMessage";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Topic,
  Researcher,
  ResearcherListResponse,
  Paper,
  CreatePaperRequest,
} from "@/types";

export default function NewPaperPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [publicationYear, setPublicationYear] = useState(
    "2026"
  );
  const [doi, setDoi] = useState("");
  const [venue, setVenue] = useState("");

  const [topics, setTopics] = useState<Topic[]>([]);
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<number[]>([]);
  const [selectedAuthorIds, setSelectedAuthorIds] = useState<number[]>([]);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadOptions() {
      setLoadingOptions(true);
      setError("");

      try {
        const [topicResponse, researcherResponse] = await Promise.all([
          apiRequest<Topic[]>("/topics", {
            token: token || undefined,
          }),
          apiRequest<ResearcherListResponse>("/researchers", {
            token: token || undefined,
          }),
        ]);

        setTopics(topicResponse);
        setResearchers(researcherResponse.researchers);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load authors and research topics."
        );
      } finally {
        setLoadingOptions(false);
      }
    }

    loadOptions();
  }, [token]);

  function toggleTopic(id: number) {
    setSelectedTopicIds((current) =>
      current.includes(id)
        ? current.filter((topicId) => topicId !== id)
        : [...current, id]
    );
  }

  function toggleAuthor(id: number) {
    setSelectedAuthorIds((current) =>
      current.includes(id)
        ? current.filter((authorId) => authorId !== id)
        : [...current, id]
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (title.trim().length < 5) {
      setError("Paper title must contain at least 5 characters.");
      return;
    }

    if (abstract.trim().length < 30) {
      setError("Please provide an abstract with at least 30 characters.");
      return;
    }

    const year = Number(publicationYear);

    if (
      !Number.isInteger(year) ||
      year < 1900 ||
      year > 2026
    ) {
      setError("Please enter a valid publication year.");
      return;
    }

    if (selectedAuthorIds.length === 0) {
      setError("Please select at least one author.");
      return;
    }

    if (selectedTopicIds.length === 0) {
      setError("Please select at least one research topic.");
      return;
    }

    const paperData: CreatePaperRequest = {
      title: title.trim(),
      abstract: abstract.trim(),
      publicationYear: year,
      doi: doi.trim() || undefined,
      venue: venue.trim() || undefined,
      topicIds: selectedTopicIds,
      authorIds: selectedAuthorIds,
    };

    setSubmitting(true);

    try {
      const createdPaper = await apiRequest<Paper>("/papers", {
        method: "POST",
        token: token || undefined,
        body: JSON.stringify(paperData),
      });

      setSuccessMessage("Research paper added successfully!");

      router.push(`/papers/${createdPaper.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to add the research paper."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-7">

        <Link
          href="/papers"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
        >
          <ArrowLeft size={17} />
          Back to Explore Papers
        </Link>

        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
              <FilePlus2 size={26} />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Add Research Paper
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Share a research publication with the ResearchHub community.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <ErrorMessage message={error} />
        )}

        {successMessage && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-7">

          <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
            <div className="mb-6 flex items-center gap-3">
              <BookOpen size={21} className="text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Paper Information
              </h2>
            </div>

            <div className="space-y-5">

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Paper Title *
                </label>

                <input
                  type="text"
                  required
                  minLength={5}
                  maxLength={255}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter the research paper title"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Abstract *
                </label>

                <textarea
                  required
                  minLength={30}
                  rows={7}
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  placeholder="Describe the research problem, methodology, findings and contributions..."
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-7 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-1 text-xs text-slate-400">
                  Minimum 30 characters.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Publication Year *
                  </label>

                  <input
                    type="number"
                    required
                    min="1900"
                    max={2026}
                    value={publicationYear}
                    onChange={(e) => setPublicationYear(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Publication Venue
                  </label>

                  <input
                    type="text"
                    maxLength={150}
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Journal or conference name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  DOI
                </label>

                <input
                  type="text"
                  maxLength={150}
                  value={doi}
                  onChange={(e) => setDoi(e.target.value)}
                  placeholder="e.g. 10.1000/xyz123"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-1 text-xs text-slate-400">
                  Digital Object Identifier, if available.
                </p>
              </div>

            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
            <div className="mb-5 flex items-center gap-3">
              <Users size={21} className="text-blue-600" />

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Paper Authors *
                </h2>

                <p className="text-xs text-slate-500">
                  Select all researchers who contributed to this paper.
                </p>
              </div>
            </div>

            {loadingOptions ? (
              <Loading message="Loading researchers..." />
            ) : researchers.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                No researchers are currently available.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {researchers.map((researcher) => (
                  <label
                    key={researcher.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                      selectedAuthorIds.includes(researcher.id)
                        ? "border-blue-400 bg-blue-50"
                        : "border-slate-200 hover:border-blue-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAuthorIds.includes(researcher.id)}
                      onChange={() => toggleAuthor(researcher.id)}
                      className="mt-1 h-4 w-4 accent-blue-600"
                    />

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {researcher.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {researcher.affiliation || researcher.email}
                      </p>

                      {researcher.researchArea && (
                        <p className="mt-1 text-xs text-slate-400">
                          {researcher.researchArea}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}

            <p className="mt-4 text-xs font-medium text-blue-600">
              {selectedAuthorIds.length} author(s) selected
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
            <div className="mb-5 flex items-center gap-3">
              <Tag size={21} className="text-purple-600" />

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Research Topics *
                </h2>

                <p className="text-xs text-slate-500">
                  Choose the topics associated with this paper.
                </p>
              </div>
            </div>

            {loadingOptions ? (
              <Loading message="Loading research topics..." />
            ) : topics.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                No research topics are currently available.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {topics.map((topic) => (
                  <label
                    key={topic.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                      selectedTopicIds.includes(topic.id)
                        ? "border-purple-400 bg-purple-50"
                        : "border-slate-200 hover:border-purple-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTopicIds.includes(topic.id)}
                      onChange={() => toggleTopic(topic.id)}
                      className="mt-1 h-4 w-4 accent-purple-600"
                    />

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {topic.name}
                      </p>

                      {topic.description && (
                        <p className="mt-1 text-xs text-slate-500">
                          {topic.description}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}

            <p className="mt-4 text-xs font-medium text-purple-600">
              {selectedTopicIds.length} topic(s) selected
            </p>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/papers"
              className="rounded-xl border border-slate-200 px-6 py-3 text-center text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting || loadingOptions}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={17} />
                  Add Research Paper
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </AppLayout>
  );
}