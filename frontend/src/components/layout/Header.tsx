"use client";

import { Search, Bell, UserCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur lg:px-10">
      <div className="relative w-full max-w-md">
        <Search
          size={19}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          placeholder="Search research papers, authors..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
        />
      </div>

      <div className="ml-6 flex items-center gap-5">
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100"
        >
          <Bell size={21} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="flex items-center gap-3 border-l border-slate-200 pl-5">
          <UserCircle size={35} className="text-blue-600" />
          <div className="hidden sm:block">
            <p className="max-w-36 truncate text-sm font-semibold text-slate-800">
              {user?.name || "Researcher"}
            </p>
            <p className="text-xs text-slate-500">
              {user?.role || "Guest"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
