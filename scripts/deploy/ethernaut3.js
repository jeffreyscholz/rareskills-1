// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.

const path = require("path");

const RANDOMNUM_CONTRACT = '0x4465Fde5c9CcC8fE163Ed4719831831E97F9b67f'

async function main() {
  // This is just a convenience check
  if (network.name === "hardhat") {
    console.warn(
      "You are trying to deploy a contract to the Hardhat Network, which" +
        "gets automatically created and destroyed every time. Use the Hardhat" +
        " option '--network localhost'"
    );
  }

  // ethers is available in the global scope
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const attackerFactory = await ethers.getContractFactory("CoinFlipAttacker");
  const attacker = await attackerFactory.deploy(RANDOMNUM_CONTRACT);
  await attacker.deployed();

  console.log("Attacker address:", attacker.address);

  // We also save the contract's artifacts and address in the frontend directory
  saveFrontendFiles(attacker);
}

function saveFrontendFiles(attacker) {
  const fs = require("fs");
  const contractsDir = path.join(__dirname, "..", "..", "frontend", "src", "contracts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ Attacker: attacker.address }, undefined, 2)
  );

  const AttackerArtifact = artifacts.readArtifactSync("CoinFlipAttacker");

  fs.writeFileSync(
    path.join(contractsDir, "CoinFlipAttacker.json"),
    JSON.stringify(AttackerArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
