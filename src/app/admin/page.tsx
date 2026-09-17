"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AdminUsersTab } from "@/components/admin/admin-users-tab";
import { FormattedTextarea } from "@/components/ui/formatted-textarea";
import { TopicFillInput } from "@/components/admin/topic-fill-input";
import {
  Shield,
  Layers,
  FileText,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  LogOut,
  Lock,
  Loader2,
  AlertTriangle,
  X,
  ExternalLink,
  Code2,
  BookOpen,
  Target,
  Maximize2,
  Zap,
  GitBranch,
  FolderPlus,
  Edit2,
  Trash2,
  MessageSquare,
  RefreshCw,
  PenSquare,
  Eye,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Search,
  Filter,
  Check,
  LayoutGrid,
  List,
} from "lucide-react";
import { cn, cleanLatexMath } from "@/lib/utils";

const TOPIC_ICON_OPTIONS = [
  { name: "Target (Pointers / Search)", icon: Target, value: "Target" },
  { name: "Maximize (Windows / Subarrays)", icon: Maximize2, value: "Maximize2" },
  { name: "Zap (Speed / Cycles)", icon: Zap, value: "Zap" },
  { name: "GitBranch (Trees / Graphs)", icon: GitBranch, value: "GitBranch" },
  { name: "Layers (Dynamic Programming)", icon: Layers, value: "Layers" },
  { name: "BookOpen (Curriculum)", icon: BookOpen, value: "BookOpen" },
  { name: "Code2 (Data Structures)", icon: Code2, value: "Code2" },
];

const PLATFORM_OPTIONS = [
  { label: "LeetCode", value: "LeetCode", color: "bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20" },
  { label: "GFG", value: "GFG", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20" },
  { label: "Codeforces", value: "Codeforces", color: "bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500/20" },
  { label: "HackerRank", value: "HackerRank", color: "bg-teal-500/10 text-teal-400 border-teal-500/30 hover:bg-teal-500/20" },
  { label: "CodeChef", value: "CodeChef", color: "bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20" },
  { label: "Other", value: "Other", color: "bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20" },
];

const getTopicIconComponent = (iconName?: string | null, slug?: string) => {
  if (iconName) {
    const found = TOPIC_ICON_OPTIONS.find(
      (o) => o.value.toLowerCase() === iconName.toLowerCase() || o.name.toLowerCase().includes(iconName.toLowerCase())
    );
    if (found) return found.icon;
  }
  if (slug) {
    const s = slug.toLowerCase();
    if (s.includes("pointer") || s.includes("target")) return Target;
    if (s.includes("window") || s.includes("subarray") || s.includes("maximize")) return Maximize2;
    if (s.includes("fast") || s.includes("zap") || s.includes("speed") || s.includes("slow")) return Zap;
    if (s.includes("tree") || s.includes("graph") || s.includes("branch") || s.includes("bfs") || s.includes("dfs")) return GitBranch;
    if (s.includes("dp") || s.includes("dynamic") || s.includes("layer")) return Layers;
    if (s.includes("math") || s.includes("code") || s.includes("structure") || s.includes("bit")) return Code2;
    if (s.includes("curriculum") || s.includes("book")) return BookOpen;
  }
  return Layers;
};

interface TopicItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  order: number;
  published: boolean;
  _count?: { patterns: number };
}

interface PatternItem {
  id: string;
  number: number;
  name: string;
  slug: string;
  topicId: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  importance: number;
  shortDescription?: string | null;
  whatIsThis?: string | null;
  intuition?: string | null;
  identificationSignals?: string | null;
  executionRecipe?: string | null;
  coreIdea?: string | null;
  interviewRule?: string | null;
  timeComplexity?: string | null;
  spaceComplexity?: string | null;
  pseudocode?: string | null;
  cppTemplate?: string | null;
  javaTemplate?: string | null;
  jsTemplate?: string | null;
  pyTemplate?: string | null;
  topic?: { id: string; name: string; slug: string };
  problems?: Array<{ id?: string; problemId?: string; problem?: ProblemItem }>;
  _count?: { problems: number };
}

interface ProblemItem {
  id: string;
  title: string;
  slug: string;
  platform?: string | null;
  externalId?: string | null;
  solveUrl: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  patterns?: Array<{ pattern: { id: string; name: string; slug: string } }>;
}

interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  category: string;
  status: string;
  publishedAt?: string | null;
  author?: { id: string; name: string };
  createdAt: string;
}

