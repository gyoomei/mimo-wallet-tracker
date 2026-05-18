import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3456;

app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// ── Config ──────────────────────────────────────────────
const MIMO_API_KEY = process.env.MIMO_API_KEY || 'demo';
const MIMO_BASE_URL = process.env.MIMO_BASE_URL || 'https://api.xiaomimimo.com/v1';
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';
const DB_FILE = join(__dirname, 'data.json');

// ── Database (JSON file) ────────────────────────────────
function loadDB() {
  if (!existsSync(DB_FILE)) {
    return { wallets: [], alerts: [], analyses: [] };
  }
  return JSON.parse(readFileSync(DB_FILE, 'utf-8'));
}

function saveDB(db) {
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ── Etherscan fetch ─────────────────────────────────────
async function fetchTransactions(address, limit = 10) {
  if (!ETHERSCAN_API_KEY) {
    // Return mock data if no API key
    return generateMockTransactions(address, limit);
  }
  try {
    const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === '1' && data.result) {
      return data.result.map(tx => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: (parseInt(tx.value) / 1e18).toFixed(6),
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
        timeStamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
        isError: tx.isError === '1',
        method: tx.functionName?.split('(')[0] || 'transfer',
        status: tx.isError === '1' ? 'failed' : 'success'
      }));
    }
    return generateMockTransactions(address, limit);
  } catch (e) {
    console.error('Etherscan fetch error:', e.message);
    return generateMockTransactions(address, limit);
  }
}

function generateMockTransactions(address, limit) {
  const methods = ['swap', 'transfer', 'approve', 'mint', 'bridge', 'delegate', 'stake'];
  const tokens = ['ETH', 'USDC', 'USDT', 'WETH', 'ARB', 'OP'];
  const txs = [];
  for (let i = 0; i < limit; i++) {
    const isOut = Math.random() > 0.5;
    txs.push({
      hash: `0x${Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('')}`,
      from: isOut ? address : `0x${Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('')}`,
      to: isOut ? `0x${Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('')}` : address,
      value: (Math.random() * 5).toFixed(6),
      gasUsed: String(Math.floor(21000 + Math.random() * 200000)),
      gasPrice: String(Math.floor(10 + Math.random() * 100)),
      timeStamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      isError: Math.random() < 0.05,
      method: methods[Math.floor(Math.random() * methods.length)],
      status: Math.random() < 0.05 ? 'failed' : 'success'
    });
  }
  return txs.sort((a, b) => new Date(b.timeStamp) - new Date(a.timeStamp));
}

