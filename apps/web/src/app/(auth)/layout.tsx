import Link from "next/link";
import { Presentation } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-12 text-white">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Presentation className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Slideshow Maker</span>
          </Link>
        </div>
        <div className="max-w-md">
          <h2 className="text-3xl font-bold leading-tight">
            Transform your presentations into interactive experiences
          </h2>
          <p className="mt-4 text-lg text-white/70">
            Upload PPTX files, add live quizzes, and engage your audience
            in real time with gamification and AI-powered features.
          </p>
        </div>
        <p className="text-sm text-white/40">
          &copy; {new Date().getFullYear()} Slideshow Maker. All rights reserved.
        </p>
      </div>

      {/* Right auth content */}
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        {/* Mobile brand */}
        <div className="mb-8 text-center lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-md shadow-indigo-200">
              <Presentation className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Slideshow Maker
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white px-6 py-8 shadow-xl shadow-gray-200/50 ring-1 ring-gray-100 sm:px-10">
            {children}
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-gray-400 lg:hidden">
            &copy; {new Date().getFullYear()} Slideshow Maker. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
