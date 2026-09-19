"use client";

import Link from "next/link";
import {
  Brain,
  ArrowUp,
  Code2,
  BookOpen,
  Layers,
  CheckCircle2,
  ChevronRight,
  Compass,
  Heart,
} from "lucide-react";

export function Footer() {
  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const quickTopics = [
    { name: "Two Pointers", href: "/patterns?q=two+pointers" },
    { name: "Sliding Window", href: "/patterns?q=sliding+window" },
    { name: "Tree BFS / DFS", href: "/patterns?q=tree" },
    { name: "Dynamic Programming", href: "/patterns?q=dp" },
    { name: "Graphs & TopoSort", href: "/patterns?q=graph" },
    { name: "Heap / Top K", href: "/patterns?q=heap" },
  ];

  return (
    <footer className="relative w-full border-t border-border/60 bg-background text-card-foreground overflow-hidden">
      {/* ── Seamless Algorithmic Botanical Artwork Grounding Layer ── */}
      <div className="absolute bottom-0 inset-x-0 h-44 sm:h-56 md:h-64 pointer-events-none z-0 overflow-hidden select-none">
        <img
          src="/footer-art.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-bottom select-none pointer-events-none opacity-40 mix-blend-multiply dark:mix-blend-screen dark:opacity-30 transition-opacity duration-300"
        />

        {/* Multi-directional Smooth Vignettes for High-Contrast Clean Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/60 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-transparent to-background/90 pointer-events-none" />
      </div>

      {/* ── Main Content Elevated on z-10 with Landing-Page Matched Cards ── */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-10 pb-6 sm:px-6 lg:px-8">
        {/* Main Content Card matching Landing Page Stat & Track Cards */}
        <div className="rounded-3xl border border-border/80 bg-card/70 dark:bg-[#12151c]/80 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-black/5 dark:shadow-black/40">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-12">
            {/* Col 1: Brand & Mission */}
            <div className="space-y-4 lg:col-span-4">
              <Link href="/" className="inline-flex items-center gap-2.5 font-bold tracking-tight text-foreground group">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 transition-transform group-hover:scale-105">
                  <Brain className="h-5 w-5" />
                </div>
                <span className="text-2xl font-heading font-extrabold tracking-tight">
                  Pattern<span className="text-primary font-black">IQ</span>
                </span>
              </Link>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
                The modern algorithmic learning platform. Master technical interview patterns systematically with deep intuition, multi-language templates, and automated spaced repetition.
              </p>

              {/* Platform Metrics Row */}
              <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1 font-medium text-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  <span>14+ Patterns</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1 font-medium text-foreground">
                  <Code2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>4 Languages</span>
                </div>
              </div>
            </div>

            {/* Col 2: Learning Tracks */}
            <div className="space-y-3 lg:col-span-2 sm:pl-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary" />
                <span>Pattern Tracks</span>
              </h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <Link href="/patterns" className="hover:text-primary transition-colors flex items-center gap-1 group">
                    <ChevronRight className="h-3 w-3 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                    <span>Browse All Patterns</span>
                  </Link>
                </li>
                <li>
                  <Link href="/patterns" className="hover:text-primary transition-colors flex items-center gap-1 group">
                    <ChevronRight className="h-3 w-3 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                    <span>Two Pointers &amp; Window</span>
                  </Link>
                </li>
                <li>
                  <Link href="/patterns" className="hover:text-primary transition-colors flex items-center gap-1 group">
                    <ChevronRight className="h-3 w-3 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                    <span>Tree &amp; Graph Traversals</span>
                  </Link>
                </li>
                <li>
                  <Link href="/problems" className="hover:text-primary transition-colors flex items-center gap-1 group">
                    <ChevronRight className="h-3 w-3 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                    <span>Curated Problem Catalog</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Practice Suite */}
            <div className="space-y-3 lg:col-span-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-primary" />
                <span>Practice Suite</span>
              </h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <Link href="/revision" className="hover:text-primary transition-colors flex items-center gap-1 group">
                    <ChevronRight className="h-3 w-3 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                    <span>Spaced Repetition</span>
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-primary transition-colors flex items-center gap-1 group">
                    <ChevronRight className="h-3 w-3 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                    <span>Student Dashboard</span>
                  </Link>
                </li>
                <li>
                  <Link href="/articles" className="hover:text-primary transition-colors flex items-center gap-1 group">
                    <ChevronRight className="h-3 w-3 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                    <span>Tech Articles</span>
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="hover:text-primary transition-colors flex items-center gap-1 group">
                    <ChevronRight className="h-3 w-3 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                    <span>Admin Studio</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Quick Pattern Pills */}
            <div className="space-y-3 lg:col-span-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                <span>High-Frequency Patterns</span>
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Jump straight into interview blueprints and start mastering algorithmic concepts:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {quickTopics.map((topic, tIdx) => (
                  <Link
                    key={tIdx}
                    href={topic.href}
                    className="rounded-lg border border-border/80 bg-muted/50 dark:bg-zinc-900/60 hover:bg-primary/10 hover:border-primary/40 hover:text-primary px-2.5 py-1 text-[11px] font-medium text-foreground transition-all shadow-2xs"
                  >
                    #{topic.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Bar: Author Credits, Social Links & Navigation ── */}
        <div className="mt-6 pt-1 flex flex-col lg:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          {/* Left: Copyright & Made with ❤️ by Suvamoy */}
          <div className="flex items-center gap-2.5 flex-wrap justify-center rounded-full border border-border/70 bg-card/70 dark:bg-[#12151c]/80 backdrop-blur-md px-4 py-1.5 shadow-2xs text-xs">
            <p>© {new Date().getFullYear()} PatternIQ.</p>
            <span className="text-border">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">by</span>
              <a
                href="https://github.com/samnatasuvamoy99"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline ml-0.5"
              >
                Suvamoy
              </a>
            </div>
          </div>

          {/* Center: Social Links (Twitter / X and GitHub) */}
          <div className="flex items-center gap-2 rounded-full border border-border/70 bg-card/70 dark:bg-[#12151c]/80 backdrop-blur-md px-3 py-1 shadow-2xs">
            <a
              href="https://x.com/SamantaSuvamoy"
              target="_blank"
              rel="noopener noreferrer"
              title="Suvamoy on X (Twitter)"
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            <span className="text-border">|</span>

            <a
              href="https://github.com/samnatasuvamoy99"
              target="_blank"
              rel="noopener noreferrer"
              title="Suvamoy on GitHub"
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
          </div>

          {/* Right: Quick Links & Back to Top */}
          <div className="flex items-center gap-3 flex-wrap rounded-full border border-border/70 bg-card/70 dark:bg-[#12151c]/80 backdrop-blur-md px-3.5 py-1.5 shadow-2xs">
            <Link href="/patterns" className="hover:text-foreground transition-colors">
              Patterns
            </Link>
            <span>•</span>
            <Link href="/problems" className="hover:text-foreground transition-colors">
              Problems
            </Link>
            <span>•</span>
            <Link href="/revision" className="hover:text-foreground transition-colors">
              Spaced Repetition
            </Link>
            <span>•</span>
            <Link href="/articles" className="hover:text-foreground transition-colors">
              Articles
            </Link>

            {/* Back to top button */}
            <button
              type="button"
              onClick={scrollToTop}
              title="Scroll back to top"
              className="ml-1 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card hover:bg-muted hover:border-primary/40 text-foreground transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
            >
              <ArrowUp className="h-3.5 w-3.5 text-primary" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
