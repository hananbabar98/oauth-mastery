"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronRight,
  Server,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  Zap,
  Timer,
  Lock,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { CodeBlock } from "@/components/ui/code-block";
import { ScrollReveal, StaggerReveal } from "@/components/layout/scroll-reveal";

// ─── Code examples ─────────────────────────────────────────────────────────

const nodeClientCredentialsCode = `// Node.js — Client Credentials flow for M2M
// Service A calling Service B without a user

const TOKEN_ENDPOINT = "https://auth.example.com/token";
const CLIENT_ID      = process.env.OAUTH_CLIENT_ID!;
const CLIENT_SECRET  = process.env.OAUTH_CLIENT_SECRET!; // server-side only!
const AUDIENCE       = "https://api.example.com";

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

export async function getServiceToken(): Promise<string> {
  // Return cached token if it has more than 60 seconds left
  if (tokenCache && tokenCache.expiresAt - Date.now() > 60_000) {
    return tokenCache.accessToken;
  }

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      // Basic auth: base64(client_id:client_secret)
      Authorization:
        "Basic " + Buffer.from(\`\${CLIENT_ID}:\${CLIENT_SECRET}\`).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope:      "read:orders write:invoices",
      audience:   AUDIENCE, // required by some providers (Auth0, etc.)
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(\`Token request failed: \${err.error_description}\`);
  }

  const data = await response.json();

  tokenCache = {
    accessToken: data.access_token,
    expiresAt:   Date.now() + data.expires_in * 1000,
  };

  return tokenCache.accessToken;
}

// Usage in a service client
export async function callOrdersService(orderId: string) {
  const token    = await getServiceToken();
  const response = await fetch(\`https://api.example.com/orders/\${orderId}\`, {
    headers: { Authorization: \`Bearer \${token}\` },
  });
  return response.json();
}`;

const nodeJWTValidationCode = `// Node.js — JWT validation using jose (modern, no jsonwebtoken)
// npm install jose

import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS_URI = "https://auth.example.com/.well-known/jwks.json";
const ISSUER   = "https://auth.example.com/";
const AUDIENCE = "https://api.example.com";

// Cache the JWKS — jose handles automatic refresh
const remoteJWKS = createRemoteJWKSet(new URL(JWKS_URI));

export interface JWTClaims {
  sub:    string;
  iss:    string;
  aud:    string | string[];
  exp:    number;
  iat:    number;
  scope?: string;
  [key: string]: unknown;
}

export async function validateAccessToken(token: string): Promise<JWTClaims> {
  const { payload } = await jwtVerify(token, remoteJWKS, {
    issuer:   ISSUER,
    audience: AUDIENCE,
    // jose automatically checks exp and nbf
    clockTolerance: "30s", // allow 30s clock skew between services
  });

  return payload as JWTClaims;
}

// Express middleware
import type { Request, Response, NextFunction } from "express";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "unauthorized",
      error_description: "Missing or invalid Authorization header",
    });
  }

  const token = authHeader.slice(7);

  try {
    const claims = await validateAccessToken(token);
    req.auth = claims; // attach to request for downstream handlers
    next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Token validation failed";
    return res.status(401).json({
      error: "invalid_token",
      error_description: message,
    });
  }
}

// Scope guard middleware
export function requireScope(scope: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const scopes = (req.auth?.scope as string ?? "").split(" ");
    if (!scopes.includes(scope)) {
      return res.status(403).json({
        error: "insufficient_scope",
        error_description: \`Required scope: \${scope}\`,
      });
    }
    next();
  };
}`;

