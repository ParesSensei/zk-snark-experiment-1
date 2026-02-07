import { ethers } from "ethers";
import hre from "hardhat";

async function main() {

  // jadinya pakai ether v6
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// (ethers v5)
// const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  const artifact = await hre.artifacts.readArtifact("Groth16Verifier");

  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet
  );

  const contract = await factory.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();

  console.log("Verifier deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});