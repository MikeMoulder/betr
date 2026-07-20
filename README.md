# Betr

Onchain escrow for informal bets. You and a friend, or a stranger on the dashboard, stake equal money on a question. The winner gets paid automatically onchain, with no arguing and no chasing anyone down.

Built on **Monad testnet** (chainId `10143`). Live contract: [`0x733b6423fe71372B9940071683d63a8Bd00c2fA8`](https://testnet.monadvision.com/address/0x733b6423fe71372B9940071683d63a8Bd00c2fA8).

## The idea

### The problem

Informal bets happen constantly. Two people disagree about a match result, a price, an outcome, and they put money on it. Then someone wins, someone forgets, someone pays late or never pays at all. There is no neutral record of what was agreed and no way to enforce it, so both the money and the trust quietly leak out of these small bets. The friction is not the wager, it is the settlement.

### The solution

Betr moves the settlement onto a smart contract so it stops depending on goodwill. When a bet is created and matched, both stakes sit in escrow held by the contract, not by either person. When the outcome is known, the full pot is released to the winner automatically. Nobody has to trust the other side to pay, and nobody has to chase them.

The hard part of any bet is deciding who actually won without handing that power to a middleman who takes a cut and slows everything down. Betr solves this with **optimistic resolution**: the design assumes people will be honest about an outcome they both witnessed, and only falls back to an arbiter when they genuinely disagree.

* A party claims they won and posts a small refundable **bond** (20% of the stake). This opens a challenge window.

* If the other side stays silent, that silence counts as agreement. The claim settles and the claimant takes the pot and their bond back.

* If the other side also claims victory, posting their own bond, the bet is now a real dispute and goes to a **named arbiter** who was chosen when the bet was created and shown before anyone accepted.

This makes honesty the cheap default and dishonesty expensive. Telling the truth about an outcome nobody contests costs nothing. Lying only works if the other person lets it slide; the moment they push back, the liar loses their bond to the honest party on top of losing the bet. Most bets never need the arbiter at all, which keeps the common case fast and free.

The last design goal is that **money never gets stuck**. Every way a bet can stall has an escape hatch that returns funds: a bet nobody accepts refunds the creator, a live bet nobody resolves refunds both sides, and a dispute the arbiter never rules on refunds both stakes and both bonds. There is no state in which the contract can hold funds forever.

### Public and private bets

Both kinds are the same 1v1 escrow. The difference is only in **discovery** and **who is allowed to accept**.

* **Public bets** are posted to the Markets dashboard where everyone can see them. Any interested person can take the other side by matching the stake, and the first to match locks it in as a 1v1.

* **Private bets** are created with a shareable link or restricted to a specific wallet, so only the intended person can accept.

In both cases the arbiter is fixed at creation and shown before accepting, so taking a bet always means agreeing to who will settle a dispute.

## How it works

A smart contract holds both stakes in escrow and releases the full pot to the winner. Resolution is **optimistic**: the truthful outcome settles itself with no third party, and only a genuine disagreement escalates to a named arbiter. If a bet is never matched or resolved, funds are refunded so nothing gets stuck.

The core loop:

1. **Create.** Write the question, set your stake, choose public or private, name an arbiter, and set the match and resolve deadlines. The creator stakes on creation.
2. **Discover or share.** Public bets appear on the Markets dashboard. Private bets are shared by link or restricted to a named wallet.
3. **Accept.** The counterparty commits an equal stake. Both stakes lock and the bet goes live.
4. **Claim victory.** After the event, a party claims they won and posts a refundable bond (20% of the stake). This opens a challenge window.
5. **Settle.** If no one counter-claims within the window, the claimant wins and pulls the pot plus their bond. If the other party also claims victory, the bet is disputed and the arbiter rules.
6. **Withdraw.** The winner pulls their balance (pull-payment).

Every stall path terminates safely in a refund: a bet that is never matched, never resolved, or where the arbiter never rules returns all stakes and bonds.

## Repository layout

```
.
├── contracts/   Foundry project: the Betr escrow contract, tests, deployment notes
└── web/         Next.js frontend: wallet, dashboard, create/accept/settle flows
```

Each directory has its own README with deeper detail:

* [contracts/README.md](contracts/README.md)

* [contracts/DEPLOYMENT.md](contracts/DEPLOYMENT.md) (live address, verification, demo tuning)

## Tech stack

| Layer         | Stack                                                                   |
| ------------- | ----------------------------------------------------------------------- |
| Contract      | Solidity `0.8.28`, Foundry, OpenZeppelin (`ReentrancyGuard`, `Ownable`) |
| Chain         | Monad testnet, RPC `https://testnet-rpc.monad.xyz`                      |
| Frontend      | Next.js 16, React 19, wagmi v3, viem, TailwindCSS v4                    |
| Wallet & auth | Para (social login + external wallets via WalletConnect)                |
| Data          | Reads contract state directly (no indexer for the MVP)                  |

## Prerequisites

* [Node.js](https://nodejs.org) 20 or newer, plus npm

* [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge`, `cast`) for the contracts

* A wallet funded with Monad testnet MON. Get test funds from the [Monad faucet](https://faucet.monad.xyz).

## Setup

### 1. Clone

```shell
git clone <repo-url> betr
cd betr
```

### 2. Contracts

Dependencies under `lib/` are not committed. Install them, then build and test:

```shell
cd contracts
forge install --no-git OpenZeppelin/openzeppelin-contracts foundry-rs/forge-std
forge build
forge test -vv
```

### 3. Frontend

```shell
cd web
npm install
```

Create `web/.env.local` with the following keys:

```shell
# Para project API key (getpara.com)
NEXT_PUBLIC_PARA_API_KEY=your_para_key
# WalletConnect project id (cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
# Address used as the default arbiter when a creator does not name one
NEXT_PUBLIC_BETR_ADMIN=0xYourAdminWallet
```

Then run the dev server:

```shell
npm run dev
```

Open <http://localhost:3000>. The frontend points at the already-deployed contract by default, so you can create and settle bets on Monad testnet without deploying anything yourself.

## Frontend routes

| Route       | Purpose                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------- |
| `/home`     | Landing page                                                                              |
| `/markets`  | Public bets feed. Browse open bets and take a side.                                       |
| `/create`   | Create a bet: question, stake, public/private, counterparty, arbiter, deadlines.          |
| `/my-bets`  | Your bets across every state: created, active, awaiting resolution, settled.              |
| `/bet/[id]` | Bet detail with live state and the one relevant action (accept, claim, withdraw, refund). |

## Deploying your own contract

The app ships pointing at a live deployment, so this is only needed if you want your own instance.

```shell
cd contracts
forge create src/Betr.sol:Betr \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key 0x<DEPLOYER_KEY> \
  --broadcast
```

After deploying, update `BETR_ADDRESS` in [web/src/lib/contract.ts](web/src/lib/contract.ts) to your new address. See [contracts/DEPLOYMENT.md](contracts/DEPLOYMENT.md) for verification and the demo-tuning parameters (`challengeWindow`, `arbiterTimeout`), which the owner can shorten so a settle is demoable without a real 24 hour wait.

## Contract reference

The full state machine is `Open → Active → PendingSettlement → Resolved`, with `PendingSettlement → Disputed → Resolved`, and `Refunded` reachable from any stall.

| Function       | Who          | Effect                                                                                                                    |
| -------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `createBet`    | anyone       | Stakes and opens a bet (public or private).                                                                               |
| `acceptBet`    | counterparty | Matches the stake; bet goes Active.                                                                                       |
| `claimVictory` | participant  | Claims the win, posting a 20% bond. First claim starts the challenge window; a second, conflicting claim opens a dispute. |
| `finalize`     | anyone       | Settles an unchallenged claim after the window.                                                                           |
| `arbitrate`    | arbiter      | Rules on a disputed bet; winner takes both stakes plus both bonds.                                                        |
| `withdraw`     | anyone       | Pulls credited winnings or refunds.                                                                                       |
| `refund`       | anyone       | Unwinds a stalled bet (unmatched, unresolved, or arbiter vanished).                                                       |

**Safety properties:** pull-payment payouts with checks-effects-interactions and `ReentrancyGuard`, exact stake and bond amounts enforced on payable calls, and guards preventing self-accept, non-participant claims, non-arbiter arbitration, and double-withdraw.

## License

MIT. See the SPDX headers in the contract source.
