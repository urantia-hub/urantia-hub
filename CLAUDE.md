# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UrantiaHub is a Next.js web application that provides access to the Urantia Papers with features including reading tracking, bookmarks, notes, AI-powered chat, search, and curated daily quotes. The app integrates with external APIs (urantia.dev) for paper content and uses a PostgreSQL database with Prisma ORM for user data.

## Development Commands

### Running the Application
```bash
npm run dev       # Start development server on port 3001
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

### Database Operations
```bash
npm run seed      # Seed database with papers, labels, and paper-label associations
npx prisma migrate dev          # Run database migrations
npx prisma generate             # Generate Prisma client
npx prisma studio               # Open Prisma Studio GUI
```

### Verifying a Deploy

A failed Vercel build leaves the previous READY deployment serving traffic, so the
live site looking fine is not evidence that a commit shipped. Two production
deploys sat in state ERROR for three months before anyone noticed. After pushing,
check the deployment state through the Vercel MCP (`list_deployments` /
`get_deployment`) and confirm the commit SHA matches.

### Two remotes — push both

The repo has two remotes and every main push must go to both:
- `kelsonic` = `kelsonic/UrantiaHub.com` (private). Vercel deploys from this one.
- `origin` = `urantia-hub/OpenUrantia.com` (public mirror). Dependabot alerts live here.

A push to `origin` alone deploys nothing; a push to `kelsonic` alone leaves the
public mirror and its security scanning stale. Keep the histories identical
(merge commits, not squash, so the mirror can fast-forward).

### Preview deploys skip migrations

`vercel.json` owns the build command. It runs `prisma migrate deploy` only when
`VERCEL_ENV` is `production` because the Preview environment's DATABASE_URL
points at a dead database (every preview build failed with P1017 until
2026-08-18). Previews build and render; they never migrate.

### Specialized Scripts
```bash
npm run screenshots              # Generate screenshots for community resources
npm run build:with-screenshots   # Generate screenshots then build
```

## Architecture

### Framework & Tech Stack
- **Framework**: Next.js 15 (Pages Router, not App Router; upgraded from 14 on 2026-08-18)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with email (Resend) and Google OAuth providers
- **Styling**: Tailwind CSS with custom design system in `once-ui/`
- **Caching**: Redis (IORedis)
- **Error Tracking**: Sentry
- **Deployment**: Vercel (project `urantia-hub`, team Adams Technologies, deploys from the `kelsonic/UrantiaHub.com` remote on `main` — see "Two remotes" above)
- **Package manager**: yarn v1, and `yarn.lock` is the only lockfile. Do not add a `package-lock.json`; a stale duplicate lockfile hid dependency fixes here before.
- **AI Integration**: Vercel AI SDK with Anthropic Claude (default), OpenAI, xAI models

### Project Structure

**Pages (`pages/`)**: Next.js pages using Pages Router
- Main pages: `index.tsx`, `papers/[paperName].tsx`, `search/`, `explore/`, etc.
- Auth pages: `auth/sign-in/`, `auth/verify-request/`, etc.
- Admin pages: `admin/curated-quotes/`
- API routes: `pages/api/` (follows Next.js API routes pattern)

**Components (`components/`)**: Reusable React components
- Navigation: `Navbar.tsx`, `HomepageNavbar.tsx`, `PaperNavbar.tsx`
- Features: `AskAI.tsx`, `Share.tsx`, `Note.tsx`, `BookmarkCategoryModal.tsx`
- UI elements: `Modal.tsx`, `Spinner.tsx`, `TiltButton.tsx`, `ParticleBackground.tsx`

**Services (`services/`)**: Data access layer with BaseService pattern
- Each service (e.g., `user/`, `bookmark/`, `paper/`) implements CRUD operations
- All extend `services/base/index.ts` abstract class
- Services use Prisma Client for database operations
- Pattern: `new UserService()` → CRUD methods (create, find, findMany, update, delete, etc.)

**Database (`prisma/`)**: Prisma schema and migrations
- Key models: User, Paper, Bookmark, Note, ReadNode, CuratedQuote, Label, Share
- User progress tracking through ReadNode model
- Bookmarks support categories
- Papers have labels (topics) for categorization
- NextAuth models: Account, Session, VerificationToken

**Utils (`utils/`)**: Shared utility functions
- `config.ts`: Application configuration
- `paperFormatters.ts`: Paper ID/URL conversion utilities
- `node.ts`: Node (paragraph) manipulation utilities
- `email-templates/`: Email HTML/text templates for magic links, daily quotes, etc.

**Libraries (`libs/`)**: External service clients
- `libs/prisma/client.ts`: Singleton Prisma client
- `libs/aws/`: AWS SDK client
- `libs/redis/`: Redis client

**Data (`data/`)**: Static data files
- `resources.js`: Community resources list used on `/community-resources` page

**Scripts (`scripts/`)**: Utility scripts
- `seed.ts`: Database seeding (papers, labels, paper-labels)
- `generate-screenshots.js`: Puppeteer script to capture website screenshots
- SQL files: Initial data for papers and labels

### External API Integration

The app consumes the Urantia Papers content from `api.urantia.dev` (Hono + Drizzle + Supabase on Cloudflare Workers):
- Papers metadata and full content fetched via `NEXT_PUBLIC_URANTIA_DEV_API_HOST`
- Audio files served from CloudFront CDN (`NEXT_PUBLIC_AUDIO_FILES_CDN`)
- Paper data is not stored locally; fetched as needed and cached with Redis
- API docs available at [urantia.dev](https://urantia.dev)
- **Migrated**: All API calls now go through `libs/urantiaApi/client.ts` which handles response mapping from the new API format to the legacy UBNode type.

### Authentication Flow

NextAuth.js configuration in `pages/api/auth/[...nextauth].ts`:
- Email magic link (via Resend)
- Google OAuth
- Custom auth pages in `pages/auth/`
- Session management with database sessions
- Prisma adapter for user/session storage

### Data Model Patterns

**Node System**: Papers are structured hierarchically
- Paper → Section → Paragraph (referred to as "nodes")
- Each node has a `globalId` (unique identifier across the Papers)
- User interactions (bookmarks, notes, reads, shares) reference nodes by `globalId`, `paperId`, `paperSectionId`, `paperSectionParagraphId`

**User Progress Tracking**:
- `ReadNode`: Tracks which paragraphs a user has read
- `lastVisitedAt`, `lastVisitedGlobalId`, `lastVisitedPaperId` on User model
- Progress page shows reading completion percentage

**Email Notifications**:
- Cron jobs in `pages/api/crons/` send automated emails
- Daily quotes: Curated quotes sent to subscribed users
- Continue reading: Reminder emails after 24 hours of inactivity
- Users can toggle email preferences: `emailNotificationsEnabled`, `emailDailyQuoteEnabled`, `emailContinueReadingEnabled`, `emailChangelogEnabled`

### AI Features

AI chat interface (`components/AskAI.tsx`, `pages/api/chat/index.ts`):
- Uses Vercel AI SDK for streaming responses
- Context includes current paper/paragraph content
- Default model: Anthropic Claude Haiku 4.5 (`claude-haiku-4-5-20251001`)
- Supported models: Claude Haiku 4.5, Claude Sonnet 4.6, Claude Opus 4.6, Grok Beta, OpenAI o1-mini
- Model selection via `AI_MODEL` environment variable

### Middleware & Error Tracking

- Sentry middleware: `middleware/sentry.ts`
- Sentry configurations: `sentry.client.config.ts`, `sentry.edge.config.ts`, `sentry.server.config.ts`
- Instrumentation: `instrumentation.ts`

### Environment Variables

Key environment variables (see `.env.example`):
- `DATABASE_URL`: PostgreSQL connection
- `REDIS_URL`: Redis connection
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`: NextAuth configuration
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: OAuth
- `RESEND_API_KEY`, `EMAIL_FROM`: Email service
- `NEXT_PUBLIC_URANTIA_DEV_API_HOST`: External API for paper content (`https://api.urantia.dev`)
- `ANTHROPIC_API_KEY`: Anthropic Claude (default AI model)
- `OPENAI_API_KEY`, `XAI_API_KEY`: Alternative AI models
- `AI_MODEL`: Model selection (default `claude-haiku-4-5-20251001`)
- `CRON_SECRET`: Secure cron endpoints
- `ADMIN_SECRET`: Secure admin endpoints