function AdminTabSync({ onTabChange }: { onTabChange: (tab: string) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam && ["users", "topics", "patterns", "problems", "moderation"].includes(tabParam)) {
      onTabChange(tabParam);
    }
  }, [searchParams, onTabChange]);
  return null;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, logout, isLoading: isAuthContextLoading } = useAuth();

  // Verification state: null = verifying, true = verified admin, false = denied
  const [isAdminVerified, setIsAdminVerified] = useState<boolean | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verifiedAdminUser, setVerifiedAdminUser] = useState<any>(null);

  // Live Curriculum & Management Data States
  const [dashboardTotals, setDashboardTotals] = useState({
    users: 0,
    patterns: 0,
    problems: 0,
    publishedArticles: 0,
    pendingArticles: 0,
    comments: 0,
  });

  const [activeTab, setActiveTab] = useState<string>("patterns");
  const [registeredUsersCount, setRegisteredUsersCount] = useState<number>(0);

  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [patterns, setPatterns] = useState<PatternItem[]>([]);
  const [problems, setProblems] = useState<ProblemItem[]>([]);
  const [pendingArticles, setPendingArticles] = useState<ArticleItem[]>([]);
  const [allArticles, setAllArticles] = useState<ArticleItem[]>([]);
  const [articleFilterStatus, setArticleFilterStatus] = useState<string>("ALL");
  const [articleSearchQuery, setArticleSearchQuery] = useState<string>("");
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Success / Error Banner
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Modals Open States (Create)
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showPatternModal, setShowPatternModal] = useState(false);
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState(false);

  // Modals Open States (Edit)
  const [editingTopic, setEditingTopic] = useState<TopicItem | null>(null);
  const [editingPattern, setEditingPattern] = useState<PatternItem | null>(null);
  const [editingProblem, setEditingProblem] = useState<ProblemItem | null>(null);

  // Active Tab inside Pattern Modals: "meta" | "intuition" | "code"
  const [patternModalTab, setPatternModalTab] = useState<"meta" | "intuition" | "code">("meta");
  const [templateLangTab, setTemplateLangTab] = useState<"python" | "cpp" | "java" | "javascript">("python");

  // -------------------------------------------------------------
  // FORM STATES: 4. NEW ARTICLE (ADMIN AUTHORING)
  // -------------------------------------------------------------
  const [newArticleTitle, setNewArticleTitle] = useState("");
  const [newArticleCategory, setNewArticleCategory] = useState("DSA");
  const [newArticleSubtopic, setNewArticleSubtopic] = useState("");
  const [newArticleExcerpt, setNewArticleExcerpt] = useState("");
  const [newArticleContent, setNewArticleContent] = useState("");
  const [newArticleCoverImage, setNewArticleCoverImage] = useState("");
  const [newArticleStatus, setNewArticleStatus] = useState<"PUBLISHED" | "DRAFT">("PUBLISHED");
  const [isArticlePreview, setIsArticlePreview] = useState(false);
  const [isSubmittingArticle, setIsSubmittingArticle] = useState(false);

  // Deletion Confirmation Modal State
  const [itemToDelete, setItemToDelete] = useState<{
    type: "topic" | "pattern" | "problem" | "article";
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // -------------------------------------------------------------
  // FORM STATES: 1. NEW TOPIC
  // -------------------------------------------------------------
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicDescription, setNewTopicDescription] = useState("");
  const [newTopicIcon, setNewTopicIcon] = useState("Target");
  const [newTopicOrder, setNewTopicOrder] = useState(1);
  const [newTopicPublished, setNewTopicPublished] = useState(true);
  const [isSubmittingTopic, setIsSubmittingTopic] = useState(false);

  // -------------------------------------------------------------
  // FORM STATES: 2. NEW PATTERN
  // -------------------------------------------------------------
  const [newPatternTopicId, setNewPatternTopicId] = useState("");
  const [newPatternTopicName, setNewPatternTopicName] = useState("");
  const [editingPatternTopicName, setEditingPatternTopicName] = useState("");
  const [newPatternNumber, setNewPatternNumber] = useState(1);
  const [newPatternName, setNewPatternName] = useState("");
  const [newPatternDifficulty, setNewPatternDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [newPatternImportance, setNewPatternImportance] = useState(5);
  const [newPatternShortDesc, setNewPatternShortDesc] = useState("");
  const [newPatternWhatIsThis, setNewPatternWhatIsThis] = useState("");
  const [newPatternIntuition, setNewPatternIntuition] = useState("");
  const [newPatternCoreIdea, setNewPatternCoreIdea] = useState("");
  const [newPatternInterviewRule, setNewPatternInterviewRule] = useState("");
  const [newPatternTime, setNewPatternTime] = useState("O(N)");
  const [newPatternSpace, setNewPatternSpace] = useState("O(1)");
  const [newPatternPseudocode, setNewPatternPseudocode] = useState("");
  const [newPatternPy, setNewPatternPy] = useState("");
  const [newPatternCpp, setNewPatternCpp] = useState("");
  const [newPatternJava, setNewPatternJava] = useState("");
  const [newPatternJs, setNewPatternJs] = useState("");
  const [newPatternSignals, setNewPatternSignals] = useState("");
  const [newPatternRecipe, setNewPatternRecipe] = useState("");
  const [newPatternSelectedProblems, setNewPatternSelectedProblems] = useState<string[]>([]);
  const [editingPatternSelectedProblems, setEditingPatternSelectedProblems] = useState<string[]>([]);
  const [isSubmittingPattern, setIsSubmittingPattern] = useState(false);

  // -------------------------------------------------------------
  // FORM STATES: 3. NEW PROBLEM
  // -------------------------------------------------------------
  const [newProblemTopicId, setNewProblemTopicId] = useState("");
  const [newProblemPatternId, setNewProblemPatternId] = useState("");
  const [newProblemPatternSearch, setNewProblemPatternSearch] = useState("");
  const [newProblemTitle, setNewProblemTitle] = useState("");
  const [newProblemPlatform, setNewProblemPlatform] = useState("LeetCode");
  const [newProblemCustomPlatform, setNewProblemCustomPlatform] = useState("");
  const [newProblemExternalId, setNewProblemExternalId] = useState("");
  const [newProblemDifficulty, setNewProblemDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [newProblemUrl, setNewProblemUrl] = useState("");
  const [newProblemIsCore, setNewProblemIsCore] = useState(true);
  const [isSubmittingProblem, setIsSubmittingProblem] = useState(false);

  // In-modal success messages for continuous addition
  const [patternModalSuccess, setPatternModalSuccess] = useState<string | null>(null);
  const [problemModalSuccess, setProblemModalSuccess] = useState<string | null>(null);

  // Patterns inventory view controls
  const [expandedAdminTopics, setExpandedAdminTopics] = useState<Record<string, boolean>>({});
  const [patternSearchQuery, setPatternSearchQuery] = useState("");
  const [patternTopicFilter, setPatternTopicFilter] = useState("ALL");
  const [patternViewMode, setPatternViewMode] = useState<"accordion" | "flat">("accordion");

  // Toggle accordion for a topic
  const toggleAdminTopic = (topicId: string) => {
    setExpandedAdminTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  // Open Add Problem Modal with specific topic/pattern pre-selected
  const openAddProblemModal = (topicId?: string, patternId?: string) => {
    const targetTopicId = topicId || (patternId ? patterns.find((p) => p.id === patternId)?.topicId : "") || newProblemTopicId || topics[0]?.id || "";
    setNewProblemTopicId(targetTopicId);

    const topicPatterns = patterns.filter((p) => p.topicId === targetTopicId || p.topic?.id === targetTopicId);
    if (patternId) {
      setNewProblemPatternId(patternId);
    } else if (topicPatterns.length > 0) {
      setNewProblemPatternId(topicPatterns[0].id);
    } else {
      setNewProblemPatternId("");
    }

    setNewProblemPatternSearch("");
    setShowProblemModal(true);
  };

  // Open Add Pattern Modal for a topic
  const openAddPatternModal = (topicId?: string, topicName?: string) => {
    if (topicId) {
      setNewPatternTopicId(topicId);
      const foundTopic = topics.find((t) => t.id === topicId);
      setNewPatternTopicName(topicName || foundTopic?.name || "");
    }
    setShowPatternModal(true);
  };

  // Smart detect platform when typing / pasting URL
  const handleSolveUrlChange = (url: string, setUrl: (v: string) => void, setPlatform: (p: string) => void) => {
    setUrl(url);
    const lower = url.toLowerCase();
    if (lower.includes("leetcode.com")) {
      setPlatform("LeetCode");
    } else if (lower.includes("geeksforgeeks.org")) {
      setPlatform("GFG");
    } else if (lower.includes("codeforces.com")) {
      setPlatform("Codeforces");
    } else if (lower.includes("hackerrank.com")) {
      setPlatform("HackerRank");
    } else if (lower.includes("codechef.com")) {
      setPlatform("CodeChef");
    }
  };

  // -------------------------------------------------------------
  // MANDATORY SECURITY VERIFICATION: Backend API Check
  // -------------------------------------------------------------
  const verifyAdminAccess = async () => {
    setIsAdminVerified(null);
    setVerificationError(null);

    const token = typeof window !== "undefined" ? localStorage.getItem("patterniq_access_token") : null;

    if (!token) {
      setIsAdminVerified(false);
      setVerificationError("No active administrator session found. Please sign in to access the Admin Console.");
      return;
    }

    try {
      const authRes = await apiClient<{ id: string; name: string; email: string; role: string }>("/auth/me");

      if (authRes.success && authRes.data) {
        if (authRes.data.role === "ADMIN") {
          setIsAdminVerified(true);
          setVerifiedAdminUser(authRes.data);
          loadAllAdminData();
          return;
        } else {
          setIsAdminVerified(false);
          setVerificationError(
            `Access Denied: Account '${authRes.data.email}' has role '${authRes.data.role}'. This console is restricted strictly to verified Administrators.`
          );
          return;
        }
      }

      setIsAdminVerified(false);
      setVerificationError(authRes.error?.message || "Administrator token verification failed. Please sign in again.");
    } catch (err: any) {
      setIsAdminVerified(false);
      setVerificationError(err?.message || "Failed to reach security authorization service to verify administrator role.");
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam && ["users", "topics", "patterns", "problems", "moderation"].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", val);
      window.history.replaceState({}, "", url.toString());
    }
  };

  useEffect(() => {
    if (!isAuthContextLoading) {
      verifyAdminAccess();
    }
  }, [isAuthContextLoading]);

  // -------------------------------------------------------------
  // FETCH ALL LIVE ADMIN DATA
  // -------------------------------------------------------------
  const loadAllAdminData = async () => {
    setIsLoadingData(true);
    try {
      const [dashRes, topicsRes, patternsRes, problemsRes, articlesRes] = await Promise.all([
        apiClient<any>("/admin/dashboard"),
        apiClient<TopicItem[]>("/admin/topics"),
        apiClient<PatternItem[]>("/admin/patterns"),
        apiClient<ProblemItem[]>("/admin/problems"),
        apiClient<ArticleItem[]>("/admin/articles"),
      ]);

      if (dashRes.success && dashRes.data?.totals) {
        setDashboardTotals(dashRes.data.totals);
        if (dashRes.data.totals.users) {
          setRegisteredUsersCount(dashRes.data.totals.users);
        }
      }

      if (topicsRes.success && Array.isArray(topicsRes.data)) {
        setTopics(topicsRes.data);
        if (topicsRes.data.length > 0) {
          if (!newPatternTopicId) {
            setNewPatternTopicId(topicsRes.data[0].id);
            setNewPatternTopicName(topicsRes.data[0].name);
          }
          if (!newProblemTopicId) {
            setNewProblemTopicId(topicsRes.data[0].id);
          }
        }
      }

      if (patternsRes.success && Array.isArray(patternsRes.data)) {
        setPatterns(patternsRes.data);
        if (patternsRes.data.length > 0 && !newProblemPatternId) {
          setNewProblemPatternId(patternsRes.data[0].id);
        }
      }

      if (problemsRes.success && Array.isArray(problemsRes.data)) {
        setProblems(problemsRes.data);
      }

      if (articlesRes.success && Array.isArray(articlesRes.data)) {
        setAllArticles(articlesRes.data);
        setPendingArticles(articlesRes.data.filter((a) => a.status === "SUBMITTED"));
      }
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessBanner(msg);
    setErrorBanner(null);
    setTimeout(() => setSuccessBanner(null), 4500);
  };

  const showError = (msg: string) => {
    setErrorBanner(msg);
    setSuccessBanner(null);
    setTimeout(() => setErrorBanner(null), 5000);
  };

  // -------------------------------------------------------------
  // HANDLERS: 1. CREATE TOPIC
  // -------------------------------------------------------------
  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    setIsSubmittingTopic(true);

    try {
      const res = await apiClient<TopicItem>("/admin/topics", {
        method: "POST",
        body: JSON.stringify({
          name: newTopicName.trim(),
          description: newTopicDescription.trim() || undefined,
          icon: newTopicIcon,
          order: Number(newTopicOrder),
          published: newTopicPublished,
        }),
      });

      if (res.success && res.data) {
        setTopics((prev) => [...prev, res.data!]);
        setShowTopicModal(false);
        showSuccess(`Topic "${newTopicName}" successfully created!`);
        setNewTopicName("");
        setNewTopicDescription("");
        setNewTopicOrder((o) => Number(o) + 1);
        loadAllAdminData();
      } else {
        showError(res.error?.message || "Failed to create topic");
      }
    } catch (e: any) {
      showError(e?.message || "Failed to create topic");
    } finally {
      setIsSubmittingTopic(false);
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: 2. UPDATE TOPIC
  // -------------------------------------------------------------
  const handleUpdateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic || !editingTopic.name.trim()) return;
    setIsSubmittingTopic(true);

    try {
      const res = await apiClient<TopicItem>(`/admin/topics/${editingTopic.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editingTopic.name.trim(),
          description: editingTopic.description?.trim() ? editingTopic.description.trim() : null,
          icon: editingTopic.icon?.trim() ? editingTopic.icon.trim() : null,
          order: Number(editingTopic.order),
          published: editingTopic.published,
        }),
      });

      if (res.success && res.data) {
        setTopics((prev) => prev.map((t) => (t.id === editingTopic.id ? res.data! : t)));
        setEditingTopic(null);
        showSuccess(`Topic "${editingTopic.name}" successfully updated!`);
        await loadAllAdminData();
      } else {
        showError(res.error?.message || "Failed to update topic");
      }
    } catch (e: any) {
      showError(e?.message || "Failed to update topic");
    } finally {
      setIsSubmittingTopic(false);
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: 3. CREATE PATTERN
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // HANDLERS: 3. CREATE PATTERN
  // -------------------------------------------------------------
  const handleCreatePattern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatternName.trim() || (!newPatternTopicId && !newPatternTopicName.trim())) return;
    setIsSubmittingPattern(true);

    try {
      const res = await apiClient<PatternItem>("/admin/patterns", {
        method: "POST",
        body: JSON.stringify({
          topicId: newPatternTopicId || undefined,
          topicName: newPatternTopicName.trim() || undefined,
          number: Number(newPatternNumber),
          name: cleanLatexMath(newPatternName.trim()),
          shortDescription: newPatternShortDesc.trim() ? cleanLatexMath(newPatternShortDesc.trim()) : undefined,
          whatIsThis: newPatternWhatIsThis.trim() ? cleanLatexMath(newPatternWhatIsThis.trim()) : undefined,
          intuition: newPatternIntuition.trim() ? cleanLatexMath(newPatternIntuition.trim()) : undefined,
          identificationSignals: newPatternSignals.trim() ? cleanLatexMath(newPatternSignals.trim()) : undefined,
          executionRecipe: newPatternRecipe.trim() ? cleanLatexMath(newPatternRecipe.trim()) : undefined,
          coreIdea: newPatternCoreIdea.trim() ? cleanLatexMath(newPatternCoreIdea.trim()) : undefined,
          interviewRule: newPatternInterviewRule.trim() ? cleanLatexMath(newPatternInterviewRule.trim()) : undefined,
          difficulty: newPatternDifficulty,
          importance: Number(newPatternImportance),
          timeComplexity: cleanLatexMath(newPatternTime),
          spaceComplexity: cleanLatexMath(newPatternSpace),
          pseudocode: newPatternPseudocode.trim() ? cleanLatexMath(newPatternPseudocode.trim()) : undefined,
          cppTemplate: newPatternCpp.trim() ? cleanLatexMath(newPatternCpp.trim()) : undefined,
          javaTemplate: newPatternJava.trim() ? cleanLatexMath(newPatternJava.trim()) : undefined,
          jsTemplate: newPatternJs.trim() ? cleanLatexMath(newPatternJs.trim()) : undefined,
          pyTemplate: newPatternPy.trim() ? cleanLatexMath(newPatternPy.trim()) : undefined,
          status: "PUBLISHED",
          benchmarkProblemIds: newPatternSelectedProblems,
        }),
      });

      if (res.success && res.data) {
        const createdName = newPatternName;
        setPatterns((prev) => [res.data!, ...prev]);
        // Keep modal OPEN for continuous creation: reset fields & advance pattern number
        setNewPatternName("");
        setNewPatternShortDesc("");
        setNewPatternWhatIsThis("");
        setNewPatternIntuition("");
        setNewPatternSignals("");
        setNewPatternRecipe("");
        setNewPatternCoreIdea("");
        setNewPatternInterviewRule("");
        setNewPatternPseudocode("");
        setNewPatternPy("");
        setNewPatternCpp("");
        setNewPatternJava("");
        setNewPatternJs("");
        setNewPatternSelectedProblems([]);
        setNewPatternNumber((n) => Number(n) + 1);
        setPatternModalSuccess(`Pattern "${createdName}" created and published! You can add Pattern #${Number(newPatternNumber) + 1} below.`);
        setTimeout(() => setPatternModalSuccess(null), 5000);
        showSuccess(`Pattern "${createdName}" successfully created and published!`);
        await loadAllAdminData();
      } else {
        showError(res.error?.message || "Failed to create pattern");
      }
    } catch (e: any) {
      showError(e?.message || "Failed to create pattern");
    } finally {
      setIsSubmittingPattern(false);
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: 4. UPDATE PATTERN
  // -------------------------------------------------------------
  const openEditPattern = (pat: PatternItem) => {
    setEditingPattern(pat);
    const probIds = pat.problems?.map((p: any) => p.problemId || p.id || p.problem?.id).filter(Boolean) || [];
    setEditingPatternSelectedProblems(probIds);
    const existingTopic = topics.find((t) => t.id === pat.topicId);
    setEditingPatternTopicName(existingTopic?.name || pat.topic?.name || "");
    setPatternModalTab("meta");
    setTemplateLangTab("python");
  };

  const handleUpdatePattern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPattern || !editingPattern.name.trim()) return;
    setIsSubmittingPattern(true);

    try {
      const payload = {
        topicId: editingPattern.topicId || undefined,
        topicName: editingPatternTopicName.trim() || undefined,
        number: Number(editingPattern.number),
        name: cleanLatexMath(editingPattern.name.trim()),
        shortDescription: editingPattern.shortDescription?.trim() ? cleanLatexMath(editingPattern.shortDescription.trim()) : null,
        whatIsThis: editingPattern.whatIsThis?.trim() ? cleanLatexMath(editingPattern.whatIsThis.trim()) : null,
        intuition: editingPattern.intuition?.trim() ? cleanLatexMath(editingPattern.intuition.trim()) : null,
        identificationSignals: editingPattern.identificationSignals?.trim() ? cleanLatexMath(editingPattern.identificationSignals.trim()) : null,
        executionRecipe: editingPattern.executionRecipe?.trim() ? cleanLatexMath(editingPattern.executionRecipe.trim()) : null,
        coreIdea: editingPattern.coreIdea?.trim() ? cleanLatexMath(editingPattern.coreIdea.trim()) : null,
        interviewRule: editingPattern.interviewRule?.trim() ? cleanLatexMath(editingPattern.interviewRule.trim()) : null,
        difficulty: editingPattern.difficulty,
        importance: Number(editingPattern.importance),
        timeComplexity: editingPattern.timeComplexity?.trim() ? cleanLatexMath(editingPattern.timeComplexity.trim()) : null,
        spaceComplexity: editingPattern.spaceComplexity?.trim() ? cleanLatexMath(editingPattern.spaceComplexity.trim()) : null,
        pseudocode: editingPattern.pseudocode?.trim() ? cleanLatexMath(editingPattern.pseudocode.trim()) : null,
        cppTemplate: editingPattern.cppTemplate?.trim() ? cleanLatexMath(editingPattern.cppTemplate.trim()) : null,
        javaTemplate: editingPattern.javaTemplate?.trim() ? cleanLatexMath(editingPattern.javaTemplate.trim()) : null,
        jsTemplate: editingPattern.jsTemplate?.trim() ? cleanLatexMath(editingPattern.jsTemplate.trim()) : null,
        pyTemplate: editingPattern.pyTemplate?.trim() ? cleanLatexMath(editingPattern.pyTemplate.trim()) : null,
        benchmarkProblemIds: editingPatternSelectedProblems,
      };

      const res = await apiClient<PatternItem>(`/admin/patterns/${editingPattern.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (res.success && res.data) {
        const updated = res.data;
        setPatterns((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
        setEditingPattern(null);
        showSuccess(`Pattern "${updated.name}" successfully updated!`);
        await loadAllAdminData();
      } else {
        showError(res.error?.message || "Failed to update pattern");
      }
    } catch (e: any) {
      showError(e?.message || "Failed to update pattern");
    } finally {
      setIsSubmittingPattern(false);
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: 5. CREATE PROBLEM
  // -------------------------------------------------------------
  const handleCreateProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProblemTitle.trim() || !newProblemUrl.trim()) return;
    setIsSubmittingProblem(true);

    try {
      const res = await apiClient<ProblemItem>("/admin/problems", {
        method: "POST",
        body: JSON.stringify({
          title: newProblemTitle.trim(),
          platform: newProblemPlatform.trim(),
          externalId: newProblemExternalId.trim() || undefined,
          solveUrl: newProblemUrl.trim(),
          difficulty: newProblemDifficulty,
        }),
      });

      if (res.success && res.data) {
        const createdProb = res.data;

        // If a pattern was selected, attach it
        if (newProblemPatternId) {
          await apiClient(`/admin/patterns/${newProblemPatternId}/problems`, {
            method: "POST",
            body: JSON.stringify({
              problemId: createdProb.id,
              isCore: newProblemIsCore,
            }),
          }).catch(() => {});
        }

        const savedTitle = newProblemTitle;
        // Keep modal OPEN for continuous creation: reset problem fields but keep topic & pattern
        setNewProblemTitle("");
        setNewProblemUrl("");
        setNewProblemExternalId("");
        setProblemModalSuccess(`Problem "${savedTitle}" created and attached! You can add another problem below.`);
        setTimeout(() => setProblemModalSuccess(null), 5000);
        showSuccess(`Problem "${savedTitle}" created and attached!`);
        loadAllAdminData();
      } else {
        showError(res.error?.message || "Failed to create problem");
      }
    } catch (e: any) {
      showError(e?.message || "Failed to create problem");
    } finally {
      setIsSubmittingProblem(false);
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: 6. UPDATE PROBLEM
  // -------------------------------------------------------------
  const handleUpdateProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProblem || !editingProblem.title.trim()) return;
    setIsSubmittingProblem(true);

    try {
      const res = await apiClient<ProblemItem>(`/admin/problems/${editingProblem.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: editingProblem.title.trim(),
          platform: editingProblem.platform?.trim() ? editingProblem.platform.trim() : null,
          externalId: editingProblem.externalId?.trim() ? editingProblem.externalId.trim() : null,
          solveUrl: editingProblem.solveUrl.trim(),
          difficulty: editingProblem.difficulty,
        }),
      });

      if (res.success && res.data) {
        setProblems((prev) => prev.map((p) => (p.id === editingProblem.id ? { ...p, ...res.data! } : p)));
        setEditingProblem(null);
        showSuccess(`Problem "${editingProblem.title}" successfully updated!`);
        await loadAllAdminData();
      } else {
        showError(res.error?.message || "Failed to update problem");
      }
    } catch (e: any) {
      showError(e?.message || "Failed to update problem");
    } finally {
      setIsSubmittingProblem(false);
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: 7. DELETE ANY ITEM (Topic, Pattern, Problem, Article)
  // -------------------------------------------------------------
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    try {
      let endpoint = "";
      if (itemToDelete.type === "topic") endpoint = `/admin/topics/${itemToDelete.id}`;
      else if (itemToDelete.type === "pattern") endpoint = `/admin/patterns/${itemToDelete.id}`;
      else if (itemToDelete.type === "problem") endpoint = `/admin/problems/${itemToDelete.id}`;
      else if (itemToDelete.type === "article") endpoint = `/admin/articles/${itemToDelete.id}`;

      const res = await apiClient(endpoint, { method: "DELETE" });

      if (res.success) {
        if (itemToDelete.type === "topic") {
          setTopics((prev) => prev.filter((t) => t.id !== itemToDelete.id));
        } else if (itemToDelete.type === "pattern") {
          setPatterns((prev) => prev.filter((p) => p.id !== itemToDelete.id));
        } else if (itemToDelete.type === "problem") {
          setProblems((prev) => prev.filter((p) => p.id !== itemToDelete.id));
        } else if (itemToDelete.type === "article") {
          setPendingArticles((prev) => prev.filter((a) => a.id !== itemToDelete.id));
          setAllArticles((prev) => prev.filter((a) => a.id !== itemToDelete.id));
        }

        showSuccess(`${itemToDelete.type.toUpperCase()} "${itemToDelete.name}" deleted.`);
        setItemToDelete(null);
        loadAllAdminData();
      } else {
        showError(res.error?.message || `Failed to delete ${itemToDelete.type}`);
      }
    } catch (e: any) {
      showError(e?.message || `Failed to delete ${itemToDelete.type}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: 8. CREATE ARTICLE (ADMIN)
  // -------------------------------------------------------------
  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArticleTitle.trim() || !newArticleContent.trim()) return;
    if (newArticleContent.trim().length < 50) {
      showError("Article content must be at least 50 characters.");
      return;
    }
    setIsSubmittingArticle(true);

    try {
      const res = await apiClient<ArticleItem>("/admin/articles", {
        method: "POST",
        body: JSON.stringify({
          title: newArticleTitle.trim(),
          category: newArticleCategory,
          subtopic: newArticleSubtopic.trim() || undefined,
          excerpt: newArticleExcerpt.trim() || undefined,
          content: newArticleContent.trim(),
          coverImage: newArticleCoverImage.trim() || undefined,
          status: newArticleStatus,
        }),
      });

      if (res.success && res.data) {
        setShowArticleModal(false);
        showSuccess(
          `Article "${newArticleTitle}" created and ${
            newArticleStatus === "PUBLISHED" ? "published live" : "saved as draft"
          }!`
        );
        setNewArticleTitle("");
        setNewArticleExcerpt("");
        setNewArticleContent("");
        setNewArticleSubtopic("");
        setNewArticleCoverImage("");
        setNewArticleStatus("PUBLISHED");
        setIsArticlePreview(false);
        loadAllAdminData();
      } else {
        showError(res.error?.message || "Failed to create article");
      }
    } catch (e: any) {
      showError(e?.message || "Failed to create article");
    } finally {
      setIsSubmittingArticle(false);
    }
  };

  // -------------------------------------------------------------
  // ARTICLE ACTIONS: Approve & Reject
  // -------------------------------------------------------------
  const handleApproveArticle = async (id: string) => {
    try {
      const res = await apiClient(`/admin/articles/${id}/publish`, { method: "POST" });
      if (res.success) {
        setPendingArticles((prev) => prev.filter((a) => a.id !== id));
        showSuccess("Article approved and published to community!");
        loadAllAdminData();
      } else {
        showError(res.error?.message || "Failed to approve article");
      }
    } catch (e: any) {
      showError(e?.message || "Failed to approve article");
    }
  };

  const handleRejectArticle = async (id: string) => {
    try {
      const res = await apiClient(`/admin/articles/${id}/reject`, { method: "POST" });
      if (res.success) {
        setPendingArticles((prev) => prev.filter((a) => a.id !== id));
        showSuccess("Article rejected.");
        loadAllAdminData();
      } else {
        showError(res.error?.message || "Failed to reject article");
      }
    } catch (e: any) {
      showError(e?.message || "Failed to reject article");
    }
  };

  const handleSwitchAccount = async () => {
    if (window.confirm("Are you sure you want to sign out of the Admin panel?")) {
      await logout();
      router.push("/admin/signin");
    }
  };

  // 1. LOADING / VERIFYING STATE
  if (isAdminVerified === null || isAuthContextLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <div className="rounded-2xl border border-border/80 bg-card p-8 max-w-sm w-full text-center space-y-4 shadow-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Shield className="h-7 w-7 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold">Verifying Administrator Privileges</h2>
          <p className="text-xs text-muted-foreground">Checking session authorization against security gateway...</p>
          <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
        </div>
      </div>
    );
  }

  // 2. DENIED / UNAUTHORIZED STATE
  if (isAdminVerified === false) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <div className="rounded-2xl border border-destructive/40 bg-card p-8 max-w-md w-full text-center space-y-5 shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Restricted Administrative Area</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {verificationError || "You must be signed in with an account having verified Administrator role to view this page."}
          </p>
          <div className="space-y-2 pt-2">
            <Link href="/admin/signin" className="block w-full">
              <Button className="w-full text-xs font-semibold h-10 gap-1.5 cursor-pointer">
                <Shield className="h-3.5 w-3.5" />
                <span>Sign In to Admin Portal</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <Suspense fallback={null}>
        <AdminTabSync onTabChange={setActiveTab} />
      </Suspense>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Platform Administration</h1>
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
              Live DB
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage curriculum tracks, patterns, canonical practice problems, and content governance in real time.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={loadAllAdminData}
            disabled={isLoadingData}
            className="gap-1.5 text-xs h-9 cursor-pointer"
            title="Refresh live data"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoadingData && "animate-spin")} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowTopicModal(true)}
            className="gap-1.5 text-xs h-9 cursor-pointer"
          >
            <FolderPlus className="h-3.5 w-3.5 text-primary" />
            <span>+ New Topic</span>
          </Button>

          <Button
            size="sm"
            onClick={() => openAddPatternModal()}
            className="gap-1.5 text-xs h-9 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ New Pattern</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => openAddProblemModal()}
            className="gap-1.5 text-xs h-9 cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5 text-emerald-500" />
            <span>+ New Problem</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowArticleModal(true)}
            className="gap-1.5 text-xs h-9 cursor-pointer border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
          >
            <PenSquare className="h-3.5 w-3.5 text-amber-500" />
            <span>+ New Article</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSwitchAccount}
            className="gap-1 text-xs text-muted-foreground hover:text-destructive h-9 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>

      {/* NOTIFICATION BANNERS */}
      {successBanner && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-400 flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="cursor-pointer">
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      )}

      {errorBanner && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-xs font-semibold text-destructive flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>{errorBanner}</span>
          </div>
          <button onClick={() => setErrorBanner(null)} className="cursor-pointer">
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      )}

      {/* OVERVIEW STATS ROW (FROM LIVE DASHBOARD API) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          onClick={() => handleTabChange("users")}
          className={cn(
            "p-5 flex items-center justify-between cursor-pointer transition-all hover:border-blue-500/50 hover:shadow-md",
            activeTab === "users" && "border-blue-500 ring-1 ring-blue-500/30 bg-blue-500/5"
          )}
          title="Click to view and manage registered users"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Registered Users</p>
              <span className="text-[10px] text-blue-500 font-semibold hover:underline">View →</span>
            </div>
            <p className="text-2xl font-bold font-mono text-foreground">{registeredUsersCount || dashboardTotals.users}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Users className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Patterns</p>
            <p className="text-2xl font-bold font-mono text-foreground">{dashboardTotals.patterns}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Layers className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Problems</p>
            <p className="text-2xl font-bold font-mono text-foreground">{dashboardTotals.problems}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <FileText className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Articles</p>
            <p className="text-2xl font-bold font-mono text-amber-500">{dashboardTotals.pendingArticles}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <MessageSquare className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* ADMIN TABS: Users, Topics, Patterns, Problems, Moderation */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 max-w-2xl h-auto p-1 gap-1">
          <TabsTrigger value="users" className="gap-1.5 py-2 cursor-pointer">
            <Users className="h-3.5 w-3.5 text-blue-400" />
            <span>Users ({registeredUsersCount || dashboardTotals.users})</span>
          </TabsTrigger>
          <TabsTrigger value="patterns" className="py-2 cursor-pointer">Patterns ({patterns.length})</TabsTrigger>
          <TabsTrigger value="topics" className="py-2 cursor-pointer">Topics ({topics.length})</TabsTrigger>
          <TabsTrigger value="problems" className="py-2 cursor-pointer">Problems ({problems.length})</TabsTrigger>
          <TabsTrigger value="moderation" className="py-2 cursor-pointer">Articles ({allArticles.length || pendingArticles.length})</TabsTrigger>
        </TabsList>

        {/* ============================================================== */}
        {/* TAB 0: REGISTERED USERS MANAGEMENT */}
        {/* ============================================================== */}
        <TabsContent value="users" className="pt-4 space-y-4">
          <AdminUsersTab
            currentAdminId={verifiedAdminUser?.id || user?.id}
            onShowSuccess={showSuccess}
            onShowError={showError}
            onUserCountChange={(count) => {
              setRegisteredUsersCount(count);
              setDashboardTotals((prev) => ({ ...prev, users: count }));
            }}
          />
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 1: TOPICS INVENTORY */}
        {/* ============================================================== */}
        <TabsContent value="topics" className="pt-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Curriculum Topics ({topics.length})</h2>
              <p className="text-xs text-muted-foreground">
                High-level tracks (e.g. Array Patterns, Sliding Window, Dynamic Programming).
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowTopicModal(true)}
              className="gap-1.5 text-xs h-9 cursor-pointer"
            >
              <FolderPlus className="h-4 w-4" />
              <span>Create New Topic</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.length > 0 ? (
              topics.map((t) => (
                <Card key={t.id} className="p-5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        Order #{t.order}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-xs">
                          {t._count?.patterns ?? 0} Patterns
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            t.published ? "text-emerald-500 border-emerald-500/30" : "text-amber-500 border-amber-500/30"
                          )}
                        >
                          {t.published ? "PUBLISHED" : "DRAFT"}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">{t.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {t.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-mono truncate max-w-[120px]">{t.slug}</span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingTopic(t)}
                        className="h-7 px-2 text-xs gap-1 cursor-pointer"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setItemToDelete({ type: "topic", id: t.id, name: t.name })}
                        className="h-7 px-2 text-xs gap-1 text-destructive hover:bg-destructive/10 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="col-span-full p-8 text-center text-muted-foreground text-sm border-dashed">
                No topics in the database yet. Click &quot;Create New Topic&quot; to add your first track.
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 2: PATTERNS INVENTORY (TOPIC ACCORDION & FILTERED LIST) */}
        {/* ============================================================== */}
        <TabsContent value="patterns" className="pt-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Pattern Inventory ({patterns.length})</h2>
              <p className="text-xs text-muted-foreground">
                All algorithmic problem-solving patterns organized by curriculum topics.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* View Mode Toggle */}
              <div className="flex items-center border border-border rounded-lg p-0.5 bg-muted/20 text-xs">
                <button
                  type="button"
                  onClick={() => setPatternViewMode("accordion")}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer",
                    patternViewMode === "accordion"
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Topic Accordion View"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Topic Boxes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPatternViewMode("flat")}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer",
                    patternViewMode === "flat"
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Flat List View"
                >
                  <List className="h-3.5 w-3.5" />
                  <span>All List</span>
                </button>
              </div>

              <Button
                size="sm"
                onClick={() => openAddPatternModal()}
                className="gap-1.5 text-xs h-9 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add New Pattern</span>
              </Button>
            </div>
          </div>

          {/* Search & Topic Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-3 rounded-xl border border-border">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search patterns by name or number..."
                  value={patternSearchQuery}
                  onChange={(e) => setPatternSearchQuery(e.target.value)}
                  className="pl-8 text-xs h-8 bg-background/60"
                />
                {patternSearchQuery && (
                  <button
                    onClick={() => setPatternSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-muted-foreground hidden sm:inline" />
                <select
                  value={patternTopicFilter}
                  onChange={(e) => setPatternTopicFilter(e.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground cursor-pointer"
                >
                  <option value="ALL">All Topics ({topics.length})</option>
                  {topics.map((t) => {
                    const count = patterns.filter((p) => p.topicId === t.id || p.topic?.id === t.id).length;
                    return (
                      <option key={t.id} value={t.id}>
                        {t.name} ({count} patterns)
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="text-xs text-muted-foreground font-mono self-center">
              Showing{" "}
              {
                patterns
                  .filter((p) => (patternTopicFilter === "ALL" ? true : p.topicId === patternTopicFilter || p.topic?.id === patternTopicFilter))
                  .filter((p) =>
                    patternSearchQuery
                      ? p.name.toLowerCase().includes(patternSearchQuery.toLowerCase()) ||
                        `#${p.number}`.includes(patternSearchQuery)
                      : true
                  ).length
              }{" "}
              patterns
            </div>
          </div>

          {/* ============================================================== */}
          {/* VIEW MODE 1: TOPIC ACCORDION BOXES (MATCHES SCREENSHOT) */}
          {/* ============================================================== */}
          {patternViewMode === "accordion" ? (
            <div className="space-y-4">
              {topics
                .filter((t) => (patternTopicFilter === "ALL" ? true : t.id === patternTopicFilter))
                .map((topic) => {
                  const topicPatterns = patterns
                    .filter((p) => p.topicId === topic.id || p.topic?.id === topic.id)
                    .filter((p) =>
                      patternSearchQuery
                        ? p.name.toLowerCase().includes(patternSearchQuery.toLowerCase()) ||
                          `#${p.number}`.includes(patternSearchQuery)
                        : true
                    );
                  const isExpanded = Boolean(expandedAdminTopics[topic.id] || patternSearchQuery);
                  const Icon = getTopicIconComponent(topic.icon, topic.slug);
                  const totalTopicPatterns = patterns.filter((p) => p.topicId === topic.id || p.topic?.id === topic.id).length;

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
                      {/* Topic Header Card (Exact Look of the Screen Box) */}
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
                        <div
                          onClick={() => toggleAdminTopic(topic.id)}
                          className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                        >
                          <div
                            className={cn(
                              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold transition-colors border",
                              isExpanded
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-muted text-muted-foreground border-border"
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>

                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                                {topic.name}
                              </h3>
                              <Badge variant={isExpanded ? "default" : "secondary"} className="text-xs font-semibold">
                                {totalTopicPatterns} Patterns
                              </Badge>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px]",
                                  topic.published ? "text-emerald-500 border-emerald-500/30" : "text-amber-500 border-amber-500/30"
                                )}
                              >
                                {topic.published ? "PUBLISHED" : "DRAFT"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                              {topic.description || "Core algorithmic pattern curriculum track."}
                            </p>
                          </div>
                        </div>

                        {/* Actions on Right */}
                        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t sm:border-t-0 border-border/50 pt-2.5 sm:pt-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAddPatternModal(topic.id, topic.name)}
                            className="h-8 px-2.5 text-xs gap-1 cursor-pointer hover:border-primary/50 hover:bg-primary/5"
                            title={`Add pattern to ${topic.name}`}
                          >
                            <Plus className="h-3.5 w-3.5 text-primary" />
                            <span className="hidden md:inline">+ Pattern</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAddProblemModal(topic.id)}
                            className="h-8 px-2.5 text-xs gap-1 cursor-pointer text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                            title={`Add problem to ${topic.name}`}
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span className="hidden md:inline">+ Problem</span>
                          </Button>

                          <button
                            type="button"
                            onClick={() => toggleAdminTopic(topic.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                          >
                            <span>{isExpanded ? "Hide Patterns" : "View Patterns"}</span>
                            <div
                              className={cn(
                                "flex h-5 w-5 items-center justify-center rounded transition-transform duration-200",
                                isExpanded ? "rotate-180 text-primary" : ""
                              )}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* EXPANDED CONTENT: PATTERNS LIST UNDER THIS TOPIC */}
                      {isExpanded && (
                        <div className="border-t border-border bg-muted/10 p-3 sm:p-4 space-y-2.5 animate-in slide-in-from-top-1 duration-150">
                          <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
                            <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-primary" />
                              <span>Patterns in &quot;{topic.name}&quot; ({topicPatterns.length})</span>
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openAddPatternModal(topic.id, topic.name)}
                              className="text-[11px] h-6 px-2 text-primary hover:underline cursor-pointer"
                            >
                              + Add another pattern to this topic
                            </Button>
                          </div>

                          {topicPatterns.length > 0 ? (
                            <div className="divide-y divide-border/60 rounded-xl border border-border/70 bg-card overflow-hidden">
                              {topicPatterns.map((pat) => (
                                <div
                                  key={pat.id}
                                  className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold font-mono shrink-0 shadow-xs">
                                      #{pat.number}
                                    </span>
                                    <div className="space-y-0.5 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-xs sm:text-sm text-foreground truncate">
                                          {pat.name}
                                        </span>
                                        <Badge
                                          variant={pat.difficulty === "EASY" ? "easy" : "medium"}
                                          className="text-[10px] px-1.5 py-0"
                                        >
                                          {pat.difficulty}
                                        </Badge>
                                        {pat.timeComplexity && (
                                          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                                            {pat.timeComplexity}
                                          </Badge>
                                        )}
                                        <span className="text-[11px] text-amber-400 font-mono">
                                          {"★".repeat(pat.importance || 5)}
                                        </span>
                                      </div>
                                      <span className="text-[11px] text-muted-foreground block truncate">
                                        {pat.shortDescription || pat.intuition || "No summary provided"} • {pat._count?.problems ?? 0} Problems Attached
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openAddProblemModal(topic.id, pat.id)}
                                      className="text-xs h-7 px-2 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
                                      title="Add practice problem directly to this pattern"
                                    >
                                      <Plus className="h-3 w-3 mr-0.5" />
                                      <span>Add Problem</span>
                                    </Button>
                                    <Link href={`/patterns/${pat.slug}`} target="_blank">
                                      <Button size="sm" variant="ghost" className="text-xs h-7 px-2">
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        <span>Preview</span>
                                      </Button>
                                    </Link>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openEditPattern(pat)}
                                      className="text-xs h-7 px-2 gap-1 cursor-pointer"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                      <span>Edit</span>
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setItemToDelete({ type: "pattern", id: pat.id, name: pat.name })}
                                      className="text-xs h-7 px-2 gap-1 text-destructive hover:bg-destructive/10 cursor-pointer"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      <span>Delete</span>
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-card/50 space-y-2">
                              <p>No patterns created under &quot;{topic.name}&quot; yet.</p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openAddPatternModal(topic.id, topic.name)}
                                className="text-xs gap-1.5 h-8"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Create First Pattern in {topic.name}</span>
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* Unassigned Patterns (if any) */}
              {patterns.filter((p) => !p.topicId && !p.topic?.id).length > 0 && (
                <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                      Unassigned Patterns ({patterns.filter((p) => !p.topicId && !p.topic?.id).length})
                    </span>
                  </div>
                  <div className="divide-y divide-border/60 rounded-xl border border-border bg-card overflow-hidden">
                    {patterns
                      .filter((p) => !p.topicId && !p.topic?.id)
                      .map((pat) => (
                        <div
                          key={pat.id}
                          className="p-3 flex items-center justify-between gap-3 hover:bg-muted/20"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-xs font-bold">#{pat.number}</span>
                            <span className="font-semibold text-xs text-foreground">{pat.name}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditPattern(pat)}
                            className="text-xs h-7 px-2 gap-1 cursor-pointer"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>Assign Topic</span>
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* VIEW MODE 2: FLAT LIST */
            <Card>
              <div className="divide-y divide-border/60">
                {patterns
                  .filter((p) => (patternTopicFilter === "ALL" ? true : p.topicId === patternTopicFilter || p.topic?.id === patternTopicFilter))
                  .filter((p) =>
                    patternSearchQuery
                      ? p.name.toLowerCase().includes(patternSearchQuery.toLowerCase()) ||
                        `#${p.number}`.includes(patternSearchQuery)
                      : true
                  )
                  .map((pat) => (
                    <div
                      key={pat.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold font-mono shrink-0">
                          #{pat.number}
                        </span>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm truncate text-foreground">{pat.name}</span>
                            <Badge variant={pat.difficulty === "EASY" ? "easy" : "medium"}>
                              {pat.difficulty}
                            </Badge>
                            {pat.timeComplexity && (
                              <Badge variant="outline" className="text-[11px] font-mono">
                                {pat.timeComplexity}
                              </Badge>
                            )}
                            <span className="text-xs text-amber-400 font-mono">
                              {"★".repeat(pat.importance || 5)}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground block truncate">
                            Track: {pat.topic?.name || "Unassigned"} • {pat._count?.problems ?? 0} Problems Attached
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAddProblemModal(pat.topicId || pat.topic?.id, pat.id)}
                          className="text-xs h-7 px-2.5 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
                        >
                          <Plus className="h-3 w-3 mr-0.5" />
                          <span>Add Problem</span>
                        </Button>
                        <Link href={`/patterns/${pat.slug}`} target="_blank">
                          <Button size="sm" variant="ghost" className="text-xs h-7 px-2.5">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            <span>Preview</span>
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditPattern(pat)}
                          className="text-xs h-7 px-2.5 gap-1 cursor-pointer"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setItemToDelete({ type: "pattern", id: pat.id, name: pat.name })}
                          className="text-xs h-7 px-2.5 gap-1 text-destructive hover:bg-destructive/10 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 3: PROBLEMS INVENTORY */}
        {/* ============================================================== */}
        <TabsContent value="problems" className="pt-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Practice Problems Inventory ({problems.length})</h2>
              <p className="text-xs text-muted-foreground">
                Canonical LeetCode and platform problems attached to curriculum patterns.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowProblemModal(true)}
              className="gap-1.5 text-xs h-9 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Problem</span>
            </Button>
          </div>

          <Card>
            <div className="divide-y divide-border/60">
              {problems.length > 0 ? (
                problems.map((prob) => {
                  const linkedPatternName = prob.patterns?.[0]?.pattern?.name;
                  return (
                    <div
                      key={prob.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">{prob.title}</span>
                          <Badge variant={prob.difficulty === "EASY" ? "easy" : "medium"}>
                            {prob.difficulty}
                          </Badge>
                          <span className="text-xs font-mono text-muted-foreground">
                            {prob.platform || "LeetCode"}
                          </span>
                        </div>
                        {linkedPatternName && (
                          <p className="text-xs text-muted-foreground">
                            Pattern: <strong className="text-foreground">{linkedPatternName}</strong>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={prob.solveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline h-7 px-2"
                        >
                          <span>Solve URL</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingProblem(prob)}
                          className="text-xs h-7 px-2.5 gap-1 cursor-pointer"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setItemToDelete({ type: "problem", id: prob.id, name: prob.title })}
                          className="text-xs h-7 px-2.5 gap-1 text-destructive hover:bg-destructive/10 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No problems registered in the database.
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 4: ARTICLES MANAGEMENT & MODERATION */}
        {/* ============================================================== */}
        <TabsContent value="moderation" className="pt-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Platform Articles & Guides</h2>
                <Badge variant="secondary" className="text-xs">
                  {allArticles.length} Total
                </Badge>
                {pendingArticles.length > 0 && (
                  <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/30 bg-amber-500/10">
                    {pendingArticles.length} Pending Review
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Author and publish technical guides directly or review community member submissions.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => setShowArticleModal(true)}
              className="gap-1.5 text-xs h-9 cursor-pointer bg-amber-600 hover:bg-amber-700 text-white self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>+ Create Article</span>
            </Button>
          </div>

          {/* Sub-Filters & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-3 rounded-xl border border-border">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setArticleFilterStatus("ALL")}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  articleFilterStatus === "ALL"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All ({allArticles.length})
              </button>
              <button
                type="button"
                onClick={() => setArticleFilterStatus("SUBMITTED")}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  articleFilterStatus === "SUBMITTED"
                    ? "bg-amber-500 text-white font-semibold"
                    : "text-amber-500 hover:bg-amber-500/10"
                )}
              >
                Pending ({pendingArticles.length})
              </button>
              <button
                type="button"
                onClick={() => setArticleFilterStatus("PUBLISHED")}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  articleFilterStatus === "PUBLISHED"
                    ? "bg-emerald-600 text-white font-semibold"
                    : "text-emerald-500 hover:bg-emerald-500/10"
                )}
              >
                Published ({allArticles.filter((a) => a.status === "PUBLISHED").length})
              </button>
              <button
                type="button"
                onClick={() => setArticleFilterStatus("DRAFT")}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  articleFilterStatus === "DRAFT"
                    ? "bg-muted text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Drafts ({allArticles.filter((a) => a.status === "DRAFT").length})
              </button>
            </div>

            <div className="relative sm:w-64">
              <Input
                placeholder="Search articles by title or author..."
                value={articleSearchQuery}
                onChange={(e) => setArticleSearchQuery(e.target.value)}
                className="text-xs h-8 bg-background/50"
              />
              {articleSearchQuery && (
                <button
                  onClick={() => setArticleSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Articles List */}
          <div className="space-y-3">
            {allArticles
              .filter((art) => {
                const matchesFilter =
                  articleFilterStatus === "ALL" || art.status === articleFilterStatus;
                const q = articleSearchQuery.toLowerCase().trim();
                const matchesSearch =
                  !q ||
                  art.title.toLowerCase().includes(q) ||
                  (art.author?.name && art.author.name.toLowerCase().includes(q)) ||
                  art.category.toLowerCase().includes(q);
                return matchesFilter && matchesSearch;
              })
              .map((art) => (
                <Card key={art.id} className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs font-mono">
                          {art.category}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-semibold",
                            art.status === "PUBLISHED" && "text-emerald-500 border-emerald-500/30 bg-emerald-500/10",
                            art.status === "SUBMITTED" && "text-amber-500 border-amber-500/30 bg-amber-500/10",
                            art.status === "DRAFT" && "text-muted-foreground border-border bg-muted/40",
                            art.status === "REJECTED" && "text-destructive border-destructive/30 bg-destructive/10"
                          )}
                        >
                          {art.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          By {art.author?.name || "Admin"} • {new Date(art.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-foreground">{art.title}</h3>
                      {art.excerpt && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {art.excerpt}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/articles/${art.slug}`} target="_blank">
                        <Button size="sm" variant="ghost" className="text-xs h-8 px-2.5 gap-1">
                          <ExternalLink className="h-3 w-3" />
                          <span>View</span>
                        </Button>
                      </Link>

                      {art.status === "SUBMITTED" && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApproveArticle(art.id)}
                            className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer h-8"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectArticle(art.id)}
                            className="gap-1 text-xs text-amber-500 hover:bg-amber-500/10 cursor-pointer h-8"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </Button>
                        </>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setItemToDelete({ type: "article", id: art.id, name: art.title })}
                        className="gap-1 text-xs text-destructive hover:bg-destructive/10 cursor-pointer h-8 px-2"
                        title="Delete article"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

            {allArticles.filter((art) => {
              const matchesFilter =
                articleFilterStatus === "ALL" || art.status === articleFilterStatus;
              const q = articleSearchQuery.toLowerCase().trim();
              return (
                matchesFilter &&
                (!q ||
                  art.title.toLowerCase().includes(q) ||
                  (art.author?.name && art.author.name.toLowerCase().includes(q)))
              );
            }).length === 0 && (
              <Card className="p-12 text-center text-sm text-muted-foreground border-dashed space-y-3">
                <BookOpen className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                <p className="font-semibold text-foreground">No articles found in this view</p>
                <p className="text-xs">Click &quot;+ Create Article&quot; to author a new platform guide.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowArticleModal(true)}
                  className="text-xs gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Your First Article</span>
                </Button>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ========================================================================= */}
      {/* 1. MODAL: CREATE TOPIC */}
      {/* ========================================================================= */}
      {showTopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 font-bold">
                  <FolderPlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Create Curriculum Track / Topic</h2>
                  <p className="text-xs text-muted-foreground">Adds a top-level subject grouping to the database</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTopicModal(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTopic} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Topic Name</label>
                <Input
                  placeholder="e.g. Dynamic Programming"
                  required
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Description</label>
                <Textarea
                  placeholder="Techniques for subproblem memoization and state transitions."
                  rows={3}
                  value={newTopicDescription}
                  onChange={(e) => setNewTopicDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Track Icon</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground"
                    value={newTopicIcon}
                    onChange={(e) => setNewTopicIcon(e.target.value)}
                  >
                    {TOPIC_ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Curriculum Order</label>
                  <Input
                    type="number"
                    value={newTopicOrder}
                    onChange={(e) => setNewTopicOrder(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="topicPub"
                  checked={newTopicPublished}
                  onChange={(e) => setNewTopicPublished(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary"
                />
                <label htmlFor="topicPub" className="text-xs text-muted-foreground select-none cursor-pointer">
                  Publish immediately (visible to all students)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTopicModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmittingTopic} className="text-xs gap-1.5">
                  {isSubmittingTopic ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FolderPlus className="h-3.5 w-3.5" />}
                  <span>Save Topic</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MODAL: EDIT TOPIC */}
      {/* ========================================================================= */}
      {editingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 font-bold">
                  <Edit2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Edit Topic: {editingTopic.name}</h2>
                  <p className="text-xs text-muted-foreground">Modify topic parameters and visibility</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTopic(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateTopic} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Topic Name</label>
                <Input
                  required
                  value={editingTopic.name}
                  onChange={(e) => setEditingTopic({ ...editingTopic, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Description</label>
                <Textarea
                  rows={3}
                  value={editingTopic.description || ""}
                  onChange={(e) => setEditingTopic({ ...editingTopic, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Track Icon</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground"
                    value={editingTopic.icon || "Target"}
                    onChange={(e) => setEditingTopic({ ...editingTopic, icon: e.target.value })}
                  >
                    {TOPIC_ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Curriculum Order</label>
                  <Input
                    type="number"
                    value={editingTopic.order}
                    onChange={(e) => setEditingTopic({ ...editingTopic, order: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editTopicPub"
                  checked={editingTopic.published}
                  onChange={(e) => setEditingTopic({ ...editingTopic, published: e.target.checked })}
                  className="rounded border-input text-primary focus:ring-primary"
                />
                <label htmlFor="editTopicPub" className="text-xs text-muted-foreground select-none cursor-pointer">
                  Published (visible to students)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingTopic(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmittingTopic} className="text-xs gap-1.5">
                  {isSubmittingTopic ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Edit2 className="h-3.5 w-3.5" />}
                  <span>Update Topic</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODAL: CREATE PATTERN */}
      {/* ========================================================================= */}
      {showPatternModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Create New Pattern</h2>
                  <p className="text-xs text-muted-foreground">Add an algorithmic pattern with full mental models and code templates</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPatternModal(false);
                  setPatternModalSuccess(null);
                }}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* In-Modal Success Banner */}
            {patternModalSuccess && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-400 flex items-center justify-between animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{patternModalSuccess}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPatternModalSuccess(null)}
                  className="cursor-pointer"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            )}

            <form onSubmit={handleCreatePattern} className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
              <Tabs value={patternModalTab} onValueChange={(v) => setPatternModalTab(v as any)} className="w-full">
                <TabsList className="grid grid-cols-3 w-full mb-4">
                  <TabsTrigger value="meta">1. Meta & Topic</TabsTrigger>
                  <TabsTrigger value="intuition">2. Intuition & Rules</TabsTrigger>
                  <TabsTrigger value="code">3. Code Templates</TabsTrigger>
                </TabsList>

                {/* TAB 1: Meta */}
                <TabsContent value="meta" className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 items-start">
                    <TopicFillInput
                      topics={topics}
                      selectedTopicId={newPatternTopicId}
                      typedTopicName={newPatternTopicName}
                      onChange={(topicId, topicName) => {
                        setNewPatternTopicId(topicId);
                        setNewPatternTopicName(topicName);
                      }}
                      onTopicCreated={(newTopic) => {
                        setTopics((prev) => [...prev, newTopic]);
                        setNewPatternTopicId(newTopic.id);
                        setNewPatternTopicName(newTopic.name);
                        loadAllAdminData();
                      }}
                      onSuccess={showSuccess}
                      onError={showError}
                      required
                    />

                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground">Pattern Number (#)</label>
                      <Input
                        type="number"
                        value={newPatternNumber}
                        onChange={(e) => setNewPatternNumber(Number(e.target.value))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Pattern Name</label>
                    <Input
                      placeholder="e.g. Sliding Window Maximum"
                      required
                      value={newPatternName}
                      onChange={(e) => setNewPatternName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground">Difficulty</label>
                      <select
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground"
                        value={newPatternDifficulty}
                        onChange={(e) => setNewPatternDifficulty(e.target.value as any)}
                      >
                        <option value="EASY">EASY</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HARD">HARD</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground">Importance Rating (1-5)</label>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        value={newPatternImportance}
                        onChange={(e) => setNewPatternImportance(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground">Time Complexity</label>
                      <Input
                        value={newPatternTime}
                        onChange={(e) => setNewPatternTime(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground">Space Complexity</label>
                      <Input
                        value={newPatternSpace}
                        onChange={(e) => setNewPatternSpace(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Short Summary</label>
                    <Textarea
                      placeholder="One-line breakdown of when to apply this technique."
                      rows={2}
                      value={newPatternShortDesc}
                      onChange={(e) => setNewPatternShortDesc(e.target.value)}
                    />
                  </div>
                </TabsContent>

                {/* TAB 2: Intuition & Rules */}
                <TabsContent value="intuition" className="space-y-4">
                  <div className="rounded-xl border border-border bg-muted/10 p-3 space-y-3">
                    <h3 className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                      <span>1. Mental Model & Core Intuition</span>
                    </h3>
                    <FormattedTextarea
                      value={newPatternIntuition}
                      onChange={setNewPatternIntuition}
                      placeholder="Explain the underlying visual, mathematical, or structural concept... Use Bold & Underline for core keywords."
                      rows={3}
                    />
                  </div>

                  <div className="rounded-xl border border-border bg-muted/10 p-3 space-y-3">
                    <h3 className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                      <span>2. Identification Signals</span>
                    </h3>
                    <FormattedTextarea
                      value={newPatternSignals}
                      onChange={setNewPatternSignals}
                      placeholder="List key keywords or pattern indicators in problem descriptions (e.g. - Array is sorted\n- Contiguous subarray sum)."
                      rows={3}
                    />
                  </div>

                  <div className="rounded-xl border border-border bg-muted/10 p-3 space-y-3">
                    <h3 className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                      <span>3. Execution Recipe</span>
                    </h3>
                    <FormattedTextarea
                      value={newPatternRecipe}
                      onChange={setNewPatternRecipe}
                      placeholder="Step-by-step procedure to execute this pattern (e.g. 1. Maintain left pointer 2. Expand right pointer)."
                      rows={3}
                    />
                  </div>

                  <div className="rounded-xl border border-border bg-muted/10 p-3 space-y-3">
                    <h3 className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                      <span>4. Interview Identification Rule</span>
                    </h3>
                    <FormattedTextarea
                      value={newPatternInterviewRule}
                      onChange={setNewPatternInterviewRule}
                      placeholder="e.g. Sorted array + contiguous subarray constraints -> Apply Sliding Window or Two Pointers."
                      rows={2}
                    />
                  </div>

                  <div className="rounded-xl border border-border bg-muted/10 p-3 space-y-2">
                    <h3 className="text-xs font-bold text-amber-500 flex items-center gap-1.5 uppercase tracking-wider">
                      <span>5. Pseudocode Blueprint</span>
                    </h3>
                    <Textarea
                      rows={5}
                      className="font-mono text-[11px] bg-background"
                      value={newPatternPseudocode}
                      onChange={(e) => setNewPatternPseudocode(e.target.value)}
                    />
                  </div>

                  {/* 6. Benchmark Problems Selection */}
                  <div className="rounded-xl border border-border bg-muted/10 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                        Benchmark Problems ({newPatternSelectedProblems.length} Selected)
                      </h3>
                      <span className="text-[11px] text-muted-foreground">Select problems to link to this pattern</span>
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-border rounded-lg bg-background divide-y divide-border/60">
                      {problems.length > 0 ? (
                        problems.map((prob) => {
                          const isChecked = newPatternSelectedProblems.includes(prob.id);
                          return (
                            <label
                              key={prob.id}
                              className="flex items-center justify-between p-2.5 hover:bg-muted/30 cursor-pointer select-none text-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setNewPatternSelectedProblems((prev) => [...prev, prob.id]);
                                    } else {
                                      setNewPatternSelectedProblems((prev) => prev.filter((id) => id !== prob.id));
                                    }
                                  }}
                                  className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                                />
                                <span className="font-semibold text-foreground truncate">{prob.title}</span>
                                <Badge variant={prob.difficulty === "EASY" ? "easy" : "medium"} className="text-[10px]">
                                  {prob.difficulty}
                                </Badge>
                              </div>
                              <span className="text-[11px] font-mono text-muted-foreground shrink-0">{prob.platform || "LeetCode"}</span>
                            </label>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-xs text-muted-foreground">
                          No problems available in database. Create problems in Problems tab first to link here.
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 3: Code Templates */}
                <TabsContent value="code" className="space-y-3">
                  <div className="flex items-center gap-2 pb-2">
                    {(["python", "cpp", "java", "javascript"] as const).map((lang) => (
                      <Button
                        key={lang}
                        type="button"
                        size="sm"
                        variant={templateLangTab === lang ? "default" : "outline"}
                        onClick={() => setTemplateLangTab(lang)}
                        className="text-xs h-7 uppercase"
                      >
                        {lang}
                      </Button>
                    ))}
                  </div>

                  {templateLangTab === "python" && (
                    <Textarea
                      rows={9}
                      className="font-mono text-[11px]"
                      value={newPatternPy}
                      onChange={(e) => setNewPatternPy(e.target.value)}
                    />
                  )}
                  {templateLangTab === "cpp" && (
                    <Textarea
                      rows={9}
                      className="font-mono text-[11px]"
                      value={newPatternCpp}
                      onChange={(e) => setNewPatternCpp(e.target.value)}
                    />
                  )}
                  {templateLangTab === "java" && (
                    <Textarea
                      rows={9}
                      className="font-mono text-[11px]"
                      value={newPatternJava}
                      onChange={(e) => setNewPatternJava(e.target.value)}
                    />
                  )}
                  {templateLangTab === "javascript" && (
                    <Textarea
                      rows={9}
                      className="font-mono text-[11px]"
                      value={newPatternJs}
                      onChange={(e) => setNewPatternJs(e.target.value)}
                    />
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowPatternModal(false);
                    setPatternModalSuccess(null);
                  }}
                  className="text-xs"
                >
                  Close
                </Button>
                <Button type="submit" size="sm" disabled={isSubmittingPattern} className="text-xs gap-1.5">
                  {isSubmittingPattern ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  <span>Save Pattern</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: EDIT PATTERN */}
      {/* ========================================================================= */}
      {editingPattern && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                  <Edit2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Edit Pattern: {editingPattern.name}</h2>
                  <p className="text-xs text-muted-foreground">Modify pattern formulas, intuition, and templates</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPattern(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePattern} className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
              <Tabs value={patternModalTab} onValueChange={(v) => setPatternModalTab(v as any)} className="w-full">
                <TabsList className="grid grid-cols-3 w-full mb-4">
                  <TabsTrigger value="meta">1. Meta & Topic</TabsTrigger>
                  <TabsTrigger value="intuition">2. Intuition & Rules</TabsTrigger>
                  <TabsTrigger value="code">3. Code Templates</TabsTrigger>
                </TabsList>

                {/* TAB 1: Meta */}
                <TabsContent value="meta" className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 items-start">
                    <TopicFillInput
                      topics={topics}
                      selectedTopicId={editingPattern.topicId}
                      typedTopicName={editingPatternTopicName}
                      onChange={(topicId, topicName) => {
                        setEditingPattern({ ...editingPattern, topicId });
                        setEditingPatternTopicName(topicName);
                      }}
                      onTopicCreated={(newTopic) => {
                        setTopics((prev) => [...prev, newTopic]);
                        setEditingPattern({ ...editingPattern, topicId: newTopic.id });
                        setEditingPatternTopicName(newTopic.name);
                        loadAllAdminData();
                      }}
                      onSuccess={showSuccess}
                      onError={showError}
                      required
                    />

                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground">Number (#)</label>
                      <Input
                        type="number"
                        value={editingPattern.number}
                        onChange={(e) => setEditingPattern({ ...editingPattern, number: Number(e.target.value) })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Pattern Name</label>
                    <Input
                      required
                      value={editingPattern.name}
                      onChange={(e) => setEditingPattern({ ...editingPattern, name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground">Difficulty</label>
                      <select
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground"
                        value={editingPattern.difficulty}
                        onChange={(e) => setEditingPattern({ ...editingPattern, difficulty: e.target.value as any })}
                      >
                        <option value="EASY">EASY</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HARD">HARD</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground">Importance (1-5)</label>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        value={editingPattern.importance}
                        onChange={(e) => setEditingPattern({ ...editingPattern, importance: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground">Time Complexity</label>
                      <Input
                        value={editingPattern.timeComplexity || ""}
                        onChange={(e) => setEditingPattern({ ...editingPattern, timeComplexity: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground">Space Complexity</label>
                      <Input
                        value={editingPattern.spaceComplexity || ""}
                        onChange={(e) => setEditingPattern({ ...editingPattern, spaceComplexity: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Short Summary</label>
                    <Textarea
                      rows={2}
                      value={editingPattern.shortDescription || ""}
                      onChange={(e) => setEditingPattern({ ...editingPattern, shortDescription: e.target.value })}
                    />
                  </div>
                </TabsContent>

                {/* TAB 2: Intuition & Rules */}
                <TabsContent value="intuition" className="space-y-4">
                  <div className="rounded-xl border border-border bg-muted/10 p-3 space-y-3">
                    <h3 className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                      <span>1. Mental Model & Core Intuition</span>
                    </h3>
                    <FormattedTextarea
                      value={editingPattern.intuition || ""}
                      onChange={(val) => setEditingPattern({ ...editingPattern, intuition: val })}
                      placeholder="Explain the underlying visual, mathematical, or structural concept... Use Bold & Underline for core keywords."
                      rows={3}
                    />
                  </div>

                  <div className="rounded-xl border border-border bg-muted/10 p-3 space-y-3">
                    <h3 className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                      <span>2. Identification Signals</span>
                    </h3>
                    <FormattedTextarea
                      value={editingPattern.identificationSignals || ""}
                      onChange={(val) => setEditingPattern({ ...editingPattern, identificationSignals: val })}
                      placeholder="List key keywords or pattern indicators in problem descriptions."
                      rows={3}
                    />
                  </div>

                  <div className="rounded-xl border border-border bg-muted/10 p-3 space-y-3">
                    <h3 className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                      <span>3. Execution Recipe</span>
                    </h3>
                    <FormattedTextarea
                      value={editingPattern.executionRecipe || ""}
                      onChange={(val) => setEditingPattern({ ...editingPattern, executionRecipe: val })}
                      placeholder="Step-by-step procedure to execute this pattern."
                      rows={3}
                    />
                  </div>

                  <div className="rounded-xl border border-border bg-muted/10 p-3 space-y-3">
                    <h3 className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                      <span>4. Interview Identification Rule</span>
                    </h3>
                    <FormattedTextarea
                      value={editingPattern.interviewRule || ""}
                      onChange={(val) => setEditingPattern({ ...editingPattern, interviewRule: val })}
                      placeholder="e.g. Sorted array + subarray constraints -> Two Pointer or Sliding Window."
                      rows={2}
                    />
                  </div>

                  <div className="rounded-xl border border-border bg-muted/10 p-3 space-y-2">
                    <h3 className="text-xs font-bold text-amber-500 flex items-center gap-1.5 uppercase tracking-wider">
                      <span>5. Pseudocode Blueprint</span>
                    </h3>
                    <Textarea
                      rows={5}
                      className="font-mono text-[11px] bg-background"
                      value={editingPattern.pseudocode || ""}
                      onChange={(e) => setEditingPattern({ ...editingPattern, pseudocode: e.target.value })}
                    />
                  </div>

                  {/* 6. Benchmark Problems Selection */}
                  <div className="rounded-xl border border-border bg-muted/10 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                        Benchmark Problems ({editingPatternSelectedProblems.length} Selected)
                      </h3>
                      <span className="text-[11px] text-muted-foreground">Select problems to link to this pattern</span>
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-border rounded-lg bg-background divide-y divide-border/60">
                      {problems.length > 0 ? (
                        problems.map((prob) => {
                          const isChecked = editingPatternSelectedProblems.includes(prob.id);
                          return (
                            <label
                              key={prob.id}
                              className="flex items-center justify-between p-2.5 hover:bg-muted/30 cursor-pointer select-none text-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEditingPatternSelectedProblems((prev) => [...prev, prob.id]);
                                    } else {
                                      setEditingPatternSelectedProblems((prev) => prev.filter((id) => id !== prob.id));
                                    }
                                  }}
                                  className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                                />
                                <span className="font-semibold text-foreground truncate">{prob.title}</span>
                                <Badge variant={prob.difficulty === "EASY" ? "easy" : "medium"} className="text-[10px]">
                                  {prob.difficulty}
                                </Badge>
                              </div>
                              <span className="text-[11px] font-mono text-muted-foreground shrink-0">{prob.platform || "LeetCode"}</span>
                            </label>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-xs text-muted-foreground">
                          No problems available in database. Create problems in Problems tab first.
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 3: Code Templates */}
                <TabsContent value="code" className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <div className="flex items-center gap-1.5">
                      <Code2 className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground">Language Code Templates</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {(["python", "cpp", "java", "javascript"] as const).map((lang) => (
                        <Button
                          key={lang}
                          type="button"
                          size="sm"
                          variant={templateLangTab === lang ? "default" : "outline"}
                          onClick={() => setTemplateLangTab(lang)}
                          className="text-xs h-7 uppercase font-mono px-3"
                        >
                          {lang}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                      <span>{templateLangTab.toUpperCase()} Implementation Template</span>
                      <span className="text-[11px] text-muted-foreground/60">Monospace Editor</span>
                    </div>
                    {templateLangTab === "python" && (
                      <Textarea
                        rows={12}
                        className="font-mono text-xs bg-background text-foreground leading-relaxed resize-y border-border"
                        placeholder="# Python solution template..."
                        value={editingPattern.pyTemplate || ""}
                        onChange={(e) => setEditingPattern({ ...editingPattern, pyTemplate: e.target.value })}
                      />
                    )}
                    {templateLangTab === "cpp" && (
                      <Textarea
                        rows={12}
                        className="font-mono text-xs bg-background text-foreground leading-relaxed resize-y border-border"
                        placeholder="// C++ solution template..."
                        value={editingPattern.cppTemplate || ""}
                        onChange={(e) => setEditingPattern({ ...editingPattern, cppTemplate: e.target.value })}
                      />
                    )}
                    {templateLangTab === "java" && (
                      <Textarea
                        rows={12}
                        className="font-mono text-xs bg-background text-foreground leading-relaxed resize-y border-border"
                        placeholder="// Java solution template..."
                        value={editingPattern.javaTemplate || ""}
                        onChange={(e) => setEditingPattern({ ...editingPattern, javaTemplate: e.target.value })}
                      />
                    )}
                    {templateLangTab === "javascript" && (
                      <Textarea
                        rows={12}
                        className="font-mono text-xs bg-background text-foreground leading-relaxed resize-y border-border"
                        placeholder="// JavaScript / TypeScript solution template..."
                        value={editingPattern.jsTemplate || ""}
                        onChange={(e) => setEditingPattern({ ...editingPattern, jsTemplate: e.target.value })}
                      />
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingPattern(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmittingPattern} className="text-xs gap-1.5">
                  {isSubmittingPattern ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Edit2 className="h-3.5 w-3.5" />}
                  <span>Update Pattern</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: CREATE PROBLEM */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 5. MODAL: CREATE PROBLEM (WITH TOPIC BOX & TOPIC-FILTERED PATTERNS & PLATFORM CLICK SELECT) */}
      {/* ========================================================================= */}
      {showProblemModal && (() => {
        const selectedTopic = topics.find((t) => t.id === newProblemTopicId) || topics[0];
        const patternsInTopic = patterns.filter(
          (p) => (selectedTopic ? p.topicId === selectedTopic.id || p.topic?.id === selectedTopic.id : true)
        );
        const filteredPatternsInTopic = newProblemPatternSearch
          ? patternsInTopic.filter((p) =>
              p.name.toLowerCase().includes(newProblemPatternSearch.toLowerCase()) ||
              `#${p.number}`.includes(newProblemPatternSearch)
            )
          : patternsInTopic;
        const TopicIcon = selectedTopic ? getTopicIconComponent(selectedTopic.icon, selectedTopic.slug) : Layers;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
            <div className="relative w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 font-bold">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Add Practice Problem</h2>
                    <p className="text-xs text-muted-foreground">
                      Select topic track, choose from only its patterns, and pick platform
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowProblemModal(false);
                    setProblemModalSuccess(null);
                  }}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* In-Modal Success Banner */}
              {problemModalSuccess && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-400 flex items-center justify-between animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{problemModalSuccess}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProblemModalSuccess(null)}
                    className="cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              )}

              <form onSubmit={handleCreateProblem} className="space-y-4 text-xs">
                {/* 1. TOPIC SELECTION & TOPIC BOX (EXACT SCREENSHOT STYLE) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-foreground flex items-center gap-1.5">
                      <FolderPlus className="h-3.5 w-3.5 text-primary" />
                      <span>1. Select Curriculum Topic / Track</span>
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      {topics.length} tracks available
                    </span>
                  </div>

                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground font-medium cursor-pointer focus:ring-1 focus:ring-primary"
                    value={newProblemTopicId}
                    onChange={(e) => {
                      const nextTopicId = e.target.value;
                      setNewProblemTopicId(nextTopicId);
                      const topicPats = patterns.filter(
                        (p) => p.topicId === nextTopicId || p.topic?.id === nextTopicId
                      );
                      if (topicPats.length > 0) {
                        setNewProblemPatternId(topicPats[0].id);
                      } else {
                        setNewProblemPatternId("");
                      }
                      setNewProblemPatternSearch("");
                    }}
                  >
                    {topics.map((t) => {
                      const count = patterns.filter((p) => p.topicId === t.id || p.topic?.id === t.id).length;
                      return (
                        <option key={t.id} value={t.id}>
                          {t.name} ({count} Patterns)
                        </option>
                      );
                    })}
                  </select>

                  {/* Topic Card Display Box (Matches user screenshot) */}
                  {selectedTopic && (
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold border border-primary/20">
                          <TopicIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-foreground">{selectedTopic.name}</span>
                            <Badge variant="secondary" className="text-[10px] font-semibold">
                              {patternsInTopic.length} Patterns
                            </Badge>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px]",
                                selectedTopic.published
                                  ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/5"
                                  : "text-amber-500 border-amber-500/30 bg-amber-500/5"
                              )}
                            >
                              {selectedTopic.published ? "PUBLISHED" : "DRAFT"}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {selectedTopic.description || "DSA curriculum pattern collection."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. ATTACH TO PATTERN (FILTERED ONLY TO SELECTED TOPIC) */}
                <div className="space-y-2 pt-1 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                      <span>2. Attach to Pattern under &quot;{selectedTopic?.name || "Topic"}&quot;</span>
                    </label>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {patternsInTopic.length} pattern{patternsInTopic.length === 1 ? "" : "s"} in this topic
                    </span>
                  </div>

                  {patternsInTopic.length > 0 ? (
                    <div className="space-y-1.5">
                      {patternsInTopic.length > 4 && (
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            placeholder="Filter pattern by name or #..."
                            value={newProblemPatternSearch}
                            onChange={(e) => setNewProblemPatternSearch(e.target.value)}
                            className="pl-8 text-xs h-8 bg-background"
                          />
                        </div>
                      )}
                      <select
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground cursor-pointer focus:ring-1 focus:ring-emerald-500"
                        value={newProblemPatternId}
                        onChange={(e) => setNewProblemPatternId(e.target.value)}
                      >
                        {filteredPatternsInTopic.map((p) => (
                          <option key={p.id} value={p.id}>
                            #{p.number} - {p.name} [{p.difficulty}]
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-500 flex items-center justify-between">
                      <span>No patterns under &quot;{selectedTopic?.name}&quot; yet.</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openAddPatternModal(selectedTopic?.id, selectedTopic?.name)}
                        className="text-xs h-7 text-amber-500 border-amber-500/30 hover:bg-amber-500/20"
                      >
                        + Create Pattern First
                      </Button>
                    </div>
                  )}
                </div>

                {/* 3. PROBLEM TITLE */}
                <div className="space-y-1.5 pt-1 border-t border-border/60">
                  <label className="font-semibold text-foreground">3. Problem Title</label>
                  <Input
                    placeholder="e.g. 3Sum (LeetCode #15)"
                    required
                    value={newProblemTitle}
                    onChange={(e) => setNewProblemTitle(e.target.value)}
                  />
                </div>

                {/* 4. PLATFORM SELECTION (CLICKABLE BUTTONS + QUICK SELECT) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-foreground">4. Platform</label>
                    <span className="text-[11px] text-muted-foreground">Click to select quickly</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {PLATFORM_OPTIONS.map((plat) => {
                      const isSelected = newProblemPlatform === plat.value || (plat.value === "Other" && !PLATFORM_OPTIONS.slice(0, 5).some((p) => p.value === newProblemPlatform));
                      return (
                        <button
                          key={plat.value}
                          type="button"
                          onClick={() => {
                            if (plat.value === "Other") {
                              setNewProblemPlatform(newProblemCustomPlatform || "Other");
                            } else {
                              setNewProblemPlatform(plat.value);
                            }
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-sm ring-1 ring-primary/30"
                              : cn("border-border text-muted-foreground hover:text-foreground", plat.color)
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3 mr-0.5" />}
                          <span>{plat.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom platform input if "Other" or custom name is used */}
                  {(!PLATFORM_OPTIONS.slice(0, 5).some((p) => p.value === newProblemPlatform) || newProblemPlatform === "Other") && (
                    <div className="pt-1">
                      <Input
                        placeholder="Enter custom platform name (e.g. CodeChef, AtCoder, InterviewBit)..."
                        value={newProblemPlatform === "Other" ? newProblemCustomPlatform : newProblemPlatform}
                        onChange={(e) => {
                          setNewProblemCustomPlatform(e.target.value);
                          setNewProblemPlatform(e.target.value || "Other");
                        }}
                        className="text-xs h-8 bg-background"
                      />
                    </div>
                  )}
                </div>

                {/* 5. DIFFICULTY & SOLVE URL */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Difficulty</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground"
                    value={newProblemDifficulty}
                    onChange={(e) => setNewProblemDifficulty(e.target.value as any)}
                  >
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Solve URL</label>
                  <Input
                    placeholder="https://leetcode.com/problems/..."
                    required
                    value={newProblemUrl}
                    onChange={(e) => handleSolveUrlChange(e.target.value, setNewProblemUrl, setNewProblemPlatform)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Pasting LeetCode/GFG URLs will automatically set the platform option.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="probCore"
                    checked={newProblemIsCore}
                    onChange={(e) => setNewProblemIsCore(e.target.checked)}
                    className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                  />
                  <label htmlFor="probCore" className="text-xs text-muted-foreground select-none cursor-pointer">
                    Mark as Core Canonical Problem for this Pattern
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowProblemModal(false);
                      setProblemModalSuccess(null);
                    }}
                    className="text-xs"
                  >
                    Close
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmittingProblem || !newProblemPatternId}
                    className="text-xs gap-1.5"
                  >
                    {isSubmittingProblem ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    <span>Save Problem</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 6. MODAL: EDIT PROBLEM (WITH PLATFORM CLICK SELECT & SMART URL DETECTION) */}
      {/* ========================================================================= */}
      {editingProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 font-bold">
                  <Edit2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Edit Problem: {editingProblem.title}</h2>
                  <p className="text-xs text-muted-foreground">Modify title, platform, difficulty, or external link</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingProblem(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProblem} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Problem Title</label>
                <Input
                  required
                  value={editingProblem.title}
                  onChange={(e) => setEditingProblem({ ...editingProblem, title: e.target.value })}
                />
              </div>

              {/* Platform Quick Selection Pills */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground">Platform</label>
                  <span className="text-[11px] text-muted-foreground">Click to select</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {PLATFORM_OPTIONS.map((plat) => {
                    const currentPlatform = editingProblem.platform || "LeetCode";
                    const isSelected = currentPlatform === plat.value || (plat.value === "Other" && !PLATFORM_OPTIONS.slice(0, 5).some((p) => p.value === currentPlatform));
                    return (
                      <button
                        key={plat.value}
                        type="button"
                        onClick={() => {
                          if (plat.value === "Other") {
                            setEditingProblem({ ...editingProblem, platform: "Other" });
                          } else {
                            setEditingProblem({ ...editingProblem, platform: plat.value });
                          }
                        }}
                        className={cn(
                          "px-3 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : cn("border-border text-muted-foreground hover:text-foreground", plat.color)
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3 mr-0.5" />}
                        <span>{plat.label}</span>
                      </button>
                    );
                  })}
                </div>

                {(!PLATFORM_OPTIONS.slice(0, 5).some((p) => p.value === (editingProblem.platform || "")) || editingProblem.platform === "Other") && (
                  <div className="pt-1">
                    <Input
                      placeholder="Custom platform name..."
                      value={editingProblem.platform === "Other" ? "" : (editingProblem.platform || "")}
                      onChange={(e) => setEditingProblem({ ...editingProblem, platform: e.target.value })}
                      className="text-xs h-8 bg-background"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Difficulty</label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground"
                  value={editingProblem.difficulty}
                  onChange={(e) => setEditingProblem({ ...editingProblem, difficulty: e.target.value as any })}
                >
                  <option value="EASY">EASY</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HARD">HARD</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Solve URL</label>
                <Input
                  required
                  placeholder="https://leetcode.com/problems/..."
                  value={editingProblem.solveUrl}
                  onChange={(e) =>
                    handleSolveUrlChange(
                      e.target.value,
                      (val) => setEditingProblem({ ...editingProblem, solveUrl: val }),
                      (plat) => setEditingProblem((prev) => (prev ? { ...prev, platform: plat } : null))
                    )
                  }
                />
                <p className="text-[11px] text-muted-foreground">https:// will be added automatically if omitted.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingProblem(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmittingProblem} className="text-xs gap-1.5">
                  {isSubmittingProblem ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Edit2 className="h-3.5 w-3.5" />}
                  <span>Update Problem</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6.5. MODAL: CREATE ARTICLE (ADMIN) */}
      {/* ========================================================================= */}
      {showArticleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 font-bold">
                  <PenSquare className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Author Platform Technical Article</h2>
                  <p className="text-xs text-muted-foreground">Publish engineering guides and pattern breakdowns</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowArticleModal(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateArticle} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Article Title</label>
                <Input
                  placeholder="e.g. Mastering In-Place Array Reversals in Technical Interviews"
                  required
                  value={newArticleTitle}
                  onChange={(e) => setNewArticleTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Category</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground"
                    value={newArticleCategory}
                    onChange={(e) => setNewArticleCategory(e.target.value)}
                  >
                    <option value="DSA">DSA (Data Structures & Algorithms)</option>
                    <option value="SYSTEM_DESIGN">System Design & Architecture</option>
                    <option value="DEVELOPMENT">Full-Stack Development</option>
                    <option value="CORE_CS">Core Computer Science (OS, CN)</option>
                    <option value="DATABASE">Database & Storage Internals</option>
                    <option value="DEVOPS">DevOps & Cloud Infrastructure</option>
                    <option value="GENAI">Generative AI & LLMs</option>
                    <option value="PROGRAMMING">Languages & Clean Code</option>
                    <option value="OTHER">Other Engineering Guides</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Subtopic (Optional)</label>
                  <Input
                    placeholder="e.g. Sliding Window, B-Trees, Docker"
                    value={newArticleSubtopic}
                    onChange={(e) => setNewArticleSubtopic(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Cover Image URL (Optional)</label>
                <Input
                  placeholder="https://images.unsplash.com/..."
                  value={newArticleCoverImage}
                  onChange={(e) => setNewArticleCoverImage(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Excerpt / Summary</label>
                <Textarea
                  placeholder="A clear 1-2 sentence overview shown in article preview cards..."
                  rows={2}
                  value={newArticleExcerpt}
                  onChange={(e) => setNewArticleExcerpt(e.target.value)}
                />
              </div>

              {/* Content Header with FormattedTextarea & Preview */}
              <div className="space-y-1.5">
                <FormattedTextarea
                  label={`Article Content (${newArticleContent.length} chars, min 50)`}
                  value={newArticleContent}
                  onChange={setNewArticleContent}
                  rows={8}
                  placeholder="Write complete technical article with step cards, pseudocode, pictures, and diagrams..."
                  required
                  category={newArticleCategory}
                />
              </div>

              {/* Publication Status Selector */}
              <div className="space-y-1.5 rounded-xl border border-border/70 bg-muted/20 p-3">
                <label className="font-semibold text-foreground block">Publication Status</label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <label
                    className={cn(
                      "flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors text-xs",
                      newArticleStatus === "PUBLISHED"
                        ? "border-emerald-500 bg-emerald-500/10 text-foreground font-semibold"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <input
                      type="radio"
                      name="articleStatus"
                      value="PUBLISHED"
                      checked={newArticleStatus === "PUBLISHED"}
                      onChange={() => setNewArticleStatus("PUBLISHED")}
                      className="sr-only"
                    />
                    <div className={cn("h-2 w-2 rounded-full", newArticleStatus === "PUBLISHED" ? "bg-emerald-500" : "bg-muted-foreground")} />
                    <div>
                      <div className="font-medium">Publish Live Immediately</div>
                      <div className="text-[10px] text-muted-foreground font-normal">Visible to all students now</div>
                    </div>
                  </label>

                  <label
                    className={cn(
                      "flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors text-xs",
                      newArticleStatus === "DRAFT"
                        ? "border-primary bg-primary/10 text-foreground font-semibold"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <input
                      type="radio"
                      name="articleStatus"
                      value="DRAFT"
                      checked={newArticleStatus === "DRAFT"}
                      onChange={() => setNewArticleStatus("DRAFT")}
                      className="sr-only"
                    />
                    <div className={cn("h-2 w-2 rounded-full", newArticleStatus === "DRAFT" ? "bg-primary" : "bg-muted-foreground")} />
                    <div>
                      <div className="font-medium">Save as Internal Draft</div>
                      <div className="text-[10px] text-muted-foreground font-normal">Hidden until published</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowArticleModal(false)}
                  className="text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingArticle}
                  className="text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                >
                  {isSubmittingArticle ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <PenSquare className="h-3.5 w-3.5" />
                  )}
                  <span>{newArticleStatus === "PUBLISHED" ? "Publish Article" : "Save as Draft"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. DELETION CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-destructive/40 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Confirm Deletion
                </h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-foreground/90 leading-relaxed bg-muted/30 p-3 rounded-lg border border-border">
              Are you sure you want to delete {itemToDelete.type} &quot;<strong>{itemToDelete.name}</strong>&quot;? All associated relations will be removed.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="text-xs gap-1.5 cursor-pointer"
              >
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                <span>Permanently Delete</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
