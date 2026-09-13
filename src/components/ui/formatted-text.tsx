"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MermaidDiagram } from "@/components/ui/mermaid-diagram";
import { normalizeImageUrl, getFallbackImageUrls, isRawImageUrl } from "@/lib/image-url";
import {
  ArrowRight,
  CheckCircle2,
  Terminal,
  Sparkles,
  AlertTriangle,
  Info,
  Image as ImageIcon,
  Workflow,
  Maximize2,
  X,
  Layers,
  Table as TableIcon,
  ExternalLink,
  RefreshCw,
  ImageOff,
} from "lucide-react";

interface FormattedTextProps {
  content?: string | null;
  className?: string;
}

// ─── Robust Formatted Image Component ─────────────────────────────────────────

interface FormattedImageItemProps {
  src: string;
  alt: string;
  isStandalone?: boolean;
  onExpand?: (src: string, alt: string) => void;
}

function FormattedImageItem({
  src: rawSrc,
  alt: rawAlt,
  isStandalone = false,
  onExpand,
}: FormattedImageItemProps) {
  const normalizedInitial = normalizeImageUrl(rawSrc);
  const [currentSrc, setCurrentSrc] = useState(normalizedInitial);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fallbacks = getFallbackImageUrls(rawSrc);
  const alt = rawAlt || "Illustration / Technical Diagram";

  useEffect(() => {
    const updated = normalizeImageUrl(rawSrc);
    setCurrentSrc(updated);
    setFallbackIndex(0);
    setHasError(false);
    setIsLoading(true);
  }, [rawSrc]);

  const handleImageError = () => {
    if (fallbackIndex < fallbacks.length) {
      const nextFallback = fallbacks[fallbackIndex];
      setFallbackIndex((prev) => prev + 1);
      setCurrentSrc(nextFallback);
    } else if (!currentSrc.includes("/api/v1/image-proxy") && (rawSrc.startsWith("http://") || rawSrc.startsWith("https://"))) {
      setCurrentSrc(`/api/v1/image-proxy?url=${encodeURIComponent(rawSrc)}`);
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  if (hasError) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-destructive/30 bg-destructive/5 p-4 my-3 text-xs transition-all",
          isStandalone ? "w-full max-w-xl mx-auto" : "inline-block w-full"
        )}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-destructive/10 text-destructive shrink-0 mt-0.5">
            <ImageOff className="h-4 w-4" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground">{alt}</span>
              <span className="text-[10px] text-destructive font-mono uppercase font-bold">Image load error</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Unable to preview this image directly. If using <strong>Google Drive</strong>, ensure the link sharing is set to{" "}
              <em>&ldquo;Anyone with the link can view&rdquo;</em>, or upload the file directly.
            </p>
            <div className="flex items-center gap-2 pt-1.5 flex-wrap">
              <a
                href={rawSrc}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-foreground hover:text-primary hover:bg-muted/80 text-[11px] font-medium border border-border transition-colors"
              >
                <span>Open original link</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <button
                type="button"
                onClick={() => {
                  setHasError(false);
                  setIsLoading(true);
                  setFallbackIndex(0);
                  setCurrentSrc(normalizeImageUrl(rawSrc) + (rawSrc.includes("?") ? "&" : "?") + `t=${Date.now()}`);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-medium border border-primary/20 transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isStandalone) {
    return (
      <div className="my-4 group">
        <div
          className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-2 shadow-md cursor-pointer transition-all hover:border-primary/40 hover:shadow-lg"
          onClick={() => onExpand && onExpand(currentSrc, alt)}
        >
          <div className="relative min-h-[140px] max-h-[500px] overflow-hidden rounded-xl bg-black/5 dark:bg-black/40 flex items-center justify-center">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/40 animate-pulse">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ImageIcon className="h-4 w-4 animate-bounce text-primary" />
                  <span>Loading image...</span>
                </div>
              </div>
            )}
            <img
              src={currentSrc}
              alt={alt}
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onError={handleImageError}
              onLoad={handleImageLoad}
              className={cn(
                "w-full h-auto max-h-[500px] object-contain rounded-xl transition-all duration-300",
                isLoading ? "opacity-0 scale-95" : "opacity-100 scale-100"
              )}
            />
            {!isLoading && (
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm p-1.5 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="h-4 w-4" />
              </div>
            )}
          </div>
          {alt && (
            <div className="flex items-center gap-2 pt-2.5 px-2 text-xs text-muted-foreground font-medium">
              <ImageIcon className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="truncate">{alt}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Inline Image
  return (
    <span
      className="inline-block my-2 cursor-pointer group align-middle max-w-full"
      onClick={() => onExpand && onExpand(currentSrc, alt)}
    >
      <span className="relative block overflow-hidden rounded-xl border border-border bg-muted/20 shadow-sm transition-all group-hover:scale-[1.01] group-hover:shadow-md">
        {isLoading && (
          <span className="flex items-center justify-center p-6 text-xs text-muted-foreground gap-1.5">
            <ImageIcon className="h-3.5 w-3.5 animate-bounce text-primary" />
            <span>Loading...</span>
          </span>
        )}
        <img
          src={currentSrc}
          alt={alt}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={handleImageError}
          onLoad={handleImageLoad}
          className={cn(
            "max-h-80 w-auto object-cover rounded-xl transition-all duration-300",
            isLoading ? "opacity-0" : "opacity-100"
          )}
        />
      </span>
      {alt && (
        <span className="block text-[10px] text-muted-foreground italic mt-1 text-center truncate max-w-xs">
          {alt}
        </span>
      )}
    </span>
  );
}

// ─── Main FormattedText ────────────────────────────────────────────────────────

export function FormattedText({ content, className }: FormattedTextProps) {
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null);

  if (!content) {
    return null;
  }

  // Pre-process text to separate inline steps, headings, or tabular columns pasted without line breaks
  const normalizePastedContent = (raw: string): string => {
    if (!raw) return raw;
    let normalized = raw;

    // 1. Separate inline "Step N:", "Phase N:", "Pass N:", "Iteration N:" embedded after punctuation
    normalized = normalized.replace(
      /([.!?])\s+((?:Step|Phase|Pass|Iteration)\s+\d+\s*:)/gi,
      "$1\n\n$2"
    );

    // 2. Fix concatenated column headers like "Data StructureThink of it like...Best used for..."
    normalized = normalized
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
      .replace(/shopFirst-In/gi, "shop | First-In");

    // 3. Separate concatenated boundary words like "ToolsBefore" -> "Tools. Before"
    normalized = normalized.replace(/([a-z])([A-Z][a-z]+)/g, (match, p1, p2) => {
      if (["Before", "After", "Pick", "Master", "Learn", "Understand", "Create", "Build"].includes(p2)) {
        return `${p1}. ${p2}`;
      }
      return match;
    });

    // 4. Separate inline markdown headers embedded after period (e.g. "end. ## Header")
    normalized = normalized.replace(/([.!?])\s+(#{1,4}\s+)/g, "$1\n\n$2");

    return normalized;
  };

  const processedContent = normalizePastedContent(content);

  // Helper to parse inline tags: **bold**, <b>bold</b>, <u>underline</u>, __underline__, *italic*, `code`, images, HTML img
  const parseInline = (text: string): React.ReactNode => {
    if (!text) return null;

    const regex = /(\*\*.*?\*\*|<b>.*?<\/b>|<u>.*?<\/u>|__.*?__|`.*?`|\*.*?\*|!\[.*?\]\(.*?\)|<img\s+[^>]*>)/g;
    const tokens = text.split(regex);

    return tokens.map((token, idx) => {
      if (!token) return null;

      // Inline Image: ![alt](url)
      if (token.startsWith("![") && token.includes("](") && token.endsWith(")")) {
        const altMatch = token.match(/!\[(.*?)\]\((.*?)\)/);
        if (altMatch) {
          const alt = altMatch[1] || "Illustration / diagram";
          const src = altMatch[2];
          return (
            <FormattedImageItem
              key={`inline-img-${idx}`}
              src={src}
              alt={alt}
              isStandalone={false}
              onExpand={(s, a) => setSelectedImage({ src: s, alt: a })}
            />
          );
        }
      }

      // Inline HTML Image: <img src="..." alt="..." />
      if (token.startsWith("<img") && token.endsWith(">")) {
        const srcMatch = token.match(/src=["'](.*?)["']/i);
        const altMatch = token.match(/alt=["'](.*?)["']/i);
        if (srcMatch && srcMatch[1]) {
          const src = srcMatch[1];
          const alt = altMatch ? altMatch[1] : "Illustration / diagram";
          return (
            <FormattedImageItem
              key={`inline-html-img-${idx}`}
              src={src}
              alt={alt}
              isStandalone={false}
              onExpand={(s, a) => setSelectedImage({ src: s, alt: a })}
            />
          );
        }
      }

      // Bold: **text** or <b>text</b>
      if ((token.startsWith("**") && token.endsWith("**")) || (token.startsWith("<b>") && token.endsWith("</b>"))) {
        const inner = token.startsWith("**") ? token.slice(2, -2) : token.slice(3, -4);
        return (
          <strong key={idx} className="font-bold text-foreground">
            {parseInline(inner)}
          </strong>
        );
      }

      // Underline: <u>text</u> or __text__
      if ((token.startsWith("<u>") && token.endsWith("</u>")) || (token.startsWith("__") && token.endsWith("__"))) {
        const inner = token.startsWith("<u>") ? token.slice(3, -4) : token.slice(2, -2);
        return (
          <u
            key={idx}
            className="underline decoration-primary/40 decoration-2 underline-offset-4 font-semibold text-foreground"
          >
            {parseInline(inner)}
          </u>
        );
      }

      // Code: `text`
      if (token.startsWith("`") && token.endsWith("`")) {
        const inner = token.slice(1, -1);
        return (
          <code
            key={idx}
            className="font-mono text-[11.5px] bg-muted px-1.5 py-0.5 rounded border border-border text-foreground font-semibold inline-block my-0.5"
          >
            {inner}
          </code>
        );
      }

      // Italic: *text* (excluding **)
      if (token.startsWith("*") && token.endsWith("*") && !token.startsWith("**")) {
        const inner = token.slice(1, -1);
        return (
          <em key={idx} className="italic text-foreground/90 font-medium">
            {parseInline(inner)}
          </em>
        );
      }

      return <span key={idx}>{token}</span>;
    });
  };

  // Shared helper to render step card content parts split by '|' and '==>'
  const renderStepParts = (stepContent: string, keyPrefix: string) => {
    const parts = stepContent.split("|").map((p) => p.trim());
    return (
      <div className="flex-1 flex flex-wrap items-center gap-2 text-xs font-mono">
        {parts.map((part, pIdx) => {
          const subParts = part.split(/==>|->|=>/).map((s) => s.trim());
          return (
            <React.Fragment key={`${keyPrefix}-p${pIdx}`}>
              {pIdx > 0 && <span className="text-muted-foreground/40 font-sans hidden sm:inline">|</span>}
              <div className="flex items-center gap-1.5 flex-wrap">
                {subParts.map((sub, sIdx) => {
                  const isExtract = sub.toLowerCase().startsWith("extract") || sub.toLowerCase().startsWith("pair");
                  const isRemaining = sub.toLowerCase().startsWith("remaining") || sub.toLowerCase().includes("stop");

                  return (
                    <React.Fragment key={`${keyPrefix}-p${pIdx}-s${sIdx}`}>
                      {sIdx > 0 && <ArrowRight className="h-3 w-3 text-primary/70 shrink-0" />}
                      <span
                        className={cn(
                          "px-2 py-1 rounded-md text-[11px] font-mono transition-colors",
                          isExtract && "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold",
                          isRemaining && "bg-amber-500/10 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-semibold",
                          !isExtract && !isRemaining && "bg-muted/70 text-foreground border border-border"
                        )}
                      >
                        {parseInline(sub)}
                      </span>
                    </React.Fragment>
                  );
                })}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // Helper to parse line blocks (Step cards, headings, lists, notes, key-values, images)
  const renderStepRow = (line: string, index: number) => {
    const trimmed = line.trim();
    if (!trimmed) return null;

    // Check for Headings: # Heading 1, ## Heading 2, ### Heading 3
    if (trimmed.startsWith("### ")) {
      return (
        <h3 key={`h3-${index}`} className="text-base sm:text-lg font-bold text-foreground mt-5 mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span>{parseInline(trimmed.slice(4))}</span>
        </h3>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <h2 key={`h2-${index}`} className="text-lg sm:text-xl font-extrabold text-foreground mt-6 mb-3 border-b border-border/50 pb-1.5 flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary shrink-0" />
          <span>{parseInline(trimmed.slice(3))}</span>
        </h2>
      );
    }
    if (trimmed.startsWith("# ")) {
      return (
        <h1 key={`h1-${index}`} className="text-xl sm:text-2xl font-black text-foreground mt-7 mb-3">
          {parseInline(trimmed.slice(2))}
        </h1>
      );
    }

    // Check if line matches standalone Markdown image: ![alt](url)
    const standaloneImgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (standaloneImgMatch) {
      const alt = standaloneImgMatch[1] || "Diagram / Illustration";
      const src = standaloneImgMatch[2];
      return (
        <FormattedImageItem
          key={`img-block-${index}`}
          src={src}
          alt={alt}
          isStandalone={true}
          onExpand={(s, a) => setSelectedImage({ src: s, alt: a })}
        />
      );
    }

    // Check if line matches standalone HTML image: <img ... />
    if (/^<img\s+[^>]*>$/i.test(trimmed)) {
      const srcMatch = trimmed.match(/src=["'](.*?)["']/i);
      const altMatch = trimmed.match(/alt=["'](.*?)["']/i);
      if (srcMatch && srcMatch[1]) {
        return (
          <FormattedImageItem
            key={`img-html-block-${index}`}
            src={srcMatch[1]}
            alt={altMatch ? altMatch[1] : "Diagram / Illustration"}
            isStandalone={true}
            onExpand={(s, a) => setSelectedImage({ src: s, alt: a })}
          />
        );
      }
    }

    // Check if line is a raw image URL pasted directly from a website without markdown syntax
    if (isRawImageUrl(trimmed)) {
      return (
        <FormattedImageItem
          key={`raw-img-${index}`}
          src={trimmed}
          alt="Illustration / Technical Diagram"
          isStandalone={true}
          onExpand={(s, a) => setSelectedImage({ src: s, alt: a })}
        />
      );
    }

    // Check if line matches named Step pattern (Step 1:, Phase 2:, etc.)
    const stepMatch = trimmed.match(/^(Step\s+\d+|Phase\s+\d+|Pass\s+\d+|Iteration\s+\d+):\s*(.*)/i);
    if (stepMatch) {
      const stepLabel = stepMatch[1];
      const stepContent = stepMatch[2];

      return (
        <div
          key={`step-${index}`}
          className="group relative my-3 rounded-xl border border-border/80 bg-card p-3.5 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 px-2.5 items-center justify-center rounded-md bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wide font-mono shrink-0 shadow-xs">
                {stepLabel}
              </span>
            </div>
            {renderStepParts(stepContent, `step-${index}`)}
          </div>
        </div>
      );
    }

    // Check for inline arrow trace lines like: "i = 1 ==> Pair: (1, 36)" or "n = 5 -> result: 10"
    const arrowMatch = trimmed.match(/^(.+?)(==>|->|=>)(.*)$/);
    if (arrowMatch) {
      const leftSide = arrowMatch[1].trim();
      const rightSide = arrowMatch[3].trim();
      const fullContent = trimmed;

      const rightParts = rightSide.split("|").map((p) => p.trim());
      const isStopLine = fullContent.toLowerCase().includes("stop");

      return (
        <div
          key={`trace-${index}`}
          className="group relative my-2 rounded-lg border border-border/60 bg-card px-3 py-2 shadow-xs transition-all hover:border-primary/30 hover:shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span
              className={cn(
                "px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold border",
                isStopLine
                  ? "bg-red-500/10 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30"
                  : "bg-muted/70 text-foreground border-border"
              )}
            >
              {leftSide}
            </span>
            <ArrowRight className="h-3 w-3 text-primary/60 shrink-0" />
            {rightParts.map((rPart, rIdx) => {
              const isPair = rPart.toLowerCase().startsWith("pair");
              const isStop = rPart.toLowerCase().includes("stop");
              return (
                <React.Fragment key={`trace-${index}-r${rIdx}`}>
                  {rIdx > 0 && <span className="text-muted-foreground/40">|</span>}
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[11px] font-mono border",
                      isPair && "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-bold",
                      isStop && !isPair && "bg-amber-500/10 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 font-semibold",
                      !isPair && !isStop && "bg-muted/60 text-foreground border-border font-medium"
                    )}
                  >
                    {rPart}
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      );
    }

    // Check for blockquote / constraint note: "> text"
    if (trimmed.startsWith("> ")) {
      const noteText = trimmed.substring(2);
      return (
        <div key={`note-${index}`} className="my-3 flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 dark:bg-amber-500/8 px-4 py-3 shadow-xs">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <span className="text-xs sm:text-sm text-foreground/90 dark:text-amber-200 leading-relaxed font-medium">{parseInline(noteText)}</span>
        </div>
      );
    }

    // Check for [!NOTE] info box
    if (trimmed.startsWith("[!NOTE]")) {
      const noteText = trimmed.substring(7).trim();
      return (
        <div key={`info-${index}`} className="my-3 flex items-start gap-2.5 rounded-xl border border-blue-500/25 bg-blue-500/10 dark:bg-blue-500/8 px-4 py-3 shadow-xs">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <span className="text-xs sm:text-sm text-foreground/90 dark:text-blue-200 leading-relaxed font-medium">{parseInline(noteText)}</span>
        </div>
      );
    }

    // Check for key-value headers like "Initial Number: 1234"
    const kvMatch = trimmed.match(/^([A-Za-z0-9][A-Za-z0-9 ]{0,30}):\s*(\S.*)$/);
    if (
      kvMatch &&
      !trimmed.startsWith("http") &&
      !trimmed.includes("==>") &&
      !trimmed.includes("->") &&
      kvMatch[1].trim().split(/\s+/).length <= 4
    ) {
      const key = kvMatch[1].trim();
      const val = kvMatch[2].trim();

      return (
        <div key={`kv-${index}`} className="my-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-xs">
          <span className="font-bold text-primary">{key}:</span>
          <span className="font-mono font-semibold text-foreground bg-background px-2 py-0.5 rounded border border-border">{parseInline(val)}</span>
        </div>
      );
    }

    // Check for divider lines like "-------------------" or "==="
    if (/^[-=]{3,}$/.test(trimmed)) {
      return (
        <div key={`div-${index}`} className="my-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <Sparkles className="h-3.5 w-3.5 text-primary/60" />
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
      );
    }

    // Check for ordered list item "1. ", "2. ", "1) ", "2) "
    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.*)/);
    if (numMatch) {
      const numStr = numMatch[1];
      const listText = numMatch[2];
      return (
        <div key={`num-item-${index}`} className="flex items-start gap-2.5 my-2 pl-1 text-xs sm:text-sm">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-mono font-bold shrink-0 mt-0.5 border border-primary/30 shadow-xs">
            {numStr}
          </span>
          <span className="flex-1 leading-relaxed text-foreground/90">{parseInline(listText)}</span>
        </div>
      );
    }

    // Check for list item "- " or "* "
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const listText = trimmed.substring(2);
      return (
        <div key={`item-${index}`} className="flex items-start gap-2.5 my-2 pl-1 text-xs sm:text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          <span className="flex-1 leading-relaxed text-foreground/90">{parseInline(listText)}</span>
        </div>
      );
    }

    // Default text line
    return (
      <p key={`p-${index}`} className="my-2 leading-relaxed text-xs sm:text-sm text-foreground/90">
        {parseInline(line)}
      </p>
    );
  };

  // Helper to render Markdown Table blocks
  const renderTableBlock = (tableLines: string[], blockIndex: number) => {
    if (tableLines.length === 0) return null;

    const parsedRows = tableLines.map((line) =>
      line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim())
    );

    // First line is header
    const headerCells = parsedRows[0] || [];
    // Filter out separator lines like |---|---|
    const bodyRows = parsedRows.slice(1).filter((row) => !row.every((cell) => /^[-:\s]+$/.test(cell)));

    return (
      <div key={`table-${blockIndex}`} className="my-5 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
        <div className="flex items-center gap-2 bg-muted/40 px-4 py-2 border-b border-border/60 text-xs font-semibold text-muted-foreground">
          <TableIcon className="h-3.5 w-3.5 text-primary" />
          <span>Structured Comparison Table</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/60 text-foreground font-bold">
                {headerCells.map((hCell, hIdx) => (
                  <th key={hIdx} className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-primary border-r border-border/40 last:border-r-0">
                    {parseInline(hCell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className="transition-colors hover:bg-primary/5 odd:bg-card even:bg-muted/20">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-3 text-foreground/90 border-r border-border/40 last:border-r-0 leading-relaxed font-sans">
                      {parseInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Main block parser (handles ```mermaid, ```code, markdown tables, and regular line blocks)
  const renderBlocks = () => {
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const blocks: React.ReactNode[] = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    // Helper to process non-code text line-by-line while grouping markdown table blocks
    const processTextSegment = (textSegment: string, baseIdx: number) => {
      const lines = textSegment.split("\n");
      let tableBuffer: string[] = [];

      lines.forEach((line, lIdx) => {
        const trimmed = line.trim();
        const isTableLine = (trimmed.startsWith("|") && trimmed.includes("|", 1)) || /^[^|\n]+\|[^|\n]+\|/.test(trimmed);

        if (isTableLine) {
          tableBuffer.push(trimmed);
        } else {
          if (tableBuffer.length > 0) {
            blocks.push(renderTableBlock(tableBuffer, baseIdx + lIdx));
            tableBuffer = [];
          }
          if (trimmed) {
            blocks.push(renderStepRow(line, baseIdx + lIdx));
          }
        }
      });

      if (tableBuffer.length > 0) {
        blocks.push(renderTableBlock(tableBuffer, baseIdx + lines.length));
      }
    };

    while ((match = codeBlockRegex.exec(processedContent)) !== null) {
      const textBefore = processedContent.substring(lastIdx, match.index);
      if (textBefore) {
        processTextSegment(textBefore, lastIdx);
      }

      const rawBlock = match[1].trim();
      const firstLineEnd = rawBlock.indexOf("\n");
      let lang = "";
      let blockBody = rawBlock;

      if (firstLineEnd !== -1) {
        lang = rawBlock.slice(0, firstLineEnd).trim().toLowerCase();
        blockBody = rawBlock.slice(firstLineEnd + 1).trim();
      }

      // Check if diagram block (mermaid or diagram)
      if (lang === "mermaid" || lang === "diagram") {
        blocks.push(
          <MermaidDiagram key={`diagram-block-${match.index}`} code={blockBody} />
        );
      } else {
        // Standard Code Snippet Block
        blocks.push(
          <div key={`code-block-${match.index}`} className="my-3 rounded-xl border border-border bg-muted/30 p-3.5 shadow-inner">
            <div className="flex items-center gap-1.5 pb-2 border-b border-border/60 text-[10px] font-mono text-muted-foreground mb-2">
              <Terminal className="h-3.5 w-3.5 text-primary" />
              <span className="uppercase tracking-wider font-semibold">{lang || "Execution Code Snippet"}</span>
            </div>
            <pre className="font-mono text-xs text-foreground overflow-x-auto leading-relaxed">{blockBody}</pre>
          </div>
        );
      }

      lastIdx = codeBlockRegex.lastIndex;
    }

    const remainingText = processedContent.substring(lastIdx);
    if (remainingText) {
      processTextSegment(remainingText, lastIdx);
    }

    return blocks;
  };

  return (
    <div className={cn("space-y-1 font-sans", className)}>
      {renderBlocks()}

      {/* Lightbox Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white bg-white/10 rounded-full backdrop-blur-sm cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
            />
            {selectedImage.alt && (
              <p className="mt-3 text-sm text-white/90 text-center font-medium bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-sm">
                {selectedImage.alt}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
