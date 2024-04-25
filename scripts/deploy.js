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

  const Tokex = await ethers.getContractFactory("Tokex");
  const tokex = await Tokex.deploy();
  await tokex.deployed();

  console.log("Tokex address:", tokex.address);

  // We also save the contract's artifacts and address in the frontend directory
  saveFrontendFiles(tokex);
}

function saveFrontendFiles(tokex) {
  const fs = require("fs");
  const contractsDir = path.join(__dirname, "..", "deployments", "tokex");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ Tokex: tokex.address }, undefined, 2)
  );

  const TokexArtifact = artifacts.readArtifactSync("Tokex");

  fs.writeFileSync(
    path.join(contractsDir, "Tokex.json"),
    JSON.stringify(TokexArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
