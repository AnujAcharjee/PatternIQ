"use client";

import { useState } from "react";
import { Copy, Check, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeViewerProps {
  code: string;
  language?: string;
  title?: string;
  className?: string;
  showLineNumbers?: boolean;
  compact?: boolean;
  fontSize?: string;
}

// Tokenize a line of pseudocode for rich syntax highlighting
function highlightPseudocodeLine(line: string) {
  // If whole line is comment
  if (line.trim().startsWith("//") || line.trim().startsWith("#")) {
    return <span className="text-emerald-400/80 italic">{line}</span>;
  }

  // Regex pattern matching different tokens
  // 1: Comments (//...)
  // 2: Strings ("..." or '...')
  // 3: Keywords
  // 4: Numbers
  // 5: Boolean/Null
  // 6: Operators
  const tokenRegex =
    /(\/\/.*$)|("[^"]*"|'[^']*')|\b(function|def|return|while|for|if|else|elif|and|or|not|in|to|down|from|let|const|var|new|class)\b|\b(\d+)\b|\b(true|false|null|None|undefined)\b|([=<>!+\-*\/]+)/g;

  const elements: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(line)) !== null) {
    const start = match.index;
    const matchedText = match[0];

    // Push text preceding the match
    if (start > lastIndex) {
      elements.push(line.slice(lastIndex, start));
    }

    if (match[1]) {
      // Comment
      elements.push(
        <span key={start} className="text-emerald-400/80 italic">
          {matchedText}
        </span>
      );
    } else if (match[2]) {
      // String
      elements.push(
        <span key={start} className="text-emerald-300">
          {matchedText}
        </span>
      );
    } else if (match[3]) {
      // Keyword
      elements.push(
        <span key={start} className="text-purple-400 font-semibold">
          {matchedText}
        </span>
      );
    } else if (match[4]) {
      // Number
      elements.push(
        <span key={start} className="text-amber-300 font-mono">
          {matchedText}
        </span>
      );
    } else if (match[5]) {
      // Boolean / Null
      elements.push(
        <span key={start} className="text-orange-400 font-semibold">
          {matchedText}
        </span>
      );
    } else if (match[6]) {
      // Operators
      elements.push(
        <span key={start} className="text-pink-400">
          {matchedText}
        </span>
      );
    }

    lastIndex = start + matchedText.length;
  }

  if (lastIndex < line.length) {
    elements.push(line.slice(lastIndex));
  }

  return elements;
}

export function CodeViewer({
  code,
  language = "pseudocode",
  title,
  className,
  showLineNumbers = true,
  compact = false,
  fontSize,
}: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.trim().split("\n");

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-[#0d1117] text-[#e6edf3] shadow-lg overflow-hidden font-mono text-xs",
        compact && "text-[10px] leading-[1.35]",
        fontSize,
        className
      )}
    >
      {/* Editor Top Bar */}
      <div
        className={cn(
          "flex items-center justify-between bg-[#161b22] border-b border-[#30363d] select-none",
          compact ? "px-3 py-1.5" : "px-4 py-2.5"
        )}
      >
        <div className="flex items-center gap-2">
          {/* Window dots */}
          <div className="flex items-center gap-1.2">
            <span className={cn("rounded-full bg-[#ff5f56]/90 inline-block", compact ? "h-2 w-2" : "h-2.5 w-2.5")} />
            <span className={cn("rounded-full bg-[#ffbd2e]/90 inline-block", compact ? "h-2 w-2" : "h-2.5 w-2.5")} />
            <span className={cn("rounded-full bg-[#27c93f]/90 inline-block", compact ? "h-2 w-2" : "h-2.5 w-2.5")} />
          </div>

          <div className="h-3 w-px bg-border/40 mx-0.5" />

          <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
            <Terminal className="h-3 w-3 text-primary" />
            <span className="text-[#8b949e]">
              {title || (language === "pseudocode" ? "pseudocode.algo" : `${language}`)}
            </span>
          </div>
        </div>

        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-1 rounded-md font-sans font-medium transition-all cursor-pointer",
            compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
            copied
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              : "bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] hover:text-white"
          )}
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body with Line Numbers & Colorful Syntax */}
      <div className={cn(compact ? "overflow-hidden p-2.5 leading-[1.38]" : "overflow-x-auto p-4 leading-relaxed")}>
        <div className="w-full inline-block">
          {lines.map((line, idx) => (
            <div
              key={idx}
              className={cn(
                "flex hover:bg-[#161b22]/70 rounded transition-colors",
                compact ? "-mx-2 px-2 py-0" : "-mx-4 px-4 py-0.5"
              )}
            >
              {showLineNumbers && (
                <span
                  className={cn(
                    "shrink-0 select-none text-right text-[#484f58] font-mono",
                    compact ? "w-5 pr-2 text-[9.5px]" : "w-8 pr-4 text-[11px]"
                  )}
                >
                  {idx + 1}
                </span>
              )}
              <span className="flex-1 whitespace-pre text-[#c9d1d9]">
                {highlightPseudocodeLine(line)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
