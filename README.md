# 🦊 MiMo Wallet Tracker

**Unified Multi-Chain EVM Wallet Intelligence Dashboard** — 100% Client-Side, No API Key, No Backend

🔗 **Live:** https://gyoomei.github.io/mimo-wallet-tracker/

---

## What Is This?

MiMo Wallet Tracker is a **zero-infrastructure** dashboard for monitoring EVM wallets across **15 blockchains simultaneously** in a single unified view. Paste any wallet address → auto-scan all chains → display balances, tokens, transactions, and AI-powered risk analysis.

**No API keys. No backend. No registration. No cost.**

## The Problem It Solves

Existing wallet trackers typically:
- Require API keys (Etherscan, Alchemy, Infura)
- Support only 1–2 chains per view
- Need backend servers or database
- Charge for real-time data

MiMo Wallet Tracker solves all of this by leveraging the **[Blockscout V2 API](https://docs.blockscout.com/)** — a free, open-source blockchain explorer API with CORS support, allowing direct browser-to-API calls without any proxy or backend.

## Features

### 🔗 Unified Multi-Chain View
One wallet = one entry, tracking all 15 chains simultaneously. A color-coded chain grid shows balance per chain. Chains with holdings are highlighted green. A proportional bar visualizes portfolio distribution.

**15 Supported Chains:**
Ethereum · Base · Arbitrum · Polygon · zkSync · Scroll · Celo · Arbitrum Nova · Filecoin · Mode · Zora · Unichain · Soneium · Redstone · Degen

### 💰 Real-Time Balance & Token Tracking
- Native coin balance (ETH, POL, CELO, FIL, DEGEN, etc.)
- ERC-20 token holdings grouped by chain
- USD value with live ETH price from Blockscout
- Chain proportion bar (visual portfolio breakdown)

### 📋 Transaction History
- Transactions from all chains, sorted by time
- Method decoding: transfer, swap, approve, mint, contract interaction
- Status indicators (success / failed / pending)
- Direction tracking (inbound / outbound)
- Per-transaction chain badge

### 🧠 AI-Powered Risk Analysis (Client-Side)
- Pattern detection: failed transactions, large transfers, token approvals
- Risk scoring: LOW → MEDIUM → HIGH → CRITICAL
- Automated recommendations (e.g. "Review approvals at revoke.cash")
- Chain-by-chain activity breakdown

### 🔔 Smart Alerts
- Auto-detect large transfers (>1 ETH outbound)
- Failed transaction warnings
- Token approval notifications
- Alert history with severity levels (info / warning / critical)

### ⚡ Zero Infrastructure
- Pure HTML / CSS / JS — no build step, no framework, no dependencies
- Single file deployment (941 lines)
- GitHub Pages compatible
- localStorage persistence (wallets survive page refresh)
- Auto-refresh every 3 minutes

## Architecture

```
Browser (100% client-side)
├── Wallet Input → Validate 0x address
├── Chain Scanner (parallel batches of 5)
│   ├── Blockscout API → /addresses/{addr}        (balance + metadata)
│   ├── Blockscout API → /addresses/{addr}/transactions  (tx history)
│   └── Blockscout API → /addresses/{addr}/tokens        (ERC-20 holdings)
├── Risk Analyzer → pattern detection + scoring
├── Alert System  → anomaly detection
└── localStorage  → wallet persistence
```

**There is no backend.** All logic runs in the user's browser. API calls go directly to Blockscout public endpoints.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Vanilla HTML / CSS / JS (single file) |
| API | Blockscout V2 (free, no key, CORS `*`) |
| Fonts | Inter + JetBrains Mono (Google Fonts) |
| Hosting | GitHub Pages (static) |
| Storage | localStorage |
| Fetch | Native `fetch` + `AbortController` (8s timeout) |
| Error Handling | `Promise.allSettled` + `try/catch` |

## Key Design Decisions

1. **Blockscout over Etherscan** — Free, CORS-enabled, no rate limit registration, 18+ chains
2. **Single file over framework** — Zero dependencies, instant deploy, easy to fork
3. **Client-side analysis over server** — Privacy-first, no data leaves the browser
4. **Parallel batch scanning (5 chains)** — Balance between speed and reliability
5. **AbortController timeout** — Prevents one slow chain from hanging the entire scan
6. **Promise.allSettled** — One chain failing doesn't block the others

## Use Cases

- **DeFi users** — Monitor portfolio across L1 + L2 chains
- **NFT collectors** — Track mints and holdings multi-chain
- **Security researchers** — Analyze wallet activity patterns
- **Whale watchers** — Monitor large wallets (Vitalik, etc.)
- **Builders** — Fork and customize for your own needs

## Quick Start

1. Open https://gyoomei.github.io/mimo-wallet-tracker/
2. Paste a wallet address (`0x...`)
3. Click **"+ Add"**
4. Wait for scanning (~15 seconds)
5. Click a wallet card to view details (transactions, tokens, analysis)

## Stats

| Metric | Value |
|--------|-------|
| Code | 941 lines, single HTML file |
| Chains | 15 EVM networks |
| API Keys | 0 |
| Backend | 0 |
| Dependencies | 0 |
| Cost | $0 (fully free tier) |
| Scan Time | ~15s per wallet (all chains) |

## API Reference

Uses [Blockscout API v2](https://docs.blockscout.com/) — completely free, no registration needed.

**Endpoints used:**
- `GET /api/v2/addresses/{address}` — Balance, exchange rate, activity flags
- `GET /api/v2/addresses/{address}/transactions` — Transaction history
- `GET /api/v2/addresses/{address}/tokens` — ERC-20 token holdings
- `GET /api/v2/stats` — Network stats + ETH price

## License

MIT — Fork it, ship it, make it yours.

---

**Built with 🦊 by [gyoomei](https://github.com/gyoomei)**
