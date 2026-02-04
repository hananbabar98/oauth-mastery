import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    resolve();
  });
}

export function decodeJWT(token: string): {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  valid: boolean;
  warnings: string[];
} {
  try {
    const parts = token.trim().split(".");
    if (parts.length !== 3) throw new Error("Invalid JWT format");

    const decodeBase64 = (str: string) => {
      const pad = str.length % 4;
      const padded = pad ? str + "=".repeat(4 - pad) : str;
      return JSON.parse(atob(padded.replace(/-/g, "+").replace(/_/g, "/")));
    };

    const header = decodeBase64(parts[0]);
    const payload = decodeBase64(parts[1]);
    const warnings: string[] = [];

    // Security checks
    if (header.alg === "none") warnings.push("CRITICAL: Algorithm is 'none' — no signature verification!");
    if (header.alg === "HS256") warnings.push("WARNING: HS256 shares secret between issuer and verifier.");
    if (!payload.exp) warnings.push("WARNING: No expiration (exp) claim — token never expires.");
    if (payload.exp && typeof payload.exp === "number" && payload.exp < Date.now() / 1000) {
      warnings.push("EXPIRED: Token has expired.");
    }
    if (!payload.iss) warnings.push("INFO: No issuer (iss) claim.");
    if (!payload.aud) warnings.push("INFO: No audience (aud) claim — any service can accept this.");

    return { header, payload, signature: parts[2], valid: true, warnings };
  } catch {
    return {
      header: {},
      payload: {},
      signature: "",
      valid: false,
      warnings: ["Invalid JWT format"],
    };
  }
}

export function generatePKCE(): { verifier: string; challenge: string } {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  // For demo purposes, show a mock challenge
  const challenge = btoa(verifier.substring(0, 20))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return { verifier, challenge };
}

export function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString();
}
