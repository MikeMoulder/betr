# Betr — Contracts

Onchain escrow for informal 1v1 bets with **optimistic settlement**. Two parties
stake equal amounts; the truthful outcome settles itself (silence = concession),
and a genuine disagreement escalates to a named arbiter. Every stall path
terminates in a full refund, so funds are never permanently stuck.

- `src/Betr.sol` — the contract (state machine + pull-payment payouts).
- `test/Betr.t.sol` — full test suite (happy settle, dispute→arbiter, refund stalls, guards).

Built with [Foundry](https://book.getfoundry.sh/), on top of OpenZeppelin
(`ReentrancyGuard`, `Ownable`).

## Setup

Dependencies (`lib/`) are **not** committed. After cloning, install them:

```shell
forge install --no-git OpenZeppelin/openzeppelin-contracts foundry-rs/forge-std
```

## Build & test

```shell
forge build
forge test -vv
```

## Deploy (Monad testnet)

```shell
forge create src/Betr.sol:Betr \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key 0x<DEPLOYER_KEY> \
  --broadcast
```

Then verify with the monskill verification API (chainId `10143`). The live
deployment and explorer links are recorded in [`DEPLOYMENT.md`](./DEPLOYMENT.md).

## Contract overview

| Function | Who | Effect |
|----------|-----|--------|
| `createBet` | anyone | Stakes and opens a bet (public or private). |
| `acceptBet` | counterparty | Matches the stake; bet goes Active. |
| `claimVictory` | participant | Claims the win, posting a 20% bond. First claim starts the challenge window; a second, conflicting claim opens a dispute. |
| `finalize` | anyone | Settles an unchallenged claim after the window. |
| `arbitrate` | arbiter | Rules on a disputed bet; winner takes both stakes + both bonds. |
| `withdraw` | anyone | Pulls credited winnings/refunds. |
| `refund` | anyone | Unwinds a stalled bet (unmatched / unresolved / arbiter-vanished). |
