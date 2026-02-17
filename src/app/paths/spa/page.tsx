"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronRight,
  Globe,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  Lock,
  RefreshCw,
  Code2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { CodeBlock } from "@/components/ui/code-block";
import { ScrollReveal, StaggerReveal } from "@/components/layout/scroll-reveal";

// ─── Code examples ─────────────────────────────────────────────────────────

const vanillaPKCECode = `// Full PKCE Authorization Code Flow — Vanilla JavaScript
// No dependencies required (uses Web Crypto API)

const CONFIG = {
  clientId:    "YOUR_CLIENT_ID",
  authEndpoint: "https://auth.example.com/authorize",
  tokenEndpoint: "https://auth.example.com/token",
  redirectUri:  window.location.origin + "/callback",
  scopes:       ["openid", "profile", "email"],
};

// ── Utilities ──────────────────────────────────────────────

function base64URLEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function randomBytes(n = 32) {
  return crypto.getRandomValues(new Uint8Array(n));
}

async function sha256(plain) {
  const data = new TextEncoder().encode(plain);
  return crypto.subtle.digest("SHA-256", data);
}

// ── Start login ────────────────────────────────────────────

export async function startLogin() {
  // 1. Generate PKCE pair
  const codeVerifier  = base64URLEncode(randomBytes(32));
  const codeChallenge = base64URLEncode(await sha256(codeVerifier));

  // 2. Generate state (CSRF protection)
  const state = base64URLEncode(randomBytes(16));

  // 3. Persist verifier and state (short-lived, tab-scoped)
  sessionStorage.setItem("cv", codeVerifier);
  sessionStorage.setItem("st", state);

  // 4. Build authorization URL
  const url = new URL(CONFIG.authEndpoint);
  url.searchParams.set("response_type",          "code");
  url.searchParams.set("client_id",              CONFIG.clientId);
  url.searchParams.set("redirect_uri",           CONFIG.redirectUri);
  url.searchParams.set("scope",                  CONFIG.scopes.join(" "));
  url.searchParams.set("state",                  state);
  url.searchParams.set("code_challenge",         codeChallenge);
  url.searchParams.set("code_challenge_method",  "S256");

  window.location.assign(url.toString());
}

// ── Handle callback ─────────────────────────────────────────

export async function handleCallback() {
  const params       = new URLSearchParams(window.location.search);
  const code         = params.get("code");
  const returnedState = params.get("state");
  const error        = params.get("error");

  if (error) throw new Error("Auth error: " + error);

  // Validate state
  const savedState = sessionStorage.getItem("st");
  if (!savedState || returnedState !== savedState) {
    throw new Error("State mismatch — rejecting callback");
  }
  sessionStorage.removeItem("st");

  const codeVerifier = sessionStorage.getItem("cv");
  sessionStorage.removeItem("cv");

  // Exchange code for tokens
  const res = await fetch(CONFIG.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type:    "authorization_code",
      code,
      redirect_uri:  CONFIG.redirectUri,
      client_id:     CONFIG.clientId,
      code_verifier: codeVerifier,
    }),
  });

  if (!res.ok) throw new Error("Token exchange failed");

  const tokens = await res.json();

  // Store access token IN MEMORY ONLY — never in localStorage!
  window.__accessToken = tokens.access_token;

  // Refresh token goes to the BFF (backend) via HttpOnly cookie
  // If using pure SPA: store in memory and accept the refresh-on-reload UX
  return tokens;
}

// ── Authenticated fetch ─────────────────────────────────────

export async function apiFetch(url, options = {}) {
  if (!window.__accessToken) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: \`Bearer \${window.__accessToken}\`,
    },
  });

  if (response.status === 401) {
    // Token expired — attempt refresh
    await refreshToken();
    return apiFetch(url, options); // retry once
  }

  return response;
}`;

