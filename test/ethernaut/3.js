const { mine } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat")

describe("Attacker", async function () {
    let coinFlip = null;
    let attacker = null;
    beforeEach(async function () {
        const coinFlipFactory = await ethers.getContractFactory('CoinFlip')
        coinFlip = await coinFlipFactory.deploy();
        coinFlip.deployed()

        const attackerFactory = await ethers.getContractFactory('CoinFlipAttacker');
        attacker = await attackerFactory.deploy(coinFlip.address);
        attacker.deployed();
    });

    describe('attack', async function() {
        it('can attack', async function () {
            let wins = await coinFlip.consecutiveWins();
            while(wins < 10) {
                mine();

                const attackTx = await attacker.attack();
                attackTx.wait();

                mine();

                wins = await coinFlip.consecutiveWins();
            }

            expect(wins).equals(10);
        })
    })
})