# TMQ Authenticity Desk

**AI Text Detection Aggregator Platform** — One submission, many detectors, one report, one permanent history.

Built for [The Midnight Quill (TMQ)](https://themidnightquill.com).

## Overview

The TMQ Authenticity Desk lets a user paste text once and have it checked by several AI-content detectors in the background, then returns one consolidated report — together with the original text — by Gmail or WhatsApp.

### How It Works

1. **Submit** — Paste text (or upload a file), choose where to receive the report (email, WhatsApp, or both), press Check.
2. **Detect** — The platform runs your text through 5 AI detectors in parallel: GPTZero, Copyleaks, Sapling, Originality.ai, Winston AI.
3. **Report** — A consolidated report shows each detector's score, a combined verdict, and an agreement indicator.
4. **Deliver** — The report (with original text and PDF) arrives by email and/or WhatsApp.
5. **History** — Every check is saved. Users see their own history; admins see everything.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite (dev) / PostgreSQL (production) via Prisma |
| Job Queue | BullMQ on Redis (with in-memory fallback) |
| Email | Nodemailer (SMTP) / Resend / Amazon SES |
| WhatsApp | WhatsApp Business Cloud API |
| PDF | pdf-lib |

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Redis (optional — falls back to in-memory processing)

### Setup

```bash
# Clone and install
cd tmq-authenticity-desk

# Backend
cd server
npm install
cp .env.example .env    # Edit with your API keys
npx prisma generate
npx prisma db push
npx ts-node seed.ts     # Create admin + sample user
npm run dev

# Frontend (in another terminal)
cd client
npm install
npm run dev
```

### Default Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tmq.com | admin123 |
| User | user@tmq.com | user123 |

### Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Environment Variables

See `server/.env.example` for all required configuration.

### Required API Keys (for production)
- **GPTZero**: https://gptzero.me/api
- **Copyleaks**: https://copyleaks.com/ai-content-detector
- **Sapling**: https://sapling.ai/api
- **Originality.ai**: https://originality.ai/api
- **Winston AI**: https://winston.ai/api

> **Dev mode**: Without API keys, the system uses mock detectors that return realistic random scores.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│   React SPA     │────▶│  Express API     │────▶│  SQLite/PG   │
│   (Vite)        │     │  (REST + SSE)    │     │  (Prisma)    │
└─────────────────┘     └────────┬─────────┘     └──────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │ GPTZero  │ │Copyleaks │ │ Sapling  │ ...
              └──────────┘ └──────────┘ └──────────┘
                    │            │            │
                    └────────────┼────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │   Report Builder        │
                    │   (PDF + Email + WA)    │
                    └─────────────────────────┘
```

## Features

- ✅ Multi-detector AI text analysis (5 providers)
- ✅ Consolidated report with combined score & agreement
- ✅ PDF report generation (TMQ green manuscript style)
- ✅ Gmail delivery with PDF attachment
- ✅ WhatsApp delivery with PDF document
- ✅ Real-time status updates (SSE)
- ✅ User history with search & filters
- ✅ Admin dashboard with full visibility
- ✅ User management (quotas, suspend/reactivate)
- ✅ Detector management (enable/disable, weights)
- ✅ Audit logging
- ✅ CSV export
- ✅ Result caching by text hash
- ✅ JWT authentication + Google OAuth
- ✅ Rate limiting & security headers

## TMQ Design Theme

The interface uses TMQ's green literary theme:
- 🟢 Forest Green `#0E3B2C` — Primary
- 🌿 Moss `#3F7D58` — Accents
- 🍃 Sage `#A9C5A0` — Soft fills
- 📜 Parchment `#F6F1E3` — Background
- ✒️ Ink `#1B1B18` — Text
- ⚠️ Amber `#B7791F` — Alerts

## License

Private — The Midnight Quill © 2026