const reactHookCode = `// useOAuth — React hook for OAuth with PKCE
// Usage: const { login, logout, user, isLoading } = useOAuth();

import { useState, useCallback, useEffect, useRef } from "react";

interface TokenSet {
  accessToken: string;
  expiresAt: number;
}

interface User {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}

function decodeJWTPayload(token: string): Record<string, unknown> {
  const payload = token.split(".")[1];
  return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
}

export function useOAuth() {
  const [tokenSet, setTokenSet] = useState<TokenSet | null>(null);
  const [user, setUser]         = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimer = useRef<ReturnType<typeof setTimeout>>();

  // ── Schedule token refresh before expiry ──────────────────
  const scheduleRefresh = useCallback((expiresAt: number) => {
    const delay = expiresAt - Date.now() - 60_000; // refresh 60s early
    if (delay > 0) {
      refreshTimer.current = setTimeout(() => {
        silentRefresh();
      }, delay);
    }
  }, []);

  // ── Silent refresh using refresh token ────────────────────
  const silentRefresh = useCallback(async () => {
    try {
      // Your backend /api/refresh proxies the token refresh
      // and returns a new access token (refresh token in HttpOnly cookie)
      const res = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
      if (!res.ok) {
        setTokenSet(null);
        setUser(null);
        return;
      }
      const data = await res.json();
      const expiresAt = Date.now() + data.expires_in * 1000;
      setTokenSet({ accessToken: data.access_token, expiresAt });
      setUser(decodeJWTPayload(data.id_token) as User);
      scheduleRefresh(expiresAt);
    } catch {
      setTokenSet(null);
      setUser(null);
    }
  }, [scheduleRefresh]);

  // ── Start PKCE login ──────────────────────────────────────
  const login = useCallback(async () => {
    const { startLogin } = await import("./oauth-client");
    await startLogin();
  }, []);

  // ── Logout ────────────────────────────────────────────────
  const logout = useCallback(async () => {
    clearTimeout(refreshTimer.current);
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setTokenSet(null);
    setUser(null);
  }, []);

  // ── Initialize: attempt silent refresh on mount ───────────
  useEffect(() => {
    silentRefresh().finally(() => setIsLoading(false));
    return () => clearTimeout(refreshTimer.current);
  }, [silentRefresh]);

  return {
    login,
    logout,
    user,
    isLoading,
    isAuthenticated: !!tokenSet,
    accessToken: tokenSet?.accessToken ?? null,
  };
}`;

const angularInterceptorCode = `// Angular HTTP Interceptor for OAuth Bearer tokens
// Automatically attaches access token to API requests
// and handles 401 responses with token refresh

import { Injectable } from "@angular/core";
import {
  HttpInterceptor, HttpRequest, HttpHandler,
  HttpEvent, HttpErrorResponse
} from "@angular/common/http";
import { Observable, throwError, BehaviorSubject } from "rxjs";
import { catchError, filter, switchMap, take } from "rxjs/operators";
import { AuthService } from "./auth.service";

@Injectable()
export class OAuthInterceptor implements HttpInterceptor {
  private refreshing = false;
  private refreshSubject = new BehaviorSubject<string | null>(null);

  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip auth header for token endpoint itself
    if (req.url.includes("/token") || req.url.includes("/authorize")) {
      return next.handle(req);
    }

    const token = this.auth.getAccessToken();
    const authReq = token ? this.addToken(req, token) : req;

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          return this.handle401(req, next);
        }
        return throwError(() => err);
      })
    );
  }

  private addToken(req: HttpRequest<unknown>, token: string) {
    return req.clone({
      setHeaders: { Authorization: \`Bearer \${token}\` }
    });
  }

  private handle401(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!this.refreshing) {
      this.refreshing = true;
      this.refreshSubject.next(null);

      return this.auth.refreshToken().pipe(
        switchMap((token: string) => {
          this.refreshing = false;
          this.refreshSubject.next(token);
          return next.handle(this.addToken(req, token));
        }),
        catchError((err) => {
          this.refreshing = false;
          this.auth.logout(); // Refresh failed — force re-login
          return throwError(() => err);
        })
      );
    }

    // Queue other requests until refresh completes
    return this.refreshSubject.pipe(
      filter((t): t is string => t !== null),
      take(1),
      switchMap((token) => next.handle(this.addToken(req, token)))
    );
  }
}`;

