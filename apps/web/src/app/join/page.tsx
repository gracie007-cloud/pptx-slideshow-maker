"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Presentation, ArrowRight, AlertCircle } from "lucide-react";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.replace(/[^A-Z0-9]/g, "");

    if (trimmed.length < 4) {
      setError("Please enter a valid session code (at least 4 characters).");
      return;
    }

    setError("");
    router.push(`/join/${trimmed}`);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (value.length <= 8) {
      setCode(value);
      setError("");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-50 via-white to-white px-4">
      <motion.div
        className="w-full max-w-sm text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Brand */}
        <div className="mb-10">
          <Link href="/" className="inline-block">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-200">
              <Presentation className="h-8 w-8 text-white" />
            </div>
          </Link>
          <h1 className="mt-5 text-3xl font-bold text-gray-900">
            Join a Session
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Enter the session code shared by your presenter
          </p>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Code input */}
        <form onSubmit={handleJoin} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={code}
              onChange={handleChange}
              placeholder="ABCDEF"
              maxLength={8}
              className="block w-full rounded-2xl border border-gray-200 bg-white px-4 py-5 text-center text-3xl font-mono font-bold tracking-[0.3em] text-gray-900 shadow-sm placeholder:text-gray-200 placeholder:tracking-[0.3em] focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
              autoComplete="off"
            />
          </div>

          <motion.button
            type="submit"
            disabled={code.length < 4}
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-4 text-lg font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            Join
            <ArrowRight className="h-5 w-5" />
          </motion.button>
        </form>

        <p className="mt-8 text-xs text-gray-400">
          No account required to join as an audience member
        </p>

        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <Link
            href="/"
            className="text-gray-500 transition-colors hover:text-gray-700"
          >
            Home
          </Link>
          <span className="text-gray-300">&middot;</span>
          <Link
            href="/login"
            className="text-indigo-600 transition-colors hover:text-indigo-500"
          >
            Sign in as presenter
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
