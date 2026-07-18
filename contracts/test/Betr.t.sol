// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {Betr} from "../src/Betr.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract BetrTest is Test {
    Betr internal betr;

    address internal creator = makeAddr("creator");
    address internal bob = makeAddr("bob"); // counterparty
    address internal carol = makeAddr("carol"); // arbiter
    address internal dave = makeAddr("dave"); // stranger

    uint256 internal constant STAKE = 1 ether;
    uint256 internal constant BOND = 0.2 ether; // 20% of STAKE
    uint256 internal constant START = 1_000_000;

    function setUp() public {
        vm.warp(START);
        betr = new Betr(); // this test contract is the owner
        vm.deal(creator, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(dave, 100 ether);
        vm.deal(carol, 100 ether);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    function _createPublic() internal returns (uint256 betId) {
        vm.prank(creator);
        betId = betr.createBet{value: STAKE}(
            "Will Arsenal win?",
            Betr.Visibility.Public,
            address(0),
            carol,
            uint64(START + 1 hours),
            uint64(START + 2 hours)
        );
    }

    function _createPrivate(address counterparty) internal returns (uint256 betId) {
        vm.prank(creator);
        betId = betr.createBet{value: STAKE}(
            "Will Arsenal win?",
            Betr.Visibility.Private,
            counterparty,
            carol,
            uint64(START + 1 hours),
            uint64(START + 2 hours)
        );
    }

    function _accept(uint256 betId, address who) internal {
        vm.prank(who);
        betr.acceptBet{value: STAKE}(betId);
    }

    function _claim(uint256 betId, address who) internal {
        vm.prank(who);
        betr.claimVictory{value: BOND}(betId);
    }

    // ---------------------------------------------------------------------
    // Happy path: create -> accept -> single claim -> finalize -> withdraw
    // ---------------------------------------------------------------------

    function test_HappyPath_SingleClaimSettles() public {
        uint256 betId = _createPublic();
        _accept(betId, bob);

        // Creator claims victory; bob stays silent (concedes).
        _claim(betId, creator);
        assertEq(uint256(betr.getBet(betId).state), uint256(Betr.State.PendingSettlement));

        // Challenge window passes with no dispute.
        vm.warp(START + 2 hours + betr.challengeWindow() + 1);
        betr.finalize(betId);

        Betr.Bet memory b = betr.getBet(betId);
        assertEq(uint256(b.state), uint256(Betr.State.Resolved));
        assertEq(b.winner, creator);
        // both stakes + own bond back
        assertEq(betr.pending(creator), 2 * STAKE + BOND);
        assertEq(betr.pending(bob), 0);

        // Winner withdraws; a second withdraw reverts (pot is gone).
        uint256 before = creator.balance;
        vm.prank(creator);
        betr.withdraw();
        assertEq(creator.balance, before + 2 * STAKE + BOND);

        vm.prank(creator);
        vm.expectRevert("nothing to withdraw");
        betr.withdraw();
    }

    // ---------------------------------------------------------------------
    // Disputed path: both claim -> arbiter rules -> winner takes all
    // ---------------------------------------------------------------------

    function test_Disputed_ArbiterAwardsWinner() public {
        uint256 betId = _createPublic();
        _accept(betId, bob);

        _claim(betId, creator); // creator claims first
        _claim(betId, bob); // bob disputes by also claiming
        assertEq(uint256(betr.getBet(betId).state), uint256(Betr.State.Disputed));

        // Arbiter rules for bob.
        vm.prank(carol);
        betr.arbitrate(betId, bob);

        Betr.Bet memory b = betr.getBet(betId);
        assertEq(uint256(b.state), uint256(Betr.State.Resolved));
        assertEq(b.winner, bob);
        // winner takes both stakes + both bonds; loser gets nothing
        assertEq(betr.pending(bob), 2 * STAKE + 2 * BOND);
        assertEq(betr.pending(creator), 0);

        // Money conservation: winner net +1.2, loser net -1.2 ether.
        uint256 bobBefore = bob.balance;
        vm.prank(bob);
        betr.withdraw();
        assertEq(bob.balance, bobBefore + 2 * STAKE + 2 * BOND);
    }

    function test_Disputed_OnlyArbiterCanRule() public {
        uint256 betId = _createPublic();
        _accept(betId, bob);
        _claim(betId, creator);
        _claim(betId, bob);

        vm.prank(dave);
        vm.expectRevert("only arbiter");
        betr.arbitrate(betId, bob);
    }

    function test_Disputed_ArbiterCannotPickOutsider() public {
        uint256 betId = _createPublic();
        _accept(betId, bob);
        _claim(betId, creator);
        _claim(betId, bob);

        vm.prank(carol);
        vm.expectRevert("invalid winner");
        betr.arbitrate(betId, dave);
    }

    // ---------------------------------------------------------------------
    // Refund stalls
    // ---------------------------------------------------------------------

    function test_Refund_OpenNeverMatched() public {
        uint256 betId = _createPublic();
        vm.warp(START + 1 hours + 1); // past matchBy
        betr.refund(betId);

        assertEq(uint256(betr.getBet(betId).state), uint256(Betr.State.Refunded));
        assertEq(betr.pending(creator), STAKE);
    }

    function test_Refund_ActiveNeverResolved() public {
        uint256 betId = _createPublic();
        _accept(betId, bob);
        vm.warp(START + 2 hours + 1); // past resolveBy, nobody claimed
        betr.refund(betId);

        assertEq(uint256(betr.getBet(betId).state), uint256(Betr.State.Refunded));
        assertEq(betr.pending(creator), STAKE);
        assertEq(betr.pending(bob), STAKE);
    }

    function test_Refund_DisputedArbiterVanished() public {
        uint256 betId = _createPublic();
        _accept(betId, bob);
        _claim(betId, creator);
        _claim(betId, bob);

        // Arbiter never rules; wait out the arbiter timeout.
        vm.warp(START + 2 hours + betr.arbiterTimeout() + 1);
        betr.refund(betId);

        assertEq(uint256(betr.getBet(betId).state), uint256(Betr.State.Refunded));
        // each gets stake + own bond back -> net zero
        assertEq(betr.pending(creator), STAKE + BOND);
        assertEq(betr.pending(bob), STAKE + BOND);
    }

    function test_Refund_RevertsWhileWindowsOpen() public {
        uint256 betId = _createPublic();
        vm.expectRevert("match window open");
        betr.refund(betId);

        _accept(betId, bob);
        vm.expectRevert("resolve window open");
        betr.refund(betId);
    }

    // ---------------------------------------------------------------------
    // Guards
    // ---------------------------------------------------------------------

    function test_Guard_CannotAcceptOwnBet() public {
        uint256 betId = _createPublic();
        vm.prank(creator);
        vm.expectRevert("cannot accept own bet");
        betr.acceptBet{value: STAKE}(betId);
    }

    function test_Guard_StakeMustMatch() public {
        uint256 betId = _createPublic();
        vm.prank(bob);
        vm.expectRevert("stake must match");
        betr.acceptBet{value: STAKE + 1}(betId);
    }

    function test_Guard_PrivateOnlyInvitedCanAccept() public {
        uint256 betId = _createPrivate(bob);

        vm.prank(dave);
        vm.expectRevert("not the invited counterparty");
        betr.acceptBet{value: STAKE}(betId);

        // The invited party can.
        _accept(betId, bob);
        assertEq(uint256(betr.getBet(betId).state), uint256(Betr.State.Active));
    }

    function test_Guard_IncorrectBondReverts() public {
        uint256 betId = _createPublic();
        _accept(betId, bob);
        vm.prank(creator);
        vm.expectRevert("incorrect bond");
        betr.claimVictory{value: BOND - 1}(betId);
    }

    function test_Guard_CannotClaimTwice() public {
        uint256 betId = _createPublic();
        _accept(betId, bob);
        _claim(betId, creator);

        vm.prank(creator);
        vm.expectRevert("you already claimed");
        betr.claimVictory{value: BOND}(betId);
    }

    function test_Guard_ClaimAfterResolveByReverts() public {
        uint256 betId = _createPublic();
        _accept(betId, bob);
        vm.warp(START + 2 hours + 1);
        vm.prank(creator);
        vm.expectRevert("resolve window closed");
        betr.claimVictory{value: BOND}(betId);
    }

    function test_Guard_DisputeAfterChallengeWindowReverts() public {
        uint256 betId = _createPublic();
        _accept(betId, bob);
        _claim(betId, creator);

        // Challenge window elapses; bob is too late to dispute.
        vm.warp(START + 2 hours + betr.challengeWindow() + 1);
        vm.prank(bob);
        vm.expectRevert("challenge window closed");
        betr.claimVictory{value: BOND}(betId);

        // ...and the sole claim now finalizes.
        betr.finalize(betId);
        assertEq(betr.getBet(betId).winner, creator);
    }

    function test_Guard_FinalizeBeforeWindowReverts() public {
        uint256 betId = _createPublic();
        _accept(betId, bob);
        _claim(betId, creator);
        vm.expectRevert("window still open");
        betr.finalize(betId);
    }

    function test_Guard_NonParticipantCannotClaim() public {
        uint256 betId = _createPublic();
        _accept(betId, bob);
        vm.prank(dave);
        vm.expectRevert("not a participant");
        betr.claimVictory{value: BOND}(betId);
    }

    // ---------------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------------

    function test_Admin_OnlyOwnerCanTuneWindows() public {
        betr.setChallengeWindow(1 minutes); // owner (this contract)
        assertEq(betr.challengeWindow(), 1 minutes);

        vm.prank(dave);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, dave));
        betr.setChallengeWindow(1 minutes);
    }

    // ---------------------------------------------------------------------
    // Creation validation
    // ---------------------------------------------------------------------

    function test_Create_RejectsBadParams() public {
        vm.startPrank(creator);

        vm.expectRevert("stake required");
        betr.createBet{value: 0}(
            "q", Betr.Visibility.Public, address(0), carol, uint64(START + 1 hours), uint64(START + 2 hours)
        );

        vm.expectRevert("arbiter cannot be creator");
        betr.createBet{value: STAKE}(
            "q", Betr.Visibility.Public, address(0), creator, uint64(START + 1 hours), uint64(START + 2 hours)
        );

        vm.expectRevert("resolveBy before matchBy");
        betr.createBet{value: STAKE}(
            "q", Betr.Visibility.Public, address(0), carol, uint64(START + 2 hours), uint64(START + 1 hours)
        );

        vm.stopPrank();
    }
}
