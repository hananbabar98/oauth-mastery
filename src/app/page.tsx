"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield, ArrowRight, Key, Server, User, Smartphone,
  Lock, Zap, AlertTriangle, CheckCircle, Code, BookOpen, Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollReveal } from "@/components/layout/scroll-reveal";

const ACTORS = [
  {
    icon: User,
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/20",
    name: "Resource Owner",
    description: "The user who owns the data and grants permission. They decide what the application can access.",
    example: "You, logging in to a third-party app with your Google account.",
  },
  {
    icon: Smartphone,
    color: "text-purple-500",
    bg: "bg-purple-500/10 border-purple-500/20",
    name: "Client",
    description: "The application requesting access to resources on behalf of the Resource Owner.",
    example: "A photo printing app that wants to read your Google Photos.",
  },
  {
    icon: Shield,
    color: "text-green-500",
    bg: "bg-green-500/10 border-green-500/20",
    name: "Authorization Server",
    description: "Issues access tokens after authenticating the user and obtaining their consent.",
    example: "Google's OAuth server at accounts.google.com.",
  },
  {
    icon: Server,
    color: "text-orange-500",
    bg: "bg-orange-500/10 border-orange-500/20",
    name: "Resource Server",
    description: "The API that holds the protected resources. Validates access tokens on every request.",
    example: "Google Photos API at photos.googleapis.com.",
  },
];

const FLOWS = [
  { name: "Authorization Code + PKCE", href: "/flows/authorization-code", badge: "Recommended", badgeVariant: "success" as const, desc: "For web apps, SPAs, and mobile apps. The most secure flow." },
  { name: "Client Credentials", href: "/flows/client-credentials", badge: "M2M", badgeVariant: "info" as const, desc: "Service-to-service communication with no user interaction." },
  { name: "Device Authorization", href: "/flows/device", badge: "IoT/CLI", badgeVariant: "secondary" as const, desc: "For devices without browsers: smart TVs, CLIs, IoT." },
  { name: "Refresh Token Flow", href: "/flows/refresh-token", badge: "All flows", badgeVariant: "secondary" as const, desc: "Renew access tokens without re-authenticating the user." },
  { name: "Implicit Flow", href: "/flows/implicit", badge: "Deprecated", badgeVariant: "warning" as const, desc: "Legacy — understand it to recognize and avoid it." },
];

const PATHS = [
  { icon: BookOpen, name: "Beginner", href: "/paths/beginner", color: "bg-blue-500", desc: "New to OAuth? Start here.", time: "~30 min" },
  { icon: Smartphone, name: "Mobile Dev", href: "/paths/mobile", color: "bg-purple-500", desc: "iOS & Android OAuth patterns.", time: "~45 min" },
  { icon: Code, name: "SPA Dev", href: "/paths/spa", color: "bg-green-500", desc: "Browser-based token storage & auth.", time: "~40 min" },
  { icon: Server, name: "Backend/API", href: "/paths/backend", color: "bg-orange-500", desc: "Token validation, M2M, rate limiting.", time: "~50 min" },
  { icon: Shield, name: "Security", href: "/paths/security", color: "bg-red-500", desc: "Threat modeling & attack mitigations.", time: "~60 min" },
];

