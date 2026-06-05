"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "/#features" },
    { name: "Solutions", href: "/#solutions" },
    { name: "Pricing", href: "/#pricing" },
    { name: "API", href: "/#developers" },
  ];

  return (
    <>
      {/* Sticky header structure with glassmorphism */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "backdrop-blur-md bg-white/75 border-b border-slate-200/40 shadow-xs py-4"
            : "bg-transparent py-6"
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo Area */}
          <Link
            href="/"
            className="flex items-center gap-2.5 select-none cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <img src="/Logo.png" alt="LeadFlow Logo" className="h-8 w-8 object-contain" />
            <span className="font-sans text-2xl font-extrabold tracking-tight">
              <span className="text-slate-900">Lead</span>
              <span className="text-[#6366F1]">Flow</span>
            </span>
          </Link>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="relative text-sm font-medium text-slate-600 hover:text-slate-900 transition-all duration-200 px-3.5 py-2 rounded-lg hover:bg-slate-500/5 cursor-pointer"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Action Area - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200 px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="group cursor-pointer inline-flex items-center gap-1 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.97] transition-all duration-200 px-5 py-2.5 rounded-xl shadow-xs hover:shadow-sm"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 focus:outline-none cursor-pointer rounded-lg hover:bg-slate-100 transition-colors duration-200"
            aria-label="Toggle Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6 animate-in spin-in-90 duration-200" /> : <Menu className="w-6 h-6 animate-in fade-in duration-200" />}
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/50 shadow-md overflow-hidden z-40"
            >
              <div className="flex flex-col px-6 py-6 space-y-3.5 text-base font-semibold text-slate-700">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="hover:text-[#6366F1] transition-colors duration-150 cursor-pointer py-2 border-b border-slate-100/60 last:border-b-0"
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="cursor-pointer text-sm font-semibold text-slate-700 hover:text-[#6366F1] transition-colors duration-200 px-4 py-2.5 w-1/2 text-center border border-slate-200 rounded-xl hover:bg-slate-50"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="cursor-pointer text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 text-center active:scale-[0.97] transition-all duration-200 px-5 py-2.5 rounded-xl shadow-xs w-1/2 flex items-center justify-center gap-1"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Spacer to push content below the fixed navbar */}
      <div className="h-20 md:h-24" />
    </>
  );
}
