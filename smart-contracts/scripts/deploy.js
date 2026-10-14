const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("----------------------------------------------------");
  console.log("🚀 Starting BlockVote Smart Contract Deployment...");
  console.log("----------------------------------------------------");

  const [deployer, account1, account2, account3, account4, account5] = await ethers.getSigners();
  console.log(`📡 Deployer Account: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Deployer Balance: ${ethers.formatEther(balance)} ETH`);

  // 1. Deploy BlockVote
  const BlockVote = await ethers.getContractFactory("BlockVote");
  const blockVote = await BlockVote.deploy();
  await blockVote.waitForDeployment();

  const contractAddress = await blockVote.getAddress();
  console.log(`✅ BlockVote Contract deployed successfully at: ${contractAddress}`);

  // 2. Seed Initial Demo Elections
  console.log("\n📦 Seeding initial academic demonstration elections...");

  const now = Math.floor(Date.now() / 1000);

  // Election 1: Active Main Election
  const el1StartTime = now - 120; // Started 2 minutes ago
  const el1EndTime = now + 86400 * 5; // Ends in 5 days
  const tx1 = await blockVote.createElection(
    "Student Union Presidential Election 2026",
    "Annual election for university student body president and executive council.",
    el1StartTime,
    el1EndTime
  );
  await tx1.wait();

  // Add Candidates to Election 1
  await (await blockVote.addCandidate(
    1,
    "Sarah Jenkins",
    "Student Welfare & Sustainability",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
  )).wait();

  await (await blockVote.addCandidate(
    1,
    "David Rodriguez",
    "Campus Innovation & Tech Alliance",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"
  )).wait();

  await (await blockVote.addCandidate(
    1,
    "Aisha Patel",
    "Equal Opportunity & Academic Rights",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80"
  )).wait();

  // Register standard Hardhat default test addresses for easy testing
  const demoVoters = [
    deployer.address,
    account1.address,
    account2.address,
    account3.address,
    account4.address,
    account5.address,
  ];

  await (await blockVote.registerVotersBatch(1, demoVoters)).wait();
  console.log(`   ✓ Election 1: Created with 3 candidates & ${demoVoters.length} registered voters`);

  // Cast initial votes from account2 and account3 to have realistic initial data
  await (await blockVote.connect(account2).vote(1, 2)).wait(); // voted for David Rodriguez
  await (await blockVote.connect(account3).vote(1, 1)).wait(); // voted for Sarah Jenkins
  console.log(`   ✓ Election 1: Seeded 2 sample votes on-chain for verification`);

  // Election 2: Another Active Election
  const el2StartTime = now - 60;
  const el2EndTime = now + 86400 * 2;
  await (await blockVote.createElection(
    "Faculty of Engineering Student Representative",
    "Selecting the student representative for academic curriculum advisory committee.",
    el2StartTime,
    el2EndTime
  )).wait();

  await (await blockVote.addCandidate(2, "Liam O'Connor", "Robotics & AI Society", "")).wait();
  await (await blockVote.addCandidate(2, "Zoe Chen", "Civil & Green Infrastructure", "")).wait();
  await (await blockVote.registerVotersBatch(2, demoVoters)).wait();
  await (await blockVote.connect(account1).vote(2, 2)).wait(); // voted Zoe Chen
  console.log(`   ✓ Election 2: Created with 2 candidates & registered voters`);

  // Election 3: Concluded Election for verification demo
  const el3StartTime = now - 86400 * 2;
  const el3EndTime = now + 86400; // Will be closed early by admin
  await (await blockVote.createElection(
    "Campus Green Initiative Referendum (Concluded)",
    "Campus-wide referendum on adopting zero-single-use plastics policy in student facilities.",
    el3StartTime,
    el3EndTime
  )).wait();

  await (await blockVote.addCandidate(3, "Option YES: Adopt Green Policy", "Eco Action Taskforce", "")).wait();
  await (await blockVote.addCandidate(3, "Option NO: Retain Existing Rules", "Campus Operations", "")).wait();
  await (await blockVote.registerVotersBatch(3, [deployer.address, account1.address, account2.address])).wait();
  await (await blockVote.connect(account1).vote(3, 1)).wait();
  await (await blockVote.connect(account2).vote(3, 1)).wait();
  await (await blockVote.closeElectionEarly(3)).wait(); // finalized
  console.log(`   ✓ Election 3: Seeded and closed as completed demo referendum`);

  // 3. Save contract artifacts and ABI for the frontend
  const frontendContractsDir = path.join(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  const contractInfo = {
    address: contractAddress,
    network: "localhost",
    chainId: 31337,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(frontendContractsDir, "contractAddress.json"),
    JSON.stringify(contractInfo, null, 2)
  );

  // Read ABI from hardhat artifacts
  const artifactPath = path.join(__dirname, "../artifacts/contracts/BlockVote.sol/BlockVote.json");
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    fs.writeFileSync(
      path.join(frontendContractsDir, "BlockVoteABI.json"),
      JSON.stringify(artifact.abi, null, 2)
    );
  }

  console.log(`\n🎉 Frontend contract files exported to: frontend/src/contracts/`);
  console.log("----------------------------------------------------");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
