<div align="center">

# OAuth Mastery

### Complete Interactive Guide to OAuth 2.0 / 2.1

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**Master OAuth 2.0 and OAuth 2.1 — from first principles to production-ready implementation.**
Interactive flow diagrams · JWT inspector · PKCE generator · Security checklists · Role-based learning paths

[Report a Bug](https://github.com/hananbabar98/oauth/issues) · [Request Feature](https://github.com/hananbabar98/oauth/issues)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Pages & Routes](#pages--routes)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**OAuth Mastery** is a fully interactive educational platform designed to help developers understand, implement, and secure OAuth 2.0 and 2.1 integrations. Whether you're a complete beginner or an experienced backend engineer, this platform offers tailored learning paths, animated flow diagrams, and hands-on tools that make complex authorization concepts accessible and practical.

> Think of OAuth like a hotel key card — your password is the master key, but OAuth gives apps a temporary card that only opens specific doors.

---

## Features

### Learning Content

- **5 OAuth Flow Guides** — Authorization Code + PKCE, Client Credentials, Device Authorization, Implicit (deprecated), Refresh Token — each with HTTP request/response examples, animated step-through diagrams, and code samples in JavaScript, Python, Go, and curl
- **5 Role-Based Learning Paths** — Beginner (6-chapter curriculum), Mobile Developer, SPA Developer, Backend/API, Security Specialist — ranging from 530 to 896 lines of curated content
- **OAuth 2.1 Updates** — What changed, what's deprecated, and why it matters
- **Edge Case Library** — 8 real-world security vulnerabilities with explanations, attack vectors, and mitigations

### Interactive Playground Tools

- **JWT Inspector** — Paste any JWT and decode its header, payload, and signature in real-time
- **Decision Tree** — Answer a few questions and get a recommended OAuth flow for your use case
- **PKCE Generator** — Generate cryptographically secure code verifier and challenge pairs

### Security Checklist (37 items across 5 sections)

| Section                        | Items                                                                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Authorization Server Config    | PKCE enforcement, exact URI matching, state required, token lifetimes, revocation, introspection, rate limiting, refresh rotation |
| Client Implementation          | Auth Code + PKCE, no secret exposure, cryptographic state, PKCE S256, redirect URI, least-privilege scopes                        |
| Token Handling                 | Validate every request, secure storage, expiry handling, concurrent refresh mutex, revoke on logout, no plaintext logging         |
| API Security (Resource Server) | JWT signature verify, exp/iss/aud claims, scope per endpoint, HTTPS only, JWKS caching                                            |
| Production Readiness           | HTTPS everywhere, auth failure monitoring, incident response plan, secret rotation, security headers, dependency scanning         |

Interactive, localStorage-persisted, with Markdown export.

### Platform

- Full-text fuzzy search across all 73+ topics with Fuse.js
- Smooth scroll-reveal animations powered by Framer Motion
- Dark mode with system preference detection
- Fully responsive — desktop, tablet, and mobile
- Syntax-highlighted code blocks with one-click copy

---

## Screenshots

### Home Page — Hero & Overview

> **Add screenshot:** Run the app, navigate to `/`, take a screenshot, and replace this section.
> Suggested path: `public/screenshots/home.png`

```
📸 Screenshot: Home page — hero section, actors overview, flows grid
```

### OAuth Flows Overview

> **Add screenshot:** Navigate to `/flows`

```
📸 Screenshot: /flows — all 5 flow cards with descriptions
```

### Interactive Playground

> **Add screenshot:** Navigate to `/playground`

```
📸 Screenshot: /playground — JWT Inspector and PKCE Generator tabs
```

### Security Checklist

> **Add screenshot:** Navigate to `/checklist`

```
📸 Screenshot: /checklist — interactive checklist with progress bar
```

### Edge Case Library

> **Add screenshot:** Navigate to `/edge-cases`

```
📸 Screenshot: /edge-cases — 8 security vulnerability cards
```

---

> **Tip for adding screenshots:** Take screenshots with your browser at 1280×800, save them to `public/screenshots/`, then replace each block above with:
>
> ```md
> ![Description](public/screenshots/filename.png)
> ```

---

## Tech Stack

| Category   | Technology                                                                             |
| ---------- | -------------------------------------------------------------------------------------- |
| Framework  | [Next.js 16](https://nextjs.org/) — App Router, Server & Client Components             |
| Language   | [TypeScript 5](https://www.typescriptlang.org/) — full type safety                     |
| UI Library | [React 19](https://react.dev/)                                                         |
| Styling    | [Tailwind CSS v4](https://tailwindcss.com/)                                            |
| Components | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) primitives |
| Animation  | [Framer Motion](https://www.framer.com/motion/)                                        |
| Icons      | [Lucide React](https://lucide.dev/)                                                    |
| Search     | [Fuse.js](https://www.fusejs.io/) — fuzzy full-text search                             |
| Fonts      | [Inter](https://rsms.me/inter/) + [JetBrains Mono](https://www.jetbrains.com/lp/mono/) |

---

## Getting Started

### Prerequisites

Make sure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) v18 or higher — [Download here](https://nodejs.org/en/download)
- [npm](https://www.npmjs.com/) v9+ (bundled with Node.js)
- [Git](https://git-scm.com/) — [Download here](https://git-scm.com/downloads)

Verify your setup:

```bash
node --version   # should print v18.x.x or higher
npm --version    # should print 9.x.x or higher
git --version    # should print git version x.x.x
```

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/hananbabar98/oauth.git
cd oauth
```

---

### Step 2 — Install Dependencies

```bash
npm install
```

Or with an alternative package manager:

```bash
pnpm install   # pnpm
yarn install   # yarn
```

> This installs Next.js, React, Tailwind CSS, Framer Motion, shadcn/ui components, and all other dependencies listed in `package.json`.

---

### Step 3 — Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You should see the OAuth Mastery home page with the hero section and flow overview.

The development server supports hot reload — any changes you make to source files are reflected instantly in the browser.

---

### Step 4 — Explore the App

Once running, navigate to the key sections:

| URL                                | What to explore                              |
| ---------------------------------- | -------------------------------------------- |
| `http://localhost:3000`            | Home — hero, actors, flow overview           |
| `http://localhost:3000/flows`      | All 5 OAuth flow guides                      |
| `http://localhost:3000/playground` | JWT Inspector, PKCE Generator, Decision Tree |
| `http://localhost:3000/checklist`  | Interactive security checklist               |
| `http://localhost:3000/edge-cases` | 8 security edge cases                        |
| `http://localhost:3000/oauth-21`   | OAuth 2.1 changes                            |

---

### Step 5 — Build for Production

When you're ready to deploy:

```bash
npm run build     # creates an optimised production build in .next/
npm run start     # serves the production build at http://localhost:3000
```

---

### Available Scripts

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Start development server with hot reload |
| `npm run build` | Create an optimised production build     |
| `npm run start` | Serve the production build locally       |
| `npm run lint`  | Run ESLint across the entire codebase    |

---

## Project Structure

```
oauth/
├── src/
│   ├── app/                          # Next.js App Router pages & layouts
│   │   ├── page.tsx                  # Home page
│   │   ├── layout.tsx                # Root layout (header, sidebar, theme)
│   │   ├── globals.css               # Global Tailwind styles
│   │   │
│   │   ├── flows/                    # OAuth flow guides
│   │   │   ├── page.tsx              # Flows index
│   │   │   ├── authorization-code/   # Auth Code + PKCE
│   │   │   ├── client-credentials/   # Machine-to-machine
│   │   │   ├── device/               # Device / IoT
│   │   │   ├── implicit/             # Implicit (deprecated)
│   │   │   └── refresh-token/        # Token refresh
│   │   │
│   │   ├── paths/                    # Role-based learning paths
│   │   │   ├── page.tsx              # Paths index
│   │   │   ├── beginner/
│   │   │   ├── mobile/
│   │   │   ├── spa/
│   │   │   ├── backend/
│   │   │   └── security/
│   │   │
│   │   ├── playground/page.tsx       # Interactive dev tools
│   │   ├── checklist/page.tsx        # Security checklist
│   │   ├── edge-cases/page.tsx       # Vulnerability library
│   │   ├── oauth-21/page.tsx         # OAuth 2.1 guide
│   │   └── search/                   # Full-text search
│   │
│   ├── components/
│   │   ├── layout/                   # Header, Sidebar, ScrollReveal
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── flows/                    # Animated SVG flow diagrams
│   │   └── tools/                    # Playground tool components
│   │
│   └── lib/
│       ├── nav.ts                    # Navigation tree + 73-item search index
│       └── utils.ts                  # JWT decode, PKCE gen, clipboard, cn
│
├── public/                           # Static assets
├── tailwind.config.ts
├── next.config.ts
└── tsconfig.json
```

---

## Pages & Routes

| Route                       | Description                                                     |
| --------------------------- | --------------------------------------------------------------- |
| `/`                         | Home — hero, the four actors, flows overview, common pitfalls   |
| `/flows`                    | All OAuth flow guides index                                     |
| `/flows/authorization-code` | Authorization Code + PKCE — the recommended modern flow         |
| `/flows/implicit`           | Implicit Flow — deprecated, historical reference                |
| `/flows/client-credentials` | Client Credentials — server-to-server / machine-to-machine      |
| `/flows/device`             | Device Authorization — smart TVs, IoT, CLI tools                |
| `/flows/refresh-token`      | Refresh Token flow and rotation best practices                  |
| `/paths`                    | Learning paths index                                            |
| `/paths/beginner`           | Start here — OAuth from scratch, no prior knowledge required    |
| `/paths/mobile`             | OAuth for iOS and Android developers                            |
| `/paths/spa`                | OAuth for Single Page Applications                              |
| `/paths/backend`            | OAuth for server-side APIs and microservices                    |
| `/paths/security`           | Advanced path for security specialists                          |
| `/playground`               | JWT Inspector · PKCE Generator · Decision Tree                  |
| `/checklist`                | Interactive production-readiness security checklist             |
| `/edge-cases`               | Library of 8 common OAuth security vulnerabilities              |
| `/oauth-21`                 | OAuth 2.1 changes — what's new, what's removed, migration guide |
| `/search`                   | Full-text fuzzy search across all topics                        |

---

## Contributing

Contributions, issues, and feature requests are welcome!

### How to Contribute

1. **Fork** this repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/oauth.git
   cd oauth
   ```
3. **Create** a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** and commit using [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: add animated diagram for auth code flow"
   git commit -m "fix: correct PKCE code challenge generation"
   git commit -m "docs: add missing JSDoc for generatePKCE"
   ```
5. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Open a Pull Request** against the `main` branch of this repository

### Ideas for Contributions

- Animated SVG diagrams for the flow pages (`src/components/flows/`)
- Additional edge cases or security vulnerability examples
- New learning path content
- Translations / i18n support
- Accessibility improvements

### Reporting Issues

Found a bug or want to suggest a feature? [Open an issue](https://github.com/hananbabar98/oauth/issues) with:

- A clear, descriptive title
- Steps to reproduce the problem (for bugs)
- Expected vs actual behaviour
- Browser, OS, and Node.js version if relevant

---

## License

This project is licensed under the [MIT License](LICENSE).

You are free to use, copy, modify, merge, publish, distribute, sublicense, and sell copies of this software, as long as the original copyright notice is included.

---

<div align="center">

Built by **[Abdul Hanan Babar](https://www.linkedin.com/in/abdul-hanan-babar-b37811142/)** · © 2026

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Abdul%20Hanan%20Babar-0A66C2?style=flat&logo=linkedin)](https://www.linkedin.com/in/abdul-hanan-babar-b37811142/)
[![GitHub](https://img.shields.io/badge/GitHub-hananbabar98-181717?style=flat&logo=github)](https://github.com/hananbabar98)

⭐ If this helped you understand OAuth, please consider giving the repo a star — it helps others find it!

**[Back to top ↑](#oauth-mastery)**

</div>
