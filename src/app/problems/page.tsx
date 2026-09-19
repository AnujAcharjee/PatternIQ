"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { AuthGuard } from "@/components/auth/auth-guard";
import {
  FileText,
  Search,
  ExternalLink,
  CheckCircle2,
  Circle,
  Star,
  Play,
  Layers,
  ChevronDown,
  Target,
  Maximize2,
  Zap,
  GitBranch,
  Sparkles,
  Trophy,
  Loader2,
  Pencil,
  Trash2,
  X,
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

interface ProblemItem {
  id: string;
  title: string;
  slug: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  platform: string;
  solveUrl: string;
  orderIndex: number;
  status: "SOLVED" | "ATTEMPTED" | "NOT_ATTEMPTED";
  isStarred?: boolean;
}

interface PatternWithProblems {
  id: string;
  number: number;
  name: string;
  slug: string;
  topicSlug: string;
  difficulty: string;
  importance: number;
  summary: string;
  complexity: { time: string; space: string };
  problems: ProblemItem[];
}

interface ProblemNote {
  id: string;
  content: string;
  problemId?: string | null;
  patternId?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TopicWithPatterns {
  id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
  patterns: PatternWithProblems[];
}

function ProblemsContent() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL"); // ALL, SOLVED, UNSOLVED, STARRED
  const [isLoading, setIsLoading] = useState(true);

  const [rawTopics, setRawTopics] = useState<TopicWithPatterns[]>([]);
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [expandedPatterns, setExpandedPatterns] = useState<Record<string, boolean>>({});
  const [problemStates, setProblemStates] = useState<Record<string, { status: string; isStarred: boolean }>>({});

  // Per-problem notes state
  const [problemNotes, setProblemNotes] = useState<Record<string, ProblemNote>>({});
  const [activeNoteProblemId, setActiveNoteProblemId] = useState<string | null>(null);
  const [editingNoteProblemId, setEditingNoteProblemId] = useState<string | null>(null);
  const [noteDraftText, setNoteDraftText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isDeletingNote, setIsDeletingNote] = useState(false);

  // Fetch live problems catalog and user progress on mount
  useEffect(() => {
    async function loadCatalogAndProgress() {
      setIsLoading(true);
      try {
        const [catalogRes, progressRes, notesRes] = await Promise.all([
          apiClient<any[]>("/problems/catalog"),
          apiClient<{ problemProgress?: Array<{ problemId: string; status: string }> }>("/progress"),
          apiClient<ProblemNote[]>("/notes?type=problem").catch(() => ({ success: false, data: [] })),
        ]);

        if (notesRes.success && Array.isArray(notesRes.data)) {
          const nMap: Record<string, ProblemNote> = {};
          notesRes.data.forEach((note) => {
            if (note.problemId) {
              nMap[note.problemId] = note;
            }
          });
          setProblemNotes(nMap);
        }

        if (catalogRes.success && Array.isArray(catalogRes.data)) {
          const loadedTopics: TopicWithPatterns[] = catalogRes.data.map((topic: any) => ({
            id: topic.id,
            name: topic.name,
            slug: topic.slug,
            description: topic.description || "",
            order: topic.order || 0,
            patterns: (topic.patterns || [])
              .slice()
              .sort((a: any, b: any) => (a.number ?? 0) - (b.number ?? 0) || (a.order ?? 0) - (b.order ?? 0))
              .map((pat: any) => ({
                id: pat.id,
                number: pat.number,
                name: pat.name,
                slug: pat.slug,
                topicSlug: topic.slug,
                difficulty: pat.difficulty || "MEDIUM",
                importance: pat.importance ?? 5,
                summary: pat.shortDescription || pat.whatIsThis || "",
                complexity: {
                  time: pat.timeComplexity || "O(N)",
                  space: pat.spaceComplexity || "O(1)",
                },
                problems: (pat.problems || [])
                  .slice()
                  .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
                  .map((pItem: any, idx: number) => {
                    const prob = pItem.problem || pItem;
                    return {
                      id: prob.id,
                      title: prob.title,
                      slug: prob.slug,
                      difficulty: prob.difficulty || "EASY",
                      platform: prob.platform || "LeetCode",
                      solveUrl: prob.solveUrl || `https://leetcode.com/problemset/all/`,
                      orderIndex: pItem.order || idx + 1,
                      status: "NOT_ATTEMPTED",
                    };
                  }),
              })),
          }));

          setRawTopics(loadedTopics);

          // Check searchParams for target pattern/problem/search
          const targetPattern = searchParams.get("pattern");
          const targetProblem = searchParams.get("problem");
          const targetSearch = searchParams.get("search");

          if (targetSearch) {
            setSearchTerm(targetSearch);
          }

          const expT: Record<string, boolean> = {};
          const expP: Record<string, boolean> = {};
          let hasExplicitTarget = false;

          if (targetPattern || targetProblem) {
            loadedTopics.forEach((t) => {
              t.patterns.forEach((p) => {
                const matchesPat = targetPattern && (p.slug === targetPattern || p.id === targetPattern);
                const matchesProb = targetProblem && p.problems.some((pr) => pr.id === targetProblem || pr.slug === targetProblem || pr.title.toLowerCase() === targetProblem.toLowerCase());

                if (matchesPat || matchesProb) {
                  expT[t.slug] = true;
                  expP[p.id] = true;
                  hasExplicitTarget = true;
                }
              });
            });
          }

          // By default, keep all topics and patterns collapsed unless explicitly targeted by searchParams
          setExpandedTopics(expT);
          setExpandedPatterns(expP);
        }

        if (progressRes.success && progressRes.data?.problemProgress) {
          setProblemStates((prev) => {
            const next = { ...prev };
            progressRes.data?.problemProgress?.forEach((p) => {
              next[p.problemId] = {
                status: p.status,
                isStarred: prev[p.problemId]?.isStarred || false,
              };
            });
            return next;
          });
        }
      } catch (err) {
        console.error("Failed to load catalog or progress", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadCatalogAndProgress();
  }, [searchParams]);

  // Smooth scroll and highlight target pattern or problem
  useEffect(() => {
    if (isLoading || rawTopics.length === 0) return;

    const paramPattern = searchParams.get("pattern");
    const paramProblem = searchParams.get("problem");

    if (!paramPattern && !paramProblem) return;

    const timer = setTimeout(() => {
      let element: HTMLElement | null = null;

      if (paramProblem) {
        element = document.getElementById(`problem-${paramProblem}`);
        if (!element) {
          for (const t of rawTopics) {
            for (const p of t.patterns) {
              for (const pr of p.problems) {
                if (pr.id === paramProblem || pr.slug === paramProblem || pr.title.toLowerCase() === paramProblem.toLowerCase()) {
                  element = document.getElementById(`problem-${pr.id}`);
                  break;
                }
              }
              if (element) break;
            }
            if (element) break;
          }
        }
      }

      if (!element && paramPattern) {
        element = document.getElementById(`pattern-${paramPattern}`);
        if (!element) {
          for (const t of rawTopics) {
            for (const p of t.patterns) {
              if (p.slug === paramPattern || p.id === paramPattern) {
                element = document.getElementById(`pattern-${p.slug}`) || document.getElementById(`pattern-${p.id}`);
                break;
              }
            }
            if (element) break;
          }
        }
      }

      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add("ring-2", "ring-primary", "ring-offset-2", "ring-offset-background", "shadow-lg");
        setTimeout(() => {
          element?.classList.remove("ring-2", "ring-primary", "ring-offset-2", "ring-offset-background", "shadow-lg");
        }, 3500);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [isLoading, rawTopics, searchParams]);

  // Toggle problem solved checkmark and persist per-user in database
  const toggleSolved = async (probId: string) => {
    const current = problemStates[probId] || { status: "NOT_ATTEMPTED", isStarred: false };
    const nextStatus = current.status === "SOLVED" ? "NOT_ATTEMPTED" : "SOLVED";

    // Optimistic UI update
    setProblemStates((prev) => ({
      ...prev,
      [probId]: { ...current, status: nextStatus },
    }));

    // Persist per-user progress to DB
    try {
      await apiClient("/progress/problems/toggle", {
        method: "POST",
        body: JSON.stringify({
          problemId: probId,
          status: nextStatus,
        }),
      });
    } catch (e) {
      console.error("Failed to persist problem status", e);
    }
  };

  // Toggle star / bookmark on problem
  const toggleStarred = (probId: string) => {
    setProblemStates((prev) => {
      const current = prev[probId] || { status: "NOT_ATTEMPTED", isStarred: false };
      return {
        ...prev,
        [probId]: { ...current, isStarred: !current.isStarred },
      };
    });
  };

  // Open / toggle note for a problem
  const handleOpenNote = (problemId: string) => {
    if (activeNoteProblemId === problemId) {
      setActiveNoteProblemId(null);
      setEditingNoteProblemId(null);
    } else {
      setActiveNoteProblemId(problemId);
      const existing = problemNotes[problemId];
      if (existing) {
        setEditingNoteProblemId(null); // Open in view mode so student can see what they wrote
        setNoteDraftText(existing.content);
      } else {
        setEditingNoteProblemId(problemId); // No note yet, open in write mode
        setNoteDraftText("");
      }
    }
  };

  const handleStartEditNote = (problemId: string) => {
    setEditingNoteProblemId(problemId);
    setNoteDraftText(problemNotes[problemId]?.content || "");
  };

  const handleCancelEditNote = (problemId: string) => {
    if (problemNotes[problemId]) {
      setEditingNoteProblemId(null); // Return to view mode
      setNoteDraftText(problemNotes[problemId].content);
    } else {
      setActiveNoteProblemId(null);
      setEditingNoteProblemId(null);
      setNoteDraftText("");
    }
  };

  // Save / Update note for a problem
  const handleSaveNote = async (problemId: string) => {
    if (!noteDraftText.trim()) return;
    setIsSavingNote(true);
    try {
      const existing = problemNotes[problemId];
      if (existing) {
        const res = await apiClient<ProblemNote>(`/notes/${existing.id}`, {
          method: "PATCH",
          body: JSON.stringify({ content: noteDraftText.trim() }),
        });
        if (res.success && res.data) {
          setProblemNotes((prev) => ({ ...prev, [problemId]: res.data! }));
          setEditingNoteProblemId(null); // Return to formatted view mode
        }
      } else {
        const res = await apiClient<ProblemNote>("/notes", {
          method: "POST",
          body: JSON.stringify({
            content: noteDraftText.trim(),
            problemId,
          }),
        });
        if (res.success && res.data) {
          setProblemNotes((prev) => ({ ...prev, [problemId]: res.data! }));
          setEditingNoteProblemId(null); // Return to formatted view mode
        }
      }
    } catch (err) {
      console.error("Failed to save note", err);
    } finally {
      setIsSavingNote(false);
    }
  };

  // Delete note for a problem
  const handleDeleteNote = async (problemId: string) => {
    const existing = problemNotes[problemId];
    if (!existing) return;
    setIsDeletingNote(true);
    try {
      await apiClient(`/notes/${existing.id}`, { method: "DELETE" });
      setProblemNotes((prev) => {
        const next = { ...prev };
        delete next[problemId];
        return next;
      });
      setNoteDraftText("");
      setActiveNoteProblemId(null);
      setEditingNoteProblemId(null);
    } catch (err) {
      console.error("Failed to delete note", err);
    } finally {
      setIsDeletingNote(false);
    }
  };

  const toggleTopic = (slug: string) => {
    setExpandedTopics((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  const togglePattern = (patternId: string) => {
    setExpandedPatterns((prev) => ({ ...prev, [patternId]: !prev[patternId] }));
  };

  const expandAll = () => {
    const allT: Record<string, boolean> = {};
    const allP: Record<string, boolean> = {};
    rawTopics.forEach((t) => {
      allT[t.slug] = true;
      t.patterns.forEach((p) => (allP[p.id] = true));
    });
    setExpandedTopics(allT);
    setExpandedPatterns(allP);
  };

  const collapseAll = () => {
    setExpandedTopics({});
    setExpandedPatterns({});
  };

  // Build the hierarchical Topic -> Pattern -> Problems tree with live states
  const hierarchy: TopicWithPatterns[] = useMemo(() => {
    return rawTopics.map((topic) => {
      const topicPats = topic.patterns.map((pat) => {
        const enrichedProbs: ProblemItem[] = pat.problems.map((prob) => {
          const state = problemStates[prob.id] || { status: prob.status, isStarred: false };
          return {
            ...prob,
            status: state.status as "SOLVED" | "ATTEMPTED" | "NOT_ATTEMPTED",
            isStarred: state.isStarred,
          };
        });

        return {
          ...pat,
          problems: enrichedProbs,
        };
      });

      return {
        ...topic,
        patterns: topicPats,
      };
    });
  }, [rawTopics, problemStates]);

  // Compute overall global progress statistics
  const stats = useMemo(() => {
    let total = 0;
    let solved = 0;
    let easySolved = 0;
    let mediumSolved = 0;
    let hardSolved = 0;

    hierarchy.forEach((t) => {
      t.patterns.forEach((p) => {
        p.problems.forEach((prob) => {
          total++;
          if (prob.status === "SOLVED") {
            solved++;
            if (prob.difficulty === "EASY") easySolved++;
            if (prob.difficulty === "MEDIUM") mediumSolved++;
            if (prob.difficulty === "HARD") hardSolved++;
          }
        });
      });
    });

    const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;
    return { total, solved, percentage, easySolved, mediumSolved, hardSolved };
  }, [hierarchy]);

  // Filter the hierarchy based on search query, difficulty, and status
  const filteredHierarchy = useMemo(() => {
    return hierarchy
      .map((topic) => {
        const filteredPatterns = topic.patterns
          .map((pat) => {
            const filteredProblems = pat.problems.filter((prob) => {
              // Search match
              const matchesSearch =
                !searchTerm ||
                prob.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                prob.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                topic.name.toLowerCase().includes(searchTerm.toLowerCase());

              // Difficulty match
              const matchesDiff =
                difficultyFilter === "ALL" || prob.difficulty === difficultyFilter;

              // Status match
              let matchesStatus = true;
              if (statusFilter === "SOLVED") matchesStatus = prob.status === "SOLVED";
              if (statusFilter === "UNSOLVED") matchesStatus = prob.status !== "SOLVED";
              if (statusFilter === "STARRED") matchesStatus = !!prob.isStarred;

              return matchesSearch && matchesDiff && matchesStatus;
            });

            return {
              ...pat,
              problems: filteredProblems,
            };
          })
          .filter((pat) => {
            // Keep pattern if it has matching problems, or if searching and pattern name matches
            if (pat.problems.length > 0) return true;
            if (searchTerm && pat.name.toLowerCase().includes(searchTerm.toLowerCase())) return true;
            return false;
          });

        return {
          ...topic,
          patterns: filteredPatterns,
        };
      })
      .filter((topic) => {
        // Keep topic if it has matching patterns
        if (topic.patterns.length > 0) return true;
        if (searchTerm && topic.name.toLowerCase().includes(searchTerm.toLowerCase())) return true;
        return false;
      });
  }, [hierarchy, searchTerm, difficultyFilter, statusFilter]);

  return (
    <AuthGuard>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="border-b border-border/60 pb-6">
          <h1 className="text-3xl font-bold tracking-tight">Curated Problems Catalog</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Organized hierarchically by <strong>Topics</strong> &rarr; <strong>Patterns</strong> &rarr; <strong>Problems</strong>.
          </p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading problems catalog...</p>
          </div>
        ) : rawTopics.length === 0 ? (
          /* Empty State when no topics/problems exist in database */
          <Card className="p-12 text-center space-y-4 border-dashed">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <FileText className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold">No problems available</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              There are currently no topics or problems in the catalog. Check back soon or consult the dashboard.
            </p>
            <div className="pt-2">
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <>
            {/* OVERALL PROGRESS BANNER */}
            <div className="rounded-2xl border border-border/80 bg-gradient-to-r from-card via-muted/20 to-primary/5 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm font-bold">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-foreground">
                      Your Practice Completion
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground font-mono">{stats.solved}</span> of{" "}
                      <span className="font-mono">{stats.total}</span> problems solved ({stats.percentage}%)
                    </p>
                  </div>
                </div>

                {/* Difficulty breakdown pills */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <div className="rounded-lg border border-border bg-card px-3 py-1.5 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground">Easy:</span>
                    <span className="font-mono font-semibold">{stats.easySolved}</span>
                  </div>
                  <div className="rounded-lg border border-border bg-card px-3 py-1.5 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-muted-foreground">Medium:</span>
                    <span className="font-mono font-semibold">{stats.mediumSolved}</span>
                  </div>
                  <div className="rounded-lg border border-border bg-card px-3 py-1.5 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span className="text-muted-foreground">Hard:</span>
                    <span className="font-mono font-semibold">{stats.hardSolved}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <Progress value={stats.percentage} className="h-2.5 bg-muted/60" />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{stats.percentage}% complete</span>
                  <span>{stats.total - stats.solved} problems remaining</span>
                </div>
              </div>
            </div>

            {/* FILTER AND SEARCH BAR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Search input */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search problems, topics, platforms..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {/* Difficulty Filter */}
                <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/20 shrink-0">
                  {["ALL", "EASY", "MEDIUM", "HARD"].map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficultyFilter(diff)}
                      className={cn(
                        "px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer",
                        difficultyFilter === diff
                          ? "bg-background text-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {diff}
                    </button>
                  ))}
                </div>

                {/* Status Filter */}
                <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/20 shrink-0">
                  {[
                    { label: "All", val: "ALL" },
                    { label: "Solved", val: "SOLVED" },
                    { label: "Unsolved", val: "UNSOLVED" },
                    { label: "Starred", val: "STARRED" },
                  ].map((st) => (
                    <button
                      key={st.val}
                      type="button"
                      onClick={() => setStatusFilter(st.val)}
                      className={cn(
                        "px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer",
                        statusFilter === st.val
                          ? "bg-background text-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* Expand / Collapse Controls */}
                <div className="flex items-center gap-1 shrink-0 ml-auto sm:ml-0">
                  <Button variant="ghost" size="sm" onClick={expandAll} className="text-xs h-8 px-2.5">
                    Expand All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={collapseAll} className="text-xs h-8 px-2.5">
                    Collapse
                  </Button>
                </div>
              </div>
            </div>

            {/* HIERARCHICAL TOPIC / PATTERN / PROBLEM ACCORDIONS */}
            <div className="space-y-6">
              {filteredHierarchy.length > 0 ? (
                filteredHierarchy.map((topic) => {
                  const TopicIcon = TOPIC_ICONS[topic.slug] || Layers;
                  const isTopicExpanded = !!expandedTopics[topic.slug];

                  // Calculate topic completion stats
                  let topicTotal = 0;
                  let topicSolved = 0;
                  topic.patterns.forEach((pat) => {
                    pat.problems.forEach((pr) => {
                      topicTotal++;
                      if (pr.status === "SOLVED") topicSolved++;
                    });
                  });
                  const topicPct = topicTotal > 0 ? Math.round((topicSolved / topicTotal) * 100) : 0;

                  return (
                    <div
                      key={topic.id}
                      className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs transition-all"
                    >
                      {/* TOPIC HEADER ACCORDION TRIGGER */}
                      <button
                        type="button"
                        onClick={() => toggleTopic(topic.slug)}
                        className="w-full flex items-center justify-between p-4 sm:p-5 bg-muted/10 hover:bg-muted/30 transition-colors border-b border-border/60 text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                            <TopicIcon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-base sm:text-lg font-bold text-foreground truncate">
                                {topic.name}
                              </h3>
                              <Badge variant="outline" className="text-[11px] shrink-0 font-mono">
                                {topic.patterns.length} patterns
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate max-w-md sm:max-w-xl">
                              {topic.description}
                            </p>
                          </div>
                        </div>

                        {/* Right: Progress bar & Chevron */}
                        <div className="flex items-center gap-4 shrink-0 pl-2">
                          <div className="hidden md:flex flex-col items-end gap-1 w-32">
                            <div className="flex justify-between w-full text-[11px]">
                              <span className="text-muted-foreground">{topicPct}%</span>
                              <span className="font-mono font-medium">{topicSolved}/{topicTotal}</span>
                            </div>
                            <Progress value={topicPct} className="h-1.5 w-full bg-muted/60" />
                          </div>

                          <div
                            className={cn(
                              "h-8 w-8 rounded-lg flex items-center justify-center bg-muted/40 text-muted-foreground transition-transform duration-200",
                              isTopicExpanded && "rotate-180 text-foreground bg-muted/80"
                            )}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </div>
                      </button>

                      {/* TOPIC BODY (Patterns list) */}
                      {isTopicExpanded && (
                        <div className="p-4 sm:p-5 space-y-4 bg-background/50">
                          {topic.patterns.length > 0 ? (
                            topic.patterns.map((pat) => {
                              const isPatternExpanded = !!expandedPatterns[pat.id];
                              const patSolvedCount = pat.problems.filter((pr) => pr.status === "SOLVED").length;
                              const isAllPatternSolved =
                                pat.problems.length > 0 && patSolvedCount === pat.problems.length;

                                  return (
                                <div
                                  key={pat.id}
                                  id={`pattern-${pat.slug}`}
                                  className={cn(
                                    "rounded-xl border transition-all overflow-hidden scroll-mt-24",
                                    isAllPatternSolved
                                      ? "border-emerald-500/30 bg-emerald-500/[0.02]"
                                      : "border-border/70 bg-card/60"
                                  )}
                                >
                                  {/* PATTERN HEADER */}
                                  <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20 border-b border-border/40">
                                    {/* Left: Number, Name, Complexity */}
                                    <div className="flex items-start sm:items-center gap-3">
                                      <button
                                        type="button"
                                        onClick={() => togglePattern(pat.id)}
                                        className="mt-0.5 sm:mt-0 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-mono text-xs font-bold hover:bg-primary/20 transition-colors cursor-pointer"
                                        title={isPatternExpanded ? "Collapse pattern" : "Expand pattern"}
                                      >
                                        #{pat.number}
                                      </button>

                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Link
                                            href={`/patterns/${pat.slug}`}
                                            className="text-sm sm:text-base font-bold text-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5"
                                          >
                                            <span>{pat.name}</span>
                                            <ExternalLink className="h-3.5 w-3.5 opacity-50" />
                                          </Link>
                                          <Badge variant={pat.difficulty === "EASY" ? "easy" : "medium"}>
                                            {pat.difficulty}
                                          </Badge>
                                          {/* PATTERN IMPORTANCE STAR RATING */}
                                          <span
                                            className="text-xs text-amber-400 font-mono tracking-tighter"
                                            title={`Importance: ${pat.importance || 5}/5 stars`}
                                          >
                                            {"★".repeat(Math.max(1, Math.min(5, pat.importance || 5)))}
                                          </span>
                                          {isAllPatternSolved && (
                                            <Badge variant="solved" className="text-[10px] py-0 px-1.5">
                                              Mastered
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 font-mono">
                                          <span>Time: {pat.complexity.time}</span>
                                          <span>•</span>
                                          <span>Space: {pat.complexity.space}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Right: Solved fraction & toggle accordion button */}
                                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                      <span className="text-xs font-mono font-medium text-muted-foreground">
                                        {patSolvedCount} / {pat.problems.length} solved
                                      </span>

                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => togglePattern(pat.id)}
                                        className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                                      >
                                        <span>{isPatternExpanded ? "Hide" : "Show"}</span>
                                        <ChevronDown
                                          className={cn(
                                            "h-3.5 w-3.5 transition-transform duration-200",
                                            isPatternExpanded && "rotate-180"
                                          )}
                                        />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* PATTERN PROBLEMS LIST */}
                                  {isPatternExpanded && (
                                    <div className="divide-y divide-border/40">
                                      {pat.problems.length > 0 ? (
                                        pat.problems.map((prob) => {
                                          const isSolved = prob.status === "SOLVED";

                                          return (
                                            <div
                                              key={prob.id}
                                              id={`problem-${prob.id}`}
                                              className={cn(
                                                "p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-300 rounded-lg scroll-mt-24",
                                                isSolved ? "bg-emerald-500/5" : "hover:bg-muted/30"
                                              )}
                                            >
                                              {/* Left: Checkmark + Star + Note + Title + Platform */}
                                              <div className="flex flex-col gap-2 min-w-0 flex-1">
                                                <div className="flex items-start sm:items-center justify-between sm:justify-start gap-3 min-w-0">
                                                  <div className="flex items-center gap-2 shrink-0">
                                                    {/* CHECKMARK OPTION */}
                                                    <button
                                                      type="button"
                                                      onClick={() => toggleSolved(prob.id)}
                                                      className={cn(
                                                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-all cursor-pointer",
                                                        isSolved
                                                          ? "bg-emerald-500 border-emerald-500 text-white shadow-xs"
                                                          : "border-border hover:border-emerald-500/60 bg-background text-transparent hover:text-muted-foreground/30"
                                                      )}
                                                      title={isSolved ? "Mark as unsolved" : "Mark as solved"}
                                                    >
                                                      <CheckCircle2 className="h-4 w-4" />
                                                    </button>

                                                    {/* STAR / BOOKMARK OPTION */}
                                                    <button
                                                      type="button"
                                                      onClick={() => toggleStarred(prob.id)}
                                                      className={cn(
                                                        "flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors cursor-pointer",
                                                        prob.isStarred
                                                          ? "text-amber-400 hover:text-amber-500"
                                                          : "text-muted-foreground/40 hover:text-amber-400"
                                                      )}
                                                      title={prob.isStarred ? "Remove from starred" : "Star problem"}
                                                    >
                                                      <Star className={cn("h-4 w-4", prob.isStarred && "fill-current")} />
                                                    </button>

                                                    {/* NOTE BUTTON */}
                                                    <button
                                                      type="button"
                                                      onClick={() => handleOpenNote(prob.id)}
                                                      className={cn(
                                                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all cursor-pointer relative",
                                                        problemNotes[prob.id]
                                                          ? "text-amber-400 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 shadow-xs"
                                                          : "text-muted-foreground/40 hover:text-amber-400 hover:bg-amber-500/10"
                                                      )}
                                                      title={problemNotes[prob.id] ? "View / edit note" : "Add note for this problem"}
                                                    >
                                                      <FileText className="h-3.5 w-3.5" />
                                                      {problemNotes[prob.id] && (
                                                        <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 ring-1 ring-background" />
                                                      )}
                                                    </button>
                                                  </div>

                                                  <div className="space-y-0.5 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                      <span
                                                        className={cn(
                                                          "text-sm font-semibold transition-all",
                                                          isSolved
                                                            ? "line-through text-muted-foreground"
                                                            : "text-foreground"
                                                        )}
                                                      >
                                                        {prob.title}
                                                      </span>
                                                      <Badge variant={prob.difficulty === "EASY" ? "easy" : "medium"}>
                                                        {prob.difficulty}
                                                      </Badge>
                                                    </div>
                                                    <span className="text-xs font-mono text-muted-foreground block">
                                                      {prob.platform}
                                                    </span>
                                                  </div>
                                                </div>

                                                {/* INLINE NOTE VIEW & EDITOR (Only visible when note symbol is clicked) */}
                                                {activeNoteProblemId === prob.id && (
                                                  <div className="mt-2.5 p-3.5 sm:p-4 rounded-xl bg-card border border-amber-500/30 space-y-3 animate-in slide-in-from-top-1 duration-200 shadow-sm">
                                                    {editingNoteProblemId !== prob.id && problemNotes[prob.id] ? (
                                                      /* ── VIEW MODE (Formatted note display) ── */
                                                      <div className="space-y-2.5">
                                                        <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                                                          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                                                            <FileText className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0" />
                                                            <span>Personal Note for {prob.title}</span>
                                                            <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono font-normal">
                                                              Saved {new Date(problemNotes[prob.id].updatedAt).toLocaleDateString()}
                                                            </span>
                                                          </div>
                                                          <div className="flex items-center gap-1">
                                                            <Button
                                                              type="button"
                                                              variant="ghost"
                                                              size="sm"
                                                              onClick={() => handleStartEditNote(prob.id)}
                                                              className="h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 cursor-pointer"
                                                              title="Edit note"
                                                            >
                                                              <Pencil className="h-3 w-3" />
                                                              <span>Edit</span>
                                                            </Button>
                                                            <Button
                                                              type="button"
                                                              variant="ghost"
                                                              size="sm"
                                                              onClick={() => handleDeleteNote(prob.id)}
                                                              disabled={isDeletingNote}
                                                              className="h-6 px-2 text-[11px] gap-1 text-destructive hover:bg-destructive/10 cursor-pointer"
                                                              title="Delete note"
                                                            >
                                                              <Trash2 className="h-3 w-3" />
                                                              <span>Delete</span>
                                                            </Button>
                                                            <Button
                                                              type="button"
                                                              variant="ghost"
                                                              size="sm"
                                                              onClick={() => setActiveNoteProblemId(null)}
                                                              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                                                              title="Close note"
                                                            >
                                                              <X className="h-3.5 w-3.5" />
                                                            </Button>
                                                          </div>
                                                        </div>

                                                        {/* Formatted Note Content */}
                                                        <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap font-sans bg-muted/30 border border-border/50 rounded-lg p-3">
                                                          {problemNotes[prob.id].content}
                                                        </div>
                                                      </div>
                                                    ) : (
                                                      /* ── EDIT MODE (Textarea editor) ── */
                                                      <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                                                            <FileText className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                                                            <span>{problemNotes[prob.id] ? `Edit Note for ${prob.title}` : `Add Note for ${prob.title}`}</span>
                                                          </div>
                                                          <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleCancelEditNote(prob.id)}
                                                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                                                            title="Close editor"
                                                          >
                                                            <X className="h-3.5 w-3.5" />
                                                          </Button>
                                                        </div>

                                                        <textarea
                                                          value={noteDraftText}
                                                          onChange={(e) => setNoteDraftText(e.target.value)}
                                                          placeholder="Write your personal note, key pattern trick, edge cases, or revision tips for this problem..."
                                                          className="w-full min-h-[90px] text-xs sm:text-sm p-3 rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 resize-y font-sans placeholder:text-muted-foreground/60 leading-relaxed shadow-inner"
                                                          rows={3}
                                                          autoFocus
                                                        />

                                                        <div className="flex items-center justify-between gap-2">
                                                          <span className="text-[10px] text-muted-foreground font-mono">
                                                            {noteDraftText.length} / 5000 chars
                                                          </span>
                                                          <div className="flex items-center gap-2">
                                                            <Button
                                                              type="button"
                                                              variant="outline"
                                                              size="sm"
                                                              onClick={() => handleCancelEditNote(prob.id)}
                                                              className="h-7 text-xs px-2.5 cursor-pointer"
                                                            >
                                                              Cancel
                                                            </Button>
                                                            <Button
                                                              type="button"
                                                              size="sm"
                                                              disabled={isSavingNote || !noteDraftText.trim()}
                                                              onClick={() => handleSaveNote(prob.id)}
                                                              className="h-7 text-xs px-3 gap-1.5 cursor-pointer"
                                                            >
                                                              {isSavingNote && <Loader2 className="h-3 w-3 animate-spin" />}
                                                              <span>{problemNotes[prob.id] ? "Update Note" : "Save Note"}</span>
                                                            </Button>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              </div>

                                              {/* Right: Solved status + START BUTTON */}
                                              <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pl-9 sm:pl-0 self-end sm:self-center">
                                                {isSolved && (
                                                  <Badge variant="solved" className="text-[11px] gap-1 py-0.5">
                                                    <CheckCircle2 className="h-3 w-3" /> Solved
                                                  </Badge>
                                                )}

                                                {/* START / SOLVE BUTTON */}
                                                <a
                                                  href={prob.solveUrl}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="inline-flex items-center justify-center gap-1.5 h-8 px-3.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs transition-all cursor-pointer"
                                                  title="Open problem in LeetCode"
                                                >
                                                  <Play className="h-3 w-3 fill-current" />
                                                  <span>Start</span>
                                                  <ExternalLink className="h-3 w-3 opacity-70" />
                                                </a>
                                              </div>
                                            </div>
                                          );
                                        })
                                      ) : (
                                        <div className="p-4 text-center text-xs text-muted-foreground">
                                          No problems match your filter under this pattern.
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="p-6 text-center text-xs text-muted-foreground">
                              No patterns or problems match your search criteria.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <Card className="p-12 text-center text-muted-foreground text-sm border-dashed">
                  <p>No questions found matching your filter criteria.</p>
                  <p className="text-xs mt-1">Try resetting the search query or difficulty filters.</p>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </AuthGuard>
  );
}

export default function ProblemsPage() {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading problems catalog...</p>
          </div>
        }
      >
        <ProblemsContent />
      </Suspense>
    </AuthGuard>
  );
}
