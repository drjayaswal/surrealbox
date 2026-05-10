# Surrealbox

A modern, reputation-weighted Q&A community platform where the best answers surface through collective intelligence. Built for debate-driven discussions with a clean, responsive interface.

---

## Features

- **Single-Page Feed Architecture** — The entire Q&A experience happens directly in the feed. No dedicated detail pages, no unnecessary navigation. Everything from voting to answering is inline.
- **Explore Feed** — Paginated question feed with trending and newest sort modes, debounced live search, and skeleton loading states.
- **Lazy-Loaded Discussions** — Answers and comments are fetched on-demand only when an authenticated user expands the dropdown, keeping the initial page load fast.
- **Auth-Gated Interactions** — Viewing answers/comments, posting, and voting all require authentication. Unauthenticated clicks surface a contextual sign-in modal instead of silently failing.
- **Weight-Based Votes** — Vote score reflects community reputation. High-reputation voters carry more weight.
- **Reputation System** — Earn SR (Surrealbox Reputation) by asking quality questions and posting helpful answers.
- **Pagination** — Server-side pagination with ellipsis page controls, live item count, and prev/next navigation.
- **Graceful State Management** — Per-card loading, error, and submission states. Counts update optimistically on successful post. State resets cleanly on feed navigation.
- **Modern UI** — Framer Motion animations, micro-interactions, responsive layout, and dark-mode-ready design tokens.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database | PostgreSQL (Neon serverless) |
| ORM | Drizzle ORM |
| Authentication | Better-Auth |
| Styling | Vanilla CSS + Tailwind CSS |
| Animation | Framer Motion |
| Icons | Phosphor Icons |
| Runtime | Bun |

---

## Project Structure

```text
app/
  api/
    questions/        GET (public, paginated) · POST (auth required)
    questions/[id]/   POST (increment views)
    answers/          GET (auth required, lazy) · POST (auth required)
    answers/[id]/     PATCH (accept answer, owner only)
    comments/         GET (auth required, lazy) · POST (auth required)
    votes/            POST (auth required, cast vote)
  (non-admin)/
    page.tsx          Explore Feed home page (Single-Page App entry point)
  db/
    schema.ts         Drizzle schema — questions, answers, comments, votes, users
  types/
    home.type.ts      Shared TypeScript interfaces for feed data
components/
  app/
    HomeFeed/
      QuestionCard.tsx   Full card with lazy answer/comment dropdowns
      AnswerCard.tsx     Answer with lazy comment dropdown
      CommentItem.tsx    Single comment row
      QuestionSkeleton.tsx  Pulse skeleton for loading state
      AskQuestionCard.tsx   Ask question modal
    AuthModal.tsx      Sign-in prompt modal
```

---

## API Design

### `GET /api/questions`
Public. Fetches paginated questions with live answer/comment counts via grouped subqueries. Does **not** join answers or comments — those are fetched lazily.

Query params: `page`, `limit`, `q` (search), `sort` (`newest` | `trending`)

### `GET /api/answers?questionId=<id>`
**Auth required.** Returns paginated answers (with author) for a question. No comments joined — fetched separately per answer.

### `GET /api/comments?parentId=<id>&parentType=<question|answer>`
**Auth required.** Returns paginated comments for a question or answer.

### `POST /api/questions` · `POST /api/answers` · `POST /api/comments`
All require an active session. Input is validated server-side. Authors cannot answer/comment on their own content.

---

## Local Development

```bash
bun install

cp .env.example .env

bun dev
```

### Environment Variables

```env
BETTER_AUTH_SECRET=
BETTER_AUTH_API_KEY=
BETTER_AUTH_URL=
DATABASE_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_UNSPLASH_APP_ID=
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=
NEXT_PUBLIC_UNSPLASH_SECRET_KEY=
```

---

## Error Handling & Logging

All API routes use structured `console.error` / `console.info` / `console.warn` with a `[ROUTE_METHOD]` prefix for easy log filtering:

```
[QUESTIONS_GET] page=1 limit=10 sort=trending returned=10 total=42
[ANSWERS_POST] New answer id=... for question=... by user=...
[COMMENTS_GET] Unauthenticated request for parentId=... parentType=question
```

Client-side fetch errors surface as `toast.error()` messages. A retry button appears on feed-level failures.

---

**Built with ❤️ by Dhruv Ratan Jayaswal**
