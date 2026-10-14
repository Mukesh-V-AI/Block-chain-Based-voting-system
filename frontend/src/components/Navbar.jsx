import React from "react";
import { Vote, Shield, Key, AlertCircle, RefreshCw, LogOut, FileCheck } from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { formatAddress } from "../utils/helpers";

export default function Navbar({ activeTab, setActiveTab, onOpenDemoModal }) {
  const {
    account,
    balance,
    isAdmin,
    isCorrectNetwork,
    connectWallet,
    disconnectWallet,
    switchToHardhatNetwork,
    isConnecting,
    refreshData,
  } = useWeb3();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: "rgba(10, 14, 23, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        {/* Brand Logo */}
        <div
          onClick={() => setActiveTab("elections")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 15px rgba(99, 102, 241, 0.4)",
            }}
          >
            <Vote size={22} color="#ffffff" />
          </div>
          <div>
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.3rem",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                background: "linear-gradient(135deg, #ffffff 40%, #94a3b8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              BlockVote
            </span>
            <span
              style={{
                marginLeft: "6px",
                fontSize: "0.68rem",
                padding: "2px 6px",
                borderRadius: "4px",
                background: "rgba(99, 102, 241, 0.2)",
                color: "#818cf8",
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              EVM DAPP
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            className={`btn btn-sm ${activeTab === "elections" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveTab("elections")}
          >
            <Vote size={15} /> Elections
          </button>

          <button
            className={`btn btn-sm ${activeTab === "admin" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveTab("admin")}
          >
            <Shield size={15} /> Admin Console
            {isAdmin && (
              <span
                style={{
                  fontSize: "0.65rem",
                  background: "#f43f5e",
                  color: "white",
                  padding: "1px 5px",
                  borderRadius: "6px",
                  fontWeight: 800,
                }}
              >
                ADMIN
              </span>
            )}
          </button>

          <button
            className={`btn btn-sm ${activeTab === "audit" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveTab("audit")}
          >
            <FileCheck size={15} /> Audit & Proofs
          </button>

          <button
            className="btn btn-sm btn-secondary"
            onClick={onOpenDemoModal}
            title="View test accounts and private keys"
            style={{ border: "1px dashed rgba(99, 102, 241, 0.4)", color: "#a5b4fc" }}
          >
            <Key size={15} /> Test Accounts
          </button>
        </nav>

        {/* Web3 Wallet State & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Network Switcher Warning */}
          {account && !isCorrectNetwork && (
            <button
              className="btn btn-sm btn-danger"
              onClick={switchToHardhatNetwork}
              style={{ animation: "pulse 1.5s infinite" }}
            >
              <AlertCircle size={14} /> Switch to Localhost (31337)
            </button>
          )}

          {/* Network Status Badge */}
          {account && isCorrectNetwork && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.78rem",
                color: "#10b981",
                background: "rgba(16, 185, 129, 0.1)",
                padding: "6px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(16, 185, 129, 0.25)",
              }}
            >
              <div className="pulse-dot" />
              <span>Hardhat 31337</span>
            </div>
          )}

          {/* Connect / Connected Account Badge */}
          {account ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(17, 24, 39, 0.8)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "10px",
                padding: "4px 8px 4px 12px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: "#38bdf8" }}>
                  {formatAddress(account)}
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  {Number(balance).toFixed(3)} ETH
                </span>
              </div>
              <button
                onClick={disconnectWallet}
                title="Disconnect Wallet"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px",
                  color: "#94a3b8",
                  cursor: "pointer",
                  display: "flex",
                }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={connectWallet}
              disabled={isConnecting}
            >
              <Vote size={15} />
              {isConnecting ? "Connecting..." : "Connect MetaMask"}
            </button>
          )}

          {/* Refresh button */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={refreshData}
            title="Refresh Blockchain Data"
            style={{ padding: "8px" }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
