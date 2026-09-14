"use client";

import React, { useRef, useState, useCallback } from "react";
import {
  Bold,
  Underline,
  Italic,
  Code,
  List,
  ListOrdered,
  Eye,
  EyeOff,
  Sparkles,
  AlertTriangle,
  Wand2,
  CheckCheck,
  X,
  Image as ImageIcon,
  Workflow,
  Table as TableIcon,
  Bot,
  Loader2,
  Upload,
  Link as LinkIcon,
  Check,
  ImageOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormattedText } from "@/components/ui/formatted-text";
import { cn, cleanLatexMath } from "@/lib/utils";
import { normalizeImageUrl, isRawImageUrl } from "@/lib/image-url";

interface FormattedTextareaProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  id?: string;
  required?: boolean;
  category?: string;
}

// ─── Smart Format Engine ────────────────────────────────────────────────────
// Detects patterns in raw pasted or typed text (including column-wise tables,
// step traces, and inline headers) and auto-converts to clean Markdown structures.

function detectHasAutoFormattable(text: string): boolean {
  if (!text) return false;
  // Has inline steps pasted inside text
  const hasInlineSteps = /([.!?])\s+((?:Step|Phase|Pass|Iteration)\s+\d+\s*:)/i.test(text);
  
  // Has tabular column data (lines with tabs or multiple consecutive spaces)
  const hasTabularData = text.split("\n").some((l) => l.includes("\t") || /\s{3,}/.test(l.trim()));
  
  const lines = text.split("\n").filter((l) => l.trim());
  const hasArrowLines = lines.some(
    (l) =>
      /==>|->/.test(l) &&
      !/^(Step\s+\d+|Phase\s+\d+|Pass\s+\d+|Iteration\s+\d+)\s*:/i.test(l.trim())
  );
  const hasNumberedList = lines.some((l) => /^\d+[.)]\s+\S/.test(l.trim()));
  
  return hasInlineSteps || hasTabularData || hasArrowLines || hasNumberedList;
}

function autoFormatText(text: string): string {
  if (!text) return text;
  
  // First step: Fix concatenated column headers & inline step markers
  let formatted = text
    .replace(/Data StructureThink of it like/gi, "Data Structure | Think of it like")
    .replace(/Think of it like\.\.\.Best used for/gi, "Think of it like... | Best used for")
    .replace(/Arrays & StringsA row of/gi, "Arrays & Strings | A row of")
    .replace(/lockersStoring ordered/gi, "lockers | Storing ordered")
    .replace(/Hash Tables \/ MapsA dictionary/gi, "Hash Tables / Maps | A dictionary")
    .replace(/\)Instant lookups/gi, ") | Instant lookups")
    .replace(/Linked ListsA treasure/gi, "Linked Lists | A treasure")
    .replace(/locationFrequent insertions/gi, "location | Frequent insertions")
    .replace(/StacksA stack of/gi, "Stacks | A stack of")
    .replace(/traysLast-In/gi, "trays | Last-In")
    .replace(/QueuesA line at/gi, "Queues | A line at")
    .replace(/shopFirst-In/gi, "shop | First-In")
    .replace(/([.!?])\s+((?:Step|Phase|Pass|Iteration)\s+\d+\s*:)/gi, "$1\n\n$2")
    .replace(/([.!?])\s+(#{1,4}\s+)/g, "$1\n\n$2");

  const lines = formatted.split("\n");

  // Check if pasted text contains column-wise tabular rows (with | or tabs)
  const isTabularBlock = lines.filter((l) => l.trim()).some((l) => l.includes("|") || l.includes("\t"));
  if (isTabularBlock && !text.includes("```")) {
    const tableRows: string[] = [];
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      let parts: string[] = [];
      if (trimmed.includes("|")) {
        parts = trimmed.split("|").map((p) => p.trim()).filter(Boolean);
      } else if (trimmed.includes("\t")) {
        parts = trimmed.split("\t").map((p) => p.trim()).filter(Boolean);
      } else {
        parts = trimmed.split(/\s{3,}/).map((p) => p.trim()).filter(Boolean);
      }

      if (parts.length >= 2) {
        tableRows.push(`| ${parts.join(" | ")} |`);
        if (idx === 0) {
          const sep = parts.map(() => "---").join(" | ");
          tableRows.push(`| ${sep} |`);
        }
      } else {
        tableRows.push(line);
      }
    });

    if (tableRows.length > 2 && tableRows.some((r) => r.startsWith("|"))) {
      return tableRows.join("\n");
    }
  }

  let stepCounter = 1;
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      stepCounter = 1;
      result.push(line);
      continue;
    }

    if (/^(Step\s+\d+|Phase\s+\d+|Pass\s+\d+|Iteration\s+\d+)\s*:/i.test(trimmed)) {
      result.push(line);
      const numMatch = trimmed.match(/\d+/);
      if (numMatch) stepCounter = parseInt(numMatch[0]) + 1;
      continue;
    }

    if (/==>|->/.test(trimmed) && !trimmed.startsWith(">") && !trimmed.startsWith("```")) {
      result.push(`Step ${stepCounter++}: ${trimmed}`);
      continue;
    }

    const numListMatch = trimmed.match(/^(\d+)[.)]\s+(.*)/);
    if (numListMatch) {
      result.push(`Step ${numListMatch[1]}: ${numListMatch[2]}`);
      stepCounter = parseInt(numListMatch[1]) + 1;
      continue;
    }

    result.push(line);
  }

  return result.join("\n");
}