## Important Conventions

**Service Layer**: Always use services for database operations, not direct Prisma calls in API routes or components
- Example: `new UserService().findMany(args)` instead of `prisma.user.findMany(args)`

**Node References**: When working with paragraph-level data, always include all four identifiers: `globalId`, `paperId`, `paperSectionId`, `paperSectionParagraphId`

**API Route Protection**: Use `getSessionDetails` utility (from `utils/getSessionDetails.ts`) to authenticate API routes that require user context

**Paper Content**: Never assume paper content is in the local database; always fetch from `urantia.dev` API

**Linking to redirect API routes**: Use a plain `<a>`, never `next/link`, for hrefs that point at an API route (`deriveReadLink` returns `/api/redirect/user/read`, which 307s to a page). A client-side transition to a non-page can land on the target page with empty `pageProps`, which crashed `/explore` in production. `TiltButton` handles this by branching on `/api/` hrefs.

**Page props are not guaranteed**: Default array props from `getStaticProps` (`{ nodes = [] }`) rather than dereferencing them directly. Same reason as above: the client router can render a page with no props at all.

**TypeScript**: The project uses TypeScript; type definitions in `types/` directory

**Styling**: Use Tailwind CSS classes; custom design tokens in `once-ui/` for consistent theming

## API Migration Context

