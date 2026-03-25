"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Upload,
  Brain,
  Users,
  BarChart3,
  Play,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Upload PPTX",
    description:
      "Drag and drop your PowerPoint files and watch them transform into interactive web presentations instantly.",
    color: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    icon: Brain,
    title: "Live Quizzes",
    description:
      "Engage your audience with real-time quizzes, polls, and interactive questions embedded in your slides.",
    color: "from-purple-500 to-pink-500",
    bg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    icon: Users,
    title: "Real-time Engagement",
    description:
      "Participants join with a simple code. See reactions, answers, and engagement metrics live as you present.",
    color: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    icon: Sparkles,
    title: "AI-Powered",
    description:
      "Let AI generate quiz questions from your slide content, suggest improvements, and create summaries automatically.",
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-sm font-bold text-white shadow-md shadow-indigo-200">
              S
            </div>
            <span className="text-lg font-bold text-gray-900">
              Slideshow Maker
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Sign In
            </Link>
            <Link
              href="/join"
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Join Session
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20">
        {/* Background gradient blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 opacity-60 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 opacity-50 blur-3xl" />
        </div>

        <motion.div
          className="relative mx-auto max-w-5xl px-6 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-medium text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              Now with AI-powered quiz generation
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="mt-6 text-5xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-6xl lg:text-7xl"
          >
            Make presentations{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              truly interactive
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-500 sm:text-xl"
          >
            Upload your PPTX, add live quizzes, and engage your audience in
            real time. Gamification, analytics, and AI features built right in.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-300 hover:brightness-110"
            >
              <Play className="h-4.5 w-4.5" />
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/join"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-7 py-3.5 text-base font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
            >
              <Users className="h-4.5 w-4.5" />
              Join a Session
            </Link>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            variants={itemVariants}
            className="mx-auto mt-16 flex max-w-xl items-center justify-center gap-8 rounded-2xl border border-gray-100 bg-gray-50/80 px-8 py-4 sm:gap-12"
          >
            {[
              { value: "10K+", label: "Presentations" },
              { value: "500K+", label: "Participants" },
              { value: "98%", label: "Satisfaction" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50/50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to{" "}
              <span className="text-indigo-600">captivate</span> your audience
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500">
              From file upload to live engagement analytics, we have got you
              covered at every step.
            </p>
          </motion.div>

          <motion.div
            className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="group relative rounded-2xl border border-gray-100 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg}`}
                >
                  <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Three steps to an{" "}
              <span className="text-indigo-600">unforgettable</span> session
            </h2>
          </motion.div>

          <motion.div
            className="mt-16 grid gap-12 md:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              {
                step: "01",
                title: "Upload your PPTX",
                description:
                  "Drag and drop your presentation file. We will process each slide and extract content automatically.",
                icon: Upload,
              },
              {
                step: "02",
                title: "Add quizzes & interactions",
                description:
                  "Attach multiple-choice, poll, or open-ended questions to any slide. Let AI generate them for you.",
                icon: Brain,
              },
              {
                step: "03",
                title: "Present & engage",
                description:
                  "Start a session, share the join code, and see live responses, reactions, and leaderboard updates.",
                icon: BarChart3,
              },
            ].map((step) => (
              <motion.div key={step.step} variants={itemVariants} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
                  <step.icon className="h-7 w-7 text-indigo-600" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                  Step {step.step}
                </span>
                <h3 className="mt-2 text-lg font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <motion.div
          className="mx-auto max-w-4xl px-6"
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-10 py-16 text-center text-white shadow-2xl">
            <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50" />
            <h2 className="relative text-3xl font-bold sm:text-4xl">
              Ready to transform your presentations?
            </h2>
            <p className="relative mx-auto mt-4 max-w-lg text-lg text-white/80">
              Join thousands of presenters who make every slide count.
            </p>
            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-indigo-700 shadow-lg transition-all hover:bg-gray-50 hover:shadow-xl"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/join"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-7 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10"
              >
                Join a Session
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-10">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Slideshow Maker. Built for interactive
          presentations.
        </div>
      </footer>
    </main>
  );
}