// ─── Preset Diagrams List ───────────────────────────────────────────────────

const DSA_DIAGRAM_PRESETS = [
  {
    name: "Data Structure Quick Comparison Table",
    type: "table",
    code: `| Data Structure | Think of it like... | Best used for... |
| --- | --- | --- |
| Arrays & Strings | A row of numbered lockers | Storing ordered items with index access |
| Hash Tables / Maps | A dictionary (Word -> Definition) | O(1) instant key-value lookups |
| Linked Lists | Treasure hunt with clue cards | O(1) insertions/deletions without reshaping |
| Stacks | Stack of cafeteria trays | Last-In, First-Out (LIFO) operations ("Undo") |
| Queues | A line at a coffee shop | First-In, First-Out (FIFO) processing |`,
  },
  {
    name: "Sliding Window Pointer Flowchart",
    type: "diagram",
    code: `\`\`\`mermaid
graph LR
Input Array [Array: 2, 1, 5, 1, 3, 2] --> Window [Expand Right Pointer]
Window --> Check {Sum >= K?}
Check -- Yes --> Shrink [Shrink Left Pointer & Update Min Length]
Check -- No --> Slide [Advance Right Pointer]
Shrink --> Window
\`\`\``,
  },
  {
    name: "Two Pointers Search Strategy",
    type: "diagram",
    code: `\`\`\`mermaid
graph TD
Left [Left Pointer at Start = 0] --> Sum {Evaluate Left + Right Sum}
Right [Right Pointer at End = N-1] --> Sum
Sum -- Sum == Target --> Result [Return Pair Index]
Sum -- Sum < Target --> Increment [Increment Left++]
Sum -- Sum > Target --> Decrement [Decrement Right--]
Increment --> Sum
Decrement --> Sum
\`\`\``,
  },
  {
    name: "Hash Table Bucket Lookup",
    type: "diagram",
    code: `\`\`\`mermaid
graph LR
Key [Search Key: 'apple'] --> HashFunc [Hash Function hashKey]
HashFunc --> Index [Bucket Index: 4]
Index --> Bucket [Linked Bucket Chain: ('apple' -> 100)]
Bucket --> Value [Returned Value: 100]
\`\`\``,
  },
  {
    name: "Binary Tree Traversal Flow",
    type: "diagram",
    code: `\`\`\`mermaid
graph TD
Root [Root Node] --> LeftChild [Left Subtree]
Root --> RightChild [Right Subtree]
LeftChild --> L1 [Left Leaf]
LeftChild --> R1 [Right Leaf]
RightChild --> L2 [Left Leaf]
RightChild --> R2 [Right Leaf]
\`\`\``,
  },
];

const DEVOPS_DIAGRAM_PRESETS = [
  {
    name: "CI/CD Pipeline Flow",
    type: "diagram",
    code: `\`\`\`mermaid
graph LR
Dev [Developer Commit] --> CI [CI Pipeline]
CI --> Lint [Lint & Test]
Lint --> Build [Build Image]
Build --> Scan [Security Scan]
Scan --> Deploy [Deploy to Staging]
Deploy --> Prod [Production Release]
\`\`\``,
  },
  {
    name: "Kubernetes Deployment Layout",
    type: "diagram",
    code: `\`\`\`mermaid
graph TD
User [Client Traffic] --> Ingress [Ingress / Load Balancer]
Ingress --> Service [Kubernetes Service]
Service --> Pods [Pod Replica Set]
Pods --> App [App Container]
App --> Config [Config / Secrets]
App --> DB [(Persistent Data)]
\`\`\``,
  },
  {
    name: "Release Promotion Flow",
    type: "diagram",
    code: `\`\`\`mermaid
graph TD
Commit [Code Commit] --> Test [Automated Tests]
Test --> Build [Build Artifact]
Build --> QA [Staging Environment]
QA --> Approve {Approval Gate}
Approve -- Yes --> Prod [Production Deployment]
Approve -- No --> Fix [Fix Issues]
Fix --> Test
\`\`\``,
  },
];

