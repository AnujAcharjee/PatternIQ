"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { AuthGuard } from "@/components/auth/auth-guard";
import { apiClient } from "@/lib/api-client";
import {
  Layers,
  Search,
  ArrowRight,
  ChevronDown,
  Target,
  Maximize2,
  Zap,
  GitBranch,
  CheckCircle2,
  Sparkles,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TOPIC_ICONS: Record<string, any> = {
  "two-pointers": Target,
  "sliding-window": Maximize2,
  "fast-slow-pointers": Zap,
  "binary-search": Search,
  "tree-bfs-dfs": GitBranch,
  "dynamic-programming": Layers,
  "array": Target,
};

interface UnifiedTopic {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  patternCount: number;
  completedCount?: number;
  order: number;
}

interface UnifiedPattern {
  id: string;
  number: number;
  name: string;
  slug: string;
  topicSlug: string;
  topicName: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  summary: string;
  complexity: {
    time: string;
    space: string;
  };
  problemsCount: number;
  status?: string;
}

function PatternsContent() {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get("topic");

  const [topics, setTopics] = useState<UnifiedTopic[]>([]);
  const [patterns, setPatterns] = useState<UnifiedPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");

  // Track expanded topics by slug.
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  // 1. Fetch live topics, patterns, and user progress from API
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [topicsRes, patternsRes, progressRes] = await Promise.all([
          apiClient<any[]>("/topics"),
          apiClient<{ items: any[]; pagination: any }>("/patterns?limit=100"),
          apiClient<any[]>("/progress/patterns").catch(() => ({ success: false, data: [] })),
        ]);

        const userProgressMap: Record<string, string> = {};
        if (progressRes.success && Array.isArray(progressRes.data)) {
          progressRes.data.forEach((item: any) => {
            if (item.patternId) {
              userProgressMap[item.patternId] = item.status;
            }
          });
        }

        let mappedPatterns: UnifiedPattern[] = [];
        if (patternsRes.success && patternsRes.data?.items) {
          mappedPatterns = patternsRes.data.items.map((p) => ({
            id: p.id,
            number: p.number,
            name: p.name,
            slug: p.slug,
            topicSlug: p.topic?.slug || "",
            topicName: p.topic?.name || "",
            difficulty: p.difficulty || "MEDIUM",
            summary: p.shortDescription || p.summary || "",
            complexity: {
              time: p.timeComplexity || "O(N)",
              space: p.spaceComplexity || "O(1)",
            },
            problemsCount: p._count?.problems ?? p.problems?.length ?? 0,
            status: userProgressMap[p.id] || p.status || "NOT_STARTED",
          }));
          setPatterns(mappedPatterns);
        }

        let loadedTopics: UnifiedTopic[] = [];
        if (topicsRes.success && Array.isArray(topicsRes.data)) {
          loadedTopics = topicsRes.data.map((t, idx) => {
            const topicPats = mappedPatterns.filter((p) => p.topicSlug === t.slug);
            const completedCount = topicPats.filter(
              (p) => userProgressMap[p.id] === "COMPLETED" || userProgressMap[p.id] === "MASTERED"
            ).length;

            return {
              id: t.id,
              name: t.name,
              slug: t.slug,
              description: t.description || "",
              icon: t.icon || "Layers",
              patternCount: t._count?.patterns || t.patternCount || topicPats.length || 0,
              completedCount,
              order: t.order || idx + 1,
            };
          });
          setTopics(loadedTopics);
        }

        // Set initial expanded topic
        const activeSlug = initialTopic || loadedTopics[0]?.slug;
        if (activeSlug) {
          setExpandedTopics({ [activeSlug]: true });
        }
      } catch (err) {
        console.error("Failed to fetch live API data", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [initialTopic]);

  const toggleTopic = (slug: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [slug]: !prev[slug],
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    topics.forEach((t) => (all[t.slug] = true));
    setExpandedTopics(all);
  };

  const collapseAll = () => {
    setExpandedTopics({});
  };

  // Group patterns under topics and apply search/difficulty filters
  const topicSections = topics.map((topic) => {
    const topicPats = patterns
      .filter((p) => p.topicSlug === topic.slug)
      .sort((a, b) => a.number - b.number);

    const completedInTopic = topicPats.filter(
      (p) => p.status === "COMPLETED" || p.status === "MASTERED"
    ).length;

    const filtered = topicPats.filter((pat) => {
      const matchesSearch =
        pat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pat.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDifficulty =
        difficultyFilter === "ALL" || pat.difficulty === difficultyFilter;

      return matchesSearch && matchesDifficulty;
    });

    return {
      ...topic,
      patterns: filtered,
      totalCount: topicPats.length,
      completedCount: completedInTopic,
    };
  }).filter((topic) => {
    if (!searchTerm) return true;
    return (
      topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.patterns.length > 0
    );
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="border-b border-border/60 pb-6">
        <h1 className="text-3xl font-bold tracking-tight">DSA Topics & Patterns</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          Browse all algorithmic topics below. Click any topic to open its dropdown and reveal all underlying patterns.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search topics or patterns..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "EASY", "MEDIUM", "HARD"].map((diff) => (
              <Button
                key={diff}
                variant={difficultyFilter === diff ? "default" : "outline"}
                size="sm"
                onClick={() => setDifficultyFilter(diff)}
                className="text-xs"
              >
                {diff}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto text-xs">
          <Button variant="ghost" size="sm" onClick={expandAll} className="text-xs text-muted-foreground hover:text-foreground">
            Expand All
          </Button>
          <span>•</span>
          <Button variant="ghost" size="sm" onClick={collapseAll} className="text-xs text-muted-foreground hover:text-foreground">
            Collapse All
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading curriculum patterns...</p>
        </div>
      ) : (
        /* TOPICS ACCORDION / DROPDOWN LIST */
        <div className="space-y-4">
          {topicSections.length > 0 ? (
            topicSections.map((topic) => {
              const isExpanded = !!expandedTopics[topic.slug];
              const Icon = TOPIC_ICONS[topic.slug] || Layers;
              const completed = topic.completedCount || 0;
              const count = topic.totalCount || topic.patternCount;
              const percentage = count > 0 ? Math.round((completed / count) * 100) : 0;

              return (
                <div
                  key={topic.id}
                  className={cn(
                    "rounded-2xl border transition-all duration-200 overflow-hidden bg-card",
                    isExpanded
                      ? "border-primary/50 shadow-md ring-1 ring-primary/20"
                      : "border-border/80 hover:border-primary/40 hover:shadow-sm"
                  )}
                >
                  {/* Clickable Topic Header */}
                  <button
                    type="button"
                    onClick={() => toggleTopic(topic.slug)}
                    className="w-full text-left p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none cursor-pointer hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-4 min-w-0">
                      <div
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold transition-colors",
                          isExpanded
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                            {topic.name}
                          </h2>
                          <Badge variant={isExpanded ? "default" : "secondary"} className="text-xs">
                            {count} Patterns
                          </Badge>
                          {percentage > 0 && (
                            <Badge variant="outline" className="text-[11px] font-mono">
                              {percentage}% Completed
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 leading-relaxed">
                          {topic.description}
                        </p>
                      </div>
                    </div>

                    {/* Right Progress & Chevron */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 border-border/50 pt-3 sm:pt-0">
                      <div className="w-28 hidden md:block">
                        <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span className="font-mono font-semibold">{percentage}%</span>
                        </div>
                        <Progress value={percentage} className="h-1.5" />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                          {isExpanded ? "Hide Patterns" : "View Patterns"}
                        </span>
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-transform duration-200",
                            isExpanded ? "bg-primary/10 text-primary rotate-180 border-primary/30" : "hover:bg-muted"
                          )}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* EXPANDED DROPDOWN: FULL-WIDTH PATTERNS UNDER THIS TOPIC */}
                  {isExpanded && (
                    <div className="border-t border-border bg-muted/10 p-4 sm:p-6 space-y-3 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between pb-1 px-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          <span>Patterns under {topic.name}:</span>
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {topic.patterns.length} displayed
                        </span>
                      </div>

                      {topic.patterns.length > 0 ? (
                        topic.patterns.map((pat) => (
                          <div
                            key={pat.id}
                            className="w-full rounded-xl border border-border/80 bg-card p-4 sm:p-5 hover:border-primary/50 transition-all hover:shadow-sm"
                          >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                              <div className="flex items-start gap-3.5 min-w-0">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm">
                                  #{pat.number}
                                </span>

                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-base sm:text-lg font-bold text-foreground">
                                      {pat.name}
                                    </h3>
                                    <Badge variant={pat.difficulty === "EASY" ? "easy" : "medium"}>
                                      {pat.difficulty}
                                    </Badge>
                                    <Badge variant="outline" className="text-[11px] font-mono">
                                      Time: {pat.complexity.time}
                                    </Badge>
                                    <Badge variant="outline" className="text-[11px] font-mono">
                                      Space: {pat.complexity.space}
                                    </Badge>
                                    {(pat.status === "COMPLETED" || pat.status === "MASTERED") && (
                                      <Badge variant="outline" className="text-[11px] gap-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                                        <CheckCircle2 className="h-3 w-3" /> Studied
                                      </Badge>
                                    )}
                                    {pat.status === "IN_PROGRESS" && (
                                      <Badge variant="outline" className="text-[11px] gap-1 bg-blue-500/10 text-blue-500 border-blue-500/30">
                                        Reading
                                      </Badge>
                                    )}
                                  </div>

                                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 max-w-3xl leading-relaxed">
                                    {pat.summary}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 border-t lg:border-t-0 border-border/50 pt-2 lg:pt-0">
                                <Link
                                  href={`/problems?pattern=${pat.slug}`}
                                  className="text-xs text-muted-foreground hover:text-primary font-medium hover:underline inline-flex items-center gap-1 transition-colors"
                                  title="View problems for this pattern in catalog"
                                >
                                  <span>{pat.problemsCount} Practice Problems</span>
                                  <ArrowRight className="h-3 w-3" />
                                </Link>
                                <Link href={`/patterns/${pat.slug}`}>
                                  <Button size="sm" variant={pat.status === "COMPLETED" || pat.status === "MASTERED" ? "outline" : "default"} className="gap-1.5 text-xs h-8">
                                    <span>{pat.status === "COMPLETED" || pat.status === "MASTERED" ? "Review Pattern" : "Study Pattern"}</span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                          No patterns found matching your filter under {topic.name}.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <Card className="p-12 text-center text-muted-foreground text-sm border-dashed">
              No topics or patterns match your search criteria.
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default function PatternsPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="p-12 text-center text-muted-foreground">Loading curriculum...</div>}>
        <PatternsContent />
      </Suspense>
    </AuthGuard>
  );
}
