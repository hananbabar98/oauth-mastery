"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  BookOpen,
  Key,
  Users,
  ShieldCheck,
  Database,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Info,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CodeBlock } from "@/components/ui/code-block";
import { ScrollReveal, StaggerReveal } from "@/components/layout/scroll-reveal";

const CHAPTERS = [
  { id: 1, title: "Why OAuth Exists" },
  { id: 2, title: "The Four Actors" },
  { id: 3, title: "Your First OAuth Flow" },
  { id: 4, title: "Scopes Explained" },
  { id: 5, title: "Tokens 101" },
  { id: 6, title: "What Can Go Wrong" },
];

// ─── Code examples ────────────────────────────────────────────────────────────

const pkceGenerateCode = `// Step 2: Generate PKCE code_verifier and code_challenge
import { webcrypto } from "crypto"; // Node.js 18+; in browser use window.crypto

function base64URLEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function generatePKCE() {
  // code_verifier: a cryptographically random string (43–128 chars)
  const randomBytes = webcrypto.getRandomValues(new Uint8Array(32));
  const codeVerifier = base64URLEncode(randomBytes.buffer);

  // code_challenge: SHA-256 hash of the verifier, base64url-encoded
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await webcrypto.subtle.digest("SHA-256", data);
  const codeChallenge = base64URLEncode(digest);

  return { codeVerifier, codeChallenge };
}

const { codeVerifier, codeChallenge } = await generatePKCE();
// Store codeVerifier securely — you will need it at the callback step
sessionStorage.setItem("pkce_code_verifier", codeVerifier);`;

const buildAuthUrlCode = `// Step 3: Build the authorization URL and redirect the user
const params = new URLSearchParams({
  response_type: "code",
  client_id: "YOUR_CLIENT_ID",
  redirect_uri: "https://yourapp.com/callback",
  scope: "openid profile email",
  state: generateState(),           // random string to prevent CSRF
  code_challenge: codeChallenge,
  code_challenge_method: "S256",
});

const authorizationUrl =
  \`https://auth.example.com/authorize?\${params.toString()}\`;

// Redirect the user's browser to the authorization server
window.location.href = authorizationUrl;

// Helper: generate a random state value
function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}`;

const callbackCode = `// Step 4: Handle the callback — extract the code and validate state
const urlParams = new URLSearchParams(window.location.search);
const code  = urlParams.get("code");
const state = urlParams.get("state");
const error = urlParams.get("error");

if (error) {
  throw new Error(\`Authorization failed: \${error}\`);
}

// IMPORTANT: Validate the state parameter to prevent CSRF
const savedState = sessionStorage.getItem("oauth_state");
if (state !== savedState) {
  throw new Error("State mismatch — possible CSRF attack");
}

// Clean up state from storage
sessionStorage.removeItem("oauth_state");`;

const tokenExchangeCode = `// Step 5: Exchange the authorization code for tokens
const codeVerifier = sessionStorage.getItem("pkce_code_verifier");
sessionStorage.removeItem("pkce_code_verifier"); // clean up

const response = await fetch("https://auth.example.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type:    "authorization_code",
    code:          code,            // from the callback URL
    redirect_uri:  "https://yourapp.com/callback",
    client_id:     "YOUR_CLIENT_ID",
    code_verifier: codeVerifier,    // proves you started the flow
  }),
});

const tokens = await response.json();
// {
//   access_token:  "eyJhbG...",  (use for API calls)
//   refresh_token: "def502...",  (use to get new access tokens)
//   id_token:      "eyJhbG...",  (contains user identity, OIDC)
//   expires_in:    3600,         (access token lifetime in seconds)
//   token_type:    "Bearer"
// }`;

const apiCallCode = `// Step 6: Call a protected API with the access token
const response = await fetch("https://api.example.com/me", {
  headers: {
    // Always use the "Bearer" scheme
    Authorization: \`Bearer \${tokens.access_token}\`,
    "Content-Type": "application/json",
  },
});

if (response.status === 401) {
  // Token expired — try refreshing (see Step 7)
  await refreshAccessToken();
  return;
}

const userData = await response.json();`;

