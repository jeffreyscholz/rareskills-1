const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber, Contract } = require("ethers");
const { mine } = require("@nomicfoundation/hardhat-network-helpers");
const { RevertStatement } = require("prettier-plugin-solidity/src/nodes");

describe("TokenBoy conrtract", async function () {
  let tokenContract = null;

  beforeEach(async function () {
    const tokenContractFactory = await ethers.getContractFactory("TokenBoy");
    tokenContract = await tokenContractFactory.deploy();
    await tokenContract.deployed();
  });

  describe("Mint new tokens", async function () {
    it("non minter role cannot mint", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();

      const mintTx = tokenContract.connect(addr1).mint(addr1.address, 1000);

      await expect(mintTx).to.be.revertedWith("must have minter role to mint");
    });

    it("non admin cannot assign minter role", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();

      const grantRoleTx = tokenContract
        .connect(addr1)
        .grantMinterRole(addr1.address);

      await expect(grantRoleTx).to.be.revertedWith(
        "AccessControl: account " +
          addr1.address.toLowerCase() +
          " is missing role 0x0000000000000000000000000000000000000000000000000000000000000000"
      );
    });
  });
});

describe("NftWithStaking contract", async function () {
  let stakingContract = null;
  let tokenContract = null;
  let nftContract = null;

  beforeEach(async function () {
    const tokenContractFactory = await ethers.getContractFactory("TokenBoy");
    tokenContract = await tokenContractFactory.deploy();
    await tokenContract.deployed();

    const nftContractFactory = await ethers.getContractFactory("NFTBoy");
    nftContract = await nftContractFactory.deploy();
    await nftContract.deployed();

    const stakingContractFactory = await ethers.getContractFactory(
      "StakingBoy"
    );
    stakingContract = await stakingContractFactory.deploy(
      tokenContract.address,
      nftContract.address
    );
    await stakingContract.deployed();

    tokenContract.grantMinterRole(stakingContract.address);
  });

  describe("stake nft", async function () {
    it("does not accept a different nft", async function () {
      const [owner] = await ethers.getSigners();

      const wrongNftContractFactory = await ethers.getContractFactory("NFTBoy");
      const wrongNftContract = await wrongNftContractFactory.deploy();
      await wrongNftContract.deployed();

      const mintTx = await wrongNftContract.mint(0);
      mintTx.wait();

      const stakeTx = wrongNftContract[
        "safeTransferFrom(address,address,uint256)"
      ](owner.address, stakingContract.address, 0);

      await expect(stakeTx).to.be.revertedWith("Wrong NFT");
    });

    it("stakes nft sent to the contract", async function () {
      const [owner] = await ethers.getSigners();
      const mintTx = await nftContract.mint(0);
      mintTx.wait();

      const stakeTx = await nftContract[
        "safeTransferFrom(address,address,uint256)"
      ](owner.address, stakingContract.address, 0);
      stakeTx.wait();

      expect(await stakingContract.balanceOf(owner.address)).equals(1);
    });
  });

  describe("withdraw rewards", function async() {
    it("able to withdraw rewards", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const mintTx0 = await nftContract.mint(0);
      mintTx0.wait();

      const mintTx1 = await nftContract.mint(1);
      mintTx1.wait();

      const stakeTx0 = await nftContract[
        "safeTransferFrom(address,address,uint256)"
      ](owner.address, stakingContract.address, 0);
      stakeTx0.wait();

      await ethers.provider.send("evm_increaseTime", [12 * 60 * 60]);

      const stakeTx1 = await nftContract[
        "safeTransferFrom(address,address,uint256)"
      ](owner.address, stakingContract.address, 1);
      stakeTx1.wait();

      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);

      const withdrawRewardTx = await stakingContract.withdrawRewards();
      withdrawRewardTx.wait();

      expect(await tokenContract.balanceOf(owner.address)).equal(
        BigNumber.from(10).pow(19).mul(2)
      );
    });

    it("revert when balance is zero", async function () {
      const withdrawTx = stakingContract.withdrawRewards();
      await expect(withdrawTx).to.be.revertedWith("No staked tokens found");
    });

    it("cannot send token when reward is 0", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();

      const mintTx0 = await nftContract.mint(0);
      mintTx0.wait();

      const stakeTx0 = await nftContract[
        "safeTransferFrom(address,address,uint256)"
      ](owner.address, stakingContract.address, 0);
      stakeTx0.wait();

      await ethers.provider.send("evm_increaseTime", [12 * 60 * 60]);

      const withdrawTx = stakingContract.withdrawRewards();

      await expect(withdrawTx).to.be.revertedWith("No rewards accumulated yet");
    });
  });

  describe("withdraw nft", async function () {
    it("can withdraw staked nft and get rewards", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const mintTx0 = await nftContract.mint(0);
      mintTx0.wait();

      const mintTx1 = await nftContract.mint(1);
      mintTx1.wait();

      const stakeTx0 = await nftContract[
        "safeTransferFrom(address,address,uint256)"
      ](owner.address, stakingContract.address, 0);
      stakeTx0.wait();

      await ethers.provider.send("evm_increaseTime", [12 * 60 * 60]);

      const stakeTx1 = await nftContract[
        "safeTransferFrom(address,address,uint256)"
      ](owner.address, stakingContract.address, 1);
      stakeTx1.wait();

      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
      await mine();

      const withdrawNftTx = await stakingContract.withdrawNFT(1);
      withdrawNftTx.wait();

      expect(await nftContract.balanceOf(owner.address)).equal(1);

      expect(await tokenContract.balanceOf(owner.address)).equal(
        BigNumber.from(10).pow(19)
      );
    });

    it("non owner cannot withdraw staked nft", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const mintTx = await nftContract.mint(0);
      mintTx.wait();

      const stakeTx = await nftContract[
        "safeTransferFrom(address,address,uint256)"
      ](owner.address, stakingContract.address, 0);
      stakeTx.wait();

      const withdrawNftTx = stakingContract.connect(addr1).withdrawNFT(0);

      await expect(withdrawNftTx).to.be.revertedWith("Invalid TokenID");
    });

    it("dont send ether when reward is 0", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const mintTx0 = await nftContract.mint(0);
      mintTx0.wait();

      const stakeTx0 = await nftContract[
        "safeTransferFrom(address,address,uint256)"
      ](owner.address, stakingContract.address, 0);
      stakeTx0.wait();

      const withdrawNftTx = await stakingContract.withdrawNFT(0);
      withdrawNftTx.wait();

      expect(await nftContract.balanceOf(owner.address)).equal(1);

      expect(await tokenContract.balanceOf(owner.address)).equal(0);
    });
  });

  describe("get staked tokens", async function () {
    it("can get list of staked tokens", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();

      const mintTx0 = await nftContract.mint(0);
      mintTx0.wait();

      const mintTx1 = await nftContract.mint(1);
      mintTx1.wait();

      const stakeTx0 = await nftContract[
        "safeTransferFrom(address,address,uint256)"
      ](owner.address, stakingContract.address, 0);
      stakeTx0.wait();

      const stakeTx1 = await nftContract[
        "safeTransferFrom(address,address,uint256)"
      ](owner.address, stakingContract.address, 1);
      stakeTx1.wait();

      const stakedTokens = await stakingContract.getStakedTokens(owner.address);
      const expectedTokens = ["0", "1"];

      stakedTokens.map((x, i) => {
        expect(x).equal(expectedTokens[i]);
      });
    });
  });

  describe("time since last reward collected", async function () {
    it("can get time since last reward collected", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();

      const mintTx0 = await nftContract.mint(0);
      mintTx0.wait();

      const stakeTx0 = await nftContract[
        "safeTransferFrom(address,address,uint256)"
      ](owner.address, stakingContract.address, 0);
      stakeTx0.wait();

      await ethers.provider.send("evm_increaseTime", [12 * 60 * 60]);
      await mine();

      const timeSinceStake = await stakingContract.timeSinceLastRewardCollected(
        0
      );
      expect(timeSinceStake).equal(12 * 60 * 60);
    });
  });

  describe("view total reward for staker", async function () {
    it("can view reward for all tokens staked by an user", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const mintTx0 = await nftContract.mint(0);
      mintTx0.wait();

      const mintTx1 = await nftContract.mint(1);
      mintTx1.wait();

      const stakeTx0 = await nftContract[
        "safeTransferFrom(address,address,uint256)"
      ](owner.address, stakingContract.address, 0);
      stakeTx0.wait();

      await ethers.provider.send("evm_increaseTime", [12 * 60 * 60]);

      const stakeTx1 = await nftContract[
        "safeTransferFrom(address,address,uint256)"
      ](owner.address, stakingContract.address, 1);
      stakeTx1.wait();

      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);

      mine();

      expect(await stakingContract.totalRewardsForStaker(owner.address)).equal(
        BigNumber.from(10).pow(19).mul(2)
      );
    });
  });
});