All API calls now go through `libs/urantiaApi/client.ts`, which maps new API responses to legacy types:

| New Endpoint | Client Function | Used By |
|---|---|---|
| `GET /toc` | `fetchToc()` | `pages/papers/index.tsx`, `pages/explore/index.tsx` |
| `GET /papers/{id}` | `fetchPaper(id)` | `pages/papers/[paperName].tsx` |
| `POST /search` | `searchParagraphs(q)` | `pages/api/urantia-book/search.ts` |
| `GET /paragraphs/{ref}` | `fetchParagraph(ref)` | cron jobs, admin curated-quotes, services |
| `GET /paragraphs/{ref}` (batch) | `fetchParagraphs(refs)` | bookmark/note/readNode services |
| Local computation | `getPaperParagraphCounts()` | `pages/api/user/nodes/progress/index.ts` |

**Response mapping** (`libs/urantiaApi/mapper.ts`):
- `id` → `globalId`
- Constructs `paperSectionId` and `paperSectionParagraphId` from component fields
- Defaults `language` to `"eng"`, `type` to `"paragraph"`
- Search `htmlText` is already enriched with `<span class=urantia-dev-highlighted>` by the API via `ts_headline`

## Dependency Pins

These pins are deliberate — do not "upgrade" them without checking the reason:

- `@testing-library/jest-dom` exact `6.9.1` — 6.10.0 is a botched release that requires Node 22; this machine builds on Node 20.
- `resolutions` block forces patched transitive versions (axios, follow-redirects, postcss, sharp, rollup) that parent packages pin too low. Keep the block when regenerating the lockfile.
- `nodemailer` looks unused (Resend sends the emails) but next-auth's EmailProvider imports it at module load, so it must stay a dependency.

## Known Technical Debt

These are pre-existing issues — do not fix unless explicitly asked:

- **Remaining `any` types** — Reduced significantly in services/utils/API routes, but some remain in components and client-side pages
- **moment.js** — heavy date library (user chose to keep for now), used for formatting
- **Pre-existing ESLint warnings** in older files
- **Pre-existing TypeScript errors** in some test files (unknown types)
- **API calls use `libs/urantiaApi/client.ts`** — centralized client with response mapping layer

## Logging

Use `utils/logger.ts` for server-side logging instead of `console.log`/`console.error`:
```typescript
import createLogger from "@/utils/logger";
const logger = createLogger("moduleName");
logger.info("message", { key: value });
logger.error("message", error);
```

## Testing

- Framework: Vitest + React Testing Library
- Run: `npm run test`
- Tests cover: hooks (6), services (4), API routes (4), components (4), pages (2)
- Service tests use dependency injection to mock Prisma models
- API route tests mock `getSessionDetails`, services, and `withSentry`

**Never put test files under `pages/`.** Next treats every file there as a route:
`vi.mock` runs during page-data collection and hard-fails `next build`, and API
route tests deploy as live public endpoints. Page and API route tests live in the
top-level `__tests__/pages/...` mirror and import the subject by alias
(`await import("@/pages/api/user/nodes/progress")`). Tests colocated with
`components/`, `hooks/`, and `services/` are fine.
