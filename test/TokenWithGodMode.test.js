const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const { getAddress } = require("ethers/lib/utils");

describe("TokenWithGodMode contract", async function () {
  let tokenWithGodModeContract = null;

  beforeEach(async function () {
    const tokenWithGodModeContractFactory = await ethers.getContractFactory(
      "TokenWithGodMode"
    );
    tokenWithGodModeContract = await tokenWithGodModeContractFactory.deploy(
      "Token",
      "TKN"
    );
    await tokenWithGodModeContract.deployed();
  });

  describe("mint tokens", async function () {
    it("admin can mint", async function () {
      const [owner] = await ethers.getSigners();
      const mintTx = await tokenWithGodModeContract.mint(owner.address, 10);
      mintTx.wait();

      expect(await tokenWithGodModeContract.balanceOf(owner.address)).equal(10);
    });

    it("non admin cannot mint", async function () {
      const [owner, addr1] = await ethers.getSigners();
      const mintTx = tokenWithGodModeContract
        .connect(addr1)
        .mint(addr1.address, 10);

      await expect(mintTx).to.be.revertedWith(
        "AccessControl: account " +
          addr1.address.toLowerCase() +
          " is missing role 0x0000000000000000000000000000000000000000000000000000000000000000"
      );
    });
  });

  describe("transfer god mode", async function () {
    it("god role able to transfer", async function () {
      const [owner, addr1] = await ethers.getSigners();
      const mintTx = await tokenWithGodModeContract.mint(owner.address, 10);
      mintTx.wait();

      const transferTx = await tokenWithGodModeContract.transferGodMode(
        owner.address,
        addr1.address,
        10
      );
      transferTx.wait();

      expect(await tokenWithGodModeContract.balanceOf(addr1.address)).equal(10);
    });

    it("non god role not able to transfer", async function () {
      const [owner, addr1] = await ethers.getSigners();
      const mintTx = await tokenWithGodModeContract.mint(owner.address, 10);
      mintTx.wait();

      const transferTx = tokenWithGodModeContract
        .connect(addr1)
        .transferGodMode(owner.address, addr1.address, 10);

      await expect(transferTx).to.be.revertedWith(
        "AccessControl: account " +
          addr1.address.toLowerCase() +
          " is missing role 0x44caa441160f2659abeb8071bc942d6eef52d1573223916bcde9b624d75d793d"
      );
    });
  });

  describe("assign god role", async function () {
    it("admin able to assign god role", async function () {
      const [owner, addr1] = await ethers.getSigners();
      const assignTx = await tokenWithGodModeContract.assignGodRole(
        addr1.address
      );
      assignTx.wait();

      expect(await tokenWithGodModeContract.isGod(addr1.address)).to.be.true;
    });

    it("non admin not able to assign god role", async function () {
      const [owner, addr1] = await ethers.getSigners();
      const assignTx = tokenWithGodModeContract
        .connect(addr1)
        .assignGodRole(addr1.address);

      await expect(assignTx).to.be.revertedWith(
        "AccessControl: account " +
          addr1.address.toLowerCase() +
          " is missing role 0x0000000000000000000000000000000000000000000000000000000000000000"
      );
    });

    it("cannot assign god role to null address", async function () {
      const [owner] = await ethers.getSigners();
      const assignTx = tokenWithGodModeContract.assignGodRole(
        getAddress("0x0000000000000000000000000000000000000000")
      );

      await expect(assignTx).to.be.revertedWith("Null address error");
    });
  });
});