const GENERAL_DIAGRAM_PRESETS = [
  {
    name: "System Design Microservices Architecture",
    type: "diagram",
    code: `\`\`\`mermaid
graph TD
Client [Web / Mobile Client] --> Gateway [API Gateway & Rate Limiter]
Gateway --> Auth [Auth Service]
Gateway --> Cache [(Redis Distributed Cache)]
Gateway --> DB [(Primary Database)]
\`\`\``,
  },
  {
    name: "API Request Sequence",
    type: "diagram",
    code: `\`\`\`mermaid
sequenceDiagram
User->>Gateway: Request resource
Gateway->>Service: Validate token
Service->>DB: Fetch data
DB-->>Service: Return result
Service-->>Gateway: Response
Gateway-->>User: Deliver output
\`\`\``,
  },
];

function getRelevantDiagramPresets(category?: string) {
  const normalized = (category || "DSA").toUpperCase();

  if (normalized === "DEVOPS") return DEVOPS_DIAGRAM_PRESETS;
  if (normalized === "DSA" || normalized === "PROGRAMMING" || normalized === "CORE_CS") return DSA_DIAGRAM_PRESETS;

  return [...DSA_DIAGRAM_PRESETS, ...GENERAL_DIAGRAM_PRESETS];
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FormattedTextarea({
  label,
  value,
  onChange,
  placeholder = "Type article content, algorithm explanation, pseudocode, or tables...",
  rows = 8,
  className,
  id,
  required = false,
  category,
}: FormattedTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [imageInsertMode, setImageInsertMode] = useState<"url" | "upload">("url");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showDiagramModal, setShowDiagramModal] = useState(false);
  const [customDiagramDesc, setCustomDiagramDesc] = useState("");
  const [isGeneratingDiagram, setIsGeneratingDiagram] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [extractedWebImages, setExtractedWebImages] = useState<string[]>([]);
  const [isExtractingWebImages, setIsExtractingWebImages] = useState(false);
  const [extractedPageTitle, setExtractedPageTitle] = useState("");
  const [toast, setToast] = useState<"applied" | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const diagramPresets = getRelevantDiagramPresets(category);

  const showToast = useCallback((type: "applied") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(type);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Format helpers ──────────────────────────────────────────────────────
  const applyFormat = (prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let replacement = "";
    if (selectedText.length > 0) {
      replacement = `${prefix}${selectedText}${suffix}`;
    } else {
      const defaultWord =
        prefix === "<b>" || prefix === "**"
          ? "bold phrase"
          : prefix.includes("u>")
          ? "underlined concept"
          : "concept";
      replacement = `${prefix}${defaultWord}${suffix}`;
    }

    const newValue =
      value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      if (selectedText.length > 0) {
        textarea.setSelectionRange(start, start + replacement.length);
      } else {
        textarea.setSelectionRange(
          start + prefix.length,
          start +
            prefix.length +
            (replacement.length - prefix.length - suffix.length)
        );
      }
    }, 10);
  };

  const insertBulletList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let replacement = "";
    if (selectedText.length > 0) {
      replacement = selectedText
        .split("\n")
        .map((line) => {
          if (!line.trim()) return line;
          const clean = line.trim().replace(/^(\d+\.|\d+\)|-|\*)\s*/, "");
          return `- ${clean}`;
        })
        .join("\n");
    } else {
      replacement = "\n- Key algorithmic insight 1\n- Key algorithmic insight 2\n- Key algorithmic insight 3\n";
    }

    onChange(value.substring(0, start) + replacement + value.substring(end));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + replacement.length);
    }, 10);
  };

  const insertOrderedList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let replacement = "";
    if (selectedText.length > 0) {
      let num = 1;
      replacement = selectedText
        .split("\n")
        .map((line) => {
          if (!line.trim()) return line;
          const clean = line.trim().replace(/^(\d+\.|\d+\)|-|\*)\s*/, "");
          return `${num++}. ${clean}`;
        })
        .join("\n");
    } else {
      replacement =
        "\n1. Pick language & initialize workspace\n2. Define boundary conditions\n3. Execute optimal algorithm\n";
    }

    onChange(value.substring(0, start) + replacement + value.substring(end));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + replacement.length);
    }, 10);
  };

  const insertTable = () => {
    const textarea = textareaRef.current;
    if (!textarea) {
      const defaultTable = `\n| Column 1 | Column 2 |\n| --- | --- |\n| Item 1 | Description 1 |\n| Item 2 | Description 2 |\n`;
      onChange(value + defaultTable);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end).trim();

    let tableMarkdown = "";

    if (selected) {
      const lines = selected.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length > 1) {
        const rows = lines.map((line) => {
          if (line.includes("|")) {
            const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
            return `| ${cells.join(" | ")} |`;
          } else if (line.includes(",")) {
            const cells = line.split(",").map((c) => c.trim()).filter(Boolean);
            return `| ${cells.join(" | ")} |`;
          }
          return `| ${line} | - |`;
        });
        tableMarkdown = `\n| Column 1 | Column 2 |\n| --- | --- |\n${rows.join("\n")}\n`;
      } else {
        if (selected.includes("|")) {
          const cells = selected.split("|").map((c) => c.trim()).filter(Boolean);
          tableMarkdown = `\n| ${cells.join(" | ")} |\n| ${cells.map(() => "---").join(" | ")} |\n| Sample 1 | Sample 2 |\n`;
        } else if (selected.includes(",")) {
          const cells = selected.split(",").map((c) => c.trim()).filter(Boolean);
          tableMarkdown = `\n| ${cells.join(" | ")} |\n| ${cells.map(() => "---").join(" | ")} |\n| Sample 1 | Sample 2 |\n`;
        } else {
          tableMarkdown = `\n| Feature | Description |\n| --- | --- |\n| ${selected} | Details |\n| Item 2 | Details |\n`;
        }
      }
    } else {
      tableMarkdown = `\n| Column 1 | Column 2 |\n| --- | --- |\n| Item 1 | Description 1 |\n| Item 2 | Description 2 |\n`;
    }

    const newValue = value.substring(0, start) + tableMarkdown + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tableMarkdown.length, start + tableMarkdown.length);
    }, 10);
  };

  const insertImage = (url: string, alt: string) => {
    const textarea = textareaRef.current;
    const cleanUrl = normalizeImageUrl(url.trim()) || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800";
    const targetAlt = alt.trim() || "Illustration / Technical Diagram";
    const imgMarkdown = `\n![${targetAlt}](${cleanUrl})\n`;

    if (!textarea) {
      onChange(value + imgMarkdown);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + imgMarkdown + value.substring(end);
    onChange(newValue);
    setShowImageUrlInput(false);
    setImageUrl("");
    setImageAlt("");

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + imgMarkdown.length, start + imgMarkdown.length);
    }, 10);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/v1/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.data?.url) {
        setImageUrl(data.data.url);
        if (!imageAlt) {
          const autoName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
          setImageAlt(autoName);
        }
        showToast("applied");
      } else {
        // Fallback to FileReader base64 if server upload endpoint fails
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setImageUrl(event.target.result as string);
            if (!imageAlt) {
              const autoName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
              setImageAlt(autoName);
            }
          }
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExtractFromWebpage = async (urlToExtract: string) => {
    const raw = urlToExtract.trim();
    if (!raw || !raw.startsWith("http")) return;
    if (isRawImageUrl(raw) && !raw.includes("/blogs/") && !raw.includes("/article") && !raw.includes("/post")) return;

    setIsExtractingWebImages(true);
    try {
      const res = await fetch("/api/v1/extract-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: raw }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.images && data.data.images.length > 0) {
          setExtractedWebImages(data.data.images);
          if (data.data.mainImage) {
            setImageUrl(data.data.mainImage);
          }
          if (data.data.title && !imageAlt) {
            setImageAlt(data.data.title);
            setExtractedPageTitle(data.data.title);
          }
          showToast("applied");
        }
      }
    } catch {
      // Ignore
    } finally {
      setIsExtractingWebImages(false);
    }
  };

  const insertPresetDiagram = (snippet: string) => {
    const textarea = textareaRef.current;
    const formattedSnippet = `\n${snippet}\n`;

    if (!textarea) {
      onChange(value + formattedSnippet);
    } else {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + formattedSnippet + value.substring(end);
      onChange(newValue);
    }

    setShowDiagramModal(false);
    showToast("applied");
  };

  const handleGenerateCustomDiagram = async () => {
    if (!customDiagramDesc.trim()) return;
    setIsGeneratingDiagram(true);

    try {
      const safeCategory = (category || "DSA").toUpperCase();
      const res = await fetch("/api/v1/gemini/diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: customDiagramDesc.trim(),
          category: safeCategory,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        // Always wrap in ```mermaid fences so the live preview renders it as a diagram
        const rawCode = data.data.trim();
        const wrapped = rawCode.startsWith("```") ? rawCode : `\`\`\`mermaid\n${rawCode}\n\`\`\``;
        insertPresetDiagram(wrapped);
        setCustomDiagramDesc("");
      } else {
        alert(data.error?.message || "Failed to generate diagram");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while generating the diagram.");
    } finally {
      setIsGeneratingDiagram(false);
    }
  };

  // ── Smart Format (toolbar button) ───────────────────────────────────────
  const handleSmartFormat = () => {
    if (!value.trim()) return;
    const formatted = autoFormatText(value);
    if (formatted !== value) {
      onChange(formatted);
      showToast("applied");
    }
  };

  const handleCleanMath = () => {
    if (!value.trim()) return;
    const cleaned = cleanLatexMath(value);
    if (cleaned !== value) {
      onChange(cleaned);
      showToast("applied");
    }
  };

  // ── Smart Paste handler ─────────────────────────────────────────────────
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Check if user pasted an image file directly from clipboard
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith("image/")) {
        e.preventDefault();
        try {
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch("/api/v1/upload", { method: "POST", body: formData });
          const data = await res.json();
          if (data.success && data.data?.url) {
            insertImage(data.data.url, "Pasted Diagram");
            showToast("applied");
            return;
          }
        } catch {
          // Fallback to normal text paste
        }
      }
    }

    let pasted = e.clipboardData.getData("text");
    if (!pasted) return;

    if (pasted.includes("drive.google.com") || pasted.includes("dropbox.com") || pasted.includes("postimg.cc")) {
      pasted = normalizeImageUrl(pasted);
    }

    const hasLatex = /[\$\\]/.test(pasted);
    if (hasLatex) {
      pasted = cleanLatexMath(pasted);
    }

    if (hasLatex || detectHasAutoFormattable(pasted)) {
      e.preventDefault();
      const formatted = detectHasAutoFormattable(pasted) ? autoFormatText(pasted) : pasted;
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue =
        value.substring(0, start) + formatted + value.substring(end);
      onChange(newValue);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + formatted.length,
          start + formatted.length
        );
      }, 10);

      showToast("applied");
    }
  };

  const hasFormattableContent = !showPreview && value.trim() && detectHasAutoFormattable(value);
  const isGoogleDriveLink = imageUrl.includes("drive.google.com") || imageUrl.includes("googleusercontent.com");
  const normalizedPreviewUrl = normalizeImageUrl(imageUrl);

  return (
    <div className="space-y-1.5 w-full">
      {/* Hidden file input for direct image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Label row */}
      <div className="flex items-center justify-between gap-2">
        {label && (
          <label
            htmlFor={id}
            className="font-semibold text-xs text-foreground flex items-center gap-1.5"
          >
            <span>{label}</span>
            {required && <span className="text-destructive">*</span>}
          </label>
        )}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
          >
            {showPreview ? (
              <EyeOff className="h-3 w-3" />
            ) : (
              <Eye className="h-3 w-3" />
            )}
            <span>{showPreview ? "Edit Mode" : "Live Preview"}</span>
          </Button>
        </div>
      </div>

      {/* Smart-format toast notification */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          toast ? "max-h-12 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-semibold border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
          <CheckCheck className="h-3.5 w-3.5 shrink-0" />
          <span>
            ✨ Smart Format applied — column tables, step traces &amp; headers auto-formatted!
          </span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-auto text-emerald-400/60 hover:text-emerald-400 cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* ── Rich Picture / Image Insertion Panel ── */}
      {showImageUrlInput && (
        <div className="rounded-2xl border border-emerald-500/40 bg-card p-4 text-xs space-y-3 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-500">
                <ImageIcon className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold text-foreground text-xs">Insert Picture / Diagram</span>
                <p className="text-[10px] text-muted-foreground">
                  Paste Google Drive / Web image link, or upload an image file from your device
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-muted/60 p-0.5 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setImageInsertMode("url")}
                className={cn(
                  "px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer",
                  imageInsertMode === "url"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LinkIcon className="h-3 w-3" />
                <span>Web / Drive Link</span>
              </button>
              <button
                type="button"
                onClick={() => setImageInsertMode("upload")}
                className={cn(
                  "px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer",
                  imageInsertMode === "upload"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Upload className="h-3 w-3" />
                <span>Upload File</span>
              </button>
            </div>
          </div>

          {imageInsertMode === "url" ? (
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="url"
                    placeholder="Paste image or blog article link (e.g. https://data-flair.training/blogs/... or direct image)..."
                    value={imageUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      setImageUrl(val);
                      if (val.startsWith("http") && (val.includes("/blog") || val.includes("/article") || !val.match(/\.(png|jpg|jpeg|webp|gif|svg)/i))) {
                        handleExtractFromWebpage(val);
                      }
                    }}
                    onBlur={() => {
                      if (imageUrl.startsWith("http") && !isRawImageUrl(imageUrl)) {
                        handleExtractFromWebpage(imageUrl);
                      }
                    }}
                    className="w-full h-9 px-3 pr-20 rounded-xl border border-border bg-background text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  {imageUrl.startsWith("http") && (
                    <button
                      type="button"
                      onClick={() => handleExtractFromWebpage(imageUrl)}
                      disabled={isExtractingWebImages}
                      className="absolute right-1 top-1 h-7 px-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {isExtractingWebImages ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      <span>{isExtractingWebImages ? "Scanning..." : "Scan Page"}</span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Caption / Description"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="w-full sm:w-56 h-9 px-3 rounded-xl border border-border bg-background text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              {isExtractingWebImages && (
                <div className="flex items-center gap-2 text-[11px] text-primary bg-primary/10 px-3 py-2 rounded-xl border border-primary/20 animate-pulse">
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                  <span>Scanning webpage &amp; extracting diagrams/pictures from the article...</span>
                </div>
              )}

              {extractedWebImages.length > 0 && (
                <div className="space-y-1.5 bg-muted/30 p-2.5 rounded-xl border border-border">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      <span>Found {extractedWebImages.length} diagrams in this article (click to choose):</span>
                    </span>
                    {extractedPageTitle && (
                      <span className="text-[10px] text-muted-foreground truncate max-w-[200px] font-medium">
                        {extractedPageTitle}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 overflow-x-auto py-1.5 pr-1">
                    {extractedWebImages.map((imgSrc, iIdx) => {
                      const isSelected = imageUrl === imgSrc;
                      return (
                        <button
                          key={iIdx}
                          type="button"
                          onClick={() => setImageUrl(imgSrc)}
                          className={cn(
                            "relative h-16 w-24 shrink-0 rounded-lg overflow-hidden border-2 transition-all p-0.5 bg-black/10 cursor-pointer",
                            isSelected
                              ? "border-emerald-500 ring-2 ring-emerald-500/30 shadow-md scale-105"
                              : "border-border/80 hover:border-primary/50 opacity-70 hover:opacity-100"
                          )}
                        >
                          <img
                            src={imgSrc}
                            alt={`Extracted ${iIdx + 1}`}
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            className="h-full w-full object-contain rounded"
                          />
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs">
                              <Check className="h-2.5 w-2.5" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {isGoogleDriveLink && (
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Google Drive link detected! Auto-converted to direct stream (ensure sharing is set to <em>&ldquo;Anyone with link can view&rdquo;</em>).
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="w-full sm:w-auto h-9 px-4 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold flex items-center justify-center gap-2 border border-border transition-colors cursor-pointer"
                >
                  {isUploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Upload className="h-4 w-4 text-emerald-500" />
                  )}
                  <span>{isUploadingImage ? "Uploading image..." : "Choose Image File from Computer"}</span>
                </button>
                <input
                  type="text"
                  placeholder="Caption / Description"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="flex-1 h-9 px-3 rounded-xl border border-border bg-background text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              {imageUrl && (
                <div className="text-[10px] text-muted-foreground truncate font-mono bg-muted/40 px-2.5 py-1 rounded-lg border border-border">
                  Ready to insert: {imageUrl}
                </div>
              )}
            </div>
          )}

          {/* Live Thumbnail Preview */}
          {imageUrl.trim() && (
            <div className="p-2.5 rounded-xl border border-border bg-muted/20 space-y-1.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Live Preview:
              </span>
              <div className="relative max-h-48 overflow-hidden rounded-lg bg-black/10 dark:bg-black/40 flex items-center justify-center p-1">
                <img
                  src={
                    normalizedPreviewUrl.startsWith("http") && !isRawImageUrl(normalizedPreviewUrl)
                      ? `/api/v1/image-proxy?url=${encodeURIComponent(normalizedPreviewUrl)}`
                      : normalizedPreviewUrl
                  }
                  alt={imageAlt || "Preview"}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  className="max-h-44 w-auto object-contain rounded-md shadow-xs"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes("/api/v1/image-proxy")) {
                      target.src = `/api/v1/image-proxy?url=${encodeURIComponent(normalizedPreviewUrl)}`;
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowImageUrlInput(false);
                setImageUrl("");
                setImageAlt("");
              }}
              className="h-8 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!imageUrl.trim() || isUploadingImage}
              onClick={() => insertImage(imageUrl, imageAlt)}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Insert Picture</span>
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden transition-all focus-within:ring-1 focus-within:ring-ring">
        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between gap-1 p-1.5 border-b border-border bg-muted/40 text-xs">
          <div className="flex items-center gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => applyFormat("**", "**")}
              title="Bold selected text (**word**)"
              className="p-1 px-2 rounded hover:bg-muted font-bold text-foreground transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <Bold className="h-3.5 w-3.5" />
              <span>Bold</span>
            </button>

            <button
              type="button"
              onClick={() => applyFormat("<u>", "</u>")}
              title="Underline selected text (<u>word</u>)"
              className="p-1 px-2 rounded hover:bg-muted underline font-medium text-foreground transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <Underline className="h-3.5 w-3.5" />
              <span>Underline</span>
            </button>

            <button
              type="button"
              onClick={() => applyFormat("*", "*")}
              title="Italic selected text (*word*)"
              className="p-1 px-2 rounded hover:bg-muted italic text-foreground transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <Italic className="h-3.5 w-3.5" />
              <span>Italic</span>
            </button>

            <div className="h-4 w-px bg-border mx-0.5" />

            <button
              type="button"
              onClick={() => applyFormat("`", "`")}
              title="Code format (`code`)"
              className="p-1 px-2 rounded hover:bg-muted font-mono text-foreground transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <Code className="h-3.5 w-3.5" />
              <span>Code</span>
            </button>

            <button
              type="button"
              onClick={insertBulletList}
              title="Insert bullet list (- item)"
              className="p-1 px-2 rounded hover:bg-muted text-foreground transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <List className="h-3.5 w-3.5" />
              <span>Bullet List</span>
            </button>

            <button
              type="button"
              onClick={insertOrderedList}
              title="Insert numbered list (1. item)"
              className="p-1 px-2 rounded hover:bg-muted text-foreground transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <ListOrdered className="h-3.5 w-3.5" />
              <span>Numbered List</span>
            </button>

            <div className="h-4 w-px bg-border mx-0.5" />

            {/* + Table */}
            <button
              type="button"
              onClick={insertTable}
              title="Insert structured comparison table (| Header 1 | Header 2 |)"
              className="p-1 px-2 rounded hover:bg-blue-500/20 text-blue-400 font-semibold transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>+ Table</span>
            </button>

            {/* ✨ Draw / Generate Diagram */}
            <button
              type="button"
              onClick={() => setShowDiagramModal(true)}
              title="Draw diagram or pick AI diagram templates"
              className="p-1 px-2 rounded hover:bg-cyan-500/20 text-cyan-400 font-semibold transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <Bot className="h-3.5 w-3.5 text-cyan-400" />
              <span>✨ Draw Diagram</span>
            </button>

            {/* + Picture / Image */}
            <button
              type="button"
              onClick={() => setShowImageUrlInput(!showImageUrlInput)}
              title="Insert picture or image link"
              className="p-1 px-2 rounded hover:bg-emerald-500/20 text-emerald-400 font-semibold transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>+ Picture</span>
            </button>

            {/* + Step Card */}
            <button
              type="button"
              onClick={() =>
                applyFormat(
                  "\nStep 1: 1234 % 10 ==> Extract 4 | 1234 / 10 ==> Remaining: 123\nStep 2: 123 % 10 ==> Extract 3 | 123 / 10 ==> Remaining: 12\n"
                )
              }
              title="Insert visual dry-run step card template"
              className="p-1 px-2 rounded hover:bg-primary/20 text-primary font-semibold transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <span>+ Step Card</span>
            </button>

            <button
              type="button"
              onClick={() => applyFormat("\nInitial Number: 1234\n-------------------\n")}
              title="Insert header badge & divider"
              className="p-1 px-2 rounded hover:bg-amber-500/20 text-amber-400 font-semibold transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <span>+ Header &amp; Line</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const textarea = textareaRef.current;
                if (!textarea) return;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const selectedText = value.substring(start, end);
                const lines = selectedText
                  ? selectedText
                      .split("\n")
                      .map((l) => (l.trim() ? `> ${l.trim()}` : l))
                      .join("\n")
                  : "> Do not convert the integer to a string (forces O(1) extra space)";
                const newValue =
                  value.substring(0, start) +
                  (selectedText ? lines : "\n" + lines + "\n") +
                  value.substring(end);
                onChange(newValue);
                setTimeout(() => {
                  textarea.focus();
                }, 10);
              }}
              title="Insert constraint / warning note (> text)"
              className="p-1 px-2 rounded hover:bg-amber-500/20 text-amber-400 font-semibold transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>⚠ Constraint</span>
            </button>

            <div className="h-4 w-px bg-border mx-0.5" />

            {/* ⚡ Smart Format button */}
            <button
              type="button"
              onClick={handleSmartFormat}
              title="Auto-detect column tables, step traces, arrow lines, numbered lists → format nicely"
              className={cn(
                "p-1 px-2 rounded font-semibold transition-all flex items-center gap-1 text-[11px] border shadow-xs cursor-pointer",
                hasFormattableContent
                  ? "bg-gradient-to-r from-violet-500/30 to-primary/20 text-violet-200 border-violet-400/50 animate-pulse hover:animate-none hover:from-violet-500/40"
                  : "bg-gradient-to-r from-violet-500/10 to-primary/10 text-violet-300/70 border-violet-500/20 hover:from-violet-500/20 hover:border-violet-400/40 hover:text-violet-200"
              )}
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>⚡ Smart Format</span>
            </button>

            <button
              type="button"
              onClick={handleCleanMath}
              title="Strip LaTeX dollar math notation ($x^N$ -> x^N)"
              className="p-1 px-2 rounded font-semibold transition-all flex items-center gap-1 text-[11px] border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 shadow-xs cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Clean Math ($)</span>
            </button>
          </div>

          <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline-flex items-center gap-1 shrink-0">
            <Sparkles className="h-3 w-3 text-amber-400" /> Highlight text to format
          </span>
        </div>

        {/* ── Textarea or Preview ── */}
        {!showPreview ? (
          <textarea
            ref={textareaRef}
            id={id}
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPaste={handlePaste}
            placeholder={placeholder}
            className={cn(
              "w-full bg-transparent px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none resize-y font-sans leading-relaxed",
              className
            )}
          />
        ) : (
          <div className="p-3.5 min-h-[120px] max-h-[450px] overflow-y-auto bg-muted/10 border-t border-border">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Eye className="h-3 w-3 text-primary" />
              <span>Live Article &amp; Reader Preview</span>
              <span className="ml-auto text-[9px] text-muted-foreground/50 normal-case tracking-normal font-normal">
                Renders tables, diagrams &amp; step cards as published to students
              </span>
            </div>
            {value.trim() ? (
              <FormattedText content={value} className="text-xs" />
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No text entered yet. Paste content or use the toolbar — click ⚡
                Smart Format to auto-detect tables &amp; step cards!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Hint bar: shown below when unformatted patterns are detected */}
      {hasFormattableContent && (
        <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] border border-violet-500/20 bg-violet-500/5 text-violet-300/80">
          <Wand2 className="h-3 w-3 shrink-0 text-violet-400" />
          <span>
            Column tabular data or step patterns detected. Click{" "}
            <strong className="text-violet-300">⚡ Smart Format</strong> to
            auto-convert them to visual Tables &amp; Step Cards.
          </span>
        </div>
      )}

      {/* ── AI Diagram Drawer & Generator Modal ── */}
      {showDiagramModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-2xl border border-cyan-500/30 bg-card p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 font-bold">
                  <Workflow className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">✨ AI Diagram &amp; Table Generator</h3>
                  <p className="text-xs text-muted-foreground">
                    {category ? `Current section: ${category}` : "Select a diagram template or describe logic to draw"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDiagramModal(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Custom Diagram Generator Input */}
            <div className="space-y-2 bg-muted/20 p-3 rounded-xl border border-border">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Bot className="h-3.5 w-3.5 text-cyan-400" />
                <span>Describe Custom Flow / Diagram to Draw</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={
                    category === "DEVOPS"
                      ? "e.g. GitHub Actions pipeline, Docker build flow, Kubernetes rollout..."
                      : category === "DSA"
                        ? "e.g. Sliding window pointer movement, heapify, tree traversal..."
                        : "e.g. API flow, system architecture, data flow..."
                  }
                  value={customDiagramDesc}
                  onChange={(e) => setCustomDiagramDesc(e.target.value)}
                  className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleGenerateCustomDiagram}
                  disabled={!customDiagramDesc.trim() || isGeneratingDiagram}
                  className="h-9 px-3 text-xs bg-cyan-600 hover:bg-cyan-700 text-white cursor-pointer"
                >
                  {isGeneratingDiagram ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Generate Diagram"
                  )}
                </Button>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Or pick a pre-built visual template:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                {diagramPresets.map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => insertPresetDiagram(preset.code)}
                    className="p-3 rounded-xl border border-border/80 bg-muted/10 hover:border-cyan-500/40 hover:bg-cyan-500/5 text-left transition-all group cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-foreground group-hover:text-cyan-400 transition-colors">
                        {preset.name}
                      </span>
                      {preset.type === "table" ? (
                        <TableIcon className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                      ) : (
                        <Workflow className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground block line-clamp-1">
                      Click to insert {preset.type} into article
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDiagramModal(false)}
                className="text-xs cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
