"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight, FileText, Shield, Wrench, BookOpen, Zap, Code2 } from "lucide-react";
import Fuse from "fuse.js";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/layout/scroll-reveal";
import { searchIndex } from "@/lib/nav";
import { cn } from "@/lib/utils";

const fuse = new Fuse(searchIndex, {
  keys: [
    { name: "title", weight: 0.6 },
    { name: "keywords", weight: 0.3 },
    { name: "section", weight: 0.1 },
  ],
  threshold: 0.35,
  includeScore: true,
});

type SearchItem = (typeof searchIndex)[number];

const sectionMeta: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  Overview: {
    icon: <FileText className="w-3.5 h-3.5" />,
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
  },
  Flows: {
    icon: <Zap className="w-3.5 h-3.5" />,
    color: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800",
  },
  Spec: {
    icon: <Code2 className="w-3.5 h-3.5" />,
    color: "text-indigo-700 dark:text-indigo-400",
    bg: "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800",
  },
  Security: {
    icon: <Shield className="w-3.5 h-3.5" />,
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800",
  },
  Guides: {
    icon: <BookOpen className="w-3.5 h-3.5" />,
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800",
  },
  Tools: {
    icon: <Wrench className="w-3.5 h-3.5" />,
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800",
  },
};

function SectionBadge({ section }: { section: string }) {
  const meta = sectionMeta[section] ?? {
    icon: <FileText className="w-3.5 h-3.5" />,
    color: "text-muted-foreground",
    bg: "bg-muted border-border",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border", meta.bg, meta.color)}>
      {meta.icon}
      {section}
    </span>
  );
}

function ResultCard({ item, query, index }: { item: SearchItem; query: string; index: number }) {
  const highlight = (text: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/60 text-inherit rounded-sm px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
    >
      <Link
        href={item.href}
        className="group flex items-start justify-between gap-4 p-4 rounded-lg border bg-card hover:border-primary/50 hover:shadow-sm transition-all"
      >
        <div className="flex flex-col gap-1.5 min-w-0">
          <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
            {highlight(item.title)}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <SectionBadge section={item.section} />
            <span className="text-xs text-muted-foreground truncate font-mono">{item.href}</span>
          </div>
          {item.keywords.length > 0 && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {item.keywords.join(" · ")}
            </p>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
      </Link>
    </motion.div>
  );
}

function groupBySection(items: SearchItem[]) {
  return items.reduce<Record<string, SearchItem[]>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});
}

const SECTION_ORDER = ["Overview", "Flows", "Spec", "Security", "Guides", "Tools"];

function SearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = useCallback((q: string) => {
    const trimmed = q.trim();
    if (trimmed.length > 0) {
      const res = fuse.search(trimmed).map((r) => r.item);
      setResults(res);
      setHasSearched(true);
    } else {
      setResults([]);
      setHasSearched(false);
    }
  }, []);

  // Sync URL param → state on first load
  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setQuery(q);
    runSearch(q);
  }, [searchParams, runSearch]);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    runSearch(val);
    // Update URL without triggering a navigation
    const params = new URLSearchParams();
    if (val.trim()) params.set("q", val.trim());
    router.replace(`/search${params.toString() ? `?${params}` : ""}`, { scroll: false });
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    router.replace("/search", { scroll: false });
    inputRef.current?.focus();
  };

  // Browse mode: show all items grouped by section when no query
  const browseGroups = groupBySection(searchIndex);
  const resultGroups = groupBySection(results);

  const isSearching = query.trim().length > 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 lg:py-16">
      {/* Header */}
      <ScrollReveal>
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
            <Search className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Search</h1>
          <p className="text-muted-foreground">
            Find flows, guides, security topics, and tools across all of OAuth Mastery.
          </p>
        </div>
      </ScrollReveal>

      {/* Search Input */}
      <ScrollReveal delay={0.05}>
        <div className="relative mb-8">
          <div className="flex items-center gap-3 border-2 rounded-xl px-4 h-14 bg-background focus-within:border-primary transition-colors shadow-sm">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={handleChange}
              placeholder="Search OAuth topics, flows, security issues…"
              className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              aria-label="Search"
            />
            <div className="flex items-center gap-2">
              {query && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClear} aria-label="Clear search">
                  <X className="h-4 w-4" />
                </Button>
              )}
              <kbd className="hidden sm:inline-flex text-xs text-muted-foreground border rounded-md px-1.5 py-0.5 bg-muted">
                Esc
              </kbd>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Results or Browse */}
      <AnimatePresence mode="wait">
        {isSearching ? (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Result count */}
            <p className="text-sm text-muted-foreground mb-5">
              {results.length === 0 ? (
                <>No results for <span className="font-medium text-foreground">"{query}"</span></>
              ) : (
                <>{results.length} result{results.length !== 1 ? "s" : ""} for{" "}
                  <span className="font-medium text-foreground">"{query}"</span></>
              )}
            </p>

            {results.length === 0 ? (
              /* Empty state */
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 border rounded-xl bg-muted/30"
              >
                <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="font-medium mb-1">No results found</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Try searching for "PKCE", "refresh token", "redirect URI", or "JWT"
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {["PKCE", "refresh token", "CSRF", "JWT", "device flow"].map((s) => (
                    <Button
                      key={s}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setQuery(s);
                        runSearch(s);
                        router.replace(`/search?q=${encodeURIComponent(s)}`, { scroll: false });
                      }}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </motion.div>
            ) : (
              /* Grouped results */
              <div className="space-y-8">
                {SECTION_ORDER.filter((s) => resultGroups[s]).map((section) => (
                  <div key={section}>
                    <div className="flex items-center gap-2 mb-3">
                      <SectionBadge section={section} />
                      <span className="text-xs text-muted-foreground">
                        {resultGroups[section].length} result{resultGroups[section].length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {resultGroups[section].map((item, i) => (
                        <ResultCard key={item.href} item={item} query={query} index={i} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          /* Browse all — no query */
          <motion.div key="browse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-sm text-muted-foreground mb-5">
              Browse all {searchIndex.length} topics
            </p>
            <div className="space-y-8">
              {SECTION_ORDER.filter((s) => browseGroups[s]).map((section) => (
                <ScrollReveal key={section}>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <SectionBadge section={section} />
                    </div>
                    <div className="space-y-2">
                      {browseGroups[section].map((item, i) => (
                        <ResultCard key={item.href} item={item} query="" index={i} />
                      ))}
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto px-4 py-16 text-center text-muted-foreground">
          Loading search…
        </div>
      }
    >
      <SearchPageInner />
    </Suspense>
  );
}
