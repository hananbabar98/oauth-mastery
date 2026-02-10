"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollReveal, StaggerReveal } from "@/components/layout/scroll-reveal";
import {
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Server,
  Tv,
  RefreshCw,
  GitBranch,
  Zap,
} from "lucide-react";

interface FlowCard {
  slug: string;
  name: string;
  badge: string;
  badgeVariant: "success" | "destructive" | "info" | "warning" | "default";
  icon: React.ReactNode;
  iconBg: string;
  description: string;
  whenToUse: string;
}

const flows: FlowCard[] = [
  {
    slug: "authorization-code",
    name: "Authorization Code + PKCE",
    badge: "Recommended",
    badgeVariant: "success",
    icon: <ShieldCheck className="w-6 h-6" />,
    iconBg: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    description:
      "The most secure grant type. Separates token exchange from the browser using a short-lived authorization code and PKCE for cryptographic protection.",
    whenToUse:
      "Web apps, single-page apps, mobile apps — any time a user needs to grant access to their resources.",
  },
  {
    slug: "implicit",
    name: "Implicit Flow",
    badge: "Deprecated",
    badgeVariant: "destructive",
    icon: <AlertTriangle className="w-6 h-6" />,
    iconBg: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    description:
      "Originally designed for browser-based SPAs that couldn't keep secrets. Access tokens were returned directly in URL fragments — now known to be insecure.",
    whenToUse:
      "Do not use. Migrate to Authorization Code + PKCE. Documented here for historical context.",
  },
  {
    slug: "client-credentials",
    name: "Client Credentials",
    badge: "Machine-to-Machine",
    badgeVariant: "info",
    icon: <Server className="w-6 h-6" />,
    iconBg: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    description:
      "No user involved. A service authenticates directly with the Authorization Server using its client_id and client_secret to obtain an access token.",
    whenToUse:
      "Microservices, CI/CD pipelines, scheduled jobs, backend APIs calling other APIs.",
  },
  {
    slug: "device",
    name: "Device Authorization",
    badge: "Smart TVs & CLIs",
    badgeVariant: "warning",
    icon: <Tv className="w-6 h-6" />,
    iconBg: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    description:
      "For devices that cannot open a browser or have limited input capability. The device shows a code; the user enters it on a secondary device to authorize.",
    whenToUse:
      "Smart TVs, CLI tools (GitHub CLI), game consoles, IoT devices, set-top boxes.",
  },
  {
    slug: "refresh-token",
    name: "Refresh Token",
    badge: "Token Lifecycle",
    badgeVariant: "default",
    icon: <RefreshCw className="w-6 h-6" />,
    iconBg: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    description:
      "Access tokens are short-lived. Refresh tokens allow obtaining new access tokens silently without requiring the user to re-authenticate.",
    whenToUse:
      "Any application that needs long-lived sessions beyond the access token lifetime (typically 15min–1hr).",
  },
];

export default function FlowsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <ScrollReveal>
            <div className="flex items-center gap-2 mb-4">
              <GitBranch className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Interactive Diagrams
              </span>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.05}>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Flow Explorer
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Click any flow to see animated step-by-step diagrams with exact HTTP requests
              and responses.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <div className="flex items-center gap-2 mt-6 text-sm text-muted-foreground">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>All examples use realistic data — copy and adapt for your implementation.</span>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Flow Cards Grid */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {flows.map((flow) => (
            <Link key={flow.slug} href={`/flows/${flow.slug}`} className="group block">
              <motion.div
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card className="h-full cursor-pointer border-2 hover:border-primary/40 transition-colors duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className={`p-2.5 rounded-lg ${flow.iconBg} shrink-0`}>
                        {flow.icon}
                      </div>
                      <Badge variant={flow.badgeVariant} className="shrink-0 mt-0.5">
                        {flow.badge}
                      </Badge>
                    </div>
                    <div className="mt-3">
                      <h2 className="text-lg font-semibold tracking-tight group-hover:text-primary transition-colors">
                        {flow.name}
                      </h2>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {flow.description}
                    </p>
                    <div className="rounded-md bg-muted/60 p-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        When to use
                      </p>
                      <p className="text-sm text-foreground/80">{flow.whenToUse}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-4 text-sm font-medium text-primary">
                      <span>Explore flow</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>
          ))}
        </StaggerReveal>

        {/* Bottom hint */}
        <ScrollReveal delay={0.3}>
          <div className="mt-12 rounded-xl border bg-muted/30 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Each flow page includes{" "}
              <span className="font-medium text-foreground">interactive step diagrams</span>,{" "}
              <span className="font-medium text-foreground">real HTTP request/response examples</span>, and{" "}
              <span className="font-medium text-foreground">copy-ready code</span> in multiple languages.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
