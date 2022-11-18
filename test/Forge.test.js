const {ethers} = require("hardhat");
const {expect} = require("chai");
const { mine } = require("@nomicfoundation/hardhat-network-helpers");


describe("Forge Contract", async function() {
    let forge = null;
    let nft = null;
    beforeEach( async function() {
        const nftFactory = await ethers.getContractFactory('GenBukowski');
        nft = await nftFactory.deploy();
        await nft.deployed();

        const forgeFactory = await ethers.getContractFactory('Forge');
        forge = await forgeFactory.deploy(nft.address);
        await forge.deployed();

        const assignTx = await nft.assignMinter(forge.address);
        assignTx.wait();
    })
   
    describe("mint tokens [0-2]", async function() {
        it("can mint tokens [0-2]", async function() {
            const [owner] = await ethers.getSigners();
            const mintTx = await forge.mint(0);
            mintTx.wait();

            expect(await nft.balanceOf(owner.address, 0)).equals(1);
        });
        
        it("cannot mint tokens other than [0-2]", async function() {
            const mintTx1 =  forge.mint(3);

            await expect(mintTx1).to.be.revertedWith("id not in range [0-2]");
        });

        it("cannot mint before cooldown", async function() {
            const mintTx0 = await forge.mint(0);
            mintTx0.wait();

            const mintTx1 =  forge.mint(1);

            await expect(mintTx1).to.be.revertedWith("mint limit exceeded");
        });

        it("can mint after cooldown", async function() {
            const [owner] = await ethers.getSigners();
            const mintTx0 = await forge.mint(0);
            mintTx0.wait();

            mine();
            await ethers.provider.send('evm_increaseTime', [61]);

            const mintTx1 = await forge.mint(1);
            mintTx1.wait();

            expect(await nft.balanceOf(owner.address, 1)).equals(1);
        });
    });

    describe("forge tokens", async function() {
        it("does not accept tokens other than [0-2]", async function() {
            const ids = [true, true, true, true, true, true];
            const forgeTx = forge.forge(ids);

            await expect(forgeTx).to.be.revertedWith("Invalid ids length")
        });

        it("burns token 0,1,2 to mint 6", async function() {
            const [owner] = await ethers.getSigners();
            const ids = [true, true, true];

            const mintTx0 = await forge.mint(0);
            mintTx0.wait();

            await ethers.provider.send('evm_increaseTime', [60]);
            mine()

            const mintTx1 = await forge.mint(1);
            mintTx1.wait();

            await ethers.provider.send('evm_increaseTime', [60]);
            mine()

            const mintTx2 = await forge.mint(2);
            mintTx2.wait();

            const forgeTx = await forge.forge(ids);
            forgeTx.wait();

            expect(await nft.balanceOf(owner.address, 6)).equals(1);
            expect(await nft.balanceOf(owner.address, 0)).equals(0);
            expect(await nft.balanceOf(owner.address, 1)).equals(0);
            expect(await nft.balanceOf(owner.address, 2)).equals(0);
        });

        it("burns token 0,1 to mint 3", async function() {
            const [owner] = await ethers.getSigners();
            const ids = [true, true, false];

            const mintTx0 = await forge.mint(0);
            mintTx0.wait();

            await ethers.provider.send('evm_increaseTime', [60]);
            mine()

            const mintTx1 = await forge.mint(1);
            mintTx1.wait();

            const forgeTx = await forge.forge(ids);
            forgeTx.wait();

            expect(await nft.balanceOf(owner.address, 3)).equals(1);
            expect(await nft.balanceOf(owner.address, 0)).equals(0);
            expect(await nft.balanceOf(owner.address, 1)).equals(0);
        });

        it("burns token 1,2 to mint 4", async function() {
            const [owner] = await ethers.getSigners();
            const ids = [false, true, true];

            const mintTx2 = await forge.mint(2);
            mintTx2.wait();

            await ethers.provider.send('evm_increaseTime', [60]);
            mine()

            const mintTx1 = await forge.mint(1);
            mintTx1.wait();

            const forgeTx = await forge.forge(ids);
            forgeTx.wait();

            expect(await nft.balanceOf(owner.address, 4)).equals(1);
            expect(await nft.balanceOf(owner.address, 1)).equals(0);
            expect(await nft.balanceOf(owner.address, 2)).equals(0);
        });

        it("burns token 0, 2 to mint 5", async function() {
            const [owner] = await ethers.getSigners();
            const ids = [true, false, true];

            const mintTx2 = await forge.mint(2);
            mintTx2.wait();

            await ethers.provider.send('evm_increaseTime', [60]);
            mine()

            const mintTx0 = await forge.mint(0);
            mintTx0.wait();

            const forgeTx = await forge.forge(ids);
            forgeTx.wait();

            expect(await nft.balanceOf(owner.address, 5)).equals(1);
            expect(await nft.balanceOf(owner.address, 0)).equals(0);
            expect(await nft.balanceOf(owner.address, 2)).equals(0);
        });

        it("does not mint on incorrect forge combination", async function() {
            const [owner] = await ethers.getSigners();
            let ids = [false, false, true];

            const mintTx2 = await forge.mint(2);
            mintTx2.wait();

            const forgeTx = await forge.forge(ids);
            forgeTx.wait();

            expect(await nft.balanceOf(owner.address, 0)).equals(0);
            expect(await nft.balanceOf(owner.address, 1)).equals(0);
            expect(await nft.balanceOf(owner.address, 2)).equals(1);
            expect(await nft.balanceOf(owner.address, 3)).equals(0);
            expect(await nft.balanceOf(owner.address, 4)).equals(0);
            expect(await nft.balanceOf(owner.address, 5)).equals(0);
            expect(await nft.balanceOf(owner.address, 6)).equals(0);
        });
    })

    describe("burn", async function() {
        it("user can burn any single token", async function() {
            const [owner] = await ethers.getSigners();

            const mintTx2 = await forge.mint(2);
            mintTx2.wait();

            const burnTx = await forge.burn(2, 1);
            burnTx.wait();

            expect(await nft.balanceOf(owner.address, 2)).equals(0);
        })
    });

    describe("trade", async function() {
        it("can trade tokens any tokens for [0-2] ", async function() {
            const [owner] = await ethers.getSigners();

            const mintTx = await forge.mint(0);
            mintTx.wait();

            const tradeTx = await forge.trade(0, 2, 1);
            tradeTx.wait();

            expect(await nft.balanceOf(owner.address, 2)).equals(1);
        });

        it("cannot trade tokens for [3-6]", async function() {
            const mintTx = await forge.mint(0);
            mintTx.wait();

            const tradeTx = forge.trade(0, 3, 1);

            await expect(tradeTx).to.be.revertedWith("invalid tokenId")
        });

        it("cannot trade a token for the same token", async function() {
            const mintTx = await forge.mint(2);
            mintTx.wait();

            const tradeTx = forge.trade(2, 2, 1);

            await expect(tradeTx).to.be.revertedWith("tokenIds cannot be same")
        });
    });
    
    describe("get mint cooldown time", async function() {
        it("can get mint cooldown time", async function() {
            const [owner] = await ethers.getSigners();
            const mintTx = await forge.mint(2);
            mintTx.wait();
            
            const blockNum = await ethers.provider.getBlockNumber();
            const block = await ethers.provider.getBlock(blockNum);
            const timestamp = block.timestamp;

            expect(await forge.getMintCooldownTime(owner.address)).equals(timestamp+60);
        })
    })
})