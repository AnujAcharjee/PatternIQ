"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CodeViewer } from "@/components/ui/code-viewer";
import { MOCK_TOPICS, MOCK_PATTERNS } from "@/lib/mock-data";
import {
  Layers,
  ArrowRight,
  CheckCircle2,
  Zap,
  Target,
  Repeat,
  Code2,
  BrainCircuit,
  Sparkles,
  Award,
  BookOpen,
  TrendingUp,
  Terminal,
  ListOrdered,
} from "lucide-react";

const TWO_SUM_CODE: Record<string, { code: string; lang: string; title: string }> = {
  python: {
    lang: "python",
    title: "two-sum-sorted.py",
    code: `def two_sum_sorted(arr: list[int], target: int) -> list[int]:
    left = 0
    right = len(arr) - 1
    
    while left < right:
        current_sum = arr[left] + arr[right]
        
        if current_sum == target:
            return [left, right]
        elif current_sum < target:
            left += 1       # Need larger sum
        else:
            right -= 1      # Need smaller sum
            
    return [-1, -1]`,
  },
  cpp: {
    lang: "cpp",
    title: "two-sum-sorted.cpp",
    code: `vector<int> twoSumSorted(const vector<int>& arr, int target) {
    int left = 0;
    int right = arr.size() - 1;
    
    while (left < right) {
        int currentSum = arr[left] + arr[right];
        
        if (currentSum == target) {
            return {left, right};
        } else if (currentSum < target) {
            left++;       // Need larger sum
        } else {
            right--;      // Need smaller sum
        }
    }
    return {-1, -1};
}`,
  },
  java: {
    lang: "java",
    title: "TwoSumSorted.java",
    code: `public int[] twoSumSorted(int[] arr, int target) {
    int left = 0;
    int right = arr.length - 1;
    
    while (left < right) {
        int currentSum = arr[left] + arr[right];
        
        if (currentSum == target) {
            return new int[] { left, right };
        } else if (currentSum < target) {
            left++;       // Need larger sum
        } else {
            right--;      // Need smaller sum
        }
    }
    return new int[] { -1, -1 };
}`,
  },
  javascript: {
    lang: "javascript",
    title: "two-sum-sorted.js",
    code: `function twoSumSorted(arr, target) {
    let left = 0;
    let right = arr.length - 1;
    
    while (left < right) {
        const currentSum = arr[left] + arr[right];
        
        if (currentSum === target) {
            return [left, right];
        } else if (currentSum < target) {
            left++;       // Need larger sum
        } else {
            right--;      // Need smaller sum
        }
    }
    return [-1, -1];
}`,
  },
};

