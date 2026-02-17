"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Smartphone,
  Globe,
  Server,
  ShieldAlert,
  Clock,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ScrollReveal, StaggerReveal } from "@/components/layout/scroll-reveal";

interface PathCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  difficultyVariant: "success" | "warning" | "destructive";
  href: string;
  topics: string[];
}

const paths: PathCard[] = [
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: "Beginner — Web Apps",
    description:
      "Start here if OAuth is new to you. Build a complete web app login flow in 30 minutes. Covers the core concepts, actors, and Authorization Code + PKCE from scratch.",
    time: "30 min",
    difficulty: "Beginner",
    difficultyVariant: "success",
    href: "/paths/beginner",
    topics: ["OAuth actors", "Authorization Code + PKCE", "Scopes", "Access & Refresh tokens", "Common pitfalls"],
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: "Mobile Developer",
    description:
      "iOS/Android OAuth with PKCE, secure token storage, and biometric auth. Learn AppAuth, custom URI schemes vs Universal Links, and Keychain/Keystore patterns.",
    time: "45 min",
    difficulty: "Intermediate",
    difficultyVariant: "warning",
    href: "/paths/mobile",
    topics: ["AppAuth library", "PKCE for mobile", "Keychain & Keystore", "Universal Links", "Biometric auth"],
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "SPA Developer",
    description:
      "Browser-based OAuth challenges, token storage tradeoffs, and silent auth. Understand why SPAs cannot use client secrets and the best strategies to stay secure.",
    time: "40 min",
    difficulty: "Intermediate",
    difficultyVariant: "warning",
    href: "/paths/spa",
    topics: ["Token storage options", "BFF pattern", "CSP headers", "Silent auth", "React / Vue / Angular SDKs"],
  },
  {
    icon: <Server className="w-6 h-6" />,
    title: "Backend / API Developer",
    description:
      "Service-to-service auth, token validation, introspection, and rate limiting. Master Client Credentials flow and JWT validation for production APIs.",
    time: "50 min",
    difficulty: "Intermediate",
    difficultyVariant: "warning",
    href: "/paths/backend",
    topics: ["Client Credentials", "JWT validation", "Token introspection", "Rate limiting", "Kubernetes secrets"],
  },
  {
    icon: <ShieldAlert className="w-6 h-6" />,
    title: "Security Specialist",
    description:
      "Threat modeling OAuth flows, complete attack taxonomy, and hardening checklist. Learn CSRF, PKCE downgrade, token theft, redirect URI attacks, and mix-up attacks.",
    time: "60 min",
    difficulty: "Advanced",
    difficultyVariant: "destructive",
    href: "/paths/security",
    topics: ["Threat modeling", "Attack taxonomy", "OWASP OAuth", "Pentest methodology", "Hardening checklist"],
  },
];

const difficultyColors: Record<string, string> = {
  Beginner: "text-emerald-900 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
  Intermediate: "text-amber-900 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
  Advanced: "text-red-900 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",
};

export default function LearningPathsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <ScrollReveal>
        <div className="mb-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">Learning Paths</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Choose Your Learning Path
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            OAuth can mean very different things depending on what you are building. Pick the path that
            matches your role and we will guide you through the concepts, code, and security considerations
            that matter most to you.
          </p>
        </div>
      </ScrollReveal>

      {/* Recommendation banner */}
      <ScrollReveal delay={0.1}>
        <div className="mb-8 flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <BookOpen className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">New to OAuth?</p>
            <p className="text-sm text-muted-foreground">
              Start with the{" "}
              <Link href="/paths/beginner" className="text-primary underline underline-offset-2 hover:no-underline font-medium">
                Beginner — Web Apps
              </Link>{" "}
              path. It builds a complete mental model in 30 minutes and prepares you for any of the specialized
              paths.
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* Path cards */}
      <StaggerReveal className="grid gap-6 sm:grid-cols-1 lg:grid-cols-1">
        {paths.map((path) => (
          <motion.div
            key={path.href}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="group hover:border-primary/40 transition-colors duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                      {path.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg leading-tight">{path.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border ${difficultyColors[path.difficulty]}`}
                        >
                          {path.difficulty}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {path.time}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button asChild size="sm" className="shrink-0">
                    <Link href={path.href}>
                      Start Path
                      <ArrowRight className="ml-1.5 w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed mb-4">
                  {path.description}
                </CardDescription>
                <div className="flex flex-wrap gap-1.5">
                  {path.topics.map((topic) => (
                    <Badge key={topic} variant="secondary" className="text-xs font-normal">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </StaggerReveal>

      {/* Footer note */}
      <ScrollReveal delay={0.3}>
        <div className="mt-10 pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground">
            All paths use real-world code examples and are kept up to date with{" "}
            <Link href="/oauth-21" className="text-primary underline underline-offset-2 hover:no-underline">
              OAuth 2.1
            </Link>
            . PKCE is used throughout — it is now required for all public clients.
          </p>
        </div>
      </ScrollReveal>
    </div>
  );
}
