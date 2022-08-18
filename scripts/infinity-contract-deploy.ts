import { ethers } from "hardhat";

async function main() {

  const InfinityContract = await ethers.getContractFactory("InfinityContract"); // bize contractı geçiyor 
  const contract = await InfinityContract.deploy();

  // @ts-ignore
  await contract.deployed();

  // @ts-ignore
  console.log("Contract deployed to:", contract.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