const pythonFastAPICode = `# Python — FastAPI JWT validation with caching
# pip install fastapi python-jose[cryptography] httpx

from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, jwk
from jose.utils import base64url_decode
import httpx, json, time
from typing import Optional
from pydantic import BaseModel

app = FastAPI()
security = HTTPBearer()

# ── JWKS Cache ─────────────────────────────────────────────────────────────

JWKS_URI  = "https://auth.example.com/.well-known/jwks.json"
ISSUER    = "https://auth.example.com/"
AUDIENCE  = "https://api.example.com"

class JWKSCache:
    def __init__(self):
        self._keys: dict = {}
        self._fetched_at: float = 0
        self._ttl: int = 3600  # re-fetch every hour

    async def get_key(self, kid: str):
        now = time.time()
        if now - self._fetched_at > self._ttl or kid not in self._keys:
            await self._fetch()
        return self._keys.get(kid)

    async def _fetch(self):
        async with httpx.AsyncClient() as client:
            resp = await client.get(JWKS_URI)
            resp.raise_for_status()
            jwks = resp.json()

        self._keys = {
            k["kid"]: jwk.construct(k)
            for k in jwks["keys"]
        }
        self._fetched_at = time.time()

jwks_cache = JWKSCache()

# ── Token validation ────────────────────────────────────────────────────────

class TokenClaims(BaseModel):
    sub: str
    iss: str
    exp: int
    iat: int
    scope: Optional[str] = None

async def validate_token(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> TokenClaims:
    token = credentials.credentials

    # Decode header to get kid (key ID) without verification
    header = jwt.get_unverified_header(token)
    kid    = header.get("kid")

    if not kid:
        raise HTTPException(status_code=401, detail="Token missing kid")

    public_key = await jwks_cache.get_key(kid)
    if not public_key:
        raise HTTPException(status_code=401, detail="Unknown signing key")

    try:
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256", "ES256"],
            audience=AUDIENCE,
            issuer=ISSUER,
        )
    except JWTError as e:
        raise HTTPException(status_code=401, detail=str(e))

    return TokenClaims(**payload)

def require_scope(required_scope: str):
    async def checker(claims: TokenClaims = Depends(validate_token)):
        scopes = (claims.scope or "").split()
        if required_scope not in scopes:
            raise HTTPException(
                status_code=403,
                detail=f"Insufficient scope. Required: {required_scope}",
            )
        return claims
    return checker

# ── Example protected endpoint ──────────────────────────────────────────────

@app.get("/api/orders")
async def list_orders(claims: TokenClaims = Depends(require_scope("read:orders"))):
    return {"sub": claims.sub, "orders": []}`;

const goJWTCode = `// Go — JWT validation with caching and token introspection fallback
// go get github.com/lestrrat-go/jwx/v2

package auth

import (
    "context"
    "fmt"
    "net/http"
    "strings"
    "time"

    "github.com/lestrrat-go/jwx/v2/jwk"
    "github.com/lestrrat-go/jwx/v2/jwt"
)

const (
    jwksURI  = "https://auth.example.com/.well-known/jwks.json"
    issuer   = "https://auth.example.com/"
    audience = "https://api.example.com"
)

// JWKSCache auto-refreshes the key set in the background
var jwksCache jwk.Cache

func init() {
    ctx := context.Background()
    jwksCache = jwk.NewCache(ctx)
    // Register the JWKS URI — cache auto-refreshes every hour
    _ = jwksCache.Register(jwksURI, jwk.WithRefreshInterval(time.Hour))
    // Pre-warm the cache
    _, _ = jwksCache.Refresh(ctx, jwksURI)
}

// ValidateToken validates a Bearer token and returns the JWT claims
func ValidateToken(ctx context.Context, tokenString string) (jwt.Token, error) {
    keySet, err := jwksCache.Get(ctx, jwksURI)
    if err != nil {
        return nil, fmt.Errorf("fetching JWKS: %w", err)
    }

    token, err := jwt.Parse([]byte(tokenString), jwt.WithKeySet(keySet),
        jwt.WithIssuer(issuer),
        jwt.WithAudience(audience),
        jwt.WithValidate(true),
        jwt.WithAcceptableSkew(30*time.Second),
    )
    if err != nil {
        return nil, fmt.Errorf("invalid token: %w", err)
    }

    return token, nil
}

// AuthMiddleware — HTTP middleware that validates Bearer tokens
func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        auth := r.Header.Get("Authorization")
        if !strings.HasPrefix(auth, "Bearer ") {
            http.Error(w, \`{"error":"unauthorized"}\`, http.StatusUnauthorized)
            return
        }

        token, err := ValidateToken(r.Context(), strings.TrimPrefix(auth, "Bearer "))
        if err != nil {
            http.Error(w, \`{"error":"invalid_token"}\`, http.StatusUnauthorized)
            return
        }

        // Store claims in request context
        ctx := context.WithValue(r.Context(), contextKeyToken, token)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// RequireScope — middleware that checks for a specific scope
func RequireScope(scope string) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            token := r.Context().Value(contextKeyToken).(jwt.Token)
            scopes, _ := token.Get("scope")

            scopeStr, _ := scopes.(string)
            for _, s := range strings.Split(scopeStr, " ") {
                if s == scope {
                    next.ServeHTTP(w, r)
                    return
                }
            }

            http.Error(w, \`{"error":"insufficient_scope"}\`, http.StatusForbidden)
        })
    }
}

type contextKey string
const contextKeyToken contextKey = "token"`;

