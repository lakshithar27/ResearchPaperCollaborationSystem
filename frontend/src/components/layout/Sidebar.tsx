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
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-6">
        <div className="rounded-xl bg-blue-600 p-2 text-white">
          <Microscope size={23} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">ResearchHub</h1>
          <p className="text-xs text-slate-500">Research Collaboration</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
        <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
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
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon size={19} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        {user && (
          <div className="mb-3 px-3">
            <p className="truncate text-sm font-semibold text-slate-800">
              {user.name}
            </p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut size={19} />
          Logout
        </button>
      </div>
    </aside>
  );
}
