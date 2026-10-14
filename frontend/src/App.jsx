import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Vote,
  Shield,
  Search,
  Filter,
  Sparkles,
  BarChart3,
  Layers,
  CheckCircle,
  Clock,
  Plus,
} from "lucide-react";
import { Web3Provider, useWeb3 } from "./context/Web3Context";
import AcademicDisclaimer from "./components/AcademicDisclaimer";
import Navbar from "./components/Navbar";
import ElectionCard from "./components/ElectionCard";
import ElectionDetails from "./components/ElectionDetails";
import AdminPanel from "./components/AdminPanel";
import AuditTrail from "./components/AuditTrail";
import DemoAccountsModal from "./components/DemoAccountsModal";

function DashboardContent() {
  const { contract, readContract, account, isAdmin, refreshData } = useWeb3();

  const [activeTab, setActiveTab] = useState("elections"); // "elections" | "admin" | "audit"
  const [selectedElectionId, setSelectedElectionId] = useState(null);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  // Elections State
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "upcoming" | "ended"

  const activeContract = contract || readContract;

  // Load All Elections from Blockchain
  const fetchAllElections = useCallback(async () => {
    if (!activeContract) return;

    try {
      setLoading(true);
      const rawList = await activeContract.getAllElections();
      const parsed = rawList.map((el) => ({
        id: Number(el.id),
        title: el.title,
        description: el.description,
        startTime: Number(el.startTime),
        endTime: Number(el.endTime),
        candidateCount: Number(el.candidateCount),
        totalVotes: Number(el.totalVotes),
        state: Number(el.state),
        creator: el.creator,
      }));

      // Sort with newest first
      setElections(parsed.reverse());
    } catch (err) {
      console.warn("Error fetching elections list:", err);
    } finally {
      setLoading(false);
    }
  }, [activeContract]);

  useEffect(() => {
    fetchAllElections();
  }, [fetchAllElections]);

  // Compute Overall Stats
  const stats = useMemo(() => {
    let totalVotes = 0;
    let activeCount = 0;
    const nowSec = Math.floor(Date.now() / 1000);

    elections.forEach((el) => {
      totalVotes += el.totalVotes;
      if (el.state === 1 && el.endTime > nowSec) {
        activeCount++;
      }
    });

    return {
      totalElections: elections.length,
      totalVotes,
      activeCount,
    };
  }, [elections]);

  // Filtered Elections
  const filteredElections = useMemo(() => {
    const nowSec = Math.floor(Date.now() / 1000);

    return elections.filter((el) => {
      // Search match
      const matchesSearch =
        el.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        el.description.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Status match
      if (statusFilter === "active") {
        return el.state === 1 && el.endTime > nowSec;
      }
      if (statusFilter === "upcoming") {
        return el.state === 0 && el.startTime > nowSec;
      }
      if (statusFilter === "ended") {
        return el.state === 2 || el.endTime <= nowSec;
      }
      return true;
    });
  }, [elections, searchQuery, statusFilter]);

  const handleSelectElection = (id) => {
    setSelectedElectionId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToDashboard = () => {
    setSelectedElectionId(null);
    fetchAllElections();
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Academic Notice */}
      <AcademicDisclaimer />

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedElectionId(null);
        }}
        onOpenDemoModal={() => setDemoModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="app-container" style={{ flex: 1 }}>
        {/* VIEW 1: ELECTION DETAILS (If an election is selected) */}
        {selectedElectionId !== null ? (
          <ElectionDetails
            electionId={selectedElectionId}
            onBack={handleBackToDashboard}
            onOpenAdminTab={() => {
              setActiveTab("admin");
              setSelectedElectionId(null);
            }}
          />
        ) : activeTab === "admin" ? (
          /* VIEW 2: ADMIN PANEL */
          <AdminPanel
            elections={elections}
            onRefresh={() => {
              fetchAllElections();
              refreshData();
            }}
          />
        ) : activeTab === "audit" ? (
          /* VIEW 3: AUDIT & PROOFS */
          <AuditTrail elections={elections} />
        ) : (
          /* VIEW 4: ELECTIONS DASHBOARD (Default) */
          <div>
            {/* Hero Section */}
            <div
              className="glass-panel"
              style={{
                padding: "36px 32px",
                marginBottom: "32px",
                background:
                  "linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.08) 50%, rgba(139, 92, 246, 0.05) 100%)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ maxWidth: "720px" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    borderRadius: "9999px",
                    background: "rgba(99, 102, 241, 0.18)",
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                    color: "#818cf8",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    marginBottom: "14px",
                  }}
                >
                  <Sparkles size={14} /> DECENTRALIZED GOVERNANCE
                </div>

                <h1 style={{ fontSize: "2.4rem", lineHeight: "1.2", marginBottom: "12px" }}>
                  Institutional Voting Powered by Ethereum
                </h1>

                <p style={{ fontSize: "1rem", color: "#cbd5e1", lineHeight: "1.6", marginBottom: "24px" }}>
                  Cast verifiable, tamper-proof ballots with transparent smart contract execution.
                  Enforces voter eligibility, prevents duplicate voting, and tallies results in real time.
                </p>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      const activeFirst = elections.find((e) => e.state === 1);
                      if (activeFirst) {
                        handleSelectElection(activeFirst.id);
                      } else if (elections.length > 0) {
                        handleSelectElection(elections[0].id);
                      }
                    }}
                  >
                    <Vote size={17} /> Explore Active Ballots
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={() => setDemoModalOpen(true)}
                  >
                    🔑 Hardhat Test Accounts
                  </button>
                </div>
              </div>

              {/* Decorative Watermark */}
              <div
                style={{
                  position: "absolute",
                  right: "-20px",
                  bottom: "-30px",
                  opacity: 0.06,
                  pointerEvents: "none",
                }}
              >
                <Vote size={260} />
              </div>
            </div>

            {/* Statistics Ribbon */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                marginBottom: "32px",
              }}
            >
              <div className="glass-panel" style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-subtle)", fontSize: "0.82rem" }}>
                  <Layers size={16} color="#818cf8" /> Total Elections
                </div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "#ffffff" }}>
                  {stats.totalElections}
                </div>
              </div>

              <div className="glass-panel" style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-subtle)", fontSize: "0.82rem" }}>
                  <BarChart3 size={16} color="#38bdf8" /> Ballots Cast On-Chain
                </div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "#38bdf8" }}>
                  {stats.totalVotes}
                </div>
              </div>

              <div className="glass-panel" style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-subtle)", fontSize: "0.82rem" }}>
                  <Clock size={16} color="#10b981" /> Active Voting Windows
                </div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "#34d399" }}>
                  {stats.activeCount}
                </div>
              </div>

              <div className="glass-panel" style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-subtle)", fontSize: "0.82rem" }}>
                  <CheckCircle size={16} color="#c084fc" /> State Verification
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "10px", color: "#c084fc" }}>
                  Immutable Ledger
                </div>
              </div>
            </div>

            {/* Controls Bar: Search & Status Filter */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              {/* Search Box */}
              <div
                style={{
                  position: "relative",
                  flex: "1 1 300px",
                  maxWidth: "400px",
                }}
              >
                <Search
                  size={18}
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-subtle)",
                  }}
                />
                <input
                  type="text"
                  placeholder="Search elections by title..."
                  className="form-input"
                  style={{ paddingLeft: "42px" }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Status Filter Buttons */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <button
                  className={`btn btn-sm ${statusFilter === "all" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setStatusFilter("all")}
                >
                  All ({elections.length})
                </button>
                <button
                  className={`btn btn-sm ${statusFilter === "active" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setStatusFilter("active")}
                >
                  Active ({stats.activeCount})
                </button>
                <button
                  className={`btn btn-sm ${statusFilter === "upcoming" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setStatusFilter("upcoming")}
                >
                  Upcoming
                </button>
                <button
                  className={`btn btn-sm ${statusFilter === "ended" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setStatusFilter("ended")}
                >
                  Concluded
                </button>

                {isAdmin && (
                  <button
                    className="btn btn-sm btn-accent"
                    onClick={() => setActiveTab("admin")}
                    style={{ marginLeft: "6px" }}
                  >
                    <Plus size={15} /> New Election
                  </button>
                )}
              </div>
            </div>

            {/* Elections Grid */}
            {loading && elections.length === 0 ? (
              <div className="grid-cards">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="glass-panel" style={{ height: "260px", padding: "24px" }}>
                    <div className="shimmer" style={{ height: "24px", width: "40%", marginBottom: "16px", borderRadius: "6px" }} />
                    <div className="shimmer" style={{ height: "30px", width: "80%", marginBottom: "12px", borderRadius: "6px" }} />
                    <div className="shimmer" style={{ height: "60px", width: "100%", borderRadius: "8px" }} />
                  </div>
                ))}
              </div>
            ) : filteredElections.length === 0 ? (
              <div className="glass-panel" style={{ padding: "60px 20px", textAlign: "center" }}>
                <Vote size={48} color="#64748b" style={{ margin: "0 auto 16px auto" }} />
                <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>No Elections Found</h3>
                <p style={{ color: "var(--text-muted)", maxWidth: "400px", margin: "0 auto 16px auto" }}>
                  {searchQuery
                    ? `No elections matched the query "${searchQuery}".`
                    : "There are currently no elections matching this filter."}
                </p>
                {isAdmin && (
                  <button className="btn btn-primary btn-sm" onClick={() => setActiveTab("admin")}>
                    Create Election in Admin Panel
                  </button>
                )}
              </div>
            ) : (
              <div className="grid-cards">
                {filteredElections.map((election) => (
                  <ElectionCard
                    key={election.id}
                    election={election}
                    onSelect={handleSelectElection}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border-subtle)",
          padding: "24px 20px",
          background: "rgba(10, 14, 23, 0.8)",
          textAlign: "center",
          fontSize: "0.82rem",
          color: "var(--text-subtle)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <strong>BlockVote</strong> &bull; Decentralized Voting DApp &bull; Solidity ^0.8.24, Hardhat, Ethers.js v6 & React
          </div>
          <div>
            Academic Demonstration &bull; Public EVM State Consensus
          </div>
        </div>
      </footer>

      {/* Demo Accounts Modal */}
      <DemoAccountsModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <Web3Provider>
      <DashboardContent />
    </Web3Provider>
  );
}
