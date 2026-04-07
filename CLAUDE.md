# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start dev server on port 5174
- `npm run build` — Production build (output in `dist/`)
- `npm run lint` — ESLint
- No test framework is configured

## Architecture

React 19 + Vite SPA for a personal financial/market dashboard ("Economica"). Uses react-router-dom for client-side routing, no backend — all user data persists in localStorage.

### Data flow

- **Market data**: `services/marketData.js` fetches from Yahoo Finance via Vite dev proxy (`/api/yahoo` → `query1.finance.yahoo.com`). The `useMarketData` hook polls every 60s and falls back to `data/mockData.js` on failure.
- **Truth Social**: `services/truthSocial.js` fetches Trump posts via Vite dev proxy (`/api/truth` → `truthsocial.com`), using the Mastodon-compatible API.
- **Reports**: `context/ReportsContext.jsx` provides CRUD for reports stored in localStorage (`publishedReports`). Reports support publish, archive, edit, and delete. The report writer (`pages/ReportWriter.jsx`) uses `contentEditable` with `document.execCommand` for rich text editing, with a separate localStorage key for drafts (`reportDrafts`).
- **P&L tracker**: `hooks/usePnlData.js` manages daily P&L entries and notes in localStorage (`monthlyPnl`, `pnlNotes`). Uses `useSyncExternalStore` for cross-component reactivity. Supports JSON export/import. Notes support markdown via the `marked` library.
- **Watchlist**: `hooks/useWatchlist.js` manages ticker watchlist in localStorage (`watchlist`), polls prices every 60s, supports upper/lower price limit alerts.

### Routing

| Path | Page |
|------|------|
| `/` | Home — featured chart, report cards, sidebar with watchlist |
| `/write` | Report writer (new) |
| `/write/:id` | Report writer (edit existing) |
| `/report/:id` | Report view |
| `/archive` | Archived reports |
| `/links` | External links |
| `/pnl` | Monthly P&L calendar tracker |

### Key patterns

- Plain CSS (co-located `.css` files per component/page), no CSS framework
- No TypeScript — plain JSX
- localStorage keys: `publishedReports`, `reportDrafts`, `monthlyPnl`, `pnlNotes`, `watchlist`
- Proxied APIs only work in dev mode (Vite proxy config in `vite.config.js`)