const cspHeaderExample = `# Example Content Security Policy for an OAuth SPA
# Add this as an HTTP response header from your server

Content-Security-Policy:
  default-src 'self';

  # Scripts: only from your own origin
  # Remove 'unsafe-inline' if you can move all JS to files
  script-src 'self' 'nonce-{RANDOM_NONCE}';

  # Styles: your origin + inline styles with nonce
  style-src 'self' 'nonce-{RANDOM_NONCE}';

  # API calls: only to known origins
  connect-src 'self'
    https://api.example.com
    https://auth.example.com;

  # Images: your origin + data URIs for small icons
  img-src 'self' data: https://cdn.example.com;

  # Frames: prevent your app from being embedded (clickjacking)
  frame-ancestors 'none';

  # No form submissions to external origins
  form-action 'self';

  # Force HTTPS for all future requests from this origin
  upgrade-insecure-requests;

# ── Why this matters for OAuth ───────────────────────────────
# If an attacker injects a <script>, CSP blocks it from:
# - Reading your in-memory access token
# - Making fetch() calls to steal data
# - Redirecting to a malicious authorization server
#
# Use a NONCE or HASH instead of 'unsafe-inline'.
# Generate a fresh nonce per request (server-side).`;

// ─── Main page ─────────────────────────────────────────────────────────────

