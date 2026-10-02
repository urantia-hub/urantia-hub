# UrantiaHub

A Next.js web application for reading, studying, and engaging with the Urantia Book. Live at [urantiahub.com](https://urantiahub.com).

Paper content is served by [api.urantia.dev](https://urantia.dev), a separate Hono + Drizzle API on Cloudflare Workers. UrantiaHub fetches content on demand and stores only user data locally.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      User Browser                       │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 UrantiaHub (Next.js 14)                  │
│                   urantiahub.com :3001                   │
│                                                         │
│  Pages: reading, search, explore, progress, my-library  │
│  Auth: NextAuth (magic link + Google OAuth)             │
│  AI: Vercel AI SDK (Anthropic Claude / OpenAI / xAI)   │
│  Email: Resend + SendGrid                               │
│                                                         │
│  ┌─────────┐  ┌──────────┐  ┌────────────────────────┐ │
│  │ Prisma  │  │  Redis   │  │  Service Layer         │ │
│  │ (Users, │  │ (Cache)  │  │  BaseService → CRUD    │ │
│  │ Notes,  │  │          │  │  15 specialized svcs   │ │
│  │ etc.)   │  │          │  │                        │ │
│  └────┬────┘  └────┬─────┘  └────────────────────────┘ │
└───────┼─────────────┼──────────────────┬────────────────┘
        │             │                  │ HTTP fetch
        ▼             ▼                  ▼
   PostgreSQL      Redis     ┌──────────────────────────┐
                             │  api.urantia.dev          │
                             │  (Hono + Cloudflare       │
                             │   Workers)                │
                             │                          │
                             │  Content: 197 papers     │
                             │  Search: Postgres FTS    │
                             │  Semantic: pgvector      │
                             │                          │
                             │  ┌────────┐ ┌─────────┐ │
                             │  │Supabase│ │pgvector │ │
                             │  │Postgres│ │(embed.) │ │
                             │  └────────┘ └─────────┘ │
                             └──────────────────────────┘
                                         │
                                    CloudFront CDN
                                    (Audio MP3s)
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (Pages Router) |
| Language | TypeScript |
| Database | PostgreSQL via Prisma |
| Caching | Redis (ioredis) |
| Search | Proxied via api.urantia.dev (Postgres FTS + pgvector semantic search) |
| Auth | NextAuth.js (email magic link + Google OAuth) |
| AI | Vercel AI SDK — Anthropic Claude (default), OpenAI, xAI |
| Email | Resend (magic links) + SendGrid (transactional) |
| Monitoring | Sentry (client, server, edge) |
| Styling | Tailwind CSS + once-ui design system |
| Hosting | Vercel |
| Audio CDN | CloudFront |

---

## External API (api.urantia.dev)

Paper content is served by `api.urantia.dev` (docs at [urantia.dev](https://urantia.dev)). The hub never stores paper text locally — it fetches on demand and caches with Redis.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/toc` | Table of contents |
| GET | `/papers` | List all 197 papers |
| GET | `/papers/{id}` | Single paper with all paragraphs |
| GET | `/paragraphs/{ref}` | Paragraph by globalId, standardReferenceId, or paperSectionParagraphId |
| GET | `/paragraphs/{ref}/context` | Paragraph with surrounding context |
| GET | `/paragraphs/random` | Random paragraph |
| POST | `/search` | Full-text search |
| POST | `/search/semantic` | Semantic search via pgvector embeddings |
| GET | `/audio` | Audio file URLs |
| GET | `/health` | Health check |

---

## Features

| Feature | Description |
|---------|-------------|
| **Reading** | Full paper reader with section navigation and paragraph-level tracking |
| **Bookmarks** | Save paragraphs with optional categories |
| **Notes** | Attach personal notes to any paragraph (max 1000 chars) |
| **AI Chat** | AI-powered explanations of passages (Claude Haiku 4.5 default, cached) |
| **Search** | Full-text search with suggestions, popular/recent queries |
| **Progress** | Per-paper reading completion percentages |
| **Audio** | Audio narration from CloudFront CDN with Spotify episode links |
| **Sharing** | Share passages via copy link/text, Facebook, Instagram, WhatsApp, X |
| **Explore** | Featured passages, most-read papers, topic-based discovery |
| **Email** | Magic link auth, daily quotes, continue reading reminders, changelog updates |
| **Admin** | Curated quotes management, changelog email broadcasting |

---

## Page Routes

**Core Reading:**
- `/` — Homepage with hero, features overview, featured passages
- `/papers` — All 197 papers organized by 4 parts, filterable by topic labels
- `/papers/[paperName]` — Full paper reader with bookmarks, notes, sharing, AI, audio

**Discovery & Library:**
- `/explore` — Featured passages, papers in progress, most-read, papers by topic
- `/search` — Full-text search with popular/recent suggestions
- `/progress` — Per-paper reading completion grid
- `/my-library` — User bookmarks and notes with filtering/sorting
- `/my-library/bookmarks` — Bookmarks with category management

**Account:**
- `/settings` — User preferences and notification settings
- `/settings/interests` — Topic interest management
- `/onboarding/interests` — First-time interest selection
- `/auth/sign-in`, `/auth/verify-request`, `/auth/sign-out`, `/auth/error`

**Content & Legal:**
- `/changelog`, `/community-resources`, `/blockchain-archive`
- `/privacy-policy`, `/cookie-policy`, `/terms-of-service`
- `/admin/curated-quotes` — Admin curated quotes management

---

## API Routes (Internal)

**User Management:**
- `GET/PUT/DELETE /api/user` — Profile, notification prefs, account deletion
- `GET /api/user/nodes/last-visited` — Resume reading position
- `POST/GET /api/user/nodes/read` — Track paragraphs read (5-min throttle)
- `GET /api/user/nodes/progress` — Reading progress for all papers
- `DELETE /api/user/nodes/progress` — Reset all reading progress

**Bookmarks & Notes:**
- `POST/GET/DELETE /api/user/nodes/bookmarks` — CRUD bookmarks by paper
- `GET/PATCH /api/user/nodes/bookmarks/[id]` — Update bookmark category
- `GET /api/user/bookmark-categories` — List categories
- `POST/GET /api/user/nodes/notes` — CRUD notes by paper

**Activity & Interests:**
- `GET /api/user/activity` — Combined bookmarks + notes feed
- `GET/POST /api/user/interests` — Topic interest preferences

**Search:**
- `POST /api/urantia-book/search` — Proxy to api.urantia.dev search
- `POST/GET /api/searches` — Track search queries
- `GET /api/searches/popular` — Popular searches
- `GET /api/searches/recent` — User's recent searches

**Explore:**
- `GET /api/explore/most-read` — Top 6 most-read papers (cached weekly)
- `GET /api/explore/papers-by-topic` — Papers by topic label
- `GET /api/explore/curated-quotes` — Featured quotes

**AI & Email:**
- `POST /api/chat` — AI paragraph explanations (streaming, cached)
- `POST /api/crons/sendDailyQuote` — Daily quote email cron
- `POST /api/crons/sendContinueReadingAfter24Hours` — Resume reading reminder cron
- `POST /api/admin/sendChangelogUpdate` — Broadcast changelog email
- `GET /api/user/unsubscribe` — Email unsubscribe

**Redirects:**
- `GET /api/redirect/user/read` — Redirect to last visited paper
- `GET /api/redirect/papers/by-standard-reference-id/[id]` — Redirect by reference ID

---

## Service Layer

All services extend `services/base/index.ts` (BaseService) providing: `create`, `find`, `findMany`, `get`, `update`, `upsert`, `delete`, `deleteMany`, `count`.

| Service | Model | Extra Methods |
|---------|-------|---------------|
| `UserService` | User | — |
| `BookmarkService` | Bookmark | `getUserBookmarksWithDetails()` — enriches with paragraph content from API |
| `NoteService` | Note | `getUserNotesWithDetails()` — enriches with paragraph content from API |
| `ReadNodeService` | ReadNode | — |
| `PaperService` | Paper | — |
| `LabelService` | Label | — |
| `PaperLabelService` | PaperLabel | — |
| `ShareService` | Share | — |
| `UserSearchService` | — | Search history tracking |
| `UserInterestService` | UserInterest | — |
| `AIExplanationService` | AIExplanation | AI response caching |
| `CuratedQuoteService` | CuratedQuote | — |
| `SentQuoteService` | SentQuote | Per-user quote tracking |
| `AccountService` | Account | NextAuth account linking |
| `SessionService` | Session | Session management |

---

## Database Schema (Prisma)

**Core User Models:**
- `User` — email, name, image, admin flag, email preferences (4 toggles), last visited tracking
- `Account` — NextAuth OAuth accounts (Google)
- `Session` — NextAuth database sessions
- `VerificationToken` — Magic link tokens

**Content Interaction Models:**
- `Bookmark` — globalId, paperId, sectionId, paragraphId, optional category, userId
- `Note` — globalId, paperId, sectionId, paragraphId, text, userId
- `ReadNode` — tracks individual paragraph reads per user
- `Share` — paragraph shares with platform enum and count
- `AIExplanation` — cached AI responses keyed by globalId

**Content Metadata Models:**
- `Paper` — id, title, globalId (seeded from SQL)
- `Label` — topic categories (Science, Theology, etc.)
- `PaperLabel` — many-to-many paper ↔ label
- `UserInterest` — many-to-many user ↔ label
- `CuratedQuote` — admin-selected quotes with sentAt tracking
- `SentQuote` — per-user quote delivery tracking

---

## Data Model & Node System

### Content Hierarchy

```
Part (4 parts)
 └── Paper (197 papers, 0–196)
      └── Section (variable per paper)
           └── Paragraph (the atomic unit / "node")
```

### globalId Format

Every paragraph has a unique `globalId`: `"partId:paperId.sectionId.paragraphId"`

Example: `"1:2.0.1"` = Part 1, Paper 2, Section 0, Paragraph 1

### User Interactions → Nodes

All user interactions reference paragraphs using four identifiers:
- `globalId` — unique across the entire book
- `paperId` — which paper (0–196)
- `paperSectionId` — which section within the paper
- `paperSectionParagraphId` — which paragraph within the section

Models that reference nodes: `Bookmark`, `Note`, `ReadNode`, `Share`, `AIExplanation`, `CuratedQuote`, `SentQuote`

---

## Authentication Flow

NextAuth.js configured in `pages/api/auth/[...nextauth].ts`:

1. **Email Magic Link** — user enters email → Resend sends magic link → user clicks → session created
2. **Google OAuth** — standard OAuth flow via Google provider
3. **Session Storage** — database sessions via Prisma adapter
4. **Route Protection** — `utils/getSessionDetails.ts` extracts session in API routes
5. **Custom Pages** — `/auth/sign-in`, `/auth/verify-request`, `/auth/error`, `/auth/sign-out`

---

## AI Integration

- **SDK**: Vercel AI SDK for streaming responses
- **Default Model**: Anthropic Claude Haiku 4.5 (`claude-haiku-4-5-20251001`)
- **Supported Models**: Claude Haiku 4.5, Claude Sonnet 4.6, Claude Opus 4.6, Grok Beta, OpenAI o1-mini — configurable via `AI_MODEL` env var
- **Caching**: Responses cached in `AIExplanation` model keyed by globalId — same paragraph never re-queried
- **Context**: Current paragraph text + paper context sent with each request
- **Endpoint**: `POST /api/chat` with streaming response

---

## Email System

**Providers**: Resend (magic link auth) + SendGrid (transactional emails)

**Templates** (`utils/email-templates/`):
- `magicLink.ts` — login magic link
- `dailyQuote.ts` — daily curated quote
- `continueReading24Hours.ts` — resume reading after 24h inactivity
- `changelogUpdate.ts` — product updates
- `baseEmailTemplate.ts` — shared styling

**Cron Jobs** (secured via `CRON_SECRET` header):
- `sendDailyQuote` — picks unsent curated quote, emails to subscribed users
- `sendContinueReadingAfter24Hours` — finds users inactive 24h+, sends resume link

**User Preferences** (4 independent toggles):
- `emailNotificationsEnabled` — master toggle
- `emailDailyQuoteEnabled` — daily quote subscription
- `emailContinueReadingEnabled` — inactivity reminders
- `emailChangelogEnabled` — product updates

---

## Caching Strategy

Redis caching via `libs/redis/`:

| Key Pattern | TTL | Purpose |
|-------------|-----|---------|
| Most-read papers | 1 week | Explore page top papers |
| Search results (api) | 3 days | Search response cache |
| Progress calculation (api) | 3 days | Paper progress percentages |

---

## Key Directories

```
urantia-hub/
├── pages/
│   ├── api/                      # 30+ API routes
│   │   ├── auth/[...nextauth].ts # NextAuth configuration
│   │   ├── chat/index.ts         # AI chat endpoint
│   │   ├── crons/                # Scheduled email jobs
│   │   ├── user/                 # User CRUD + interactions
│   │   ├── explore/              # Discovery endpoints
│   │   ├── searches/             # Search tracking
│   │   ├── admin/                # Admin endpoints
│   │   └── redirect/             # URL redirects
│   ├── papers/[paperName].tsx    # Paper reader page
│   ├── search/index.tsx          # Search page
│   ├── explore/index.tsx         # Explore page
│   ├── progress/index.tsx        # Progress tracker
│   ├── my-library/               # Bookmarks + notes
│   ├── settings/                 # User preferences
│   ├── auth/                     # Auth pages
│   └── ...                       # Other pages
├── components/
│   ├── Navbar.tsx                # Main navigation
│   ├── AskAI.tsx                 # AI chat interface
│   ├── Note.tsx                  # Note modal
│   ├── Share.tsx                 # Share modal
│   ├── BookmarkCategoryModal.tsx # Bookmark categories
│   ├── ParticleBackground.tsx    # Animated background
│   └── ...                       # 25+ components
├── services/                     # BaseService → 15 specialized services
├── libs/
│   ├── prisma/client.ts          # Singleton Prisma client
│   ├── redis/                    # Redis client + helpers
│   └── ...
├── utils/
│   ├── config.ts                 # Audio config, reading speed, Spotify IDs
│   ├── paperFormatters.ts        # Paper ID ↔ URL conversions
│   ├── node.ts                   # Node/globalId utilities
│   ├── getSessionDetails.ts      # API route auth helper
│   ├── email-templates/          # HTML email templates
│   └── renderNode.tsx            # Paragraph rendering
├── once-ui/                      # Custom design system / tokens
├── types/                        # TypeScript definitions
├── data/resources.js             # Community resources list
├── scripts/
│   ├── seed.ts                   # Database seeding
│   └── generate-screenshots.js   # Puppeteer screenshot capture
└── prisma/schema.prisma          # 15 models
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis

### Setup

```bash
cd urantia-hub
cp .env.example .env          # Fill in all credentials
npm install
npx prisma migrate dev        # Run database migrations
npx prisma generate           # Generate Prisma client
npm run seed                  # Seed papers, labels, paper-labels
npm run dev                   # Starts on http://localhost:3001
```

Set `NEXT_PUBLIC_URANTIA_DEV_API_HOST` in `.env` to `https://api.urantia.dev` (or `http://localhost:3000` if running urantia-dev-api locally).

---

## Environment Variables

Key environment variables (see `.env.example`):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection |
| `REDIS_URL` | Redis cache |
| `NEXT_PUBLIC_URANTIA_DEV_API_HOST` | api.urantia.dev URL |
| `NEXT_PUBLIC_AUDIO_FILES_CDN` | CloudFront CDN for audio |
| `NEXT_PUBLIC_HOST` | Hub public URL |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | NextAuth config |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `RESEND_API_KEY`, `EMAIL_FROM` | Resend (magic link emails) |
| `SENDGRID_API_KEY`, `SENDGRID_FROM` | SendGrid (transactional emails) |
| `SENDGRID_SEND_DAILY_QUOTE_TEMPLATE_ID` | Daily quote email template |
| `SENDGRID_SEND_CONTINUE_READING_TEMPLATE_ID` | Continue reading template |
| `ANTHROPIC_API_KEY` | Anthropic Claude (default AI model) |
| `OPENAI_API_KEY` | OpenAI for AI explanations |
| `XAI_API_KEY` | xAI (Grok) alternative model |
| `AI_MODEL` | Model selection (default `claude-haiku-4-5-20251001`) |
| `CRON_SECRET` | Secures cron job endpoints |
| `ADMIN_SECRET` | Secures admin endpoints |
| `SEED_EMAIL` | Email for database seeding |
| `SENTRY_AUTH_TOKEN` | Sentry error tracking |

---

## Deployment

UrantiaHub deploys to **Vercel**.

**Cron Jobs** (Vercel Cron):
- `POST /api/crons/sendDailyQuote` — daily
- `POST /api/crons/sendContinueReadingAfter24Hours` — daily

Both require `CRON_SECRET` header for authorization.

**Error Tracking**: Sentry configured for client, server, and edge runtimes.

**Audio Hosting**: MP3 files stored in S3, served via CloudFront CDN.

---

## Further Reading

- See `CLAUDE.md` for development conventions and coding patterns
- See `TODOS.md` for the prioritized improvement roadmap

## Related

- [urantia.dev](https://urantia.dev): the API and MCP server that serve the text. A separate project that UrantiaHub uses.
- [docs.urantia.dev](https://docs.urantia.dev): the API docs.
- [Dalamatia](https://dalamatia.urantiahub.com): a story game set in Paper 66, with links back to the text here.

## License

This project is licensed under the [MIT License](./LICENSE).

## Disclaimer

This is an independent community project by [Adams Technologies LLC](https://adamstechnologies.com). It is not affiliated with, endorsed by, or connected with Urantia Foundation. The original English text of *The Urantia Book* is in the public domain (*Michael Foundation v. Urantia Foundation*, 10th Cir. 2003). All use of "Urantia" is nominative fair use to identify the subject matter.
