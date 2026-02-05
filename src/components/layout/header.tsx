"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Search, X, Shield, Moon, Sun } from "lucide-react";
import Fuse from "fuse.js";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { searchIndex } from "@/lib/nav";

const fuse = new Fuse(searchIndex, {
  keys: ["title", "keywords", "section"],
  threshold: 0.3,
  includeScore: true,
});

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(isDark);
    if (isDark) document.documentElement.classList.add("dark");
  }, []);

  const toggle = () => {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
      return next;
    });
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggle} className="h-9 w-9">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<typeof searchIndex>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (query.length > 1) {
      const res = fuse.search(query).slice(0, 6).map((r) => r.item);
      setResults(res);
      setOpen(true);
    } else {
      setResults([]);
      setOpen(false);
    }
  }, [query]);

  const handleSelect = (href: string) => {
    router.push(href);
    setQuery("");
    setOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative flex-1 max-w-sm">
      <div className="flex items-center gap-2 border rounded-md px-3 h-9 bg-muted/50 focus-within:border-primary transition-colors">
        <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <kbd className="hidden sm:inline-flex text-[10px] text-muted-foreground border rounded px-1">⌘K</kbd>
        {query && (
          <button onClick={() => { setQuery(""); setOpen(false); }}>
            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full rounded-md border shadow-lg z-50 overflow-hidden" style={{ backgroundColor: 'hsl(var(--popover))' }}>
          {results.map((item) => (
            <button
              key={item.href}
              onClick={() => handleSelect(item.href)}
              className="flex flex-col w-full px-3 py-2 text-left hover:bg-accent transition-colors"
            >
              <span className="text-sm font-medium">{item.title}</span>
              <span className="text-xs text-muted-foreground">{item.section}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 lg:px-6">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              OAuth Mastery
            </SheetTitle>
          </SheetHeader>
          <Sidebar mobile />
        </SheetContent>
      </Sheet>

      {/* Logo (mobile) */}
      <Link href="/" className="lg:hidden flex items-center gap-2 font-bold">
        <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
          <Shield className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        OAuth Mastery
      </Link>

      <div className="flex-1 flex items-center justify-end gap-2">
        <SearchBar />
        <ThemeToggle />
      </div>
    </header>
  );
}
