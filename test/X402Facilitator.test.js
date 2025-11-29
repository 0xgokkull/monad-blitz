const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("X402Facilitator", function () {
  let facilitator;
  let owner;
  let user1;
  let user2;
  const PAYMENT_AMOUNT = ethers.parseEther("0.01");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const X402Facilitator = await ethers.getContractFactory("X402Facilitator");
    facilitator = await X402Facilitator.deploy();
    await facilitator.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await facilitator.owner()).to.equal(owner.address);
    });

    it("Should set correct payment amount", async function () {
      expect(await facilitator.PAYMENT_AMOUNT()).to.equal(PAYMENT_AMOUNT);
    });

    it("Should set default commission rate to 10%", async function () {
      expect(await facilitator.commissionRate()).to.equal(10);
    });
  });

  describe("Payment", function () {
    it("Should accept payment for snippet", async function () {
      const snippetId = ethers.id("test-snippet-1");

      await expect(
        facilitator.connect(user1).payForSnippet(snippetId, {
          value: PAYMENT_AMOUNT,
        })
      )
        .to.emit(facilitator, "PaymentReceived")
        .and.to.emit(facilitator, "AccessGranted");

      expect(await facilitator.hasAccess(user1.address, snippetId)).to.be.true;
    });

    it("Should reject insufficient payment", async function () {
      const snippetId = ethers.id("test-snippet-2");
      const insufficientAmount = ethers.parseEther("0.005");

      await expect(
        facilitator.connect(user1).payForSnippet(snippetId, {
          value: insufficientAmount,
        })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should reject duplicate payment", async function () {
      const snippetId = ethers.id("test-snippet-3");

      await facilitator.connect(user1).payForSnippet(snippetId, {
        value: PAYMENT_AMOUNT,
      });

      await expect(
        facilitator.connect(user1).payForSnippet(snippetId, {
          value: PAYMENT_AMOUNT,
        })
      ).to.be.revertedWith("Already purchased");
    });

    it("Should calculate commission correctly", async function () {
      const snippetId = ethers.id("test-snippet-4");

      await facilitator.connect(user1).payForSnippet(snippetId, {
        value: PAYMENT_AMOUNT,
      });

      const expectedCommission = (PAYMENT_AMOUNT * 10n) / 100n;
      const commissionPool = await facilitator.getCommissionPool();

      expect(commissionPool).to.equal(expectedCommission);
    });
  });

  describe("Batch Payment", function () {
    it("Should accept batch payment for multiple snippets", async function () {
      const snippetIds = [
        ethers.id("batch-1"),
        ethers.id("batch-2"),
        ethers.id("batch-3"),
      ];

      const totalPayment = PAYMENT_AMOUNT * BigInt(snippetIds.length);

      await facilitator.connect(user1).batchPayForSnippets(snippetIds, {
        value: totalPayment,
      });

      for (const snippetId of snippetIds) {
        expect(await facilitator.hasAccess(user1.address, snippetId)).to.be
          .true;
      }
    });

    it("Should reject insufficient batch payment", async function () {
      const snippetIds = [ethers.id("batch-4"), ethers.id("batch-5")];
      const insufficientAmount = PAYMENT_AMOUNT;

      await expect(
        facilitator.connect(user1).batchPayForSnippets(snippetIds, {
          value: insufficientAmount,
        })
      ).to.be.revertedWith("Insufficient payment for batch");
    });
  });

  describe("Commission Management", function () {
    it("Should allow owner to withdraw commission", async function () {
      const snippetId = ethers.id("test-snippet-5");

      await facilitator.connect(user1).payForSnippet(snippetId, {
        value: PAYMENT_AMOUNT,
      });

      const commissionPool = await facilitator.getCommissionPool();
      const ownerBalanceBefore = await ethers.provider.getBalance(
        owner.address
      );

      const tx = await facilitator.withdrawCommission();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

      expect(ownerBalanceAfter).to.equal(
        ownerBalanceBefore + commissionPool - gasUsed
      );
      expect(await facilitator.getCommissionPool()).to.equal(0);
    });

    it("Should reject non-owner withdrawal", async function () {
      await expect(
        facilitator.connect(user1).withdrawCommission()
      ).to.be.revertedWith("Only owner can call this");
    });

    it("Should allow owner to update commission rate", async function () {
      await facilitator.updateCommissionRate(20);
      expect(await facilitator.commissionRate()).to.equal(20);
    });

    it("Should reject commission rate above 50%", async function () {
      await expect(facilitator.updateCommissionRate(51)).to.be.revertedWith(
        "Commission rate cannot exceed 50%"
      );
    });
  });

  describe("Access Control", function () {
    it("Should correctly track user access", async function () {
      const snippetId = ethers.id("test-snippet-6");

      expect(await facilitator.hasAccess(user1.address, snippetId)).to.be.false;

      await facilitator.connect(user1).payForSnippet(snippetId, {
        value: PAYMENT_AMOUNT,
      });

      expect(await facilitator.hasAccess(user1.address, snippetId)).to.be.true;
      expect(await facilitator.hasAccess(user2.address, snippetId)).to.be.false;
    });

    it("Should track user payments", async function () {
      const snippetId1 = ethers.id("test-snippet-7");
      const snippetId2 = ethers.id("test-snippet-8");

      await facilitator.connect(user1).payForSnippet(snippetId1, {
        value: PAYMENT_AMOUNT,
      });

      await facilitator.connect(user1).payForSnippet(snippetId2, {
        value: PAYMENT_AMOUNT,
      });

      const userPayments = await facilitator.getUserPayments(user1.address);
      const expectedPayments = ((PAYMENT_AMOUNT * 90n) / 100n) * 2n; // After 10% commission

      expect(userPayments).to.equal(expectedPayments);
    });
  });

  describe("Ownership", function () {
    it("Should allow owner to transfer ownership", async function () {
      await facilitator.transferOwnership(user1.address);
      expect(await facilitator.owner()).to.equal(user1.address);
    });

    it("Should reject ownership transfer to zero address", async function () {
      await expect(
        facilitator.transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid new owner");
    });

    it("Should reject non-owner ownership transfer", async function () {
      await expect(
        facilitator.connect(user1).transferOwnership(user2.address)
      ).to.be.revertedWith("Only owner can call this");
    });
  });
});
