# 🗳️ BlockVote - Decentralized Blockchain Voting DApp

**BlockVote** is a decentralized, transparent, and verifiable voting application built with **Solidity**, **Hardhat**, **React (Vite)**, **MetaMask**, and **Ethers.js v6**.

> ⚠️ **ACADEMIC DEMONSTRATION NOTICE:**  
> This project is designed strictly for educational and academic demonstration purposes. All transactions, voter addresses, and candidate choices are recorded publicly and transparently on the Ethereum Virtual Machine (EVM) blockchain ledger. **Votes are NOT cryptographically anonymous or secret.** Real-world national elections require advanced cryptographic techniques such as Zero-Knowledge Proofs (zk-SNARKs) and homomorphic encryption.

---

## 📚 Complete Project Documentation

In addition to this README, exhaustive documentation is organized in the [`docs/`](file:///e:/projects/blockchain%20based%20voting%20system/docs) directory:

- 📖 **[Comprehensive User Manual](file:///e:/projects/blockchain%20based%20voting%20system/docs/USER_MANUAL.md):** Complete guide for Voters, Administrators, and Auditors, including step-by-step MetaMask setup, ballot casting, batch voter whitelisting, and troubleshooting.
- 🏗️ **[Technical Architecture & Specifications](file:///e:/projects/blockchain%20based%20voting%20system/docs/ARCHITECTURE_AND_SPECS.md):** Deep technical documentation covering data structures, EVM state transition diagrams, smart contract function signatures, gas optimizations, frontend architecture, and security threat modeling.

---

## 🌟 Key Features

### 🏛️ Smart Contract & Governance
- **Multi-Election Management:** The administrator can create multiple concurrent or sequential elections with customizable titles, descriptions, and start/end timestamps.
- **Candidate Registration:** Admins can register candidates with their names, party affiliations/manifestos, and optional profile avatars.
- **Voter Whitelisting & Eligibility Enforcement:** Strict on-chain whitelist logic prevents unauthorized wallets from casting ballots.
- **Batch Voter Registration:** Mass-register eligible voter addresses in a single atomic transaction to minimize gas overhead.
- **Duplicate Voting Prevention:** The contract tracks ballot state per address to reject duplicate voting attempts.
- **Timestamp & Deadline Enforcement:** State transitions enforce that voting can only occur when `block.timestamp >= startTime && block.timestamp <= endTime`.
- **Admin Lifecycle Controls:** Admins can extend election deadlines or close elections early if circumstances require.

### 💻 Modern Web3 Frontend (React + Vite + Ethers.js v6)
- **Glassmorphic Web3 UI:** Styled with a dark-mode palette, glowing borders, and modern typography (`Outfit` & `Plus Jakarta Sans`).
- **Real-Time Live Countdown:** Real-time ticker for each election displaying time remaining down to the second.
- **Dynamic Vote Analytics:** Live vote tallying with percentage progress bars and winner badges (👑) for concluded elections.
- **Voter Personal Status Card:** Automatically detects if the connected wallet is registered, whether it has already voted, and which candidate it voted for.
- **Celebratory Confetti & Receipt:** Fires animated confetti on successful ballot submission and displays the confirmed Ethereum transaction hash.
- **Hardhat Test Accounts Helper:** A built-in modal displaying the default Hardhat test accounts with 1-click address and private key copying for quick MetaMask testing.
- **Audit & Proofs Dashboard:** Academic verification panel with 1-click **JSON and CSV data export** for report submission.

---

## 📁 Project Structure

```
blockchain based voting system/
├── docs/                          # Detailed Project Documentation
│   ├── USER_MANUAL.md             # Complete step-by-step User Manual
│   └── ARCHITECTURE_AND_SPECS.md  # Technical Architecture & Smart Contract Specs
│
├── smart-contracts/               # Hardhat EVM environment
│   ├── contracts/
│   │   └── BlockVote.sol          # Main Solidity smart contract (^0.8.24)
│   ├── scripts/
│   │   └── deploy.js              # Deployment and demo election seeding script
│   ├── test/
│   │   └── BlockVote.test.js      # 23 automated unit tests (100% passing)
│   ├── hardhat.config.js          # Hardhat configuration (viaIR optimizer)
│   └── package.json
│
├── frontend/                      # React + Vite application
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AcademicDisclaimer.jsx  # Academic transparency banner & modal
│   │   │   ├── Navbar.jsx              # Navigation and wallet connect header
│   │   │   ├── ElectionCard.jsx        # Dashboard election cards
│   │   │   ├── ElectionDetails.jsx     # Voting ballot & live results
│   │   │   ├── AdminPanel.jsx          # Admin election management
│   │   │   ├── AuditTrail.jsx          # Verification & JSON/CSV export
│   │   │   └── DemoAccountsModal.jsx   # Hardhat private keys helper
│   │   ├── context/
│   │   │   └── Web3Context.jsx         # Ethers v6 wallet provider & state
│   │   ├── contracts/
│   │   │   ├── BlockVoteABI.json       # Auto-exported smart contract ABI
│   │   │   └── contractAddress.json    # Auto-exported contract address
│   │   ├── utils/
│   │   │   ├── constants.js            # Network configs & demo accounts
│   │   │   └── helpers.js              # Formatting & error parsing utilities
│   │   ├── App.jsx                     # Root application view router
│   │   ├── index.css                   # Custom Web3 glassmorphic design system
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── package.json                   # Root convenience runner scripts
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **MetaMask** browser extension installed in Chrome, Brave, Edge, or Firefox.

---

### 2. Step-by-Step Setup

#### Step 1: Start the Local Hardhat Blockchain Node
Open a terminal in the root directory:
```bash
cd smart-contracts
npx hardhat node
```
*Keep this terminal open!* This launches a local Ethereum JSON-RPC node at `http://127.0.0.1:8545` with 20 pre-funded test accounts (10,000 ETH each).

---

#### Step 2: Deploy & Seed the Smart Contract
Open a **second terminal**:
```bash
cd smart-contracts
npx hardhat run scripts/deploy.js --network localhost
```
This script will:
1. Deploy `BlockVote.sol` to the local network.
2. Automatically seed 3 realistic demo elections (with candidates and sample votes).
3. Export the contract address and ABI directly to `frontend/src/contracts/`!

---

#### Step 3: Launch the React Frontend
In the **frontend** directory:
```bash
cd frontend
npm run dev
```
Open [http://localhost:5174](http://localhost:5174) in your browser.

---

### 3. Configuring MetaMask for Localhost

1. In MetaMask, open the **Network Selector** (top left) and click **Add Network** &rarr; **Add a network manually**.
   - **Network Name:** `Hardhat Localhost`
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`
2. **Import Test Accounts:**
   - In the BlockVote web application, click the **"Test Accounts"** button in the navigation bar.
   - Copy the private key for:
     - **Admin / Deployer:** `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
     - **Voter #1:** `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
   - In MetaMask, click your profile icon &rarr; **Add account or hardware wallet** &rarr; **Import account** &rarr; paste the private key.

---

## 🧪 Running the Smart Contract Tests

To execute the unit test suite:
```bash
cd smart-contracts
npx hardhat test
```

### Test Coverage Highlights (23 Passing Tests):
- ✅ Contract deployment and owner admin initialization.
- ✅ Academic disclaimer view output verification.
- ✅ Admin election creation with start/end time validation.
- ✅ Rejection of unauthorized users attempting to create elections.
- ✅ Candidate addition with name validation.
- ✅ Single voter registration and duplicate voter rejection.
- ✅ Batch voter registration for multiple addresses.
- ✅ Successful ballot casting during active voting windows.
- ✅ Prevention of duplicate voting from the same wallet.
- ✅ Rejection of votes from unregistered wallets.
- ✅ Rejection of votes prior to election start or after deadline expiration.
- ✅ Admin deadline extension and early election termination.

---

## 🔐 Security & Design Practices

1. **Reentrancy Protection:** Critical state transitions such as `vote()` utilize OpenZeppelin's `ReentrancyGuard` (`nonReentrant` modifier) to prevent reentrancy attacks.
2. **Access Control:** All administrative operations are guarded by `onlyAdmin` modifier checking against `owner()` and approved admin mapping.
3. **CEI Pattern (Checks-Effects-Interactions):** Validations precede storage mutation, followed by event emission.
4. **Solidity 0.8.24 Overflow Protection:** Built-in compiler checks eliminate integer overflow and underflow vulnerabilities without requiring external SafeMath libraries.
5. **viaIR Optimizer:** Enabled in `hardhat.config.js` to optimize stack depth and gas consumption.

---

## 📄 License
This project is open-source and available under the **MIT License**.
