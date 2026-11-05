"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Library,
  Sparkles,
  Users,
  Network,
  UserCircle,
  LogOut,
  Microscope,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Explore Papers", href: "/papers", icon: BookOpen },
  { name: "My Research", href: "/my-research", icon: Library },
  { name: "Recommendations", href: "/recommendations", icon: Sparkles },
  { name: "Researchers", href: "/researchers", icon: Users },
  { name: "Citation Explorer", href: "/citations", icon: Network },
  { name: "My Profile", href: "/profile", icon: UserCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200/80 bg-white shadow-[4px_0_24px_rgba(15,23,42,0.03)]">
      {/* Brand Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
        <div className="flex items-center justify-center rounded-2xl bg-gradient-to-b from-blue-600 to-blue-700 p-2.5 text-white shadow-md shadow-blue-500/20 border-b-2 border-blue-900">
          <Microscope size={22} />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">ResearchHub</h1>
          <p className="text-[11px] font-semibold text-slate-400">
            Research Collaboration
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-5">
        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Workspace
        </p>

        {navigation.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition duration-150 ${
                active
                  ? "bg-blue-50/90 text-blue-700 font-bold border border-blue-200/80 shadow-sm"
                  : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium"
              }`}
            >
              <Icon size={19} className={active ? "text-blue-600" : "text-slate-400"} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer & Logout */}
      <div className="border-t border-slate-100 p-4 space-y-2">
        {user && (
          <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3">
            <p className="truncate text-sm font-bold text-slate-900">
              {user.name}
            </p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
            <span className="mt-1.5 inline-block rounded-full bg-blue-100 text-blue-700 font-bold px-2 py-0.5 text-[10px]">
              {user.role}
            </span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