function ActorFlow() {
  return (
    <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 p-6 rounded-xl bg-muted/50 border overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent pointer-events-none" />
      {[
        { label: "Resource Owner", icon: User, color: "#3b82f6" },
        { label: "Client App", icon: Smartphone, color: "#8b5cf6" },
        { label: "Auth Server", icon: Shield, color: "#22c55e" },
        { label: "Resource Server", icon: Server, color: "#f97316" },
      ].map((actor, i) => (
        <React.Fragment key={actor.label}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-2 z-10"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center border-2"
              style={{ background: actor.color + "20", borderColor: actor.color + "40" }}
            >
              <actor.icon className="w-5 h-5" style={{ color: actor.color }} />
            </div>
            <span className="text-xs font-medium text-center">{actor.label}</span>
          </motion.div>
          {i < 3 && (
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: i * 0.15 + 0.2, duration: 0.4 }}
              className="hidden md:flex items-center gap-1 flex-1 min-w-0"
            >
              <div className="flex-1 h-px bg-linear-to-r from-border to-primary/40" />
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </motion.div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-20">
      {/* Hero */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-muted/50 text-sm text-muted-foreground">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span>OAuth 2.1 draft — PKCE now required for all flows</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Master OAuth{" "}
            <span className="text-primary">2.0 / 2.1</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From first principles to production-ready implementation. Interactive diagrams,
            live code playgrounds, and security checklists — not just theory.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/paths/beginner">
                Start Learning <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/flows">
                <Play className="mr-1 w-4 h-4" /> Explore Flows
              </Link>
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <Link href="/playground">
                <Key className="mr-1 w-4 h-4" /> Playground
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* What is OAuth */}
      <ScrollReveal>
        <section className="space-y-6">
          <div className="max-w-3xl">
            <Badge variant="info" className="mb-3">The Basics</Badge>
            <h2 className="text-3xl font-bold mb-4">What is OAuth?</h2>
            <p className="text-lg text-muted-foreground">
              OAuth is an <strong className="text-foreground">authorization framework</strong> that lets applications
              access resources on behalf of a user — without ever seeing the user&apos;s password.
            </p>
          </div>

          <Alert variant="info">
            <Key className="h-4 w-4" />
            <AlertTitle>The Hotel Key Card Analogy</AlertTitle>
            <AlertDescription>
              Instead of giving a visitor your master key (your password), you give them a hotel key card
              (an access token) that only opens specific doors, expires automatically, and can be revoked
              at any time. That&apos;s exactly what OAuth does.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Lock, title: "No Credential Sharing", desc: "Third-party apps never see your password. They get a scoped, revocable access token instead." },
              { icon: Shield, title: "Scoped Access", desc: "Tokens carry exactly the permissions granted — nothing more. A read-only token cannot delete your data." },
              { icon: Zap, title: "Revocable", desc: "Revoke a token instantly without changing your password. Compromise a token, not your entire account." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <Card className="h-full">
                  <CardContent className="p-5">
                    <item.icon className="w-6 h-6 text-primary mb-3" />
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* Four Actors */}
      <ScrollReveal>
        <section className="space-y-6">
          <div>
            <Badge variant="info" className="mb-3">Core Concepts</Badge>
            <h2 className="text-3xl font-bold mb-2">The Four Actors</h2>
            <p className="text-muted-foreground">Every OAuth flow involves exactly these four parties.</p>
          </div>
          <ActorFlow />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ACTORS.map((actor, i) => (
              <motion.div
                key={actor.name}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 + 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <Card className={`border ${actor.bg} h-full`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${actor.bg} shrink-0`}>
                        <actor.icon className={`w-5 h-5 ${actor.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{actor.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{actor.description}</p>
                        <p className="text-xs text-muted-foreground italic">
                          <span className="font-medium not-italic text-foreground">Example: </span>
                          {actor.example}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* Flows */}
      <ScrollReveal>
        <section className="space-y-6">
          <div>
            <Badge variant="info" className="mb-3">Grant Types</Badge>
            <h2 className="text-3xl font-bold mb-2">OAuth Flows</h2>
            <p className="text-muted-foreground">
              Different use cases require different flows. Choosing the right one is critical for security.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {FLOWS.map((flow, i) => (
              <motion.div
                key={flow.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link href={flow.href} className="block group">
                  <Card className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge variant={flow.badgeVariant} className="shrink-0">{flow.badge}</Badge>
                        <div>
                          <span className="font-medium">{flow.name}</span>
                          <p className="text-sm text-muted-foreground">{flow.desc}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="text-center">
            <Button variant="outline" asChild>
              <Link href="/playground">
                Not sure which flow? Use the Decision Tree →
              </Link>
            </Button>
          </div>
        </section>
      </ScrollReveal>

      {/* Learning Paths */}
      <ScrollReveal>
        <section className="space-y-6">
          <div>
            <Badge variant="info" className="mb-3">Learning Paths</Badge>
            <h2 className="text-3xl font-bold mb-2">Choose Your Path</h2>
            <p className="text-muted-foreground">Targeted guides based on your role and use case.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PATHS.map((path, i) => (
              <motion.div
                key={path.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link href={path.href} className="block group">
                  <Card className="h-full hover:border-primary/50 transition-all">
                    <CardContent className="p-5">
                      <div className={`w-8 h-8 rounded-lg ${path.color} flex items-center justify-center mb-3`}>
                        <path.icon className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{path.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{path.desc}</p>
                      <span className="text-xs text-muted-foreground">{path.time}</span>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* OAuth 2.1 Callout */}
      <ScrollReveal>
        <section>
          <div className="rounded-xl border bg-linear-to-br from-primary/5 via-transparent to-transparent p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-primary" />
                  <Badge variant="warning">New in OAuth 2.1</Badge>
                </div>
                <h2 className="text-2xl font-bold mb-3">Upgrading from OAuth 2.0?</h2>
                <p className="text-muted-foreground mb-4">
                  OAuth 2.1 consolidates years of security best practices. PKCE is now required
                  for all authorization code flows. Implicit flow is removed. Redirect URIs require
                  exact matching.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["PKCE Required", "No Implicit Flow", "Exact URI Matching", "Token Rotation", "No ROPC"].map((tag) => (
                    <span key={tag} className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
                      ✓ {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="shrink-0">
                <Button asChild size="lg">
                  <Link href="/oauth-21">See All Changes <ArrowRight className="ml-1 w-4 h-4" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Security Pitfalls */}
      <ScrollReveal>
        <section className="space-y-4">
          <div>
            <Badge variant="destructive" className="mb-3">Security First</Badge>
            <h2 className="text-3xl font-bold mb-2">Common Pitfalls</h2>
            <p className="text-muted-foreground">Mistakes that affect real production systems.</p>
          </div>
          <div className="space-y-3">
            {[
              { title: "Tokens in localStorage", desc: "XSS attacks can steal tokens from localStorage. Use memory storage or HttpOnly cookies.", severity: "Critical" },
              { title: "Missing state validation", desc: "Not validating the state parameter on callback enables CSRF attacks against your OAuth flow.", severity: "High" },
              { title: "Wildcard redirect URIs", desc: "Using *.example.com allows attackers to redirect tokens to evil.example.com.", severity: "High" },
              { title: "Not validating JWT claims", desc: "Decoding a JWT is not the same as validating it. Always verify the signature, expiry, iss, and aud.", severity: "Critical" },
            ].map((pitfall) => (
              <Alert key={pitfall.title} variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="flex items-center gap-2">
                  {pitfall.title}
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{pitfall.severity}</Badge>
                </AlertTitle>
                <AlertDescription>{pitfall.desc}</AlertDescription>
              </Alert>
            ))}
          </div>
          <div className="text-center pt-2">
            <Button variant="outline" asChild>
              <Link href="/edge-cases">View Full Edge Case Library <ArrowRight className="ml-1 w-4 h-4" /></Link>
            </Button>
          </div>
        </section>
      </ScrollReveal>

      {/* CTA */}
      <ScrollReveal>
        <section className="text-center py-8">
          <Separator className="mb-8" />
          <h2 className="text-2xl font-bold mb-3">Ready to go deeper?</h2>
          <p className="text-muted-foreground mb-6">
            Use the interactive tools to decode tokens, simulate flows, and audit your implementation.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/playground"><Key className="mr-1 w-4 h-4" /> Open Playground</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/checklist"><CheckCircle className="mr-1 w-4 h-4" /> Security Checklist</Link>
            </Button>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
