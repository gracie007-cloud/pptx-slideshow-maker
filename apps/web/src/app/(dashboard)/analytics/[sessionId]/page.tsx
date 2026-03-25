"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Users,
  Clock,
  Trophy,
  CheckCircle2,
  Loader2,
  Star,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface QuizResult {
  id: string;
  question: string;
  type: string;
  options: { text: string; count: number; isCorrect: boolean }[];
  totalResponses: number;
}

interface ParticipantResult {
  id: string;
  name: string;
  score: number;
  stars: number;
  engagement: number;
}

interface SessionDetail {
  id: string;
  presentationTitle: string;
  joinCode: string;
  status: string;
  createdAt: string;
  endedAt?: string;
  participantCount: number;
  avgScore: number;
  quizResults: QuizResult[];
  participants: ParticipantResult[];
}

const COLORS = ["#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff"];
const CORRECT_COLOR = "#22c55e";

export default function SessionAnalyticsPage() {
  const params = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/sessions/${params.sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setSession(data);
        } else {
          throw new Error("Not found");
        }
      } catch {
        // Use placeholder data for demonstration
        setSession({
          id: params.sessionId,
          presentationTitle: "Q1 Sales Review",
          joinCode: "ABC123",
          status: "ENDED",
          createdAt: "2026-03-20T10:00:00Z",
          endedAt: "2026-03-20T10:24:00Z",
          participantCount: 32,
          avgScore: 78,
          quizResults: [
            {
              id: "q1",
              question: "What was our top product this quarter?",
              type: "multiple_choice",
              totalResponses: 30,
              options: [
                { text: "Widget Pro", count: 20, isCorrect: true },
                { text: "Widget Lite", count: 6, isCorrect: false },
                { text: "Widget Ultra", count: 4, isCorrect: false },
              ],
            },
            {
              id: "q2",
              question: "Rate the presentation quality",
              type: "poll",
              totalResponses: 28,
              options: [
                { text: "Excellent", count: 12, isCorrect: false },
                { text: "Good", count: 10, isCorrect: false },
                { text: "Average", count: 4, isCorrect: false },
                { text: "Needs improvement", count: 2, isCorrect: false },
              ],
            },
          ],
          participants: [
            { id: "p1", name: "Alice Johnson", score: 95, stars: 5, engagement: 98 },
            { id: "p2", name: "Bob Smith", score: 88, stars: 4, engagement: 92 },
            { id: "p3", name: "Charlie Brown", score: 82, stars: 3, engagement: 87 },
            { id: "p4", name: "Diana Lee", score: 76, stars: 3, engagement: 85 },
            { id: "p5", name: "Eve Wilson", score: 71, stars: 2, engagement: 78 },
          ],
        });
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [params.sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center py-24">
        <BarChart3 className="h-10 w-10 text-gray-300" />
        <p className="mt-3 text-sm text-gray-500">Session not found</p>
        <Link
          href="/analytics"
          className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Back to Analytics
        </Link>
      </div>
    );
  }

  const durationMinutes = session.endedAt
    ? Math.round(
        (new Date(session.endedAt).getTime() - new Date(session.createdAt).getTime()) / 60000
      )
    : null;

  const summaryStats = [
    {
      label: "Participants",
      value: session.participantCount.toString(),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Completion Rate",
      value: "94%",
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Avg. Quiz Score",
      value: `${session.avgScore}%`,
      icon: Trophy,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Duration",
      value: durationMinutes ? `${durationMinutes} min` : "N/A",
      icon: Clock,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/analytics"
          className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Analytics
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          {session.presentationTitle}
        </h1>
        <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
          <span>
            {new Date(session.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span>&middot;</span>
          <span>Join code: {session.joinCode}</span>
          <span>&middot;</span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              session.status === "ACTIVE"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {session.status.charAt(0) + session.status.slice(1).toLowerCase()}
          </span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryStats.map((stat, i) => (
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

      {/* Quiz results */}
      <div className="grid gap-6 lg:grid-cols-2">
        {session.quizResults.map((quiz, qi) => (
          <motion.div
            key={quiz.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + qi * 0.1 }}
            className="rounded-xl border border-gray-200 bg-white p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {quiz.question}
                </h3>
                <p className="mt-0.5 text-xs capitalize text-gray-500">
                  {quiz.type.replace(/_/g, " ")} &middot; {quiz.totalResponses} responses
                </p>
              </div>
            </div>

            <div className="mt-5 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={quiz.options.map((opt) => ({
                    name: opt.text,
                    count: opt.count,
                    isCorrect: opt.isCorrect,
                    pct:
                      quiz.totalResponses > 0
                        ? Math.round((opt.count / quiz.totalResponses) * 100)
                        : 0,
                  }))}
                  layout="vertical"
                  margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    width={100}
                    stroke="#9ca3af"
                  />
                  <Tooltip
                    formatter={(value: number, _name: string, props: any) => [
                      `${value} (${props?.payload?.pct ?? 0}%)`,
                      "Responses",
                    ]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {quiz.options.map((opt, idx) => (
                      <Cell
                        key={idx}
                        fill={opt.isCorrect ? CORRECT_COLOR : COLORS[idx % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend for correct answer */}
            {quiz.options.some((o) => o.isCorrect) && (
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span>Correct answer</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-xl border border-gray-200 bg-white"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Trophy className="h-4 w-4 text-amber-500" />
            Participant Leaderboard
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Rank
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  Stars
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Quiz Score
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Engagement
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {session.participants
                .sort((a, b) => b.score - a.score)
                .map((participant, i) => (
                  <tr key={participant.id} className="transition-colors hover:bg-gray-50">
                    <td className="whitespace-nowrap px-5 py-3.5 text-sm">
                      {i === 0 ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                          1
                        </span>
                      ) : i === 1 ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
                          2
                        </span>
                      ) : i === 2 ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                          3
                        </span>
                      ) : (
                        <span className="pl-2 text-gray-500">{i + 1}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                          {participant.name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        {participant.name}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-center">
                      <div className="inline-flex items-center gap-0.5">
                        {Array.from({ length: 5 }, (_, si) => (
                          <Star
                            key={si}
                            className={`h-3.5 w-3.5 ${
                              si < participant.stars
                                ? "fill-amber-400 text-amber-400"
                                : "text-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right text-sm">
                      <span
                        className={`font-medium ${
                          participant.score >= 80
                            ? "text-green-600"
                            : participant.score >= 60
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        {participant.score}%
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right text-sm text-gray-500">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{ width: `${participant.engagement}%` }}
                          />
                        </div>
                        {participant.engagement}%
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