const refreshCode = `// Step 7: Use the refresh token to get a new access token
async function refreshAccessToken() {
  const response = await fetch("https://auth.example.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type:    "refresh_token",
      refresh_token: storedRefreshToken,
      client_id:     "YOUR_CLIENT_ID",
    }),
  });

  if (!response.ok) {
    // Refresh token expired or revoked — redirect user to login
    redirectToLogin();
    return;
  }

  const newTokens = await response.json();
  // Store the new tokens; some servers rotate the refresh token too
  storeTokens(newTokens);
}`;

const jwtDecodedExample = `// Example decoded JWT (ID token from OIDC)
// Header
{
  "alg": "RS256",   // Signing algorithm
  "typ": "JWT",
  "kid": "abc123"   // Key ID — used to look up the public key
}

// Payload (claims)
{
  "iss": "https://accounts.google.com",  // Issuer
  "sub": "1234567890",                   // Subject (unique user ID)
  "aud": "YOUR_CLIENT_ID",               // Audience (must match your app)
  "exp": 1716239022,                     // Expiry (Unix timestamp)
  "iat": 1716235422,                     // Issued at
  "email": "user@example.com",
  "name": "Jane Doe",
  "picture": "https://...",
  "email_verified": true
}

// Signature
// RS256 signature over base64url(header) + "." + base64url(payload)
// Verify this against the authorization server's public key!`;

// ─── Chapter components ────────────────────────────────────────────────────────

