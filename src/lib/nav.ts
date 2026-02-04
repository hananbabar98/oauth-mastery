export interface NavItem {
  title: string;
  href: string;
  badge?: string;
  children?: NavItem[];
}

export const navigation: NavItem[] = [
  {
    title: "Overview",
    href: "/",
  },
  {
    title: "Learning Paths",
    href: "/paths",
    children: [
      { title: "Beginner — Web Apps", href: "/paths/beginner", badge: "Start here" },
      { title: "Mobile Developer", href: "/paths/mobile" },
      { title: "SPA Developer", href: "/paths/spa" },
      { title: "Backend / API", href: "/paths/backend" },
      { title: "Security Specialist", href: "/paths/security" },
    ],
  },
  {
    title: "Flow Explorer",
    href: "/flows",
    children: [
      { title: "Authorization Code + PKCE", href: "/flows/authorization-code", badge: "Recommended" },
      { title: "Implicit Flow", href: "/flows/implicit", badge: "Deprecated" },
      { title: "Client Credentials", href: "/flows/client-credentials" },
      { title: "Device Authorization", href: "/flows/device" },
      { title: "Refresh Token Flow", href: "/flows/refresh-token" },
    ],
  },
  {
    title: "OAuth 2.1 Updates",
    href: "/oauth-21",
  },
  {
    title: "Edge Case Library",
    href: "/edge-cases",
  },
  {
    title: "Integration Checklist",
    href: "/checklist",
  },
  {
    title: "Playground",
    href: "/playground",
    badge: "Interactive",
  },
];

export const searchIndex = [
  { title: "What is OAuth?", href: "/", section: "Overview", keywords: ["oauth", "authorization", "intro", "basics"] },
  { title: "OAuth Actors", href: "/#actors", section: "Overview", keywords: ["client", "resource server", "authorization server", "resource owner"] },
  { title: "Authorization Code Flow", href: "/flows/authorization-code", section: "Flows", keywords: ["pkce", "code", "authorization code", "auth code"] },
  { title: "PKCE", href: "/flows/authorization-code#pkce", section: "Flows", keywords: ["proof key", "code verifier", "code challenge", "s256"] },
  { title: "Implicit Flow", href: "/flows/implicit", section: "Flows", keywords: ["implicit", "deprecated", "token in url"] },
  { title: "Client Credentials", href: "/flows/client-credentials", section: "Flows", keywords: ["m2m", "machine to machine", "service account", "client credentials"] },
  { title: "Device Authorization", href: "/flows/device", section: "Flows", keywords: ["device code", "smart tv", "cli", "device flow"] },
  { title: "Refresh Tokens", href: "/flows/refresh-token", section: "Flows", keywords: ["refresh", "token rotation", "sliding sessions"] },
  { title: "OAuth 2.1 Changes", href: "/oauth-21", section: "Spec", keywords: ["2.1", "pkce required", "redirect uri", "rotation"] },
  { title: "CSRF & State Parameter", href: "/edge-cases#csrf", section: "Security", keywords: ["csrf", "state", "cross site request forgery"] },
  { title: "PKCE Downgrade Attack", href: "/edge-cases#pkce-downgrade", section: "Security", keywords: ["downgrade", "pkce attack", "plain verifier"] },
  { title: "Token Leakage", href: "/edge-cases#token-leakage", section: "Security", keywords: ["leakage", "referrer", "logs", "fragment"] },
  { title: "Redirect URI Attacks", href: "/edge-cases#redirect-uri", section: "Security", keywords: ["open redirect", "redirect uri validation", "wildcard"] },
  { title: "Scope Escalation", href: "/edge-cases#scope-escalation", section: "Security", keywords: ["scope", "escalation", "privilege"] },
  { title: "Token Storage (SPA)", href: "/paths/spa#storage", section: "Guides", keywords: ["localStorage", "sessionStorage", "memory", "httponly cookie"] },
  { title: "Token Inspector", href: "/playground#inspector", section: "Tools", keywords: ["jwt", "decode", "inspect", "token"] },
  { title: "Decision Tree", href: "/playground#decision", section: "Tools", keywords: ["which flow", "grant type", "decision"] },
  { title: "Security Checklist", href: "/checklist", section: "Tools", keywords: ["checklist", "security", "production", "audit"] },
];
