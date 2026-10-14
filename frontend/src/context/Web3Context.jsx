import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  HARDHAT_CHAIN_ID,
  HARDHAT_CHAIN_ID_HEX,
  LOCAL_RPC_URL,
  HARDHAT_NETWORK_CONFIG,
} from "../utils/constants";

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [readContract, setReadContract] = useState(null);
  const [balance, setBalance] = useState("0");
  const [chainId, setChainId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshData = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Initialize read-only provider and contract
  useEffect(() => {
    try {
      const fallbackProvider = new ethers.JsonRpcProvider(LOCAL_RPC_URL);
      const readOnlyInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, fallbackProvider);
      setReadContract(readOnlyInstance);
    } catch (err) {
      console.warn("Fallback RPC provider initialization warning:", err);
    }
  }, []);

  // Check if wallet is already connected
  const checkConnection = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_accounts", []);
      const network = await browserProvider.getNetwork();
      const currentChainId = Number(network.chainId);

      setChainId(currentChainId);
      setIsCorrectNetwork(currentChainId === HARDHAT_CHAIN_ID);

      if (accounts.length > 0) {
        const userAccount = accounts[0];
        const userSigner = await browserProvider.getSigner();
        const votingContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, userSigner);

        setAccount(userAccount);
        setProvider(browserProvider);
        setSigner(userSigner);
        setContract(votingContract);

        // Fetch balance
        const bal = await browserProvider.getBalance(userAccount);
        setBalance(ethers.formatEther(bal));

        // Check if admin
        try {
          const ownerAddress = await votingContract.owner();
          const adminCheck = await votingContract.isElectionAdmin(userAccount);
          setIsAdmin(userAccount.toLowerCase() === ownerAddress.toLowerCase() || adminCheck);
        } catch (e) {
          console.warn("Admin check warning:", e);
        }
      }
    } catch (err) {
      console.error("Error checking wallet connection:", err);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection, refreshTrigger]);

  // Listen to MetaMask events
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
        setSigner(null);
        setContract(null);
        setIsAdmin(false);
      } else {
        checkConnection();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [checkConnection]);

  // Connect Wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("MetaMask is not installed. Please install MetaMask to cast votes or manage elections.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      await browserProvider.send("eth_requestAccounts", []);
      await checkConnection();
    } catch (err) {
      console.error("Connection error:", err);
      setError(err.message || "Failed to connect wallet.");
    } finally {
      setIsConnecting(false);
    }
  };

  // Switch or Add Hardhat Network to MetaMask
  const switchToHardhatNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: HARDHAT_CHAIN_ID_HEX }],
      });
    } catch (switchError) {
      // Error code 4902 indicates chain has not been added
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [HARDHAT_NETWORK_CONFIG],
          });
        } catch (addError) {
          console.error("Failed to add network:", addError);
          setError("Failed to add Hardhat network to MetaMask.");
        }
      } else {
        console.error("Failed to switch network:", switchError);
        setError("Failed to switch to Hardhat network.");
      }
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setContract(null);
    setIsAdmin(false);
  };

  return (
    <Web3Context.Provider
      value={{
        account,
        provider,
        signer,
        contract,
        readContract,
        balance,
        chainId,
        isAdmin,
        isCorrectNetwork,
        isConnecting,
        error,
        connectWallet,
        disconnectWallet,
        switchToHardhatNetwork,
        refreshData,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}
