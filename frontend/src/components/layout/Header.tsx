"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  UserCircle,
  BookOpen,
  Sparkles,
  Network,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const notifications = [
    {
      id: 1,
      title: "Real-Time Citation Established",
      description: "'DeepSeek-R1' cited 'Attention Is All You Need'",
      time: "Just now",
      icon: "⚡",
      unread: true,
      href: "/citations",
    },
    {
      id: 2,
      title: "New Paper Added",
      description: "'LLaMA: Open and Efficient Foundation Language Models'",
      time: "15m ago",
      icon: "📚",
      unread: true,
      href: "/papers",
    },
    {
      id: 3,
      title: "Vector Recommender",
      description: "5 new papers matched your research area",
      time: "1h ago",
      icon: "✨",
      unread: true,
      href: "/recommendations",
    },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/papers?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/95 px-6 backdrop-blur-md lg:px-10 shadow-sm text-slate-800">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search research papers, authors... (Press Enter)"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-2.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white placeholder-slate-400"
        />
      </form>

      <div className="ml-6 flex items-center gap-4">
        {/* NOTIFICATIONS DROPDOWN */}
        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => {
              setShowNotifications((prev) => !prev);
              setShowProfileMenu(false);
            }}
            aria-label="Notifications"
            className={`relative rounded-2xl p-2.5 transition ${
              showNotifications
                ? "bg-blue-50 text-blue-600 border border-blue-200"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Bell size={21} />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-84 max-w-[90vw] card-3d p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 text-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setUnreadCount(0)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  Mark read
                </button>
              </div>

              <div className="mt-2 divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={() => setShowNotifications(false)}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition block"
                  >
                    <span className="text-base p-1 bg-slate-100 rounded-lg">{n.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                        {n.description}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-3 border-t border-slate-100 pt-2 text-center">
                <Link
                  href="/citations"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                >
                  <Network size={13} /> View Citation Explorer
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* PROFILE AVATAR & DROPDOWN MENU */}
        <div className="relative border-l border-slate-200 pl-4" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setShowProfileMenu((prev) => !prev);
              setShowNotifications(false);
            }}
            className="flex items-center gap-3 rounded-2xl p-1.5 transition hover:bg-slate-100 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 font-black text-sm shadow-sm border border-blue-200">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "ME"}
            </div>

            <div className="hidden sm:block">
              <div className="flex items-center gap-1">
                <p className="max-w-32 truncate text-sm font-bold text-slate-900">
                  {user?.name || "Researcher"}
                </p>
                <ChevronDown size={14} className="text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {user?.role || "Student"}
              </p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-64 card-3d p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 text-slate-900">
              <div className="rounded-xl bg-slate-50 p-3 mb-2 border border-slate-200/80">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {user?.name || "Researcher"}
                </p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                <span className="mt-1.5 inline-block rounded-full bg-blue-100 text-blue-700 font-bold px-2 py-0.5 text-[10px]">
                  {user?.role || "Student"}
                </span>
              </div>

              <div className="space-y-1">
                <Link
                  href="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
                >
                  <UserCircle size={16} />
                  My Profile & Settings
                </Link>

                <Link
                  href="/my-research"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
                >
                  <BookOpen size={16} />
                  My Publications
                </Link>

                <Link
                  href="/citations"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
                >
                  <Network size={16} />
                  Citation Explorer
                </Link>

                <Link
                  href="/recommendations"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
                >
                  <Sparkles size={16} />
                  Smart Recommendations
                </Link>
              </div>

              <div className="mt-2 border-t border-slate-100 pt-2">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
