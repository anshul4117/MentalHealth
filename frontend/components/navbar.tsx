"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const navLinks = [
  { href: "/", label: "Check-in" },
  { href: "/resources", label: "Resources" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const pathname = usePathname();
  const { isLoggedIn, isStudent, isCounsellor, isLoading } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-mindpulse-purple to-mindpulse-teal flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">MindPulse</span>
        </Link>

        {/* Center Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors duration-200 ${
                pathname === link.href
                  ? "text-mindpulse-text"
                  : "text-mindpulse-muted hover:text-mindpulse-text"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Side — Auth-aware */}
        <div className="flex items-center gap-3">
          {!isLoading && isLoggedIn ? (
            <>
              {isStudent && (
                <Link
                  href="/student"
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-white/5 border border-white/10 text-mindpulse-text hover:bg-white/10 transition-all"
                >
                  My Dashboard
                </Link>
              )}
              {isCounsellor && (
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-white/5 border border-white/10 text-mindpulse-text hover:bg-white/10 transition-all"
                >
                  Counsellor Panel
                </Link>
              )}
            </>
          ) : !isLoading ? (
            <>
              <Link
                href="/register"
                className="hidden sm:inline-block px-4 py-2 text-sm font-medium text-mindpulse-muted hover:text-mindpulse-text transition-colors"
              >
                Register
              </Link>
              <Link
                href="/login"
                className="relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg group"
                style={{
                  background: "linear-gradient(#0F1729, #0F1729) padding-box, linear-gradient(135deg, #6C63FF, #00D4AA) border-box",
                  border: "1px solid transparent",
                }}
              >
                <span className="text-mindpulse-text group-hover:text-white transition-colors">
                  Login
                </span>
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
