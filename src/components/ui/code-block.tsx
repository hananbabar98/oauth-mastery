"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
  highlightLines?: number[];
}

// ─── Syntax highlighter ────────────────────────────────────────────────────
// Approach: find all match positions first, then apply non-overlapping spans
// in priority order so sequential regexes can't corrupt each other.

type Span = { start: number; end: number; color: string };

function collectMatches(re: RegExp, color: string, src: string, out: Span[]) {
  let m: RegExpExecArray | null;
  const r = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  r.lastIndex = 0;
  while ((m = r.exec(src)) !== null) {
    out.push({ start: m.index, end: m.index + m[0].length, color });
    if (m[0].length === 0) r.lastIndex++;
  }
}

function applySpans(src: string, spans: Span[]): string {
  // Sort by position; earlier start wins; skip overlaps
  spans.sort((a, b) => a.start - b.start || a.end - b.end);
  const kept: Span[] = [];
  let pos = 0;
  for (const s of spans) {
    if (s.start >= pos) { kept.push(s); pos = s.end; }
  }
  let out = "";
  let i = 0;
  for (const s of kept) {
    out += src.slice(i, s.start);
    out += `<span style="color:${s.color}">${src.slice(s.start, s.end)}</span>`;
    i = s.end;
  }
  return out + src.slice(i);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlight(code: string, lang: string): string {
  const src = esc(code);
  const spans: Span[] = [];

  if (lang === "javascript" || lang === "js" || lang === "typescript" || lang === "ts") {
    // Priority: comments > strings > keywords > numbers
    collectMatches(/(\/\/[^\n]*)/g,                                                              "#6b7280", src, spans);
    collectMatches(/(\/\*[\s\S]*?\*\/)/g,                                                        "#6b7280", src, spans);
    collectMatches(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g,                  "#4ade80", src, spans);
    collectMatches(/\b(const|let|var|function|async|await|return|import|export|from|type|interface|class|extends|implements|new|if|else|for|while|try|catch|throw|of|in|typeof|instanceof|void|true|false|null|undefined)\b/g, "#c084fc", src, spans);
    collectMatches(/\b(\d+\.?\d*)\b/g,                                                           "#a78bfa", src, spans);

  } else if (lang === "python") {
    collectMatches(/(#[^\n]*)/g,                                                                 "#6b7280", src, spans);
    collectMatches(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|"""[\s\S]*?"""|'''[\s\S]*?''')/g,      "#4ade80", src, spans);
    collectMatches(/\b(def|class|import|from|return|if|elif|else|for|while|try|except|with|as|and|or|not|in|is|lambda|pass|raise|async|await|True|False|None|self)\b/g, "#c084fc", src, spans);
    collectMatches(/\b(\d+\.?\d*)\b/g,                                                           "#a78bfa", src, spans);

  } else if (lang === "go") {
    collectMatches(/(\/\/[^\n]*)/g,                                                              "#6b7280", src, spans);
    collectMatches(/(\/\*[\s\S]*?\*\/)/g,                                                        "#6b7280", src, spans);
    collectMatches(/("(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)/g,                                    "#4ade80", src, spans);
    collectMatches(/\b(func|package|import|var|const|type|struct|interface|map|chan|go|defer|return|if|else|for|range|switch|case|default|break|continue|select|nil|true|false|make|new|append|len|cap|delete|error|string|int|int64|bool|byte)\b/g, "#c084fc", src, spans);
    collectMatches(/\b(\d+\.?\d*)\b/g,                                                           "#a78bfa", src, spans);

  } else if (lang === "json") {
    collectMatches(/("(?:[^"\\]|\\.)*")\s*:/g,                                                   "#60a5fa", src, spans);
    collectMatches(/:\s*("(?:[^"\\]|\\.)*")/g,                                                   "#4ade80", src, spans);
    collectMatches(/\b(true|false|null)\b/g,                                                     "#f97316", src, spans);
    collectMatches(/\b(\d+\.?\d*)\b/g,                                                           "#a78bfa", src, spans);

  } else if (lang === "bash" || lang === "shell") {
    collectMatches(/(#[^\n]*)/g,                                                                 "#6b7280", src, spans);
    collectMatches(/("(?:[^"\\]|\\.)*")/g,                                                       "#fbbf24", src, spans);
    collectMatches(/(\$[\w{][^}\s]*}?)/g,                                                        "#4ade80", src, spans);
    collectMatches(/(\s-{1,2}[\w-]+)/g,                                                          "#60a5fa", src, spans);

  } else if (lang === "http") {
    collectMatches(/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)(\s)/gm,                            "#60a5fa", src, spans);
    collectMatches(/^(HTTP\/[\d.]+\s+\d+[^\n]*)/gm,                                             "#4ade80", src, spans);
    collectMatches(/^([\w-]+):/gm,                                                               "#c084fc", src, spans);
    collectMatches(/(#[^\n]*)/g,                                                                 "#6b7280", src, spans);
    collectMatches(/("(?:[^"\\]|\\.)*")/g,                                                       "#fbbf24", src, spans);
  }

  return applySpans(src, spans);
}

// ─── Language label map ───────────────────────────────────────────────────

const LANGUAGE_LABELS: Record<string, string> = {
  typescript: "TypeScript",
  javascript: "JavaScript",
  ts: "TypeScript",
  js: "JavaScript",
  python: "Python",
  go: "Go",
  bash: "cURL / Bash",
  shell: "Shell",
  json: "JSON",
  http: "HTTP",
};

// ─── Component ────────────────────────────────────────────────────────────

export function CodeBlock({
  code,
  language = "bash",
  filename,
  className,
  highlightLines = [],
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlighted = highlight(code.trim(), language);
  const lines = highlighted.split("\n");

  return (
    <div className={cn("group relative rounded-lg overflow-hidden border bg-zinc-950 dark:bg-zinc-900", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 dark:bg-zinc-800 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          {filename && <span className="text-xs text-zinc-400 ml-2">{filename}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">{LANGUAGE_LABELS[language] || language}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-1 rounded hover:bg-zinc-700"
          >
            {copied ? (
              <><Check className="w-3 h-3 text-green-400" /><span className="text-green-400">Copied!</span></>
            ) : (
              <><Copy className="w-3 h-3" /><span>Copy</span></>
            )}
          </button>
        </div>
      </div>

      {/* Code */}
      <div className="overflow-x-auto code-scroll">
        <pre className="p-4 text-sm leading-relaxed font-mono text-zinc-300">
          <code>
            {lines.map((line, i) => (
              <div
                key={i}
                className={cn(
                  "px-1 -mx-1 rounded",
                  highlightLines.includes(i + 1) && "bg-primary/10 border-l-2 border-primary pl-3 -ml-4"
                )}
                dangerouslySetInnerHTML={{ __html: line || "&nbsp;" }}
              />
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
