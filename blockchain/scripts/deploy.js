import hre from "hardhat";

async function main() {
  console.log("🚀 Deploying JobIntVerification contract to BSC Testnet...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "BNB\n");

  if (balance === 0n) {
    console.error("❌ Error: Account has no BNB!");
    console.error("Get testnet BNB from: https://testnet.bnbchain.org/faucet-smart");
    process.exit(1);
  }

  console.log("Deploying contract...");
  const JobIntVerification = await hre.ethers.getContractFactory("JobIntVerification");
  const jobint = await JobIntVerification.deploy();

  await jobint.waitForDeployment();

  const address = await jobint.getAddress();

  console.log("\n✅ JobIntVerification deployed successfully!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📍 Contract Address:", address);
  console.log("🔗 View on BSCScan:", `https://testnet.bscscan.com/address/${address}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("📝 IMPORTANT: Add this to your backend/.env file:");
  console.log(`CONTRACT_ADDRESS=${address}\n`);

  console.log("⏳ Waiting for block confirmations...");
  await jobint.deploymentTransaction().wait(5);
  console.log("✅ 5 confirmations received!\n");

  console.log("To verify on BSCScan, run:");
  console.log(`npx hardhat verify --network bsc_testnet ${address}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });