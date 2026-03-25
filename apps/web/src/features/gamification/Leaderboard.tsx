"use client";

import React from "react";
import { motion } from "framer-motion";
import { Trophy, Star, Medal } from "lucide-react";
import type { LeaderboardEntry } from "@slideshow/shared";

export interface LeaderboardProps {
  entries: LeaderboardEntry[];
  highlightId?: string;
}

const rankColors: Record<number, { bg: string; text: string; icon: string }> = {
  1: { bg: "bg-yellow-100", text: "text-yellow-700", icon: "text-yellow-500" },
  2: { bg: "bg-gray-100", text: "text-gray-600", icon: "text-gray-400" },
  3: { bg: "bg-orange-100", text: "text-orange-700", icon: "text-orange-400" },
};

export default function Leaderboard({ entries, highlightId }: LeaderboardProps) {
  const sorted = [...entries].sort((a, b) => a.rank - b.rank);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50">
        <Trophy className="h-4 w-4 text-purple-500" />
        <h3 className="text-sm font-semibold text-gray-700">Leaderboard</h3>
        <span className="text-xs text-gray-400 ml-auto">{entries.length} participants</span>
      </div>

      {sorted.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-gray-400">
          No participants yet
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {sorted.map((entry, i) => {
            const colors = rankColors[entry.rank];
            const isHighlighted = entry.participantId === highlightId;

            return (
              <motion.li
                key={entry.participantId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                  isHighlighted ? "bg-primary-50" : ""
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    colors?.bg ?? "bg-gray-50"
                  } ${colors?.text ?? "text-gray-400"}`}
                >
                  {entry.rank <= 3 ? (
                    <Medal className={`h-4 w-4 ${colors?.icon}`} />
                  ) : (
                    entry.rank
                  )}
                </div>

                <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                  {entry.name}
                </span>

                <div className="flex items-center gap-1 text-sm text-yellow-500">
                  <Star className="h-3.5 w-3.5 fill-yellow-400" />
                  <span className="font-medium">{entry.stars}</span>
                </div>

                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-[10px] font-bold text-white">
                  {entry.level}
                </span>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
