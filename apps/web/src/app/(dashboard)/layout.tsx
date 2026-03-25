"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Presentation,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Presentations",
    href: "/presentations",
    icon: Presentation,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
];

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-gray-200 bg-white transition-all duration-200 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-2.5 border-b border-gray-200 px-4">
          <Link href="/presentations" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-sm font-bold text-white shadow-sm">
              S
            </div>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg font-bold text-gray-900 whitespace-nowrap"
              >
                Slideshow Maker
              </motion.span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                } ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mx-2 mb-2 flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        {/* User profile + logout */}
        <div className="border-t border-gray-200 p-3">
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-xs font-semibold text-white">
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {user?.name || "User"}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {user?.email || ""}
                </p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
          {collapsed && (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="mt-2 flex w-full items-center justify-center rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main
        className={`flex-1 transition-all duration-200 ${
          collapsed ? "ml-16" : "ml-64"
        }`}
      >
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <DashboardShell>{children}</DashboardShell>
    </SessionProvider>
  );
}