const tokenIntrospectionCode = `// Token Introspection — RFC 7662
// Use when you cannot decode JWTs locally (opaque tokens, or shared AS)

// Node.js — Token Introspection with caching
import crypto from "crypto";

interface IntrospectionResult {
  active:    boolean;
  sub?:      string;
  scope?:    string;
  client_id?: string;
  exp?:      number;
  iat?:      number;
}

// Simple in-memory cache keyed by token hash (never cache the token itself)
const introspectionCache = new Map<string, { result: IntrospectionResult; cachedAt: number }>();
const CACHE_TTL_MS = 30_000; // 30 seconds

function tokenHash(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function introspectToken(token: string): Promise<IntrospectionResult> {
  const hash = tokenHash(token);
  const cached = introspectionCache.get(hash);

  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.result;
  }

  const response = await fetch("https://auth.example.com/introspect", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      // Resource server credentials
      Authorization:
        "Basic " + Buffer.from(\`\${RS_CLIENT_ID}:\${RS_CLIENT_SECRET}\`).toString("base64"),
    },
    body: new URLSearchParams({
      token,
      token_type_hint: "access_token",
    }),
  });

  const result: IntrospectionResult = await response.json();

  // Only cache active tokens (don't cache failures)
  if (result.active) {
    introspectionCache.set(hash, { result, cachedAt: Date.now() });
  }

  return result;
}`;

const k8sSecretsCode = `# Kubernetes — Secure OAuth secrets management
# Never hardcode client_id / client_secret in pod specs or images

# ── Option 1: Kubernetes Secret (base64 encoded) ─────────────────────────────
apiVersion: v1
kind: Secret
metadata:
  name: oauth-client-credentials
  namespace: my-service
type: Opaque
data:
  # echo -n 'your-client-id' | base64
  OAUTH_CLIENT_ID:     eW91ci1jbGllbnQtaWQ=
  OAUTH_CLIENT_SECRET: eW91ci1jbGllbnQtc2VjcmV0

---
# Reference in your Deployment:
env:
  - name: OAUTH_CLIENT_ID
    valueFrom:
      secretKeyRef:
        name: oauth-client-credentials
        key: OAUTH_CLIENT_ID
  - name: OAUTH_CLIENT_SECRET
    valueFrom:
      secretKeyRef:
        name: oauth-client-credentials
        key: OAUTH_CLIENT_SECRET

---
# ── Option 2: External Secrets Operator (recommended for production) ──────────
# Syncs secrets from Vault, AWS Secrets Manager, GCP Secret Manager, etc.
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: oauth-credentials
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: oauth-client-credentials
  data:
    - secretKey: OAUTH_CLIENT_ID
      remoteRef:
        key: secret/my-service/oauth
        property: client_id
    - secretKey: OAUTH_CLIENT_SECRET
      remoteRef:
        key: secret/my-service/oauth
        property: client_secret`;

// ─── Main page ─────────────────────────────────────────────────────────────

