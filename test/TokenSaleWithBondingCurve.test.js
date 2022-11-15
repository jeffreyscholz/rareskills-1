const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

describe("Token sale with bonding curve", async function () {
  let tokenSaleContract = null;

  beforeEach(async function () {
    const tokenSaleContractFactory = await ethers.getContractFactory(
      "TokenSaleWithBondingCurve"
    );
    tokenSaleContract = await tokenSaleContractFactory.deploy("Token", "TKN");
    await tokenSaleContract.deployed();
  });

  describe("buyTokens", async function () {
    it("should revert on zero value", async function () {
      const buyTokenTx = tokenSaleContract.buyTokens({
        value: ethers.utils.parseEther("0"),
      });

      await expect(buyTokenTx).to.be.revertedWith(
        "Send ETH to buy some tokens"
      );
    });

    it("should return finite tokens to user on nonzero value", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();

      const buyTokensTx = await tokenSaleContract.buyTokens({
        value: ethers.utils.parseEther("10"),
      });
      buyTokensTx.wait();

      console.log(await tokenSaleContract.balanceOf(owner.address));
      expect(await tokenSaleContract.balanceOf(owner.address)).equal(
        "3131510301"
      );
    });
  });

  describe("sellTokens", async function () {
    it("should revert on insufficient balance", async function () {
      const sellTokensTx = tokenSaleContract.sellTokens("3131510301");

      await expect(sellTokensTx).to.be.revertedWith("Insufficient balance");
    });

    it("should send 90% of price for sold tokens", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();

      const buyTokensTx = await tokenSaleContract.buyTokens({
        value: ethers.utils.parseEther("10"),
      });
      buyTokensTx.wait();

      const ownerBalance = await tokenSaleContract.balanceOf(owner.address);

      const saleReturns = await tokenSaleContract.computeSaleReturns(
        ownerBalance
      );

      const fee = saleReturns.div(10);
      const returnsAfterFee = saleReturns.sub(fee);
      const balanceBefore = await ethers.provider.getBalance(owner.address);

      const sellTokensTx = await tokenSaleContract.sellTokens(ownerBalance);
      const receipt = await sellTokensTx.wait();
      const gasSpent = receipt.gasUsed.mul(receipt.effectiveGasPrice);

      expect(await ethers.provider.getBalance(owner.address)).equal(
        returnsAfterFee.add(balanceBefore).sub(gasSpent)
      );
    });

    it("return 0 ether on selling 0 tokens", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const balanceBefore = await ethers.provider.getBalance(owner.address);

      const sellTokensTx = await tokenSaleContract.sellTokens(0);
      const receipt = await sellTokensTx.wait();
      const gasSpent = receipt.gasUsed.mul(receipt.effectiveGasPrice);

      expect(await ethers.provider.getBalance(owner.address)).equal(
        balanceBefore.sub(gasSpent)
      );
    });

    it("revert tx on insufficient ether", async function () {
      const [owner] = await ethers.getSigners();

      const buyTokensTx = await tokenSaleContract.buyTokens({
        value: ethers.utils.parseEther("10"),
      });
      buyTokensTx.wait();

      const ownerBalance = await tokenSaleContract.balanceOf(owner.address);

      await ethers.provider.send("hardhat_setBalance", [
        tokenSaleContract.address,
        "0x0",
      ]);
      const sellTokensTx = tokenSaleContract.sellTokens(ownerBalance);

      await expect(sellTokensTx).to.be.revertedWith("Failed to send ether");
    });
  });

  describe("withdraw Sale Fees", async function () {
    it("non owner cannot withdraw fees", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const withdrawTx = tokenSaleContract
        .connect(addr1)
        .withdrawSellBackFees();
      await expect(withdrawTx).to.be.revertedWith(
        `AccessControl: account ${addr1.address.toLowerCase()} is missing role 0x0000000000000000000000000000000000000000000000000000000000000000`
      );
    });

    it("owner can withdraw fees", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();

      const buyTokensTx = await tokenSaleContract
        .connect(addr1)
        .buyTokens({ value: ethers.utils.parseEther("10") });
      buyTokensTx.wait();

      const addr1TokenBalance = await tokenSaleContract.balanceOf(
        addr1.address
      );
      const saleReturns = await tokenSaleContract.computeSaleReturns(
        addr1TokenBalance
      );

      const fees = saleReturns.div(10);

      const sellTokensTx = await tokenSaleContract
        .connect(addr1)
        .sellTokens(addr1TokenBalance);
      sellTokensTx.wait();

      const ownerBalance = await ethers.provider.getBalance(owner.address);

      const withdrawFeesTx = await tokenSaleContract
        .connect(owner)
        .withdrawSellBackFees();
      const receipt = await withdrawFeesTx.wait();
      const gasSpent = receipt.gasUsed * receipt.effectiveGasPrice;

      expect(await ethers.provider.getBalance(owner.address)).equal(
        ownerBalance.add(fees).sub(gasSpent)
      );
    });

    it("revert tx on insufficient ether", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();

      const buyTokensTx = await tokenSaleContract
        .connect(addr1)
        .buyTokens({ value: ethers.utils.parseEther("10") });
      buyTokensTx.wait();

      const addr1TokenBalance = await tokenSaleContract.balanceOf(
        addr1.address
      );

      const sellTokensTx = await tokenSaleContract
        .connect(addr1)
        .sellTokens(addr1TokenBalance);
      sellTokensTx.wait();

      await ethers.provider.send("hardhat_setBalance", [
        tokenSaleContract.address,
        "0x0",
      ]);
      const withdrawFeesTx = tokenSaleContract
        .connect(owner)
        .withdrawSellBackFees();

      await expect(withdrawFeesTx).to.be.revertedWith("Failed to send ether");
    });
  });
});
