# Surrealbox

A modern, reputation-weighted Q&A community platform where the best answers surface through collective intelligence. Built for debate-driven discussions with a clean, responsive interface.

---

## Features

- **Single-Page Feed Architecture** — The entire Q&A experience happens directly in the feed. No dedicated detail pages, no unnecessary navigation. Everything from voting to answering is inline.
- **Threaded Discussions** — Supports nested replies for comments, allowing for deep, organized conversations.
- **Engagement Ecosystem** — Robust voting system for questions, answers, and comments. User reputation adjusts dynamically based on community feedback.
- **Polymorphic Moderation** — Integrated three-dot action menus for all content (questions, answers, comments) with flagging capabilities and user verification status.
- **Lazy-Loaded Interactions** — Answers, comments, and replies are fetched on-demand, optimizing initial performance while ensuring a seamless user experience.
- **Reputation System** — SR (Surrealbox Reputation) points earned through quality contributions, with verified expert status for top community members.
- **Adaptive UI** — Mobile-first design that scales elegantly from small mobile viewports to large desktop monitors with smooth Framer Motion transitions.
- **AI-Powered Moderation** — Content is automatically screened for appropriateness before being published to the community.

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
    questions/        GET (public) · POST (auth) · [id]/view (POST) · [id]/flag (POST)
    answers/          GET (auth) · POST (auth) · [id]/accept (PATCH) · [id]/flag (POST)
    comments/         GET (auth) · POST (auth) · [id]/flag (POST)
    votes/            POST (auth, polymorphic voting)
  (non-admin)/
    page.tsx          Main Explore Feed entry point
  db/
    schema.ts         Core models: questions, answers, comments, votes, user, flags
  types/
    home.type.ts      Unified data interfaces
components/
  app/
    HomeFeed/
      QuestionCard.tsx   Polymorphic question component with interaction layers
      AnswerCard.tsx     Nested answer component with accepted status and menu
      CommentItem.tsx    Recursive comment component supporting threaded replies
      Avatar.tsx         Dynamic user avatar with gender and status variants
```

---

## API Design

### `GET /api/comments`
**Auth required.** Returns paginated comments for a question, answer, or another comment (for threading).
Query params: `parentId`, `parentType` (`question` | `answer` | `comment`), `page`, `limit`.

### `POST /api/votes`
**Auth required.** Polymorphic voting endpoint.
Body: `{ votableId, votableType, direction: 'up' | 'down' }`.
Handles automatic reputation adjustments for authors and voters.

---

## Local Development

```bash
bun install
cp .env.example .env
bun dev
```

---

**Built with ❤️ by Dhruv Ratan Jayaswal**
