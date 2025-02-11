// test/VotingPlatformTest.js

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VotingPlatform", function () {
  let VotingPlatform;
  let votingPlatform;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    VotingPlatform = await ethers.getContractFactory("VotingPlatform");
    votingPlatform = await VotingPlatform.deploy();
    // 使用 ethers v6 部署等待方式
    await votingPlatform.waitForDeployment();
  });

  describe("createPoll", function () {
    it("Should create a poll and emit PollCreated event", async function () {
      const title = "Test Poll";
      const details = "This is a test poll.";
      const options = ["Option 1", "Option 2", "Option 3"];

      await expect(votingPlatform.createPoll(title, details, options))
        .to.emit(votingPlatform, "PollCreated")
        .withArgs(1, title);

      expect(await votingPlatform.pollCount()).to.equal(1);

      const pollData = await votingPlatform.getPoll(1);
      const [returnedTitle, returnedDetails, returnedOptions, returnedVotes] =
        pollData;
      expect(returnedTitle).to.equal(title);
      expect(returnedDetails).to.equal(details);
      expect(returnedOptions.length).to.equal(options.length);
      for (let i = 0; i < options.length; i++) {
        expect(returnedOptions[i]).to.equal(options[i]);
        expect(returnedVotes[i]).to.equal(0);
      }
    });
  });

  describe("vote", function () {
    beforeEach(async function () {
      const title = "Vote Test Poll";
      const details = "Poll for vote testing";
      const options = ["Option A", "Option B"];
      await votingPlatform.createPoll(title, details, options);
    });

    it("Should allow a valid vote and update votes", async function () {
      await expect(votingPlatform.connect(addr1).vote(1, 0))
        .to.emit(votingPlatform, "Voted")
        .withArgs(1, addr1.address, 0);

      const pollData = await votingPlatform.getPoll(1);
      const votes = pollData[3];
      expect(votes[0]).to.equal(1);
      expect(votes[1]).to.equal(0);
    });

    it("Should revert if the same address votes twice", async function () {
      await votingPlatform.connect(addr1).vote(1, 0);
      await expect(votingPlatform.connect(addr1).vote(1, 1)).to.be.revertedWith(
        "already voted"
      );
    });

    it("Should revert when voting on an invalid poll id", async function () {
      await expect(votingPlatform.vote(999, 0)).to.be.revertedWith(
        "vote does not exist"
      );
    });

    it("Should revert when voting on an invalid option index", async function () {
      await expect(votingPlatform.vote(1, 999)).to.be.revertedWith(
        "choice does not exist"
      );
    });
  });

  describe("getPollSummaries", function () {
    it("Should return all poll summaries", async function () {
      await votingPlatform.createPoll("Poll 1", "Details 1", ["A", "B"]);
      await votingPlatform.createPoll("Poll 2", "Details 2", ["C", "D", "E"]);

      const [ids, titles] = await votingPlatform.getPollSummaries();
      expect(ids.length).to.equal(2);
      expect(titles.length).to.equal(2);
      expect(ids[0]).to.equal(1);
      expect(titles[0]).to.equal("Poll 1");
      expect(ids[1]).to.equal(2);
      expect(titles[1]).to.equal("Poll 2");
    });
  });
});
