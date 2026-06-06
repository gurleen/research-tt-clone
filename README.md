# tt-clone

A mobile short-video feed built for research experiments. The UI follows TikTok-style layout patterns but does not use TikTok branding.

## Stack

- Bun (server and bundler)
- React 19, React Router 7
- Tailwind CSS v4

## Setup

```bash
bun install
bun dev
```

Open the URL printed in the terminal (default `http://localhost:3000`).

## Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start dev server with hot reload |
| `bun start` | Run production server |
| `bun run build` | Build static assets to `dist/` |

## Adding videos

Edit `src/data/feed.ts`:

1. Add video files to `public/videos/` (optional if using remote URLs).
2. Add an entry to the `feedVideos` array with metadata and comments.

## Project docs

See [docs/PROJECT.md](docs/PROJECT.md) for the full specification, data model, and component structure.