export default function SPAPathPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/paths" className="hover:text-foreground transition-colors">Learning Paths</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">SPA Developer</span>
      </div>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold">SPA Developer Path</h1>
          <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800">
            Intermediate
          </Badge>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          Single-Page Applications face unique OAuth challenges because they run entirely in the browser.
          This path covers secure token handling, storage strategies, and the patterns used in production SPAs.
        </p>
      </div>

      {/* ── Section 1: The SPA Challenge ─────────────────────── */}
      <ScrollReveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">1. The SPA Challenge</h2>

          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-destructive" />
                  <span className="font-semibold text-sm">No Client Secret</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  A SPA ships its entire codebase to the browser. Any secret you embed becomes public
                  — anyone can View Source and extract it. SPAs are <em>public clients</em> and must never
                  use a client_secret.
                </p>
              </CardContent>
            </Card>
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-4 h-4 text-destructive" />
                  <span className="font-semibold text-sm">XSS Risk</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Cross-site scripting (XSS) attacks inject malicious JavaScript into your page. Any token
                  accessible to JavaScript — in localStorage, sessionStorage, or global variables — can be
                  exfiltrated by injected scripts.
                </p>
              </CardContent>
            </Card>
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm">PKCE to the Rescue</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  PKCE replaces the client_secret with a per-request cryptographic challenge. It solves the
                  "public client" problem for the authorization flow. Token storage security is a separate
                  concern addressed below.
                </p>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Info className="w-4 h-4" />
            <AlertTitle>The Implicit Flow is Dead</AlertTitle>
            <AlertDescription>
              The Implicit flow (response_type=token) was designed for SPAs before PKCE existed. It returns
              tokens directly in the URL fragment — visible in browser history, server logs, and Referer
              headers. It is deprecated in OAuth 2.1 and must not be used in any new application. Use
              Authorization Code + PKCE instead.
            </AlertDescription>
          </Alert>
        </section>
      </ScrollReveal>

      <Separator className="mb-10" />

      {/* ── Section 2: Token Storage ─────────────────────────── */}
      <ScrollReveal>
        <section className="mb-12" id="storage">
          <h2 className="text-2xl font-bold mb-2">2. Token Storage Deep Dive</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Where you store OAuth tokens in a browser-based app is one of the most debated security questions
            in frontend development. Each option has real tradeoffs.
          </p>

          <Accordion type="single" collapsible defaultValue="memory" className="space-y-2">
            {[
              {
                id: "memory",
                label: "Option A: Memory (in-memory JS variable)",
                rating: "Best",
                ratingClass: "text-emerald-900 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800",
                pros: [
                  "Completely invisible to XSS — injected scripts cannot read JS module scope",
                  "Cleared automatically when the tab closes",
                  "No persistence attack surface",
                ],
                cons: [
                  "Lost on page refresh — user must re-authenticate (or use silent refresh)",
                  "Not shared across tabs — each tab has its own token",
                  "Requires a mechanism to restore tokens after navigation",
                ],
                note: "Use memory for access tokens. Combine with silent refresh (from BFF cookie or in-memory refresh token) to handle page reloads.",
              },
              {
                id: "session",
                label: "Option B: sessionStorage",
                rating: "Acceptable",
                ratingClass: "text-amber-900 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-800",
                pros: [
                  "Cleared automatically when the tab or browser window closes",
                  "Isolated per tab — one tab's compromise does not affect others",
                  "Survives page refresh within the same tab",
                ],
                cons: [
                  "Accessible to any JavaScript on the page — XSS can steal tokens",
                  "Must be combined with strict CSP to reduce XSS risk",
                  "Not suitable for high-value tokens (admin access, payment scopes)",
                ],
                note: "Acceptable for low-risk access tokens with short expiry. Pair with Content Security Policy.",
              },
              {
                id: "local",
                label: "Option C: localStorage",
                rating: "Avoid",
                ratingClass: "text-red-900 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/40 dark:border-red-800",
                pros: [
                  "Persistent across browser sessions and page refreshes",
                  "Shared across all tabs in the same origin",
                  "Simple API",
                ],
                cons: [
                  "Accessible to any JavaScript — highest XSS risk of all storage options",
                  "Persists after the user thinks they have logged out",
                  "Browser extensions can read localStorage",
                  "Cannot be restricted with HttpOnly flag",
                ],
                note: "Do not store access tokens or refresh tokens in localStorage. The convenience is not worth the security risk.",
              },
              {
                id: "cookie",
                label: "Option D: HttpOnly Cookie (via BFF)",
                rating: "Recommended for Refresh Tokens",
                ratingClass: "text-blue-900 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/40 dark:border-blue-800",
                pros: [
                  "HttpOnly flag makes the cookie completely invisible to JavaScript",
                  "XSS attacks cannot exfiltrate HttpOnly cookies",
                  "SameSite=Strict or SameSite=Lax prevents CSRF in most cases",
                  "Survives page refresh naturally",
                ],
                cons: [
                  "Requires a backend server (the Backend for Frontend pattern)",
                  "CSRF must be mitigated with SameSite + CSRF token or Double Submit Cookie",
                  "More complex architecture than pure SPA",
                ],
                note: "The gold standard for refresh token storage. The BFF pattern lets a thin server-side component hold secrets while the SPA stays stateless.",
              },
            ].map((opt) => (
              <AccordionItem
                key={opt.id}
                value={opt.id}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-medium text-left">{opt.label}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${opt.ratingClass}`}>
                      {opt.rating}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <div className="grid gap-4 sm:grid-cols-2 mb-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-1">Pros</p>
                      <ul className="space-y-1">
                        {opt.pros.map((p, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-destructive mb-1">Cons</p>
                      <ul className="space-y-1">
                        {opt.cons.map((c, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="rounded bg-muted/40 border px-3 py-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Recommendation: </span>
                    {opt.note}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <Card className="mt-6 border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">Recommended Architecture: BFF Pattern</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                The <strong className="text-foreground">Backend for Frontend (BFF)</strong> pattern adds a
                thin server-side component (Next.js API routes, Express, or a dedicated proxy) between your
                SPA and the authorization server.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>The BFF performs the token exchange server-side</li>
                <li>Refresh token is stored in an <code className="bg-muted px-1 rounded text-xs">HttpOnly; Secure; SameSite=Strict</code> cookie</li>
                <li>Access token is returned to the SPA and held in memory</li>
                <li>The SPA calls <code className="bg-muted px-1 rounded text-xs">/api/auth/refresh</code> to get a new access token (BFF does the actual refresh)</li>
                <li>The client_secret (if any) is stored securely on the server</li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </ScrollReveal>

      <Separator className="mb-10" />

      {/* ── Section 3: Silent Authentication ─────────────────── */}
      <ScrollReveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-2">3. Silent Authentication</h2>
          <p className="text-muted-foreground text-sm mb-4">
            When an access token expires, you want to silently get a new one without forcing the user to
            log in again. The approach depends on your architecture.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <Card className="border-destructive/30 opacity-80">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <CardTitle className="text-sm line-through text-muted-foreground">Hidden iFrames (Legacy)</CardTitle>
                  <Badge variant="destructive" className="text-xs">Deprecated</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>
                  The legacy silent auth approach used a hidden iframe pointed at the authorization endpoint
                  with <code>prompt=none</code>. The iframe would complete the auth flow and post the new
                  token back to the parent frame.
                </p>
                <p>
                  Modern browsers now block third-party cookies and iframe access, making this approach
                  unreliable. It no longer works in Safari, Chrome (Incognito), or browsers with ITP/ETP
                  enabled. Do not implement this pattern.
                </p>
              </CardContent>
            </Card>
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm">Refresh Tokens with PKCE (Modern)</CardTitle>
                  <Badge className="text-xs bg-emerald-500 text-white">Recommended</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>
                  Store the refresh token in an HttpOnly cookie (via BFF). When the access token expires,
                  the SPA calls your BFF's <code>/api/auth/refresh</code> endpoint. The BFF sends the
                  refresh token to the authorization server and returns a new access token to the SPA.
                </p>
                <p>
                  Implement refresh token rotation so that each refresh returns a new refresh token and
                  invalidates the old one — this detects token theft.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </ScrollReveal>

      <Separator className="mb-10" />

      {/* ── Section 4: CSP ─────────────────────────────────────── */}
      <ScrollReveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-2">4. Content Security Policy (CSP)</h2>
          <p className="text-muted-foreground text-sm mb-4">
            CSP is a browser security mechanism that restricts what resources a page can load and where it
            can make network requests. A well-configured CSP dramatically reduces the impact of XSS attacks
            — an attacker who injects a script cannot exfiltrate tokens or make unauthorized API calls.
          </p>
          <CodeBlock code={cspHeaderExample} language="bash" filename="nginx.conf / next.config.ts" />
          <Alert className="mt-4">
            <ShieldCheck className="w-4 h-4" />
            <AlertTitle>CSP Is Not a Silver Bullet</AlertTitle>
            <AlertDescription>
              CSP reduces XSS impact but does not prevent it. Always sanitize user input, use
              framework-level output encoding, conduct dependency audits (npm audit), and implement
              Subresource Integrity (SRI) for third-party scripts. Defense-in-depth is the goal.
            </AlertDescription>
          </Alert>
        </section>
      </ScrollReveal>

      <Separator className="mb-10" />

      {/* ── Section 5: Code Examples ─────────────────────────── */}
      <ScrollReveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">5. Code Examples</h2>
          <Tabs defaultValue="vanilla">
            <TabsList className="mb-4 flex-wrap h-auto gap-1">
              <TabsTrigger value="vanilla">
                <Code2 className="w-4 h-4 mr-1.5" />
                Vanilla JS
              </TabsTrigger>
              <TabsTrigger value="react">
                <Layers className="w-4 h-4 mr-1.5" />
                React Hook
              </TabsTrigger>
              <TabsTrigger value="angular">
                <Layers className="w-4 h-4 mr-1.5" />
                Angular Interceptor
              </TabsTrigger>
            </TabsList>

            <TabsContent value="vanilla">
              <p className="text-sm text-muted-foreground mb-3">
                Complete PKCE flow implementation using only the browser's built-in Web Crypto API. No
                external libraries required. In-memory token storage with BFF-compatible design.
              </p>
              <CodeBlock code={vanillaPKCECode} language="javascript" filename="oauth-client.js" />
            </TabsContent>

            <TabsContent value="react">
              <p className="text-sm text-muted-foreground mb-3">
                A custom React hook that manages the full OAuth lifecycle: login, callback handling, silent
                refresh scheduling, and logout. Designed for use with a Backend for Frontend (BFF).
              </p>
              <CodeBlock code={reactHookCode} language="typescript" filename="useOAuth.ts" />
            </TabsContent>

            <TabsContent value="angular">
              <p className="text-sm text-muted-foreground mb-3">
                An Angular HTTP interceptor that automatically adds Bearer tokens to outgoing requests and
                handles 401 responses with token refresh. Queues concurrent requests during refresh.
              </p>
              <CodeBlock code={angularInterceptorCode} language="typescript" filename="oauth.interceptor.ts" />
            </TabsContent>
          </Tabs>
        </section>
      </ScrollReveal>

      <Separator className="mb-10" />

      {/* ── Section 6: Framework Guidance ────────────────────── */}
      <ScrollReveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-2">6. Framework-Specific Guidance</h2>
          <p className="text-muted-foreground text-sm mb-6">
            These battle-tested SDK libraries handle PKCE, token refresh, and storage according to best
            practices for each framework.
          </p>

          <StaggerReveal className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">React</CardTitle>
                <CardDescription className="text-xs">Auth0 React SDK</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <CodeBlock
                  code={`npm install @auth0/auth0-react

// Wrap your app:
<Auth0Provider
  domain="YOUR_DOMAIN"
  clientId="YOUR_CLIENT_ID"
  authorizationParams={{
    redirect_uri: window.location.origin,
    scope: "openid profile email",
  }}
>
  <App />
</Auth0Provider>

// In any component:
const { loginWithRedirect, user, isAuthenticated } = useAuth0();`}
                  language="javascript"
                />
                <p className="text-xs text-muted-foreground">
                  Uses PKCE by default. Stores tokens in memory.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Vue</CardTitle>
                <CardDescription className="text-xs">vue-auth-oidc</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <CodeBlock
                  code={`npm install vue-auth-oidc

// main.ts
import { createOidcAuth } from "vue-auth-oidc";
const auth = createOidcAuth({
  authority: "https://auth.example.com",
  clientId: "YOUR_CLIENT_ID",
  redirectUri: window.location.origin + "/callback",
  scope: "openid profile email",
  pkce: true,
});
app.use(auth);

// Component:
const { signIn, user } = useAuth();`}
                  language="javascript"
                />
                <p className="text-xs text-muted-foreground">
                  Composable API. PKCE enabled. Works with Pinia.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Angular</CardTitle>
                <CardDescription className="text-xs">angular-auth-oidc-client</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <CodeBlock
                  code={`npm install angular-auth-oidc-client

// app.config.ts
import { provideAuth } from "angular-auth-oidc-client";

provideAuth({
  config: {
    authority: "https://auth.example.com",
    redirectUrl: window.location.origin,
    clientId: "YOUR_CLIENT_ID",
    scope: "openid profile email",
    responseType: "code",  // PKCE auto-enabled
    silentRenew: true,
  },
})`}
                  language="typescript"
                />
                <p className="text-xs text-muted-foreground">
                  Auto-refresh. Guards included. Well-maintained.
                </p>
              </CardContent>
            </Card>
          </StaggerReveal>
        </section>
      </ScrollReveal>

      {/* Next steps */}
      <ScrollReveal>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="font-semibold">Continue Your Learning</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              You have covered the core SPA security model. Explore the Security Specialist path for deep
              dives into XSS, CSRF, and token theft attacks.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/paths/security">Security Specialist Path</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/edge-cases">Edge Case Library</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/checklist">Security Checklist</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </ScrollReveal>
    </div>
  );
}
