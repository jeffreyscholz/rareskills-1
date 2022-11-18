// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.

const path = require("path");

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

  const nftFactory = await ethers.getContractFactory("GenBukowski");
  const nft = await nftFactory.deploy();
  await nft.deployed();

  console.log("Gen Bukowski address:", nft.address);

  const forgeFactory = await ethers.getContractFactory("Forge");
  const forge = await forgeFactory.deploy(nft.address);
  await forge.deployed();

  console.log("Forge address:", forge.address);

  // We also save the contract's artifacts and address in the frontend directory
  saveFrontendFiles(nft, forge);
}

function saveFrontendFiles(nft, forge) {
  const fs = require("fs");
  const contractsDir = path.join(__dirname, "..", "bukowski-forgery", "constants");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ NFT: nft.address, Forge: forge.address }, undefined, 2)
  );

  const NftArtifact = artifacts.readArtifactSync("GenBukowski");

  fs.writeFileSync(
    path.join(contractsDir, "GenBukowksi.json"),
    JSON.stringify(NftArtifact, null, 2)
  );

  const ForgeArtifact = artifacts.readArtifactSync("Forge");

  fs.writeFileSync(
    path.join(contractsDir, "Forge.json"),
    JSON.stringify(ForgeArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
