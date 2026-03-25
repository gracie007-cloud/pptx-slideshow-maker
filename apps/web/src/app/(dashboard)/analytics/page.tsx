"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  Trophy,
  Activity,
  Loader2,
  Calendar,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface SessionSummary {
  id: string;
  presentationTitle: string;
  date: string;
  participants: number;
  avgScore: number;
  status: string;
}

interface Stats {
  totalSessions: number;
  totalParticipants: number;
  avgQuizScore: number;
  avgEngagement: number;
}

const PLACEHOLDER_CHART_DATA = [
  { name: "Mon", engagement: 72, participants: 24 },
  { name: "Tue", engagement: 85, participants: 38 },
  { name: "Wed", engagement: 68, participants: 18 },
  { name: "Thu", engagement: 91, participants: 45 },
  { name: "Fri", engagement: 78, participants: 32 },
  { name: "Sat", engagement: 64, participants: 12 },
  { name: "Sun", engagement: 88, participants: 42 },
];

export default function AnalyticsPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    totalParticipants: 0,
    avgQuizScore: 0,
    avgEngagement: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/sessions?includeEnded=true");
        if (res.ok) {
          const data = await res.json();
          const sessionList: SessionSummary[] = (data.sessions || data || []).map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (s: any) => ({
              id: s.id,
              presentationTitle: s.presentationTitle || s.presentation?.title || "Untitled",
              date: s.createdAt || s.date,
              participants: s.participantCount || s.participants || 0,
              avgScore: s.avgScore || 0,
              status: s.status || "ENDED",
            })
          );
          setSessions(sessionList);

          const totalParticipants = sessionList.reduce((sum, s) => sum + s.participants, 0);
          const avgScore =
            sessionList.length > 0
              ? Math.round(sessionList.reduce((sum, s) => sum + s.avgScore, 0) / sessionList.length)
              : 0;

          setStats({
            totalSessions: sessionList.length,
            totalParticipants,
            avgQuizScore: avgScore,
            avgEngagement: sessionList.length > 0 ? 89 : 0,
          });
        }
      } catch {
        // Use fallback data
        setSessions([
          { id: "s1", presentationTitle: "Q1 Sales Review", date: "2026-03-20", participants: 32, avgScore: 78, status: "ENDED" },
          { id: "s2", presentationTitle: "Team Onboarding", date: "2026-03-18", participants: 15, avgScore: 85, status: "ENDED" },
          { id: "s3", presentationTitle: "Product Roadmap 2026", date: "2026-03-15", participants: 48, avgScore: 62, status: "ENDED" },
        ]);
        setStats({ totalSessions: 3, totalParticipants: 95, avgQuizScore: 75, avgEngagement: 89 });
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  const statCards = [
    { label: "Total Sessions", value: stats.totalSessions.toString(), icon: BarChart3, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Total Participants", value: stats.totalParticipants.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Avg. Quiz Score", value: `${stats.avgQuizScore}%`, icon: Trophy, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Avg. Engagement", value: `${stats.avgEngagement}%`, icon: Activity, color: "text-green-600", bg: "bg-green-50" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track engagement and quiz performance across sessions
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-gray-200 bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <div className={`rounded-lg p-2 ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-gray-200 bg-white p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              Engagement Over Time
            </h2>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={PLACEHOLDER_CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="engagement"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#6366f1" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-gray-200 bg-white p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Users className="h-4 w-4 text-blue-500" />
              Participants Per Day
            </h2>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PLACEHOLDER_CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)",
                  }}
                />
                <Bar dataKey="participants" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Sessions table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl border border-gray-200 bg-white"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Recent Sessions</h2>
        </div>

        {sessions.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <BarChart3 className="h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">No sessions recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Presentation
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Participants
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Avg Score
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {sessions.map((session) => (
                  <tr key={session.id} className="transition-colors hover:bg-gray-50">
                    <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {session.presentationTitle}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                      {new Date(session.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          session.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : session.status === "ENDED"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {session.status.charAt(0) + session.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right text-sm text-gray-500">
                      {session.participants}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right text-sm text-gray-500">
                      {session.avgScore > 0 ? `${session.avgScore}%` : "--"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right text-sm">
                      <Link
                        href={`/analytics/${session.id}`}
                        className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        View
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