// ── MiMo AI Analysis ────────────────────────────────────
async function analyzeWithMiMo(walletAddress, transactions) {
  const txSummary = transactions.slice(0, 5).map(tx =>
    `${tx.method} | ${tx.value} ETH | ${tx.from.slice(0,8)}...→${tx.to.slice(0,8)}... | ${tx.status}`
  ).join('\n');

  const prompt = `You are a blockchain security analyst. Analyze this EVM wallet activity and provide a concise report.

Wallet: ${walletAddress}
Recent Transactions:
${txSummary}

Provide:
1. Risk Level: LOW/MEDIUM/HIGH/CRITICAL
2. Activity Summary (1-2 sentences)
3. Suspicious Patterns (if any)
4. Recommendations

Keep it concise and actionable. Format as JSON:
{"risk_level":"...","summary":"...","patterns":["..."],"recommendations":["..."]}`;

  try {
    const res = await fetch(`${MIMO_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MIMO_API_KEY}`
      },
      body: JSON.stringify({
        model: 'MiMo-V2.5',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!res.ok) {
      return generateFallbackAnalysis(walletAddress, transactions);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch {}
    return generateFallbackAnalysis(walletAddress, transactions);
  } catch (e) {
    console.error('MiMo API error:', e.message);
    return generateFallbackAnalysis(walletAddress, transactions);
  }
}

function generateFallbackAnalysis(address, txs) {
  const failedCount = txs.filter(t => t.status === 'failed').length;
  const riskLevel = failedCount > 2 ? 'HIGH' : failedCount > 0 ? 'MEDIUM' : 'LOW';
  return {
    risk_level: riskLevel,
    summary: `Wallet ${address.slice(0,10)}... has ${txs.length} recent transactions with ${failedCount} failures.`,
    patterns: failedCount > 0 ? [`${failedCount} failed transactions detected`] : ['No suspicious patterns'],
    recommendations: ['Monitor for unusual activity', 'Set up alerts for large transfers']
  };
}

// ── Alert Detection ─────────────────────────────────────
function detectAlerts(address, txs) {
  const alerts = [];
  for (const tx of txs) {
    if (parseFloat(tx.value) > 1.0) {
      alerts.push({
        type: 'large_transfer',
        severity: 'warning',
        message: `Large transfer: ${tx.value} ETH`,
        txHash: tx.hash,
        address,
        timestamp: tx.timeStamp
      });
    }
    if (tx.status === 'failed') {
      alerts.push({
        type: 'failed_tx',
        severity: 'info',
        message: `Failed transaction: ${tx.method}`,
        txHash: tx.hash,
        address,
        timestamp: tx.timeStamp
      });
    }
    if (tx.method === 'approve') {
      alerts.push({
        type: 'token_approval',
        severity: 'warning',
        message: `Token approval: ${tx.to.slice(0,10)}...`,
        txHash: tx.hash,
        address,
        timestamp: tx.timeStamp
      });
    }
  }
  return alerts;
}

// ── API Routes ──────────────────────────────────────────

// Get all wallets
app.get('/api/wallets', (req, res) => {
  const db = loadDB();
  res.json(db.wallets);
});

// Add wallet
app.post('/api/wallets', (req, res) => {
  const { address, label, chain } = req.body;
  if (!address) return res.status(400).json({ error: 'Address required' });
  
  const db = loadDB();
  const exists = db.wallets.find(w => w.address.toLowerCase() === address.toLowerCase());
  if (exists) return res.status(409).json({ error: 'Wallet already tracked' });

  const wallet = {
    id: Date.now().toString(36),
    address: address.trim(),
    label: label || `Wallet ${db.wallets.length + 1}`,
    chain: chain || 'ethereum',
    addedAt: new Date().toISOString(),
    lastChecked: null,
    riskLevel: 'UNKNOWN'
  };

  db.wallets.push(wallet);
  saveDB(db);
  res.json(wallet);
});

// Remove wallet
app.delete('/api/wallets/:id', (req, res) => {
  const db = loadDB();
  db.wallets = db.wallets.filter(w => w.id !== req.params.id);
  saveDB(db);
  res.json({ success: true });
});

// Get transactions for wallet
app.get('/api/wallets/:address/transactions', async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const txs = await fetchTransactions(req.params.address, limit);
  res.json(txs);
});

// Analyze wallet with MiMo AI
app.post('/api/wallets/:address/analyze', async (req, res) => {
  const address = req.params.address;
  const txs = await fetchTransactions(address, 10);
  const analysis = await analyzeWithMiMo(address, txs);
  const alerts = detectAlerts(address, txs);

  // Save analysis
  const db = loadDB();
  const walletIdx = db.wallets.findIndex(w => w.address.toLowerCase() === address.toLowerCase());
  if (walletIdx >= 0) {
    db.wallets[walletIdx].lastChecked = new Date().toISOString();
    db.wallets[walletIdx].riskLevel = analysis.risk_level;
  }
  db.analyses.push({ address, analysis, timestamp: new Date().toISOString() });
  db.alerts.push(...alerts);
  if (db.analyses.length > 100) db.analyses = db.analyses.slice(-100);
  if (db.alerts.length > 200) db.alerts = db.alerts.slice(-200);
  saveDB(db);

  res.json({ analysis, alerts, transactions: txs.slice(0, 5) });
});

// Get alerts
app.get('/api/alerts', (req, res) => {
  const db = loadDB();
  const limit = parseInt(req.query.limit) || 20;
  res.json(db.alerts.slice(-limit).reverse());
});

// Dashboard stats
app.get('/api/stats', async (req, res) => {
  const db = loadDB();
  const stats = {
    totalWallets: db.wallets.length,
    totalAlerts: db.alerts.length,
    riskBreakdown: {
      LOW: db.wallets.filter(w => w.riskLevel === 'LOW').length,
      MEDIUM: db.wallets.filter(w => w.riskLevel === 'MEDIUM').length,
      HIGH: db.wallets.filter(w => w.riskLevel === 'HIGH').length,
      CRITICAL: db.wallets.filter(w => w.riskLevel === 'CRITICAL').length,
      UNKNOWN: db.wallets.filter(w => w.riskLevel === 'UNKNOWN' || !w.riskLevel).length
    },
    recentAlerts: db.alerts.slice(-5).reverse(),
    analysesCount: db.analyses.length
  };
  res.json(stats);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    ai: MIMO_API_KEY !== 'demo' ? 'MiMo V2.5' : 'fallback',
    uptime: process.uptime()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  🦊 MiMo Wallet Tracker running on http://localhost:${PORT}\n`);
  console.log(`  AI Engine: ${MIMO_API_KEY !== 'demo' ? 'MiMo V2.5 ✅' : 'Fallback (set MIMO_API_KEY)'}`);
  console.log(`  Etherscan: ${ETHERSCAN_API_KEY ? 'Connected ✅' : 'Mock data (set ETHERSCAN_API_KEY)\n'}`);
});
