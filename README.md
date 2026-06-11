# JanSahayak — AI Guide to Indian Government Schemes 🇮🇳

A bilingual (English + తెలుగు), AI-powered web app that helps Indian citizens discover government schemes, eligibility, required documents, application procedures, and the nearest government offices.

> **Live preview:** see the project preview URL in your Lovable dashboard.

---

## ✨ Features

- 🤖 **AI Assistant** — recommends schemes personalized to your **age, income, occupation, gender, state, and category** (SC/ST/OBC/EWS/Minority). Powered by Lovable AI (Gemini).
- 🔍 **Scheme Finder** — 50+ verified central and state schemes (PM-KISAN, Ayushman Bharat, PMAY, PMMY, PMVY, Rythu Bandhu, Kalyana Lakshmi, etc.) with category filters and voice search.
- 🏛 **Service Information** — Aadhaar, PAN, Passport, Driving License, Voter ID procedures with fees, documents, and processing times.
- 🗺 **Office Locator** — searchable list + interactive **OpenStreetMap** map with directions to government offices.
- 🌐 **Bilingual UI** — instant toggle between **English** and **తెలుగు**; AI replies in the selected language.
- 🎙 **Voice search** — Web Speech API (en-IN / te-IN).
- 🌗 **Dark mode** — professional government-tech theme (navy + saffron).
- 🔐 **Auth** — Email + Google OAuth via Lovable Cloud.
- ⭐ **Favorites & Dashboard** — save schemes, view personal dashboard.
- 🛡 **Admin Dashboard** — role-gated overview (uses a separate `user_roles` table + `has_role()` security definer function for safe RLS).
- 📱 **Mobile-first**, responsive, accessible.

---

## 🧱 Tech Stack

| Layer | Tech |
|---|---|
| Framework | React 19 + TanStack Start v1 + Vite 7 |
| Styling | Tailwind CSS v4 (CSS-first tokens) |
| UI | shadcn/ui + Lucide icons |
| State / Data | TanStack Query |
| Backend | **Lovable Cloud** (Supabase: Postgres + Auth + RLS) |
| AI | Lovable AI Gateway → `google/gemini-3-flash-preview` |
| Maps | Leaflet + OpenStreetMap (no API key) |
| Auth | Supabase Auth (Email + Google OAuth via Lovable broker) |
| i18n | Custom lightweight provider (en/te) |

---

## 🗂 Database (Lovable Cloud / Postgres)

- `profiles` — user profile (auto-created on signup via trigger)
- `user_roles` — role assignments (`admin` / `user`) — **separate table, not a column** (prevents privilege escalation)
- `schemes` — 50+ Indian government schemes (bilingual)
- `services` — civic services (Aadhaar, PAN, Passport…)
- `offices` — government offices with lat/lng
- `favorites` — user-saved schemes

All tables have RLS enabled. Public reads where appropriate; user-scoped writes via `auth.uid()`.

---

## 🚀 Getting started locally

```bash
bun install
bun dev
```

Environment variables are auto-provisioned by Lovable Cloud (see `.env`).

---

## 🌐 Deployment

Hit **Publish** in the Lovable editor (top-right). A `.lovable.app` URL is created instantly. Custom domain can be connected in **Project Settings → Domains** after the first publish.

Frontend changes require clicking **Update** in the publish dialog. Backend changes (migrations, server functions) deploy automatically.

---

## 📁 Project structure

```
src/
├── routes/             # File-based routes (TanStack Start)
│   ├── index.tsx       # Home (hero, stats, featured schemes)
│   ├── assistant.tsx   # AI chat with profile-based recommendations
│   ├── schemes.tsx     # Search + filter + favorites
│   ├── services.tsx    # Step-by-step procedures
│   ├── offices.tsx     # List + interactive map (Leaflet)
│   ├── dashboard.tsx   # User favorites
│   ├── admin.tsx       # Admin overview
│   └── auth.tsx        # Sign in / sign up
├── lib/
│   ├── ai.functions.ts # Server function calling Lovable AI Gateway
│   ├── auth.tsx        # Auth context + isAdmin
│   ├── i18n.tsx        # en/te dictionary + provider
│   └── theme.tsx       # Light/dark theme
├── components/
│   ├── Header.tsx, Footer.tsx
│   ├── ClientOnly.tsx  # SSR guard for browser-only widgets
│   ├── OfficeMap.tsx   # Leaflet map
│   └── ui/             # shadcn/ui components
└── integrations/
    └── supabase/       # Lovable Cloud client (auto-generated)
```

---

## 🤖 How the AI personalization works

1. User opens **My profile** in the assistant and fills age, gender, occupation, income band, state, category. Saved to `localStorage` (no PII server-side).
2. On send, the profile is passed to the `chatAI` server function.
3. The server fetches the live `schemes` knowledge base from Postgres and injects it + profile into the system prompt.
4. Gemini ranks the most relevant schemes (state-specific first, then age/income/occupation matches) and replies in the user's chosen language with markdown (eligibility, benefits, docs, apply link).

---

## 🛡 Security highlights

- Roles in a **separate `user_roles` table** + `has_role()` SECURITY DEFINER function (avoids RLS recursion and privilege escalation).
- All user data scoped by `auth.uid()` via RLS.
- AI key (`LOVABLE_API_KEY`) lives server-side only; never shipped to the browser.
- Service role key never imported at module scope of client-reachable files.

---

## 📜 License

MIT — built with [Lovable](https://lovable.dev).
