// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title  Betr — onchain escrow for informal 1v1 bets with optimistic settlement.
/// @notice Two parties stake equal amounts; the truthful outcome settles itself
///         (silence = concession). A genuine disagreement escalates to a named
///         arbiter. Every stall path terminates in a full refund, so funds are
///         never permanently stuck. Payouts use a pull-payment balance.
contract Betr is ReentrancyGuard, Ownable {
    // -------------------------------------------------------------------------
    // Types
    // -------------------------------------------------------------------------

    /// @dev Public = listed on the dashboard; Private = unlisted / link-shared.
    ///      Enforcement of "who may accept" is via `counterparty`, not this flag.
    enum Visibility {
        Public,
        Private
    }

    enum State {
        Open, // created, awaiting a matching stake
        Active, // both staked, event pending
        PendingSettlement, // one party claimed victory; challenge window running
        Disputed, // both claimed victory; awaiting the arbiter
        Resolved, // winner decided; payout credited
        Refunded // stalled and unwound
    }

    struct Bet {
        address creator;
        address counterparty; // pre-accept: allowed acceptor (0 = anyone); post-accept: the acceptor
        address arbiter;
        Visibility visibility;
        State state;
        uint256 stake;
        uint64 matchBy; // deadline to be accepted
        uint64 resolveBy; // deadline for someone to claim victory
        uint64 challengeDeadline; // set on the first claim
        uint64 arbiterDeadline; // set when disputed
        address claimant; // first party to claim victory
        address winner; // set on resolution
        bool creatorClaimed;
        bool counterpartyClaimed;
        string question;
    }

    // -------------------------------------------------------------------------
    // Storage
    // -------------------------------------------------------------------------

    uint256 public nextBetId;
    mapping(uint256 => Bet) public bets;

    /// @notice Withdrawable balances (winnings + refunds). Pull-payment.
    mapping(address => uint256) public pending;

    /// @notice How long after the first claim the counterparty has to dispute.
    ///         Owner-settable so demos aren't gated by a real 24h wait.
    uint64 public challengeWindow = 24 hours;

    /// @notice How long the arbiter has to rule before a dispute can be refunded.
    uint64 public arbiterTimeout = 48 hours;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event BetCreated(
        uint256 indexed betId,
        address indexed creator,
        Visibility visibility,
        address counterparty,
        address arbiter,
        uint256 stake,
        uint64 matchBy,
        uint64 resolveBy,
        string question
    );
    event BetAccepted(uint256 indexed betId, address indexed counterparty);
    event VictoryClaimed(uint256 indexed betId, address indexed claimant, State state);
    event BetDisputed(uint256 indexed betId, uint64 arbiterDeadline);
    event BetResolved(uint256 indexed betId, address indexed winner, bool viaArbiter);
    event BetRefunded(uint256 indexed betId, State fromState);
    event Withdrawn(address indexed account, uint256 amount);

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor() Ownable(msg.sender) {}

    // -------------------------------------------------------------------------
    // Views
    // -------------------------------------------------------------------------

    /// @notice The dispute bond required to claim victory: 20% of the stake.
    function bondOf(uint256 stake) public pure returns (uint256) {
        return stake / 5;
    }

    function getBet(uint256 betId) external view returns (Bet memory) {
        return bets[betId];
    }

    function betCount() external view returns (uint256) {
        return nextBetId;
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    /// @notice Create a bet, staking `msg.value`. Pass `counterparty = address(0)`
    ///         to let anyone accept (public or link-shared); pass an address to
    ///         restrict acceptance to that wallet (named private).
    function createBet(
        string calldata question,
        Visibility visibility,
        address counterparty,
        address arbiter,
        uint64 matchBy,
        uint64 resolveBy
    ) external payable returns (uint256 betId) {
        require(msg.value > 0, "stake required");
        require(arbiter != address(0), "arbiter required");
        require(arbiter != msg.sender, "arbiter cannot be creator");
        require(counterparty != msg.sender, "counterparty cannot be creator");
        require(matchBy > block.timestamp, "matchBy in past");
        require(resolveBy > matchBy, "resolveBy before matchBy");
        if (counterparty != address(0)) {
            require(arbiter != counterparty, "arbiter cannot be counterparty");
        }

        betId = nextBetId++;
        Bet storage b = bets[betId];
        b.creator = msg.sender;
        b.counterparty = counterparty;
        b.arbiter = arbiter;
        b.visibility = visibility;
        b.state = State.Open;
        b.stake = msg.value;
        b.matchBy = matchBy;
        b.resolveBy = resolveBy;
        b.question = question;

        emit BetCreated(
            betId, msg.sender, visibility, counterparty, arbiter, msg.value, matchBy, resolveBy, question
        );
    }

    /// @notice Match the stake and activate the bet.
    function acceptBet(uint256 betId) external payable {
        Bet storage b = bets[betId];
        require(b.state == State.Open, "not open");
        require(block.timestamp <= b.matchBy, "match window closed");
        require(msg.sender != b.creator, "cannot accept own bet");
        require(msg.sender != b.arbiter, "arbiter cannot be participant");
        if (b.counterparty != address(0)) {
            require(msg.sender == b.counterparty, "not the invited counterparty");
        }
        require(msg.value == b.stake, "stake must match");

        b.counterparty = msg.sender;
        b.state = State.Active;

        emit BetAccepted(betId, msg.sender);
    }

    /// @notice Claim you won, posting the dispute bond. First claim starts the
    ///         challenge window; a second, conflicting claim opens a dispute.
    function claimVictory(uint256 betId) external payable {
        Bet storage b = bets[betId];
        require(msg.sender == b.creator || msg.sender == b.counterparty, "not a participant");
        require(msg.value == bondOf(b.stake), "incorrect bond");

        if (b.state == State.Active) {
            require(block.timestamp <= b.resolveBy, "resolve window closed");
            _markClaimed(b, msg.sender);
            b.claimant = msg.sender;
            b.state = State.PendingSettlement;
            b.challengeDeadline = uint64(block.timestamp) + challengeWindow;
            emit VictoryClaimed(betId, msg.sender, State.PendingSettlement);
        } else if (b.state == State.PendingSettlement) {
            require(block.timestamp <= b.challengeDeadline, "challenge window closed");
            require(msg.sender != b.claimant, "you already claimed");
            _markClaimed(b, msg.sender);
            b.state = State.Disputed;
            b.arbiterDeadline = uint64(block.timestamp) + arbiterTimeout;
            emit VictoryClaimed(betId, msg.sender, State.Disputed);
            emit BetDisputed(betId, b.arbiterDeadline);
        } else {
            revert("cannot claim now");
        }
    }

    /// @notice Settle an unchallenged claim once the window has passed.
    ///         Permissionless — anyone can poke it. The sole claimant wins.
    function finalize(uint256 betId) external {
        Bet storage b = bets[betId];
        require(b.state == State.PendingSettlement, "not pending");
        require(block.timestamp > b.challengeDeadline, "window still open");

        b.winner = b.claimant;
        b.state = State.Resolved;
        // both stakes + the claimant's own bond back
        pending[b.claimant] += 2 * b.stake + bondOf(b.stake);

        emit BetResolved(betId, b.claimant, false);
    }

    /// @notice Arbiter rules on a disputed bet. Winner takes both stakes and both
    ///         bonds; the loser (who lied) forfeits their bond.
    function arbitrate(uint256 betId, address winner) external {
        Bet storage b = bets[betId];
        require(b.state == State.Disputed, "not disputed");
        require(msg.sender == b.arbiter, "only arbiter");
        require(winner == b.creator || winner == b.counterparty, "invalid winner");

        b.winner = winner;
        b.state = State.Resolved;
        pending[winner] += 2 * b.stake + 2 * bondOf(b.stake);

        emit BetResolved(betId, winner, true);
    }

    /// @notice Unwind a stalled bet. Handles three cases:
    ///         - Open past `matchBy`        → creator's stake back.
    ///         - Active past `resolveBy`    → both stakes back.
    ///         - Disputed past `arbiterDeadline` → both stakes + both bonds back.
    function refund(uint256 betId) external {
        Bet storage b = bets[betId];
        State from = b.state;

        if (from == State.Open) {
            require(block.timestamp > b.matchBy, "match window open");
            b.state = State.Refunded;
            pending[b.creator] += b.stake;
        } else if (from == State.Active) {
            require(block.timestamp > b.resolveBy, "resolve window open");
            b.state = State.Refunded;
            pending[b.creator] += b.stake;
            pending[b.counterparty] += b.stake;
        } else if (from == State.Disputed) {
            require(block.timestamp > b.arbiterDeadline, "arbiter window open");
            uint256 bond = bondOf(b.stake);
            b.state = State.Refunded;
            pending[b.creator] += b.stake + bond;
            pending[b.counterparty] += b.stake + bond;
        } else {
            revert("no refund in this state");
        }

        emit BetRefunded(betId, from);
    }

    /// @notice Withdraw all credited winnings/refunds.
    function withdraw() external nonReentrant {
        uint256 amount = pending[msg.sender];
        require(amount > 0, "nothing to withdraw");
        pending[msg.sender] = 0;
        (bool ok,) = payable(msg.sender).call{value: amount}("");
        require(ok, "transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    // -------------------------------------------------------------------------
    // Admin (demo tuning)
    // -------------------------------------------------------------------------

    function setChallengeWindow(uint64 w) external onlyOwner {
        require(w > 0, "zero window");
        challengeWindow = w;
    }

    function setArbiterTimeout(uint64 t) external onlyOwner {
        require(t > 0, "zero timeout");
        arbiterTimeout = t;
    }

    // -------------------------------------------------------------------------
    // Internal
    // -------------------------------------------------------------------------

    function _markClaimed(Bet storage b, address who) internal {
        if (who == b.creator) {
            require(!b.creatorClaimed, "creator already claimed");
            b.creatorClaimed = true;
        } else {
            require(!b.counterpartyClaimed, "counterparty already claimed");
            b.counterpartyClaimed = true;
        }
    }
}
