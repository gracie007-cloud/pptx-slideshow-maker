"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, User, AlertCircle, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordStrength = (() => {
    if (password.length === 0) return { level: 0, text: "", color: "" };
    if (password.length < 6) return { level: 1, text: "Weak", color: "bg-red-500" };
    if (password.length < 10) return { level: 2, text: "Fair", color: "bg-amber-500" };
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    if (hasUpper && hasNumber && hasSpecial) return { level: 4, text: "Strong", color: "bg-green-500" };
    if ((hasUpper && hasNumber) || (hasNumber && hasSpecial)) return { level: 3, text: "Good", color: "bg-blue-500" };
    return { level: 2, text: "Fair", color: "bg-amber-500" };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Registration failed. Please try again.");
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Start creating interactive presentations
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full name
          </label>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <User className="h-4 w-4 text-gray-400" />
            </div>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Jane Doe"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Mail className="h-4 w-4 text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Lock className="h-4 w-4 text-gray-400" />
            </div>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="At least 6 characters"
            />
          </div>
          {password.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= passwordStrength.level ? passwordStrength.color : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">{passwordStrength.text}</span>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
            Confirm password
          </label>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              {confirmPassword && confirmPassword === password ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Lock className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`block w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 ${
                confirmPassword && confirmPassword !== password
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              }`}
              placeholder="Re-enter your password"
            />
          </div>
          {confirmPassword && confirmPassword !== password && (
            <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
          )}
        </div>

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            required
            className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-600">
            I agree to the{" "}
            <Link href="#" className="text-indigo-600 hover:text-indigo-500">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-indigo-600 hover:text-indigo-500">
              Privacy Policy
            </Link>
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
