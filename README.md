# PromptForge

Enterprise-grade AI prompt engineering platform. Generate, compare, and rank prompts across Gemini, Claude, and DeepSeek using proven frameworks (RTF, COSTAR, RISEN, CRISPE, Chain of Thought, Few-Shot).

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in your API keys and database URL

# Run database migrations
npx drizzle-kit push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Database**: Neon Postgres + Drizzle ORM
- **Auth**: NextAuth.js v5 (JWT + Credentials)
- **AI**: Gemini 2.0 Flash, Claude 3 Haiku, DeepSeek Chat, GPT-4o (ranking)
- **Charts**: Recharts
- **Styling**: Tailwind CSS 4

## Deployment Checklist (Vercel)

- [ ] Create Vercel project and link repository
- [ ] Add **all** env vars from `.env.example` in Vercel → Project Settings → Environment Variables
- [ ] Set `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` from Neon console
- [ ] Set `NEXTAUTH_URL` to your Vercel domain (e.g. `https://promptforge.vercel.app`)
- [ ] Set `AUTH_TRUST_HOST=true`
- [ ] Run database migration: `npx drizzle-kit push`
- [ ] Verify admin seed user exists in the `users` table
- [ ] Seed the `llm_pricing` table with current model costs
- [ ] Deploy and test: login → select framework → full prompt generation flow
- [ ] Check Vercel function logs for cold start or timeout issues
- [ ] Verify `/admin/analytics` loads for admin users

## API Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/api/clarify` | 20 calls/hour per user |
| `/api/generate` | 10 calls/hour per user |
| `/api/rank` | 10 calls/hour per user |

## Project Structure

```
src/
├── app/
│   ├── (protected)/        # Auth-gated pages
│   │   ├── admin/          # Admin dashboard
│   │   └── app/            # User-facing app
│   ├── api/                # API routes
│   └── login/              # Login page
├── components/             # Shared components
├── db/                     # Schema & database
├── lib/                    # Rate limiting, validation
└── types/                  # TypeScript declarations
```
