# 🦊 MiMo Wallet Tracker

**AI-Powered EVM Wallet Intelligence Dashboard**

Real-time blockchain wallet monitoring with MiMo AI risk analysis. Track multiple EVM wallets, detect suspicious patterns, and get actionable security insights powered by Xiaomi MiMo V2.5.

## Features

- **Multi-Wallet Tracking** — Monitor unlimited EVM wallets from a single dashboard
- **AI Risk Analysis** — MiMo V2.5 analyzes transaction patterns and assigns risk levels (LOW/MEDIUM/HIGH/CRITICAL)
- **Smart Alerts** — Automatic detection of large transfers, failed transactions, token approvals, and suspicious activity
- **Transaction Explorer** — View recent transactions with method decoding (swap, transfer, approve, mint, bridge, etc.)
- **Real-time Dashboard** — Dark-themed UI with live stats, wallet overview, and alert feed
- **Etherscan Integration** — Fetches real on-chain data via Etherscan API

## Tech Stack

- **Backend:** Node.js + Express
- **Frontend:** Vanilla HTML/CSS/JS (zero dependencies)
- **AI Engine:** Xiaomi MiMo V2.5 (OpenAI-compatible API)
- **Blockchain Data:** Etherscan API
- **Storage:** JSON file (lightweight, no database required)

## Quick Start

```bash
# Clone & install
git clone https://github.com/gyoomei/mimo-wallet-tracker.git
cd mimo-wallet-tracker
npm install

# Configure
cp .env.example .env
# Edit .env with your MIMO_API_KEY

# Run
npm start
# Open http://localhost:3456
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MIMO_API_KEY` | Xiaomi MiMo API key | Yes |
| `MIMO_BASE_URL` | MiMo API endpoint | No (default: https://api.xiaomimimo.com/v1) |
| `ETHERSCAN_API_KEY` | Etherscan API key for real data | No (uses mock data) |
| `PORT` | Server port | No (default: 3456) |

## How MiMo AI is Used

The core intelligence layer uses **MiMo V2.5** to:

1. **Analyze Transaction Patterns** — Feed recent tx data to MiMo for pattern recognition
2. **Risk Assessment** — MiMo evaluates wallet behavior and assigns risk scores
3. **Threat Detection** — Identifies honeypot interactions, suspicious approvals, abnormal transfer patterns
4. **Natural Language Reports** — Generates human-readable security summaries and recommendations

### MiMo API Integration

```javascript
const response = await fetch(`${MIMO_BASE_URL}/chat/completions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${MIMO_API_KEY}`
  },
  body: JSON.stringify({
    model: 'MiMo-V2.5',
    messages: [{ role: 'user', content: analysisPrompt }],
    temperature: 0.3,
    max_tokens: 500
  })
});
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wallets` | List tracked wallets |
| POST | `/api/wallets` | Add wallet |
| DELETE | `/api/wallets/:id` | Remove wallet |
| GET | `/api/wallets/:address/transactions` | Get recent transactions |
| POST | `/api/wallets/:address/analyze` | Run MiMo AI analysis |
| GET | `/api/alerts` | Get security alerts |
| GET | `/api/stats` | Dashboard statistics |
| GET | `/api/health` | Health check |

## Use Cases

- **DeFi Users** — Monitor your wallets for unauthorized token approvals
- **NFT Collectors** — Track minting activity and detect suspicious contracts
- **Crypto Teams** — Shared dashboard for treasury wallet monitoring
- **Security Researchers** — Analyze wallet behavior patterns with AI

## Why MiMo?

Traditional blockchain explorers show raw data. MiMo Wallet Tracker adds an **intelligence layer** — understanding what transactions mean, detecting patterns humans might miss, and providing actionable security recommendations in natural language.

MiMo V2.5's reasoning capability excels at:
- Contextual understanding of DeFi transaction sequences
- Pattern matching against known attack vectors
- Generating concise, actionable security reports

## License

MIT
