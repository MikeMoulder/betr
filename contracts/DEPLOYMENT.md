# Betr — Deployment

## Monad Testnet (chainId 10143)

| Field | Value |
|-------|-------|
| Contract | `Betr` (`src/Betr.sol`) |
| Address | `0x733b6423fe71372B9940071683d63a8Bd00c2fA8` |
| Deployer | `0x3A61e1bD35b715f0e3177F1E4a6d369FE6b877a3` |
| Deploy tx | `0xb549bb4fe84a25c77b4aefdadde816faea329d9b9057ab2ddfee9c05e24449a9` |
| Compiler | `v0.8.28+commit.7893614a` (optimizer on, 200 runs, via-IR) |
| Verified | ✅ MonadVision + Monadscan (perfect match) |

### Explorer links
- MonadVision: https://testnet.monadvision.com/address/0x733b6423fe71372B9940071683d63a8Bd00c2fA8
- Monadscan: https://testnet.monadscan.com/address/0x733b6423fe71372B9940071683d63a8Bd00c2fA8

### Demo tuning (owner-set, live on-chain)
- `challengeWindow` = **180s** (default is 24h; shortened so the happy-path settle is demoable)
- `arbiterTimeout` = **300s** (default is 48h)

Both are owner-adjustable via `setChallengeWindow` / `setArbiterTimeout`.

### RPC
`https://testnet-rpc.monad.xyz`