export default function Home() {
  const featuredPattern = MOCK_PATTERNS[0];
  const [activeLanguage, setActiveLanguage] = useState<"python" | "cpp" | "java" | "javascript">("cpp");

  return (
    <div className="flex flex-col items-center justify-center">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative w-full overflow-hidden border-b border-border/40 py-24 md:py-36 bg-slate-100/70 dark:bg-slate-900/40">
        {/* Landing Graphic Background with Light & Dark Mode Optimization */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80 dark:opacity-80 pointer-events-none transition-opacity duration-300"
          style={{ backgroundImage: "url('/landing-bg.png')" }}
        />
        {/* Radial and Vertical Vignette for High-Contrast Text Legibility */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-background/50 to-background pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background pointer-events-none" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Primary Headline */}
          <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.12]">
            <span
              className="inline-block animate-word-reveal"
              style={{ animationDelay: "0ms" }}
            >
              Stop Memorizing
            </span>{" "}
            <span
              className="inline-block animate-word-reveal"
              style={{ animationDelay: "220ms" }}
            >
              <span className="text-muted-foreground/60 line-through decoration-destructive/50">
                500 Questions
              </span>
              .
            </span>
            <br />
            <span
              className="inline-block animate-word-reveal"
              style={{ animationDelay: "460ms" }}
            >
              Master{" "}
              <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">
                DSA Patterns.
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground font-normal leading-relaxed">
            Every technical interview question is derived from foundational patterns. Learn the identification triggers, master multi-language templates, and commit them to memory with automated spaced repetition.
          </p>

          {/* Action Buttons */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gap-2 h-12 px-7 text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <span>Start Learning Free</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/patterns">
              <Button size="lg" variant="outline" className="h-12 px-7 text-sm font-semibold border-border/80 bg-background/70 backdrop-blur-sm hover:bg-muted/80 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <span>Explore 14+ Patterns</span>
              </Button>
            </Link>
          </div>

          {/* Stats Strip */}
          <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-6">
            <div className="p-4 rounded-2xl border border-border/70 bg-slate-200/40 dark:bg-slate-800/40 backdrop-blur-xs space-y-1">
              <p className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">14+</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Core Patterns</p>
            </div>
            <div className="p-4 rounded-2xl border border-border/70 bg-slate-200/40 dark:bg-slate-800/40 backdrop-blur-xs space-y-1">
              <p className="font-heading text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">150+</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Curated Problems</p>
            </div>
            <div className="p-4 rounded-2xl border border-border/70 bg-slate-200/40 dark:bg-slate-800/40 backdrop-blur-xs space-y-1">
              <p className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">4 Languages</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">C++, Java, Python, JS</p>
            </div>
            <div className="p-4 rounded-2xl border border-border/70 bg-slate-200/40 dark:bg-slate-800/40 backdrop-blur-xs space-y-1">
              <p className="font-heading text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">100%</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active Recall</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. STYLIZED 3-CARD FLOATING PATTERN ARCHITECTURE SHOWCASE */}
      {/* ========================================================================= */}
      <section className="w-full py-24 px-4 sm:px-6 lg:px-8 max-w-7xl overflow-visible">
        <div className="text-center mb-16 space-y-3">
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary px-3.5 py-1 text-xs font-bold tracking-wide uppercase">
            Pattern Architecture
          </Badge>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            The Anatomy of an Algorithmic Pattern
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Deconstruct complex interview problems into intuitive mental models, clean pseudocode, and multi-language production code.
          </p>
        </div>

        {/* 3-Card Angled / Floating Showcase Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-5 items-center justify-center max-w-5xl mx-auto">
          {/* ───────────────────────────────────────────────────────────────── */}
          {/* CARD 1: Sky Blue Top Ribbon & Subtle Small Shadow                 */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <div className="group h-[460px] rounded-2xl bg-white dark:bg-card border border-border/50 dark:border-border/40 shadow-md dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),0_0_15px_-3px_rgba(56,189,248,0.12)] hover:shadow-lg dark:hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.7),0_0_22px_-3px_rgba(56,189,248,0.2)] overflow-hidden flex flex-col transition-all duration-300 lg:-rotate-2 lg:hover:rotate-0 hover:-translate-y-1 origin-bottom-right">
            {/* Solid Sky Blue Header Banner */}
            <div className="h-12 flex items-center justify-between bg-[#e0f2fe] dark:bg-[#0f1f2e] px-4 sm:px-5 border-b border-sky-200/40 dark:border-sky-900/30 shrink-0">
              <span className="text-[#0369a1] dark:text-[#38bdf8] font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-[#0369a1] dark:text-[#38bdf8]" />
                <span>Know Your Pattern</span>
              </span>
              <Badge variant="easy" className="text-[10px] px-2 py-0.2 font-bold bg-[#0369a1]/10 dark:bg-[#38bdf8]/15 text-[#0369a1] dark:text-[#38bdf8] border border-sky-600/10 dark:border-sky-400/20">
                EASY • O(N)
              </Badge>
            </div>

            {/* Card Content: All 5 Structured Points */}
            <div className="p-3.5 sm:p-4 flex-1 flex flex-col overflow-hidden text-[10.5px] leading-relaxed">
              <div className="space-y-1.5">
                {/* 1. Mental Model */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 font-heading font-bold text-foreground text-[10.5px]">
                    <span className="h-3.5 w-3.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center text-[9px]">1</span>
                    <span>Mental Model & Core Intuition</span>
                  </div>
                  <p className="text-muted-foreground bg-muted/40 p-1.5 rounded-lg border border-border/40 text-[10px] leading-tight">
                    Stand at opposite ends of a sorted array. Squeeze inward: sum too small → <code className="text-primary font-bold">left++</code>, sum too big → <code className="text-primary font-bold">right--</code>. Reduces O(N²) to O(N).
                  </p>
                </div>

                {/* Array Step Simulation */}
                <div className="rounded-lg bg-slate-950 text-slate-100 p-1.5 font-mono text-[9.5px] space-y-0.5 border border-border/20 shadow-inner">
                  <div className="flex items-center justify-between text-slate-400 text-[9px] pb-0.5 border-b border-slate-800 font-sans">
                    <span className="text-sky-400 font-bold font-mono">[1, 2, 4, 6, 8, 11]</span>
                    <span>Target = 10</span>
                  </div>
                  <p className="text-slate-300"><span className="text-blue-400">Step 1:</span> 1+11=12 (Too Big → <code className="text-rose-400">right--</code>)</p>
                  <p className="text-slate-300"><span className="text-blue-400">Step 2:</span> 1+8=9 (Too Small → <code className="text-amber-400">left++</code>)</p>
                  <p className="text-emerald-400 font-bold"><span className="text-emerald-300">Step 3:</span> 2+8=10 🎉 Match Found!</p>
                </div>

                {/* 2. Identification Signals */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 font-heading font-bold text-foreground text-[10.5px]">
                    <span className="h-3.5 w-3.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center text-[9px]">2</span>
                    <span>Identification Signals</span>
                  </div>
                  <div className="text-muted-foreground bg-muted/30 p-1.5 rounded-lg border border-border/30 space-y-0.5 text-[9.5px]">
                    <p>• <strong>Input:</strong> Sorted array or string (or easily sorted).</p>
                    <p>• <strong>Keywords:</strong> <em>Two Sum II, 3Sum, Container With Most Water, Palindrome</em>.</p>
                  </div>
                </div>

                {/* 3. Execution Recipe & Rule */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 font-heading font-bold text-foreground text-[10.5px]">
                    <span className="h-3.5 w-3.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center text-[9px]">3</span>
                    <span>Execution Recipe & Rule</span>
                  </div>
                  <div className="bg-sky-50/50 dark:bg-sky-950/20 p-1.5 rounded-lg border border-sky-200/60 dark:border-sky-900/40 text-[9.5px] space-y-0.5">
                    <p className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                      left = 0, right = N - 1 → while (left &lt; right)
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      <strong>Rule:</strong> If searching pairs/boundaries in sorted seq, squeeze inward from 0 and N-1.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Footer Guarantee */}
              <div className="mt-auto pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                <span>Canonical Framework</span>
                <span className="text-primary font-bold font-mono">100% Deterministic</span>
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* CARD 2: Teal / Green Top Ribbon & Subtle Small Shadow             */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <div className="group h-[460px] rounded-2xl bg-white dark:bg-card border border-border/50 dark:border-border/40 shadow-lg dark:shadow-[0_6px_25px_-4px_rgba(0,0,0,0.6),0_0_18px_-3px_rgba(74,222,128,0.15)] hover:shadow-xl dark:hover:shadow-[0_10px_35px_-4px_rgba(0,0,0,0.75),0_0_25px_-3px_rgba(74,222,128,0.25)] overflow-hidden flex flex-col transition-all duration-300 z-10 lg:scale-[1.02] lg:-translate-y-1 hover:-translate-y-2">
            {/* Solid Emerald / Forest Teal Header Banner */}
            <div className="h-12 flex items-center justify-between bg-[#d1fae5] dark:bg-[#112520] px-4 sm:px-5 border-b border-emerald-200/40 dark:border-emerald-900/30 shrink-0">
              <span className="text-[#065f46] dark:text-[#34d399] font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Code2 className="h-4 w-4 text-[#065f46] dark:text-[#10b981]" />
                <span>Pseudocode Blueprint</span>
              </span>
              <span className="text-[10px] font-mono text-[#065f46] dark:text-[#34d399] font-bold bg-[#065f46]/10 dark:bg-[#34d399]/15 px-2 py-0.5 rounded-full border border-emerald-600/10 dark:border-emerald-400/20">
                Universal Logic
              </span>
            </div>

            {/* Card Content: Code Viewer */}
            <div className="p-3.5 sm:p-4 flex-1 flex flex-col overflow-hidden text-xs">
              <div className="space-y-1.5">
                <div className="flex flex-col space-y-0.5">
                  <h3 className="font-heading font-extrabold text-sm sm:text-base text-foreground tracking-tight">
                    twoSumSorted.algo
                  </h3>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Language-agnostic logic flow with step-by-step pointers & syntax highlighting.
                  </p>
                </div>

                <div className="rounded-xl overflow-hidden border border-border/40 shadow-xs">
                  <CodeViewer
                    compact={true}
                    code={`FUNCTION twoSumSorted(arr, target):
    left = 0
    right = LENGTH(arr) - 1
    
    WHILE left < right:
        currentSum = arr[left] + arr[right]
        
        IF currentSum == target:
            RETURN [left, right]
        ELSE IF currentSum < target:
            left = left + 1    // Need larger sum
        ELSE:
            right = right - 1  // Need smaller sum
            
    RETURN [-1, -1]`}
                    language="pseudocode"
                    title="two-sum-sorted.algo"
                  />
                </div>
              </div>

              {/* Guarantees */}
              <div className="mt-auto pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Time: <strong className="text-foreground font-mono">O(N)</strong></span>
                <span>Space: <strong className="text-foreground font-mono">O(1)</strong></span>
                <span className="font-medium text-foreground">Single Pass Execution</span>
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* CARD 3: Pastel Yellow Top Ribbon & Subtle Small Shadow             */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <div className="group h-[460px] rounded-2xl bg-white dark:bg-card border border-border/50 dark:border-border/40 shadow-md dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),0_0_15px_-3px_rgba(250,204,21,0.12)] hover:shadow-lg dark:hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.7),0_0_22px_-3px_rgba(250,204,21,0.2)] overflow-hidden flex flex-col transition-all duration-300 lg:rotate-2 lg:hover:rotate-0 hover:-translate-y-1 origin-bottom-left">
            {/* Solid Warm Amber Header Banner */}
            <div className="h-12 flex items-center justify-between bg-[#fef3c7] dark:bg-[#221c0e] px-4 sm:px-5 border-b border-amber-200/40 dark:border-amber-900/30 shrink-0">
              <span className="text-[#b45309] dark:text-[#facc15] font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Terminal className="h-4 w-4 text-[#b45309] dark:text-[#facc15]" />
                <span>Production Code</span>
              </span>
              <span className="text-[10px] font-mono text-[#b45309] dark:text-[#facc15] font-bold bg-[#b45309]/10 dark:bg-[#facc15]/15 px-2 py-0.5 rounded-full border border-amber-600/10 dark:border-amber-400/20">
                Multi-Lang
              </span>
            </div>

            {/* Card Content: Language Switcher & CodeViewer */}
            <div className="p-3.5 sm:p-4 flex-1 flex flex-col overflow-hidden text-xs">
              <div className="space-y-1.5">
                {/* Language Switcher Tabs Bar */}
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/50 border border-border/50">
                  {(["python", "cpp", "java", "javascript"] as const).map((langKey) => {
                    const label = langKey === "python" ? "Python" : langKey === "cpp" ? "C++" : langKey === "java" ? "Java" : "JS";
                    const isSelected = activeLanguage === langKey;
                    return (
                      <button
                        key={langKey}
                        type="button"
                        onClick={() => setActiveLanguage(langKey)}
                        className={`flex-1 py-1 px-1.5 rounded-md text-[10.5px] font-semibold transition-all cursor-pointer text-center ${
                          isSelected
                            ? "bg-white dark:bg-slate-800 text-foreground shadow-xs font-bold border border-border"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Code Viewer */}
                <div className="rounded-xl overflow-hidden border border-border/40 shadow-xs">
                  <CodeViewer
                    compact={true}
                    code={TWO_SUM_CODE[activeLanguage].code}
                    language={TWO_SUM_CODE[activeLanguage].lang}
                    title={TWO_SUM_CODE[activeLanguage].title}
                  />
                </div>
              </div>

              {/* Bottom Action */}
              <div className="mt-auto pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                <span className="text-[10px] text-muted-foreground">
                  14+ Templates Ready
                </span>
                <Link href="/patterns/two-pointers">
                  <Button size="sm" className="gap-1.5 text-[10.5px] font-semibold h-7 px-2.5 shadow-xs">
                    <span>Explore Pattern</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FEATURE PILLARS */}
      {/* ========================================================================= */}
      <section className="w-full border-t border-border bg-muted/20 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 space-y-2">
            <Badge variant="outline" className="border-border text-muted-foreground px-3 py-0.5 text-xs font-semibold">
              Scientific Retention
            </Badge>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Engineered for Long-Term Recall
            </h2>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto leading-relaxed">
              Our spaced repetition engine queues active recall revisions just before memory decay occurs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-7 space-y-4 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Target className="h-6 w-6" />
              </div>
              <CardTitle className="font-heading font-bold text-xl">Pattern Recognition</CardTitle>
              <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                Categorize problems into actionable frameworks. Recognize Two Pointers, Sliding Window, or Monotonic Stacks in under 30 seconds.
              </CardDescription>
            </Card>

            <Card className="p-7 space-y-4 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Repeat className="h-6 w-6" />
              </div>
              <CardTitle className="font-heading font-bold text-xl">Spaced Repetition Engine</CardTitle>
              <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                Scientific review intervals (1, 3, 7, 14, 30 days) automatically scheduled as you solve problems and rate difficulty.
              </CardDescription>
            </Card>

            <Card className="p-7 space-y-4 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Zap className="h-6 w-6" />
              </div>
              <CardTitle className="font-heading font-bold text-xl">Multi-Language Templates</CardTitle>
              <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                Clean, battle-tested code templates in C++, Java, Python, and JavaScript with line-by-line breakdown of invariants.
              </CardDescription>
            </Card>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. CURRICULUM TRACKS PREVIEW */}
      {/* ========================================================================= */}
      <section className="w-full py-24 px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div className="space-y-1">
            <Badge variant="outline" className="border-border text-muted-foreground px-3 py-0.5 text-xs font-semibold">
              Curriculum Tracks
            </Badge>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Structured Algorithm Tracks
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Start with linear array techniques and progress to graph traversals and dynamic programming.
            </p>
          </div>
          <Link href="/patterns">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold h-9">
              <span>View Live Catalog</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_TOPICS.map((topic) => (
            <Link key={topic.id} href={`/patterns?topic=${topic.slug}`}>
              <Card className="p-6 rounded-2xl border border-border/80 dark:border-border/60 hover:border-primary/60 dark:hover:border-primary/60 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer group hover:-translate-y-1 bg-card/80 backdrop-blur-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors font-mono">
                    {topic.patternCount} Patterns
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="mt-4 font-heading font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                  {topic.name}
                </h3>
                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {topic.description}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. CTA SECTION */}
      {/* ========================================================================= */}
      <section className="w-full border-t border-border bg-card py-20 px-4 text-center">
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Accelerate Your Career</span>
          </div>

          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            Ready to Transform Your Technical Interview Prep?
          </h2>

          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Join thousands of software engineers mastering algorithms systematically. Free forever for students.
          </p>

          <div className="pt-3 flex justify-center gap-3">
            <Link href="/register">
              <Button size="lg" className="gap-2 h-12 px-8 text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <span>Create Your Free Account</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
