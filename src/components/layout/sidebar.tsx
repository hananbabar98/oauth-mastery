"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Shield, Zap, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { navigation, type NavItem } from "@/lib/nav";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const BADGE_VARIANTS: Record<string, "success" | "warning" | "info" | "default"> = {
  "Recommended": "success",
  "Deprecated": "warning",
  "Interactive": "info",
  "Start here": "info",
};

function NavGroup({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => {
    if (!item.children) return false;
    return item.children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"));
  });

  const isActive = pathname === item.href;
  const isParentActive = item.children?.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"));

  if (!item.children) {
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-all duration-150 min-h-[44px]",
          depth > 0 && "ml-3 border-l border-border pl-4",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
      >
        <span>{item.title}</span>
        {item.badge && (
          <Badge variant={BADGE_VARIANTS[item.badge] || "default"} className="text-[10px] px-1.5 py-0 shrink-0 self-center">
            {item.badge}
          </Badge>
        )}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 min-h-[44px]",
          isParentActive
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
      >
        <span>{item.title}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="pt-1 pb-2 space-y-0.5">
              {item.children.map((child) => (
                <NavGroup key={child.href} item={child} depth={depth + 1} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
  return (
    <aside className={cn(
      mobile ? "flex w-full" : "hidden lg:flex w-64",
      "flex-col shrink-0 border-r bg-background/50 backdrop-blur-sm"
    )}>
      <div className="flex h-16 items-center px-6 border-b gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">OAuth Mastery</span>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => (
            <NavGroup key={item.href} item={item} />
          ))}
        </nav>

        <div className="mt-6 pt-6 border-t">
          <div className="px-3 py-2 rounded-md bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">OAuth 2.1 is Here</span>
            </div>
            <p className="text-xs text-muted-foreground">PKCE is now required for all flows. See what changed.</p>
            <Link href="/oauth-21" className="text-xs text-primary hover:underline mt-1 inline-block">
              Learn more →
            </Link>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
