const {expect} = require("chai");
const {ethers} = require("hardhat")

describe("GenBukowski NFT", async function() {
  let nft = null;

  beforeEach(async function() {
    const nftFactory = await ethers.getContractFactory("GenBukowski");
    nft = await nftFactory.deploy();
    await nft.deployed();
  });

  describe("mint", async function() {
    it("minter can mint", async function() {
      const [owner] = await ethers.getSigners();
      const mintTx = await nft.mint(owner.address, 0, 1);
      mintTx.wait();

      const balance = await nft.balanceOf(owner.address, 0);
      expect(balance).equals(1);
    });

    it("cannot mint with id more than 6", async function() {
      const [owner] = await ethers.getSigners();
      const mintTx = nft.mint(owner.address, 7, 1);

      await expect(mintTx).to.be.revertedWith("Invalid TokenId")
    })
  
    it("non minter cannot mint", async function() {
      const [owner, addr1] = await ethers.getSigners();
      const mintTx = nft.connect(addr1).mint(addr1.address, 0, 1);

      await expect(mintTx).to.be.revertedWith(`AccessControl: account ${addr1.address.toLowerCase()} is missing role 0xf0887ba65ee2024ea881d91b74c2450ef19e1557f03bed3ea9f16b037cbe2dc9`)
    })
  });

  describe("burn", async function() {
    it("minter can burn", async function() {
      const [owner] = await ethers.getSigners();
      const mintTx = await nft.mint(owner.address, 0, 1);
      mintTx.wait();
      
      const burnTx = await nft.burn(owner.address, 0, 1);
      burnTx.wait();

      const balance = await nft.balanceOf(owner.address, 0);
      expect(balance).equals(0);
    });

    it("non minter cannot burn", async function() {
      const [owner, addr1] = await ethers.getSigners();
      const mintTx = await nft.mint(owner.address, 0, 1);
      mintTx.wait();

      const burnTx = nft.connect(addr1).burn(owner.address, 0, 1);
      await expect(burnTx).to.be.revertedWith(`AccessControl: account ${addr1.address.toLowerCase()} is missing role 0xf0887ba65ee2024ea881d91b74c2450ef19e1557f03bed3ea9f16b037cbe2dc9`)
    });
  });

  describe("burn batch", async function() {
    it("minter can burn batch", async function() {
      const [owner, addr1] = await ethers.getSigners();
      const mintTx0 = await nft.mint(owner.address, 0, 1);
      mintTx0.wait();

      const mintTx1 = await nft.mint(owner.address, 1, 1);
      mintTx1.wait();

      const burnTx = await nft.burnBatch(owner.address, [0, 1], [1, 1]);
      burnTx.wait();

      expect(await nft.balanceOf(owner.address, 0)).equals(0);
      expect(await nft.balanceOf(owner.address, 1)).equals(0);
    });

    it("non minter cannot burn batch", async function() {
      const [owner, addr1] = await ethers.getSigners();
      const mintTx0 = await nft.mint(owner.address, 0, 1);
      mintTx0.wait();

      const mintTx1 = await nft.mint(owner.address, 1, 1);
      mintTx1.wait();

      const burnTx = nft.connect(addr1).burnBatch(owner.address, [0, 1], [1, 1]);
      
      await expect(burnTx).to.be.revertedWith(`AccessControl: account ${addr1.address.toLowerCase()} is missing role 0xf0887ba65ee2024ea881d91b74c2450ef19e1557f03bed3ea9f16b037cbe2dc9`)
    })
  });

  describe("assign minter role", async function() {
    it("admin can assign minter role", async function() {
      const [owner, addr1] = await ethers.getSigners();
      const assignTx = await nft.assignMinter(addr1.address);
      assignTx.wait();

      expect(await nft.isMinter(addr1.address)).equals(true);
    });

    it("admin cannot assign minter role to null address", async function() {
      const assignTx = nft.assignMinter("0x0000000000000000000000000000000000000000");
      
      await expect(assignTx).to.be.revertedWith("null address");
    });

    it("non admin cannot assign minter role", async function() {
      const [owner, addr1] = await ethers.getSigners();
      const assignTx = nft.connect(addr1).assignMinter(addr1.address);

      await expect(assignTx).to.be.revertedWith(`AccessControl: account ${addr1.address.toLowerCase()} is missing role 0x0000000000000000000000000000000000000000000000000000000000000000`)
    });
  });

  describe("revoke minter role", async function() {
    it("admin can revoke minter role", async function() {
      const [owner, addr1] =  await ethers.getSigners();
      const assignTx = await nft.assignMinter(addr1.address);
      assignTx.wait();

      const revokeTx = await nft.revokeMinter(addr1.address);
      revokeTx.wait();

      expect(await nft.isMinter(addr1.address)).equals(false);
    });

    it("non admin cannot revoke minter role", async function() {
      const [owner, addr1] =  await ethers.getSigners();
      const assignTx = await nft.assignMinter(addr1.address);
      assignTx.wait();

      const revokeTx = nft.connect(addr1).revokeMinter(addr1.address);

      await expect(revokeTx).to.be.revertedWith(`AccessControl: account ${addr1.address.toLowerCase()} is missing role 0x0000000000000000000000000000000000000000000000000000000000000000`)
    });
  })

  describe('Supports interface', () => {
    it('does not support random interface', async () => {
        expect(await nft.supportsInterface('0x00000000')).to.be.false
    })
    
    it('does support ERC165', async () => {
        const supports = await nft.supportsInterface('0x01ffc9a7')
        expect(supports).to.be.true
    })
  })
})