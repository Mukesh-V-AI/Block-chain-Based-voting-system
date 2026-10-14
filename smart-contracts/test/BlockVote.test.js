const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BlockVote Smart Contract Unit Tests", function () {
  let BlockVote;
  let blockVote;
  let owner;
  let admin2;
  let voter1;
  let voter2;
  let voter3;
  let unauthorizedUser;

  beforeEach(async function () {
    [owner, admin2, voter1, voter2, voter3, unauthorizedUser] = await ethers.getSigners();
    BlockVote = await ethers.getContractFactory("BlockVote");
    blockVote = await BlockVote.deploy();
    await blockVote.waitForDeployment();
  });

  describe("Deployment & Configuration", function () {
    it("should deploy with the correct owner and admin rights", async function () {
      expect(await blockVote.owner()).to.equal(owner.address);
      expect(await blockVote.isElectionAdmin(owner.address)).to.be.true;
      expect(await blockVote.electionCounter()).to.equal(0);
    });

    it("should return the academic disclaimer correctly", async function () {
      const disclaimer = await blockVote.academicDisclaimer();
      expect(disclaimer).to.include("BlockVote is an educational demo");
      expect(disclaimer).to.include("not anonymous");
    });

    it("should allow owner to assign additional election admins", async function () {
      await blockVote.connect(owner).setAdmin(admin2.address, true);
      expect(await blockVote.isElectionAdmin(admin2.address)).to.be.true;

      await blockVote.connect(owner).setAdmin(admin2.address, false);
      expect(await blockVote.isElectionAdmin(admin2.address)).to.be.false;
    });

    it("should reject non-owner from assigning admins", async function () {
      await expect(
        blockVote.connect(unauthorizedUser).setAdmin(admin2.address, true)
      ).to.be.revertedWithCustomError(blockVote, "OwnableUnauthorizedAccount");
    });
  });

  describe("Election Creation", function () {
    it("should allow an admin to create an election and emit ElectionCreated", async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 60; // starts in 1 minute
      const endTime = currentTime + 3600; // ends in 1 hour

      await expect(
        blockVote.connect(owner).createElection("Presidential Election 2026", "Annual university election", startTime, endTime)
      )
        .to.emit(blockVote, "ElectionCreated")
        .withArgs(1, "Presidential Election 2026", startTime, endTime, owner.address);

      expect(await blockVote.electionCounter()).to.equal(1);

      const election = await blockVote.getElection(1);
      expect(election.id).to.equal(1);
      expect(election.title).to.equal("Presidential Election 2026");
      expect(election.description).to.equal("Annual university election");
      expect(election.candidateCount).to.equal(0);
      expect(election.totalVotes).to.equal(0);
      expect(election.state).to.equal(0); // NotStarted
    });

    it("should reject non-admin from creating an election", async function () {
      const currentTime = await time.latest();
      await expect(
        blockVote.connect(unauthorizedUser).createElection("Invalid", "Test", currentTime + 10, currentTime + 100)
      ).to.be.revertedWith("BlockVote: Caller is not an authorized administrator");
    });

    it("should reject election with empty title or invalid timestamps", async function () {
      const currentTime = await time.latest();
      await expect(
        blockVote.createElection("", "Desc", currentTime + 10, currentTime + 100)
      ).to.be.revertedWith("BlockVote: Election title cannot be empty");

      await expect(
        blockVote.createElection("Valid Title", "Desc", currentTime + 100, currentTime + 50)
      ).to.be.revertedWith("BlockVote: Start time must precede end time");

      await expect(
        blockVote.createElection("Valid Title", "Desc", currentTime - 100, currentTime - 50)
      ).to.be.revertedWith("BlockVote: End time must be in the future");
    });
  });

  describe("Candidate Management", function () {
    let electionId;
    let startTime;
    let endTime;

    beforeEach(async function () {
      const now = await time.latest();
      startTime = now + 10;
      endTime = now + 1000;
      await blockVote.createElection("Council Election", "Vote for representative", startTime, endTime);
      electionId = 1;
    });

    it("should allow admin to add candidates and emit CandidateAdded", async function () {
      await expect(
        blockVote.addCandidate(electionId, "Alice Johnson", "Progressive Tech", "https://avatar.test/alice.png")
      )
        .to.emit(blockVote, "CandidateAdded")
        .withArgs(electionId, 1, "Alice Johnson", "Progressive Tech");

      await blockVote.addCandidate(electionId, "Bob Smith", "Open Source Initiative", "https://avatar.test/bob.png");

      const candidates = await blockVote.getCandidates(electionId);
      expect(candidates.length).to.equal(2);
      expect(candidates[0].name).to.equal("Alice Johnson");
      expect(candidates[0].party).to.equal("Progressive Tech");
      expect(candidates[0].voteCount).to.equal(0);
      expect(candidates[1].name).to.equal("Bob Smith");
    });

    it("should reject adding candidate with empty name", async function () {
      await expect(
        blockVote.addCandidate(electionId, "", "Party", "")
      ).to.be.revertedWith("BlockVote: Candidate name cannot be empty");
    });

    it("should reject adding candidates for non-existent election", async function () {
      await expect(
        blockVote.addCandidate(999, "Ghost", "None", "")
      ).to.be.revertedWith("BlockVote: Election does not exist");
    });
  });

  describe("Voter Registration & Eligibility Enforcement", function () {
    let electionId;

    beforeEach(async function () {
      const now = await time.latest();
      await blockVote.createElection("Campus Vote", "Details", now + 10, now + 1000);
      electionId = 1;
    });

    it("should allow admin to register an eligible voter", async function () {
      await expect(blockVote.registerVoter(electionId, voter1.address))
        .to.emit(blockVote, "VoterRegistered")
        .withArgs(electionId, voter1.address);

      const status = await blockVote.getVoterStatus(electionId, voter1.address);
      expect(status.isRegistered).to.be.true;
      expect(status.hasVoted).to.be.false;
    });

    it("should reject duplicate registration of the same voter", async function () {
      await blockVote.registerVoter(electionId, voter1.address);
      await expect(
        blockVote.registerVoter(electionId, voter1.address)
      ).to.be.revertedWith("BlockVote: Voter already registered");
    });

    it("should support batch registration of multiple voters", async function () {
      const votersList = [voter1.address, voter2.address, voter3.address];
      await expect(blockVote.registerVotersBatch(electionId, votersList))
        .to.emit(blockVote, "VotersBatchRegistered")
        .withArgs(electionId, 3);

      for (const voter of votersList) {
        const status = await blockVote.getVoterStatus(electionId, voter);
        expect(status.isRegistered).to.be.true;
      }
    });

    it("should reject voter registration by non-admin", async function () {
      await expect(
        blockVote.connect(unauthorizedUser).registerVoter(electionId, voter1.address)
      ).to.be.revertedWith("BlockVote: Caller is not an authorized administrator");
    });
  });

  describe("Voting Mechanics & Deadlines", function () {
    let electionId;
    let startTime;
    let endTime;

    beforeEach(async function () {
      const now = await time.latest();
      startTime = now + 100;
      endTime = now + 1000;
      await blockVote.createElection("DAO Governance", "Budget Proposal", startTime, endTime);
      electionId = 1;

      // Add 2 candidates
      await blockVote.addCandidate(electionId, "Proposal A: Tech Infrastructure", "Core Devs", "");
      await blockVote.addCandidate(electionId, "Proposal B: Community Grants", "Outreach", "");

      // Register voters
      await blockVote.registerVoter(electionId, voter1.address);
      await blockVote.registerVoter(electionId, voter2.address);
    });

    it("should reject voting BEFORE election starts", async function () {
      await expect(
        blockVote.connect(voter1).vote(electionId, 1)
      ).to.be.revertedWith("BlockVote: Election has not started yet");
    });

    it("should allow registered voter to cast vote during active window", async function () {
      // Fast forward time to election start
      await time.increaseTo(startTime + 10);

      const tx = await blockVote.connect(voter1).vote(electionId, 1);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(blockVote, "VoteCast")
        .withArgs(electionId, 1, voter1.address, block.timestamp);

      // Verify candidate vote count
      const candidates = await blockVote.getCandidates(electionId);
      expect(candidates[0].voteCount).to.equal(1);
      expect(candidates[1].voteCount).to.equal(0);

      // Verify election total votes
      const election = await blockVote.getElection(electionId);
      expect(election.totalVotes).to.equal(1);

      // Verify voter status
      const status = await blockVote.getVoterStatus(electionId, voter1.address);
      expect(status.isRegistered).to.be.true;
      expect(status.hasVoted).to.be.true;
      expect(status.votedCandidateId).to.equal(1);
    });

    it("should PREVENT duplicate voting from the same wallet", async function () {
      await time.increaseTo(startTime + 10);

      // First vote succeeds
      await blockVote.connect(voter1).vote(electionId, 1);

      // Second vote from the same voter MUST revert
      await expect(
        blockVote.connect(voter1).vote(electionId, 2)
      ).to.be.revertedWith("BlockVote: Duplicate voting is not permitted. You have already voted.");
    });

    it("should reject votes from unregistered addresses", async function () {
      await time.increaseTo(startTime + 10);

      await expect(
        blockVote.connect(unauthorizedUser).vote(electionId, 1)
      ).to.be.revertedWith("BlockVote: You are not registered to vote in this election");
    });

    it("should reject votes with invalid candidate ID", async function () {
      await time.increaseTo(startTime + 10);

      await expect(
        blockVote.connect(voter1).vote(electionId, 99)
      ).to.be.revertedWith("BlockVote: Invalid candidate ID");

      await expect(
        blockVote.connect(voter1).vote(electionId, 0)
      ).to.be.revertedWith("BlockVote: Invalid candidate ID");
    });

    it("should reject voting AFTER election deadline has passed", async function () {
      // Fast forward time past end time
      await time.increaseTo(endTime + 10);

      await expect(
        blockVote.connect(voter1).vote(electionId, 1)
      ).to.be.revertedWith("BlockVote: Election deadline has passed");

      const state = await blockVote.getElectionState(electionId);
      expect(state).to.equal(2); // Ended
    });
  });

  describe("Admin Lifecycle Control & Queries", function () {
    let electionId;
    let startTime;
    let endTime;

    beforeEach(async function () {
      const now = await time.latest();
      startTime = now + 50;
      endTime = now + 500;
      await blockVote.createElection("Spring Election", "Vote", startTime, endTime);
      electionId = 1;

      await blockVote.addCandidate(electionId, "Candidate One", "Party One", "");
      await blockVote.registerVoter(electionId, voter1.address);
    });

    it("should allow admin to extend election deadline", async function () {
      const newEndTime = endTime + 1000;
      await expect(blockVote.extendElectionDeadline(electionId, newEndTime))
        .to.emit(blockVote, "ElectionDeadlineExtended")
        .withArgs(electionId, newEndTime);

      const el = await blockVote.getElection(electionId);
      expect(el.endTime).to.equal(newEndTime);
    });

    it("should allow admin to close election early", async function () {
      await time.increaseTo(startTime + 10);

      // Close early
      await expect(blockVote.closeElectionEarly(electionId))
        .to.emit(blockVote, "ElectionClosed");

      const state = await blockVote.getElectionState(electionId);
      expect(state).to.equal(2); // Ended

      // Attempts to vote now must fail
      await expect(
        blockVote.connect(voter1).vote(electionId, 1)
      ).to.be.revertedWith("BlockVote: Election has been concluded by admin");
    });

    it("should return all elections using getAllElections", async function () {
      const now = await time.latest();
      await blockVote.createElection("Second Election", "Desc", now + 10, now + 100);

      const all = await blockVote.getAllElections();
      expect(all.length).to.equal(2);
      expect(all[0].title).to.equal("Spring Election");
      expect(all[1].title).to.equal("Second Election");
    });
  });
});
