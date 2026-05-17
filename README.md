# Steam MP Game Finder

Web app to find **multiplayer games you and your Steam friends all own**. Sign in with Steam, pick friends, and compare libraries.

## Features

- Steam OpenID login
- Friend list with search + manual profile URL
- Intersection of owned games (you + selected friends)
- Multiplayer filter (default on) with toggle for all shared games
- Playtime per person, sortable results
- DE/EN UI
- Server-side cache (Upstash Redis on Vercel, in-memory locally)

## Prerequisites

1. [Steam Web API key](https://steamcommunity.com/dev/apikey)
2. `AUTH_SECRET` — e.g. `openssl rand -base64 32`
3. (Production) [Upstash Redis](https://upstash.com/) for cache across serverless invocations

## Privacy

- Your and your friends' **game libraries must be public** (Profile → Edit Profile → Privacy Settings → Game details: **Public**).
- Friends list requires your profile to allow friend list visibility to the API user.

## Local development

```bash
cp .env.example .env.local
# Fill in AUTH_SECRET, STEAM_WEB_API_KEY, AUTH_URL=http://localhost:3000

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (redirects to `/de`).

## Deploy on Vercel

1. Push the repo and import in Vercel.
2. Set environment variables from `.env.example`:
   - `AUTH_SECRET`
   - `AUTH_URL` / `NEXTAUTH_URL` = your production URL (e.g. `https://your-app.vercel.app`)
   - `STEAM_WEB_API_KEY`
   - `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
3. Deploy.

**Steam OpenID:** Use a stable production URL for `AUTH_URL`. Preview deployments may fail OpenID realm checks unless Steam allows that return URL.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |

## Tech stack

- Next.js 15 (App Router)
- NextAuth v5 (Steam via OpenID)
- next-intl (de/en)
- Tailwind CSS 4
- Upstash Redis (optional)
