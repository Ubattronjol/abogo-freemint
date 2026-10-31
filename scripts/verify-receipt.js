// verify-receipt.js — independent receipt check for a BSC mint.
// Usage: node verify-receipt.js <txHash> <contract> <wallet> <tokenId>
// Checks: status 0x1, from == wallet, to == contract, value == 0,
// a Transfer log whose tokenId matches, and gas spent (gasUsed x
// effectiveGasPrice). Tries several public RPC endpoints in order.
// No credentials, keys, or private data are used or stored here.

const RPCS = [
  'https://bsc-dataseed.binance.org',
  'https://bsc-dataseed1.bnbchain.org',
  'https://bsc-dataseed2.bnbchain.org',
  'https://bsc-dataseed3.bnbchain.org',
  'https://bsc-dataseed4.bnbchain.org',
  'https://bsc-dataseed.bnbchain.org',
];

const TRANSFER_TOPIC =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

async function rpc(url, method, params) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30000);
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: ctrl.signal,
    });
    const j = await r.json();
    if (j.error) throw new Error(j.error.message || 'rpc error');
    return j.result;
  } finally {
    clearTimeout(t);
  }
}

async function rpcAny(method, params) {
  let lastErr;
  for (const url of RPCS) {
    try {
      const res = await rpc(url, method, params);
      if (res !== undefined && res !== null) return res;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('all RPC endpoints failed');
}

async function main() {
  const [txHash, contract, wallet, tokenId] = process.argv.slice(2);
  if (!txHash || !contract || !wallet || tokenId === undefined) {
    console.error('Usage: node verify-receipt.js <txHash> <contract> <wallet> <tokenId>');
    process.exit(2);
  }
  const receipt = await rpcAny('eth_getTransactionReceipt', [txHash]);
  if (!receipt) {
    console.log(JSON.stringify({ ok: false, reason: 'receipt not found' }));
    return;
  }
  const tx = await rpcAny('eth_getTransactionByHash', [txHash]);
  const tokenIdHex = '0x' + BigInt(tokenId).toString(16);
  const transfer = (receipt.logs || []).find(
    (l) =>
      l.topics &&
      l.topics[0] &&
      l.topics[0].toLowerCase() === TRANSFER_TOPIC &&
      l.topics[3] &&
      BigInt(l.topics[3]).toString() === BigInt(tokenId).toString(),
  );
  const gasWei =
    BigInt(receipt.gasUsed) * BigInt(receipt.effectiveGasPrice || receipt.gasPrice || 0);
  const out = {
    ok:
      receipt.status === '0x1' &&
      receipt.from.toLowerCase() === wallet.toLowerCase() &&
      receipt.to.toLowerCase() === contract.toLowerCase() &&
      BigInt(tx.value || 0) === 0n &&
      !!transfer,
    status: receipt.status,
    from: receipt.from,
    to: receipt.to,
    value: tx.value,
    transferTokenId: transfer ? BigInt(transfer.topics[3]).toString() : null,
    expectedTokenId: tokenId,
    tokenIdHex,
    gasUsed: receipt.gasUsed,
    gasBnb: (Number(gasWei) / 1e18).toString(),
  };
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error('verify failed:', e.message);
  process.exit(1);
});