export default function BackendPathPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/paths" className="hover:text-foreground transition-colors">Learning Paths</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">Backend / API Developer</span>
      </div>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold">Backend / API Developer Path</h1>
          <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800">
            Intermediate
          </Badge>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          Server-side OAuth covers machine-to-machine authentication, JWT validation, token introspection,
          and the operational concerns of running OAuth-protected services in production.
        </p>
      </div>

      {/* ── Section 1: Client Credentials ─────────────────────── */}
      <ScrollReveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-2">1. Client Credentials Flow (M2M)</h2>
          <p className="text-muted-foreground text-sm mb-4">
            When Service A needs to call Service B without a user in the loop, use the Client Credentials
            grant. This is the correct pattern for microservices, background jobs, scheduled tasks, and any
            server-to-server communication.
          </p>

          <div className="rounded-lg border bg-muted/30 p-4 overflow-x-auto mb-4">
            <div className="min-w-[400px] space-y-1 font-mono text-sm">
              <div className="flex items-center gap-2">
                <span className="w-36 text-violet-400 shrink-0">Service A (Client)</span>
                <span className="text-muted-foreground">── POST /token (client_id + client_secret) →</span>
                <span className="text-emerald-400">Auth Server</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-36 text-violet-400 shrink-0">Service A (Client)</span>
                <span className="text-muted-foreground">←──────────────── access_token ────────────</span>
                <span className="text-emerald-400">Auth Server</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-36 text-violet-400 shrink-0">Service A (Client)</span>
                <span className="text-muted-foreground">── Bearer token ──────────────────────────→</span>
                <span className="text-amber-400">Service B (API)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-36 text-violet-400 shrink-0">Service A (Client)</span>
                <span className="text-muted-foreground">←──────────────── response ────────────────</span>
                <span className="text-amber-400">Service B (API)</span>
              </div>
            </div>
          </div>

          <Alert className="mb-4">
            <Lock className="w-4 h-4" />
            <AlertTitle>Client Secret Security</AlertTitle>
            <AlertDescription>
              In the Client Credentials flow, the client_secret is the primary credential. Store it in
              environment variables, Kubernetes secrets, or a secrets manager (Vault, AWS Secrets Manager).
              Never commit it to source control, never log it, and rotate it regularly.
            </AlertDescription>
          </Alert>

          <CodeBlock code={nodeClientCredentialsCode} language="typescript" filename="service-auth.ts" />
        </section>
      </ScrollReveal>

      <Separator className="mb-10" />

      {/* ── Section 2: JWT vs Introspection ──────────────────── */}
      <ScrollReveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-2">2. Token Validation: JWT vs Introspection</h2>
          <p className="text-muted-foreground text-sm mb-4">
            There are two ways to validate an access token on your resource server. The right choice depends
            on your token format and operational requirements.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            <Card className="border-emerald-200 dark:border-emerald-800">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  <CardTitle className="text-sm">Local JWT Validation</CardTitle>
                </div>
                <CardDescription className="text-xs">Best for high-throughput APIs</CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>
                  Decode the token locally using the authorization server's public keys (JWKS). No network
                  call required per request — keys are cached.
                </p>
                <div className="mt-2 space-y-1">
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>Zero latency — pure CPU work</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>No dependency on auth server availability</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <span>Cannot detect revoked tokens instantly</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <span>Requires periodic JWKS refresh</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-blue-500" />
                  <CardTitle className="text-sm">Token Introspection (RFC 7662)</CardTitle>
                </div>
                <CardDescription className="text-xs">Best for high-security or opaque tokens</CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>
                  Ask the authorization server if the token is valid. Works for both JWTs and opaque tokens.
                  Sees revocations immediately.
                </p>
                <div className="mt-2 space-y-1">
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>Detects revoked tokens in real time</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>Works with opaque (non-JWT) tokens</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <span>Adds latency — one round-trip per request</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <span>Auth server becomes a critical dependency</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm mb-4">
            <p className="font-medium mb-1">Decision Guide</p>
            <ul className="text-muted-foreground space-y-1 text-xs">
              <li><span className="text-foreground font-medium">Use JWT validation</span> if your tokens are short-lived (under 15 min), you control the key rotation schedule, and you need low-latency validation.</li>
              <li><span className="text-foreground font-medium">Use introspection</span> if tokens are long-lived, you need near-instant revocation (e.g., after password change), or you are working with opaque tokens.</li>
              <li><span className="text-foreground font-medium">Use both</span>: validate JWT structure locally, introspect periodically or on privilege-sensitive operations.</li>
            </ul>
          </div>

          <CodeBlock code={tokenIntrospectionCode} language="typescript" filename="introspection.ts" />
        </section>
      </ScrollReveal>

      <Separator className="mb-10" />

      {/* ── Section 3: JWT Validation Code Examples ────────────── */}
      <ScrollReveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">3. JWT Validation — Node.js, Python, Go</h2>
          <p className="text-muted-foreground text-sm mb-4">
            All three examples validate the JWT signature against the authorization server's JWKS, check
            issuer and audience, verify expiry, and provide middleware / dependency injection patterns.
          </p>

          <Tabs defaultValue="node">
            <TabsList className="mb-4">
              <TabsTrigger value="node">
                <Code2 className="w-4 h-4 mr-1.5" />
                Node.js
              </TabsTrigger>
              <TabsTrigger value="python">
                <Code2 className="w-4 h-4 mr-1.5" />
                Python / FastAPI
              </TabsTrigger>
              <TabsTrigger value="go">
                <Code2 className="w-4 h-4 mr-1.5" />
                Go
              </TabsTrigger>
            </TabsList>

            <TabsContent value="node">
              <p className="text-sm text-muted-foreground mb-3">
                Uses <code>jose</code> (the modern successor to jsonwebtoken). Includes JWKS caching,
                Express middleware, and a scope guard. Supports RS256 and ES256.
              </p>
              <CodeBlock code={nodeJWTValidationCode} language="typescript" filename="auth.middleware.ts" />
            </TabsContent>

            <TabsContent value="python">
              <p className="text-sm text-muted-foreground mb-3">
                FastAPI dependency injection pattern with JWKS caching, scope checking, and proper error
                responses following RFC 6750 (Bearer Token Usage).
              </p>
              <CodeBlock code={pythonFastAPICode} language="typescript" filename="auth.py" />
            </TabsContent>

            <TabsContent value="go">
              <p className="text-sm text-muted-foreground mb-3">
                Uses <code>lestrrat-go/jwx/v2</code> with background JWKS auto-refresh. Standard
                http.Handler middleware with context-based claim propagation.
              </p>
              <CodeBlock code={goJWTCode} language="typescript" filename="auth/jwt.go" />
            </TabsContent>
          </Tabs>
        </section>
      </ScrollReveal>

      <Separator className="mb-10" />

      {/* ── Section 4: Rate Limiting and Token Caching ─────────── */}
      <ScrollReveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-2">4. Rate Limiting and Token Caching</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Production APIs must limit how often clients can obtain and use tokens to prevent abuse, protect
            the authorization server, and reduce costs.
          </p>

          <StaggerReveal className="grid gap-4 sm:grid-cols-2 mb-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Token Request Rate Limiting</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>
                  Each call to the token endpoint should be rate-limited per client_id. Implement exponential
                  backoff on your service client when receiving 429 responses.
                </p>
                <p>
                  Cache tokens and reuse them for the full lifetime minus a buffer (see the Node.js Client
                  Credentials example above — it caches and reuses tokens until 60 seconds before expiry).
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">API Rate Limiting on Tokens</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>
                  Extract the <code className="bg-muted px-1 rounded">sub</code> or <code className="bg-muted px-1 rounded">client_id</code>{" "}
                  claim from the validated JWT and use it as the rate-limit key. This ensures limits are per
                  identity, not per IP (which can be shared by NAT or proxies).
                </p>
                <p>
                  Use sliding window counters (Redis) rather than fixed window buckets to avoid the burst
                  problem at window boundaries.
                </p>
              </CardContent>
            </Card>
          </StaggerReveal>

          <Alert>
            <Info className="w-4 h-4" />
            <AlertTitle>Introspection Caching is Critical</AlertTitle>
            <AlertDescription>
              If you use token introspection, cache the results for 30–60 seconds keyed by a hash of the
              token (never the token itself). A busy API can receive millions of requests per hour — without
              caching, you would overwhelm the authorization server's introspection endpoint.
            </AlertDescription>
          </Alert>
        </section>
      </ScrollReveal>

      <Separator className="mb-10" />

      {/* ── Section 5: Kubernetes Secrets ──────────────────────── */}
      <ScrollReveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-2">5. Secrets Management in Kubernetes</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Kubernetes native Secrets are base64-encoded (not encrypted) by default. For production systems
            with OAuth client secrets, use an external secrets manager with the External Secrets Operator.
          </p>

          <CodeBlock code={k8sSecretsCode} language="bash" filename="k8s-oauth-secrets.yaml" />

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              { title: "Vault (HashiCorp)", desc: "Dynamic secrets with short TTLs. Vault can generate a new client_secret on each pod start. Ideal for zero-trust environments." },
              { title: "AWS Secrets Manager", desc: "Managed secrets with automatic rotation. Integrates natively with EKS via IRSA (IAM Roles for Service Accounts)." },
              { title: "Sealed Secrets", desc: "Encrypt Kubernetes Secrets before committing to Git. Keys held in-cluster. Simpler than Vault but no dynamic secrets." },
            ].map((tool) => (
              <Card key={tool.title}>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs">{tool.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">{tool.desc}</CardContent>
              </Card>
            ))}
          </div>
        </section>
      </ScrollReveal>

      <Separator className="mb-10" />

      {/* ── Section 6: Service Mesh Patterns ───────────────────── */}
      <ScrollReveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-2">6. Service Mesh Patterns</h2>
          <p className="text-muted-foreground text-sm mb-4">
            In a service mesh (Istio, Linkerd, Consul Connect), mTLS handles service-to-service
            authentication at the network level. OAuth tokens handle authorization at the application level.
            They are complementary.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Istio + JWT AuthorizationPolicy</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                <p className="mb-2">
                  Istio can validate JWTs at the sidecar proxy level before the request reaches your
                  application code. Combine with RequestAuthentication and AuthorizationPolicy resources.
                </p>
                <CodeBlock
                  code={`apiVersion: security.istio.io/v1beta1
kind: RequestAuthentication
metadata:
  name: jwt-auth
spec:
  jwtRules:
  - issuer: "https://auth.example.com/"
    jwksUri: "https://auth.example.com/.well-known/jwks.json"
    audiences:
    - "https://api.example.com"
---
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: require-jwt
spec:
  action: ALLOW
  rules:
  - from:
    - source:
        requestPrincipals: ["*"]`}
                  language="bash"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Token Exchange (RFC 8693)</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                <p>
                  When Service A calls Service B on behalf of a user, Service A should exchange the user's
                  access token for a new token scoped to Service B (the <em>actor</em> claim identifies
                  Service A acted on behalf of the user).
                </p>
                <p className="mt-2">
                  This prevents privilege escalation: Service B only accepts tokens whose audience is itself,
                  even if Service A is compromised.
                </p>
                <CodeBlock
                  code={`POST /token HTTP/1.1
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:token-exchange
&subject_token=<user-access-token>
&subject_token_type=urn:ietf:params:oauth:token-type:access_token
&audience=https://service-b.example.com
&scope=read:data`}
                  language="bash"
                />
              </CardContent>
            </Card>
          </div>
        </section>
      </ScrollReveal>

      {/* Next steps */}
      <ScrollReveal>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span className="font-semibold">Continue Your Learning</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Backend security goes beyond token validation. The Security Specialist path covers
              threat modeling OAuth deployments and testing for vulnerabilities.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/paths/security">Security Specialist Path</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/flows/client-credentials">Client Credentials Flow</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/checklist">Production Checklist</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </ScrollReveal>
    </div>
  );
}