function ChapterWhyOAuth() {
  return (
    <div className="space-y-6">
      <ScrollReveal>
        <h2 className="text-2xl font-bold">Why OAuth Exists</h2>
        <p className="text-muted-foreground mt-1">
          Understanding the problem OAuth solves makes every other concept click into place.
        </p>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <CardTitle className="text-base text-destructive">Before OAuth: The Password Anti-Pattern</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p>
              Imagine you use a photo printing service called PrintPal. PrintPal wants to access the photos
              stored in your Google Photos account. Before OAuth existed, PrintPal would ask:{" "}
              <strong className="text-foreground">"Give us your Google username and password."</strong>
            </p>
            <p>This is catastrophic because:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>PrintPal could read your Gmail, access your Drive, or delete your account</li>
              <li>If PrintPal is breached, attackers now have your Google password</li>
              <li>You cannot revoke PrintPal's access without changing your Google password</li>
              <li>Google has no idea which app is acting on your behalf</li>
            </ul>
          </CardContent>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={0.15}>
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">The Hotel Key Card Analogy</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Think of OAuth like a hotel key card. When you check in, the front desk (the{" "}
              <strong className="text-foreground">Authorization Server</strong>) does not give you a copy of
              the master key. Instead, it programs a temporary key card (an{" "}
              <strong className="text-foreground">access token</strong>) that:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Only opens <em>your</em> room (limited scope)</li>
              <li>Expires at checkout (short-lived)</li>
              <li>Can be deactivated without changing the master key (revocable)</li>
            </ul>
            <p className="mt-2">
              OAuth gives PrintPal a temporary access token scoped only to reading your photos — nothing more,
              nothing less. Your Google password never leaves Google.
            </p>
          </CardContent>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={0.2}>
        <h3 className="text-lg font-semibold">Three Problems OAuth Solves</h3>
        <div className="grid gap-4 sm:grid-cols-3 mt-3">
          {[
            {
              icon: <Lock className="w-5 h-5" />,
              title: "Credential Sharing",
              desc: "Apps never see your password. Authorization happens directly between you and the authorization server.",
            },
            {
              icon: <ShieldCheck className="w-5 h-5" />,
              title: "Scope Limitation",
              desc: 'Apps request only the permissions they need — "read photos" not "full account access".',
            },
            {
              icon: <Key className="w-5 h-5" />,
              title: "Revocability",
              desc: "You can revoke a single app's access at any time from your account settings without changing your password.",
            },
          ].map((item) => (
            <Card key={item.title}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2 text-primary">
                  {item.icon}
                  <span className="font-semibold text-sm text-foreground">{item.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollReveal>
    </div>
  );
}

function ChapterFourActors() {
  return (
    <div className="space-y-6">
      <ScrollReveal>
        <h2 className="text-2xl font-bold">The Four Actors</h2>
        <p className="text-muted-foreground mt-1">
          Every OAuth interaction involves exactly four parties. Understanding who does what is essential.
        </p>
      </ScrollReveal>

      <StaggerReveal className="grid gap-4 sm:grid-cols-2">
        {[
          {
            icon: <Users className="w-5 h-5 text-blue-500" />,
            color: "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40",
            label: "Resource Owner",
            who: "The User",
            desc: "The human being who owns the data and can grant access to it. In the PrintPal example, this is you — the person whose photos are stored in Google Photos.",
          },
          {
            icon: <Globe className="w-5 h-5 text-violet-500" />,
            color: "border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/40",
            label: "Client",
            who: "The Application",
            desc: "The app that wants access to the resource. This is PrintPal — the photo printing service requesting permission to read your photos. The client never sees your password.",
          },
          {
            icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
            color: "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40",
            label: "Authorization Server",
            who: "The Trust Authority",
            desc: "The trusted party that authenticates you and issues tokens. In our example, this is Google's auth server (accounts.google.com). It verifies your identity and asks for your consent.",
          },
          {
            icon: <Database className="w-5 h-5 text-amber-500" />,
            color: "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40",
            label: "Resource Server",
            who: "The API",
            desc: "The server hosting the protected data. This is the Google Photos API. It validates incoming access tokens and either grants or denies access to your photos.",
          },
        ].map((actor) => (
          <Card key={actor.label} className={`border ${actor.color}`}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                {actor.icon}
                <span className="font-semibold text-sm">{actor.label}</span>
                <Badge variant="outline" className="text-xs">{actor.who}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{actor.desc}</p>
            </CardContent>
          </Card>
        ))}
      </StaggerReveal>

      <ScrollReveal delay={0.2}>
        <h3 className="text-lg font-semibold mb-3">How They Interact</h3>
        <div className="rounded-lg border bg-muted/30 p-4 overflow-x-auto">
          <div className="min-w-[420px] space-y-1 font-mono text-sm">
            <div className="flex items-center gap-2">
              <span className="w-40 text-blue-500 shrink-0">Resource Owner</span>
              <span className="text-muted-foreground">────── visits ──────→</span>
              <span className="text-violet-500">Client App</span>
            </div>
            <div className="flex items-center gap-2 pl-44">
              <span className="text-muted-foreground">── redirects user →</span>
              <span className="text-emerald-500">Authorization Server</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-40 text-blue-500 shrink-0">Resource Owner</span>
              <span className="text-muted-foreground">── logs in &amp; consents →</span>
              <span className="text-emerald-500">Authorization Server</span>
            </div>
            <div className="flex items-center gap-2 pl-44">
              <span className="text-muted-foreground">←── auth code ──────</span>
              <span className="text-emerald-500">Authorization Server</span>
            </div>
            <div className="flex items-center gap-2 pl-2">
              <span className="text-violet-500">Client App</span>
              <span className="text-muted-foreground">──────── exchange code →</span>
              <span className="text-emerald-500">Authorization Server</span>
            </div>
            <div className="flex items-center gap-2 pl-2">
              <span className="text-violet-500">Client App</span>
              <span className="text-muted-foreground">←─── access token ──────</span>
              <span className="text-emerald-500">Authorization Server</span>
            </div>
            <div className="flex items-center gap-2 pl-2">
              <span className="text-violet-500">Client App</span>
              <span className="text-muted-foreground">──── Bearer token ──→</span>
              <span className="text-amber-500">Resource Server</span>
            </div>
            <div className="flex items-center gap-2 pl-2">
              <span className="text-violet-500">Client App</span>
              <span className="text-muted-foreground">←────── data ───────</span>
              <span className="text-amber-500">Resource Server</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Notice: the Resource Owner only ever directly interacts with the Authorization Server to approve access.
          Your password never touches the Client App.
        </p>
      </ScrollReveal>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Globe(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function ChapterFirstFlow() {
  return (
    <div className="space-y-6">
      <ScrollReveal>
        <h2 className="text-2xl font-bold">Your First OAuth Flow</h2>
        <p className="text-muted-foreground mt-1">
          The Authorization Code flow with PKCE is the correct choice for virtually all web and mobile
          applications. Follow these 7 steps to implement it from scratch.
        </p>
      </ScrollReveal>

      <Alert>
        <Info className="w-4 h-4" />
        <AlertTitle>Why PKCE?</AlertTitle>
        <AlertDescription>
          PKCE (Proof Key for Code Exchange) prevents authorization code interception attacks. It is required
          for all public clients (apps that cannot securely store a client_secret) and is now mandatory in
          OAuth 2.1 for all flows.
        </AlertDescription>
      </Alert>

      {/* Step 1 */}
      <ScrollReveal delay={0.05}>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">1</div>
            <h3 className="font-semibold">Register Your App</h3>
          </div>
          <div className="ml-10">
            <p className="text-sm text-muted-foreground mb-2">
              Before you write any code, register your application with the Authorization Server (Google, GitHub,
              Auth0, etc.). You will receive a <code className="text-xs bg-muted px-1 py-0.5 rounded">client_id</code> and
              you must register at least one <code className="text-xs bg-muted px-1 py-0.5 rounded">redirect_uri</code>.
              Public clients (SPAs, mobile apps) do not use a client_secret.
            </p>
            <div className="bg-muted/40 rounded border px-4 py-3 text-sm font-mono space-y-1">
              <div><span className="text-muted-foreground">client_id:</span> <span className="text-green-400">abc123xyz</span></div>
              <div><span className="text-muted-foreground">redirect_uri:</span> <span className="text-green-400">https://yourapp.com/callback</span></div>
              <div><span className="text-muted-foreground">client_type:</span> <span className="text-amber-400">public</span> <span className="text-muted-foreground text-xs">(no secret)</span></div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Step 2 */}
      <ScrollReveal delay={0.1}>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">2</div>
            <h3 className="font-semibold">Generate PKCE Values</h3>
          </div>
          <div className="ml-10">
            <p className="text-sm text-muted-foreground mb-2">
              Before redirecting the user, generate a random <code className="text-xs bg-muted px-1 py-0.5 rounded">code_verifier</code> and
              its SHA-256 hash (<code className="text-xs bg-muted px-1 py-0.5 rounded">code_challenge</code>). Store the verifier
              — you will need it later.
            </p>
            <CodeBlock code={pkceGenerateCode} language="javascript" filename="pkce.ts" />
          </div>
        </div>
      </ScrollReveal>

      {/* Step 3 */}
      <ScrollReveal delay={0.1}>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">3</div>
            <h3 className="font-semibold">Redirect to the Authorization URL</h3>
          </div>
          <div className="ml-10">
            <p className="text-sm text-muted-foreground mb-2">
              Build the authorization URL with all required parameters and redirect the user. They will see the
              authorization server's login page and consent screen.
            </p>
            <CodeBlock code={buildAuthUrlCode} language="javascript" filename="login.ts" />
          </div>
        </div>
      </ScrollReveal>

      {/* Step 4 */}
      <ScrollReveal delay={0.1}>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">4</div>
            <h3 className="font-semibold">Handle the Callback</h3>
          </div>
          <div className="ml-10">
            <p className="text-sm text-muted-foreground mb-2">
              After the user approves access, the authorization server redirects back to your{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">redirect_uri</code> with a short-lived authorization{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">code</code>. Always validate the{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">state</code> parameter.
            </p>
            <CodeBlock code={callbackCode} language="javascript" filename="callback.ts" />
          </div>
        </div>
      </ScrollReveal>

      {/* Step 5 */}
      <ScrollReveal delay={0.1}>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">5</div>
            <h3 className="font-semibold">Exchange Code for Tokens</h3>
          </div>
          <div className="ml-10">
            <p className="text-sm text-muted-foreground mb-2">
              Make a back-channel POST request (server-to-server) to the token endpoint. Include the authorization
              code and the original <code className="text-xs bg-muted px-1 py-0.5 rounded">code_verifier</code>. This
              proves you initiated the flow.
            </p>
            <CodeBlock code={tokenExchangeCode} language="javascript" filename="token-exchange.ts" />
          </div>
        </div>
      </ScrollReveal>

      {/* Step 6 */}
      <ScrollReveal delay={0.1}>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">6</div>
            <h3 className="font-semibold">Make API Calls</h3>
          </div>
          <div className="ml-10">
            <p className="text-sm text-muted-foreground mb-2">
              Pass the access token in the{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">Authorization</code> header using the{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">Bearer</code> scheme. Handle 401 responses
              by refreshing the token.
            </p>
            <CodeBlock code={apiCallCode} language="javascript" filename="api-client.ts" />
          </div>
        </div>
      </ScrollReveal>

      {/* Step 7 */}
      <ScrollReveal delay={0.1}>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">7</div>
            <h3 className="font-semibold">Refresh the Access Token</h3>
          </div>
          <div className="ml-10">
            <p className="text-sm text-muted-foreground mb-2">
              Access tokens expire (typically in 1 hour). Use the refresh token to get a new one without
              interrupting the user. If the refresh token is also expired, the user must log in again.
            </p>
            <CodeBlock code={refreshCode} language="javascript" filename="refresh.ts" />
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}

function ChapterScopes() {
  return (
    <div className="space-y-6">
      <ScrollReveal>
        <h2 className="text-2xl font-bold">Scopes Explained</h2>
        <p className="text-muted-foreground mt-1">
          Scopes are the mechanism that limits what an access token can do. They are the implementation of the
          Principle of Least Privilege in OAuth.
        </p>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <Card>
          <CardContent className="pt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              When your app requests authorization, you specify a space-separated list of scopes. The
              authorization server presents these to the user in plain English on the consent screen. The
              issued access token is restricted to only those approved scopes.
            </p>
            <div className="bg-muted/40 rounded border px-4 py-3 font-mono text-sm overflow-x-auto">
              <span className="text-muted-foreground">https://auth.example.com/authorize?</span>
              <br />
              <span className="text-muted-foreground ml-4">...&amp;</span>
              <span className="text-blue-400">scope</span>
              <span className="text-muted-foreground">=</span>
              <span className="text-green-400">openid profile email read:photos</span>
            </div>
          </CardContent>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={0.15}>
        <h3 className="text-lg font-semibold">Common Scopes</h3>
        <div className="mt-3 rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Scope</th>
                <th className="px-4 py-2 text-left font-medium">What It Grants</th>
                <th className="px-4 py-2 text-left font-medium">Standard</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                ["openid", "Enables OIDC — allows requesting an ID token", "OIDC Core"],
                ["profile", "User's name, picture, locale", "OIDC Core"],
                ["email", "User's email address and verification status", "OIDC Core"],
                ["offline_access", "Request a refresh token for long-lived access", "OIDC Core"],
                ["read:photos", "Read access to photos (custom/app-defined)", "Custom"],
                ["write:posts", "Create and publish posts (custom/app-defined)", "Custom"],
                ["admin:org", "Manage organization settings (custom/app-defined)", "Custom"],
              ].map(([scope, desc, standard]) => (
                <tr key={scope} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2 font-mono text-xs text-primary">{scope}</td>
                  <td className="px-4 py-2 text-muted-foreground">{desc}</td>
                  <td className="px-4 py-2">
                    <Badge variant={standard === "OIDC Core" ? "default" : "secondary"} className="text-xs">
                      {standard}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.2}>
        <Alert>
          <ShieldCheck className="w-4 h-4" />
          <AlertTitle>Principle of Least Privilege</AlertTitle>
          <AlertDescription>
            Only request the scopes your application genuinely needs right now. Requesting broad scopes
            damages user trust (who wants an app asking for "manage organization" access?), increases your
            attack surface if tokens are stolen, and may cause authorization servers to reject your request
            or require additional user verification. Request additional scopes incrementally when the user
            tries to use a feature that requires them.
          </AlertDescription>
        </Alert>
      </ScrollReveal>
    </div>
  );
}

function ChapterTokens() {
  return (
    <div className="space-y-6">
      <ScrollReveal>
        <h2 className="text-2xl font-bold">Tokens 101</h2>
        <p className="text-muted-foreground mt-1">
          OAuth 2.0 uses three distinct token types. Each serves a different purpose with different
          security properties.
        </p>
      </ScrollReveal>

      <StaggerReveal className="grid gap-4 sm:grid-cols-3">
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-500" />
              <CardTitle className="text-sm">Access Token</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>Used to access protected APIs. Sent in every request header.</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs mt-2">
              <li>Short-lived: typically 1 hour</li>
              <li>Bearer token — anyone who has it can use it</li>
              <li>Often a JWT (self-contained)</li>
              <li>Treat like a password — never log it</li>
            </ul>
          </CardContent>
        </Card>
        <Card className="border-violet-200 dark:border-violet-800">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-violet-500" />
              <CardTitle className="text-sm">Refresh Token</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>Used to obtain new access tokens without re-authenticating the user.</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs mt-2">
              <li>Long-lived: days to months</li>
              <li>Sent only to the token endpoint</li>
              <li>Many servers rotate these on use</li>
              <li>Store securely — it's high value</li>
            </ul>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-500" />
              <CardTitle className="text-sm">ID Token (OIDC)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>Contains verified identity claims about the user. Part of OpenID Connect (OIDC).</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs mt-2">
              <li>Always a signed JWT</li>
              <li>Never send to APIs — it's for the client</li>
              <li>Validate the signature before trusting</li>
              <li>Check aud claim matches your client_id</li>
            </ul>
          </CardContent>
        </Card>
      </StaggerReveal>

      <ScrollReveal delay={0.2}>
        <h3 className="text-lg font-semibold mb-2">Inside a JWT</h3>
        <p className="text-sm text-muted-foreground mb-3">
          JWTs (JSON Web Tokens) are base64url-encoded JSON objects. They are <em>not encrypted</em> by
          default — anyone can decode the payload. They are <em>signed</em>, which means you can verify they
          were issued by a trusted party and have not been tampered with.
        </p>
        <CodeBlock code={jwtDecodedExample} language="json" filename="jwt-decoded.json" />
        <Alert className="mt-3">
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>Never Trust a JWT Without Validating the Signature</AlertTitle>
          <AlertDescription>
            Decode the header to find the <code>kid</code> (key ID), fetch the authorization server's JWKS
            (JSON Web Key Set) endpoint, find the matching public key, and verify the signature. Also check{" "}
            <code>exp</code> (not expired), <code>iss</code> (correct issuer), and <code>aud</code> (your
            client_id).
          </AlertDescription>
        </Alert>
      </ScrollReveal>
    </div>
  );
}

function ChapterPitfalls() {
  const pitfalls = [
    {
      id: "token-in-url",
      title: "Token in URL (Implicit Flow)",
      severity: "High",
      issue:
        "The deprecated Implicit flow returns access tokens directly in the URL fragment (#access_token=...). These tokens appear in browser history, server logs, Referer headers, and are accessible to any JavaScript on the page.",
      fix: "Always use Authorization Code + PKCE. Never use the Implicit flow. If you see response_type=token in your code, that is the implicit flow — replace it.",
    },
    {
      id: "http",
      title: "Using HTTP Instead of HTTPS",
      severity: "Critical",
      issue:
        "Transmitting tokens over unencrypted HTTP exposes them to network interception. A man-in-the-middle attacker on the same Wi-Fi network can trivially steal access tokens.",
      fix: "OAuth 2.0 mandates TLS (HTTPS) for all endpoints. Use HTTPS everywhere: authorization endpoint, token endpoint, redirect_uri, and your own API. Most authorization servers will reject non-HTTPS redirect URIs.",
    },
    {
      id: "state",
      title: "Not Validating the State Parameter",
      severity: "High",
      issue:
        "If you do not generate and validate the state parameter, your app is vulnerable to CSRF attacks. An attacker can trick your app into accepting an authorization code they initiated, potentially linking their account to a victim's session.",
      fix: 'Generate a cryptographically random state value before redirecting. Store it in sessionStorage. After the callback, verify that the state returned in the URL exactly matches what you stored. Reject the flow if it does not match.',
    },
    {
      id: "localstorage",
      title: "Storing Tokens in localStorage",
      severity: "High",
      issue:
        "localStorage is accessible to any JavaScript running on your page. A single XSS vulnerability — in your code, a third-party script, or a browser extension — can silently exfiltrate all tokens. The attacker then has persistent access until the tokens expire.",
      fix: "For SPAs: store access tokens in memory (JavaScript variables). They are lost on page refresh, but that is a worthwhile tradeoff for security. Use HttpOnly cookies (via a Backend for Frontend) for refresh tokens. See the SPA Developer path for detailed patterns.",
    },
  ];

  return (
    <div className="space-y-6">
      <ScrollReveal>
        <h2 className="text-2xl font-bold">What Can Go Wrong</h2>
        <p className="text-muted-foreground mt-1">
          These are the most common mistakes developers make when implementing OAuth. Each one can lead to a
          real security vulnerability.
        </p>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <Accordion type="single" collapsible className="space-y-2">
          {pitfalls.map((pitfall) => (
            <AccordionItem
              key={pitfall.id}
              value={pitfall.id}
              className="border rounded-lg px-4 data-[state=open]:border-destructive/40"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                  <span className="font-medium text-left">{pitfall.title}</span>
                  <Badge
                    variant={pitfall.severity === "Critical" ? "destructive" : "outline"}
                    className={`text-xs shrink-0 ${
                      pitfall.severity === "High"
                        ? "border-orange-300 text-orange-600 dark:border-orange-700 dark:text-orange-400"
                        : ""
                    }`}
                  >
                    {pitfall.severity}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Issue</p>
                  <p className="text-sm text-muted-foreground">{pitfall.issue}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-1">Fix</p>
                  <p className="text-sm text-muted-foreground">{pitfall.fix}</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollReveal>

      <ScrollReveal delay={0.2}>
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold text-sm">You have completed the Beginner Path!</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              You now understand why OAuth exists, who the actors are, how the Authorization Code + PKCE
              flow works, what scopes and tokens do, and the most critical pitfalls to avoid. You are ready
              to build real OAuth integrations.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/flows/authorization-code">
                  Interactive Flow Diagram <ArrowRight className="ml-1.5 w-3 h-3" />
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/checklist">
                  Security Checklist <ArrowRight className="ml-1.5 w-3 h-3" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </ScrollReveal>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BeginnerPathPage() {
  const [currentChapter, setCurrentChapter] = useState(1);
  const totalChapters = CHAPTERS.length;

  const chapterComponents: Record<number, React.ReactNode> = {
    1: <ChapterWhyOAuth />,
    2: <ChapterFourActors />,
    3: <ChapterFirstFlow />,
    4: <ChapterScopes />,
    5: <ChapterTokens />,
    6: <ChapterPitfalls />,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/paths" className="hover:text-foreground transition-colors">Learning Paths</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">Beginner — Web Apps</span>
      </div>

      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold">Beginner — Web Apps</h1>
          <Badge className="bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
            Beginner
          </Badge>
        </div>
        <p className="text-muted-foreground">
          A complete guide to OAuth from first principles. Build a real login flow in 30 minutes.
        </p>
      </div>

      {/* Progress and chapter navigation */}
      <div className="mb-8 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground font-medium">
            Chapter {currentChapter} of {totalChapters}: <span className="text-foreground">{CHAPTERS[currentChapter - 1].title}</span>
          </span>
          <span className="text-muted-foreground">{Math.round((currentChapter / totalChapters) * 100)}% complete</span>
        </div>
        <Progress value={(currentChapter / totalChapters) * 100} className="h-2" />
        <div className="flex flex-wrap gap-1.5">
          {CHAPTERS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setCurrentChapter(ch.id)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                ch.id === currentChapter
                  ? "bg-primary text-primary-foreground border-primary"
                  : ch.id < currentChapter
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {ch.id}. {ch.title}
            </button>
          ))}
        </div>
      </div>

      <Separator className="mb-8" />

      {/* Chapter content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentChapter}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {chapterComponents[currentChapter]}
        </motion.div>
      </AnimatePresence>

      {/* Prev / Next navigation */}
      <div className="mt-12 pt-6 border-t flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => setCurrentChapter((c) => Math.max(1, c - 1))}
          disabled={currentChapter === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground hidden sm:block">
          {CHAPTERS[currentChapter - 1].title}
        </span>
        {currentChapter < totalChapters ? (
          <Button onClick={() => setCurrentChapter((c) => Math.min(totalChapters, c + 1))}>
            Next: {CHAPTERS[currentChapter].title}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button asChild>
            <Link href="/paths">
              All Paths <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
