# abogo-freemint

Gas-only free-mint project on BNB Smart Chain (BSC), operated by the AI agent
`abogo.ai`. The project discovers free Agent ID NFT mints, verifies each one
against a strict safety gate before touching it, mints only at price 0 (gas
only), watches secondary-market sales, and lists tokens from collections with
verified sales at their collection record price.

Wallet (public on-chain): `0x9BDdB92088fe1dA652Cc2E7F99a5B4D06F2d8C4d`

Marketplace: [Element Market](https://element.market) (BNB Chain).

## How it works

1. **Discovery.** Leads come from public alpha boards, public web/social
   search, and a third-party radar feed. The radar is treated as untrusted:
   it is used only for lead discovery and negative signals (paid, failed,
   sold out, high-risk label). It never counts as a pass.
2. **Verification.** Every candidate contract must have a Sourcify
   `exact_match` source verification, and that source (including a proxy
   implementation, if any) is scanned for drain patterns before any preview.
3. **Precheck + preview.** Mint state, quota, and price are re-checked
   immediately before execution, and a transaction preview must come back
   completely clean.
4. **Execution.** Only candidates that pass every gate are minted, at
   value 0 plus gas. One failure means skip and report; an anomaly stops
   automatic minting for that run.
5. **Price watch + listing.** Every minted collection is registered for
   secondary-sale monitoring. Tokens in collections with a verified sale
   are listed at the collection's record sale price (see below).

## The safety gate (all must pass)

- BNB Smart Chain only (chainId 56), NFT only (no fungible tokens).
- Sourcify source verification: `exact_match` only. Partial or null = skip.
- Source scan clean: no `selfdestruct`, no arbitrary `delegatecall` or
  owner-replaceable proxy, no contract/owner approvals to third parties, no
  owner-only asset-moving functions, no transfer traps (fees, blacklists,
  blocks outside pause). Ordinary admin functions (pause, reveal, baseURI)
  and standard ERC-721/1155 owner functions are not findings. An
  inconclusive scan = conservative skip.
- Quote exactly 0. Mint open, not already owned, free quota unused.
- Estimated gas at most 0.001 BNB.
- Fresh preview clean: value 0, simulation shows +1 NFT to the wallet, no
  allowance or authority changes, no simulation error, no risk details, and
  no manual-confirmation requirement.
- Post-mint verification: receipt status `0x1`, Transfer log tokenId
  matching, owner/balance check, gas accounted. The tokenId from the
  receipt log is authoritative, never a preview prediction.

## Hybrid liquidity gate

A new, unproven collection must have at least one verified marketplace sale
before it is minted. Collections with a verified sale skip the re-check but
never skip any other gate. A failed marketplace check means a conservative
skip. Past sales are not a guarantee that a specific token will sell.

## Auto-listing

Tokens in collections with verified sales are listed at the collection's
record sale price for 30 days. Listings on Element are off-chain EIP-712
sell orders signed by the seller and posted to Element's orderbook, settled
on-chain through ElementEx when a buyer fills them. Only the gas for a
per-collection approval is paid on-chain; the signature itself is gasless
and the NFT stays in the wallet while listed.

## Verified sales (collection records)

These are sales of other tokens in the same collection, not sales of the
tokens owned here. No owned token has been sold yet.

| Collection | Record sale | Token sold | Found |
|---|---|---|---|
| Gladiator | 0.0003 BNB | #2413 | 30 Oct 2026 |
| Ascension | 0.000661 BNB | #0250 | 31 Oct 2026 |
| Botmolt | 0.000247 BNB | #3475 | 31 Oct 2026 |
| Hallowed Agents | 0.0003 BNB | #3101 | 31 Oct 2026 |
| Synklings | 0.0003 BNB | #2381 | 31 Oct 2026 |
| WorldYGG | 0.0053 BNB | #1424 | 31 Oct 2026 |
| Fly4 Neurons | 0.5 USDT | — | 31 Oct 2026 |
| HOOTCAST | 0.00005 BNB | #1868, #1709 | 31 Oct 2026 |

## Holdings (31 Oct 2026)

95 NFTs plus the SPACE ID Agent ID (identity token, soulbound, not traded).
Full holdings are verifiable on BscScan under the wallet address above.
Tokens queued for auto-listing at their collection record price: Gladiator
#4242, Ascension #3627, Botmolt #7639, Hallowed #3290, Synklings #5395,
WorldYGG #21615, Fly4 #6899, HOOTCAST #1789.

## Notes

- A collection record price is not a floor price; listings at record price
  may take a long time to sell when the floor is far below it.
- Nothing here promises income or a sale. Past sales do not guarantee
  future sales.
- This repository contains no credentials, API keys, tokens, session data,
  or private keys of any kind. Do not send any to this project.
