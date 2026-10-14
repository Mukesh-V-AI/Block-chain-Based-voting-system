import React, { useState, useEffect } from "react";
import {
  PlusCircle,
  UserPlus,
  Users,
  Clock,
  Shield,
  CheckCircle,
  AlertTriangle,
  Send,
  Calendar,
  Sparkles,
  Lock,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { DEMO_ACCOUNTS } from "../utils/constants";
import { parseContractError, formatDate } from "../utils/helpers";

export default function AdminPanel({ elections, onRefresh }) {
  const { account, contract, isAdmin, isCorrectNetwork } = useWeb3();

  const [activeSubTab, setActiveSubTab] = useState("create");
  const [selectedElectionId, setSelectedElectionId] = useState("");

  // Create Election Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTimeStr, setStartTimeStr] = useState("");
  const [endTimeStr, setEndTimeStr] = useState("");

  // Add Candidate Form
  const [candidateName, setCandidateName] = useState("");
  const [candidateParty, setCandidateParty] = useState("");
  const [candidateAvatar, setCandidateAvatar] = useState("");

  // Voter Registration Form
  const [voterAddress, setVoterAddress] = useState("");
  const [batchVotersText, setBatchVotersText] = useState("");

  // Lifecycle Form
  const [extensionMinutes, setExtensionMinutes] = useState(60);

  // Status
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Set default selected election if available
  useEffect(() => {
    if (elections && elections.length > 0 && !selectedElectionId) {
      setSelectedElectionId(elections[0].id.toString());
    }
  }, [elections, selectedElectionId]);

  // Quick Preset Helper for Timestamps
  const applyPreset = (durationHours) => {
    const now = new Date();
    const end = new Date(now.getTime() + durationHours * 3600 * 1000);

    // format for datetime-local (YYYY-MM-DDTHH:mm)
    const toLocalISO = (d) => {
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setStartTimeStr(toLocalISO(now));
    setEndTimeStr(toLocalISO(end));
  };

  // 1. Create Election Handler
  const handleCreateElection = async (e) => {
    e.preventDefault();
    if (!contract) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const startTimestamp = Math.floor(new Date(startTimeStr).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endTimeStr).getTime() / 1000);

      const tx = await contract.createElection(title, description, startTimestamp, endTimestamp);
      await tx.wait();

      setSuccessMsg(`Election "${title}" successfully created on-chain!`);
      setTitle("");
      setDescription("");
      setStartTimeStr("");
      setEndTimeStr("");
      onRefresh();
    } catch (err) {
      console.error(err);
      setErrorMsg(parseContractError(err));
    } finally {
      setLoading(false);
    }
  };

  // 2. Add Candidate Handler
  const handleAddCandidate = async (e) => {
    e.preventDefault();
    if (!contract || !selectedElectionId) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const tx = await contract.addCandidate(
        selectedElectionId,
        candidateName,
        candidateParty,
        candidateAvatar
      );
      await tx.wait();

      setSuccessMsg(`Candidate "${candidateName}" added to Election #${selectedElectionId}!`);
      setCandidateName("");
      setCandidateParty("");
      setCandidateAvatar("");
      onRefresh();
    } catch (err) {
      console.error(err);
      setErrorMsg(parseContractError(err));
    } finally {
      setLoading(false);
    }
  };

  // 3. Register Single Voter Handler
  const handleRegisterSingleVoter = async (e) => {
    e.preventDefault();
    if (!contract || !selectedElectionId || !voterAddress) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const tx = await contract.registerVoter(selectedElectionId, voterAddress.trim());
      await tx.wait();

      setSuccessMsg(`Voter ${voterAddress} successfully registered for Election #${selectedElectionId}!`);
      setVoterAddress("");
      onRefresh();
    } catch (err) {
      console.error(err);
      setErrorMsg(parseContractError(err));
    } finally {
      setLoading(false);
    }
  };

  // 4. Register Batch Voters Handler
  const handleRegisterBatchVoters = async (e) => {
    e.preventDefault();
    if (!contract || !selectedElectionId || !batchVotersText) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      // Parse comma or newline separated addresses
      const rawAddrs = batchVotersText
        .split(/[\n,]/)
        .map((a) => a.trim())
        .filter((a) => a.startsWith("0x") && a.length === 42);

      if (rawAddrs.length === 0) {
        setErrorMsg("No valid 42-character Ethereum addresses detected.");
        setLoading(false);
        return;
      }

      const tx = await contract.registerVotersBatch(selectedElectionId, rawAddrs);
      await tx.wait();

      setSuccessMsg(`Successfully batch-registered ${rawAddrs.length} voters for Election #${selectedElectionId}!`);
      setBatchVotersText("");
      onRefresh();
    } catch (err) {
      console.error(err);
      setErrorMsg(parseContractError(err));
    } finally {
      setLoading(false);
    }
  };

  // Helper: Pre-fill Batch with Demo Accounts
  const prefillDemoAccounts = () => {
    const list = DEMO_ACCOUNTS.map((a) => a.address).join("\n");
    setBatchVotersText(list);
  };

  // 5. Early Close Handler
  const handleCloseEarly = async () => {
    if (!contract || !selectedElectionId) return;
    if (!window.confirm("Are you sure you want to conclude this election early? Subsequent votes will be rejected.")) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const tx = await contract.closeElectionEarly(selectedElectionId);
      await tx.wait();

      setSuccessMsg(`Election #${selectedElectionId} has been concluded.`);
      onRefresh();
    } catch (err) {
      console.error(err);
      setErrorMsg(parseContractError(err));
    } finally {
      setLoading(false);
    }
  };

  // 6. Extend Deadline Handler
  const handleExtendDeadline = async () => {
    if (!contract || !selectedElectionId) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const el = elections.find((e) => e.id.toString() === selectedElectionId.toString());
      if (!el) throw new Error("Election not found");

      const currentEnd = Number(el.endTime);
      const nowSec = Math.floor(Date.now() / 1000);
      const base = currentEnd > nowSec ? currentEnd : nowSec;
      const newEndTime = base + extensionMinutes * 60;

      const tx = await contract.extendElectionDeadline(selectedElectionId, newEndTime);
      await tx.wait();

      setSuccessMsg(`Deadline for Election #${selectedElectionId} extended to ${formatDate(newEndTime)}!`);
      onRefresh();
    } catch (err) {
      console.error(err);
      setErrorMsg(parseContractError(err));
    } finally {
      setLoading(false);
    }
  };

  // Non-admin warning guard
  if (!isAdmin) {
    return (
      <div className="glass-panel" style={{ padding: "50px 24px", textAlign: "center" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "rgba(244, 63, 94, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px auto",
          }}
        >
          <Lock size={32} color="#f43f5e" />
        </div>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>Administrator Authorization Required</h2>
        <p style={{ color: "var(--text-muted)", maxWidth: "560px", margin: "0 auto 24px auto" }}>
          You are connected as <code>{account || "No Wallet"}</code>. Only the contract deployer or authorized
          election administrators can create elections, register voters, and configure deadlines.
        </p>
        <div style={{ background: "rgba(0,0,0,0.3)", padding: "14px", borderRadius: "10px", display: "inline-block" }}>
          <span style={{ fontSize: "0.85rem", color: "#38bdf8" }}>
            💡 Tip: Switch to Hardhat Account #0 (<code>0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266</code>) using the Test Accounts button in the top bar.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <div
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, rgba(244, 63, 94, 0.2), rgba(168, 85, 247, 0.2))",
              color: "#f472b6",
              fontWeight: 700,
              fontSize: "0.82rem",
            }}
          >
            🛡️ ADMIN CONSOLE
          </div>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Authorized as Deployer / Super-Admin
          </span>
        </div>
        <h1 style={{ fontSize: "1.8rem" }}>Election Management & Governance</h1>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div
          style={{
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            borderRadius: "12px",
            padding: "14px 18px",
            marginBottom: "20px",
            color: "#6ee7b7",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <CheckCircle size={18} color="#10b981" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            borderRadius: "12px",
            padding: "14px 18px",
            marginBottom: "20px",
            color: "#fca5a5",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <AlertTriangle size={18} color="#ef4444" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "12px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <button
          className={`btn btn-sm ${activeSubTab === "create" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveSubTab("create")}
        >
          <PlusCircle size={15} /> 1. Create Election
        </button>
        <button
          className={`btn btn-sm ${activeSubTab === "candidates" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveSubTab("candidates")}
        >
          <UserPlus size={15} /> 2. Add Candidates
        </button>
        <button
          className={`btn btn-sm ${activeSubTab === "voters" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveSubTab("voters")}
        >
          <Users size={15} /> 3. Register Voters
        </button>
        <button
          className={`btn btn-sm ${activeSubTab === "lifecycle" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveSubTab("lifecycle")}
        >
          <Clock size={15} /> 4. Lifecycle & Deadlines
        </button>
      </div>

      {/* SUB-TAB 1: CREATE ELECTION */}
      {activeSubTab === "create" && (
        <div className="glass-panel" style={{ padding: "28px" }}>
          <h2 style={{ fontSize: "1.3rem", marginBottom: "6px" }}>Create a New Election</h2>
          <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "20px" }}>
            Deploys a new election state onto the blockchain. You can subsequently add candidates and register voters.
          </p>

          <form onSubmit={handleCreateElection}>
            <div className="form-group">
              <label className="form-label">Election Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Computer Science Department Chair 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Election Description</label>
              <textarea
                className="form-textarea"
                placeholder="Provide context, eligibility rules, and instructions for voters..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Quick Presets */}
            <div style={{ marginBottom: "16px" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-subtle)", marginRight: "10px" }}>
                Quick Presets:
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => applyPreset(1)}
                style={{ marginRight: "6px", fontSize: "0.78rem" }}
              >
                1 Hour Demo
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => applyPreset(24)}
                style={{ marginRight: "6px", fontSize: "0.78rem" }}
              >
                24 Hours
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => applyPreset(168)}
                style={{ fontSize: "0.78rem" }}
              >
                7 Days
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label">Start Time *</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={startTimeStr}
                  onChange={(e) => setStartTimeStr(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Time (Deadline) *</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={endTimeStr}
                  onChange={(e) => setEndTimeStr(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: "10px" }}>
              <PlusCircle size={16} />
              {loading ? "Broadcasting to Ethereum..." : "Deploy Election on Chain"}
            </button>
          </form>
        </div>
      )}

      {/* SUB-TAB 2: ADD CANDIDATES */}
      {activeSubTab === "candidates" && (
        <div className="glass-panel" style={{ padding: "28px" }}>
          <h2 style={{ fontSize: "1.3rem", marginBottom: "6px" }}>Register Candidates</h2>
          <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "20px" }}>
            Add candidates or ballot options to any created election.
          </p>

          <form onSubmit={handleAddCandidate}>
            <div className="form-group">
              <label className="form-label">Target Election *</label>
              <select
                className="form-select"
                value={selectedElectionId}
                onChange={(e) => setSelectedElectionId(e.target.value)}
                required
              >
                {elections.map((el) => (
                  <option key={el.id} value={el.id}>
                    #{el.id} - {el.title} ({el.candidateCount} candidates)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Candidate Name / Ballot Option *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Dr. Jane Doe"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Party Affiliation / Slogan / Manifesto</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. AI Research & Academic Freedom Caucus"
                value={candidateParty}
                onChange={(e) => setCandidateParty(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Avatar Image URL (Optional)</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://example.com/photo.jpg"
                value={candidateAvatar}
                onChange={(e) => setCandidateAvatar(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: "10px" }}>
              <UserPlus size={16} />
              {loading ? "Recording Candidate..." : "Add Candidate"}
            </button>
          </form>
        </div>
      )}

      {/* SUB-TAB 3: REGISTER VOTERS */}
      {activeSubTab === "voters" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="glass-panel" style={{ padding: "28px" }}>
            <h2 style={{ fontSize: "1.3rem", marginBottom: "6px" }}>Batch Register Voters (Recommended)</h2>
            <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "16px" }}>
              Register multiple eligible voter wallet addresses in a single atomic transaction.
            </p>

            <form onSubmit={handleRegisterBatchVoters}>
              <div className="form-group">
                <label className="form-label">Target Election *</label>
                <select
                  className="form-select"
                  value={selectedElectionId}
                  onChange={(e) => setSelectedElectionId(e.target.value)}
                  required
                >
                  {elections.map((el) => (
                    <option key={el.id} value={el.id}>
                      #{el.id} - {el.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Voter Wallet Addresses (Comma or Line Separated) *
                  </label>
                  <button
                    type="button"
                    onClick={prefillDemoAccounts}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: "0.76rem", padding: "4px 8px" }}
                  >
                    <Sparkles size={13} color="#818cf8" /> Pre-fill 6 Local Hardhat Accounts
                  </button>
                </div>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: "120px", fontFamily: "var(--font-mono)", fontSize: "0.84rem" }}
                  placeholder="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266&#10;0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
                  value={batchVotersText}
                  onChange={(e) => setBatchVotersText(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Users size={16} />
                {loading ? "Registering Batch On-Chain..." : "Batch Register Voters"}
              </button>
            </form>
          </div>

          <div className="glass-panel" style={{ padding: "28px" }}>
            <h2 style={{ fontSize: "1.2rem", marginBottom: "6px" }}>Register Single Voter</h2>
            <form onSubmit={handleRegisterSingleVoter}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "12px", alignItems: "flex-end" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Ethereum Address (0x...)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="0x..."
                    value={voterAddress}
                    onChange={(e) => setVoterAddress(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-secondary" disabled={loading}>
                  Register Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: LIFECYCLE & DEADLINES */}
      {activeSubTab === "lifecycle" && (
        <div className="glass-panel" style={{ padding: "28px" }}>
          <h2 style={{ fontSize: "1.3rem", marginBottom: "6px" }}>Deadline Control & Early Conclude</h2>
          <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "20px" }}>
            Manage the operational lifecycle of live elections.
          </p>

          <div className="form-group">
            <label className="form-label">Target Election *</label>
            <select
              className="form-select"
              value={selectedElectionId}
              onChange={(e) => setSelectedElectionId(e.target.value)}
            >
              {elections.map((el) => (
                <option key={el.id} value={el.id}>
                  #{el.id} - {el.title} (Ends: {formatDate(el.endTime)})
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
              marginTop: "24px",
            }}
          >
            {/* Extend Deadline Card */}
            <div
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "14px",
                padding: "20px",
              }}
            >
              <h3 style={{ fontSize: "1.05rem", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Clock size={16} color="#38bdf8" /> Extend Voting Deadline
              </h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "14px" }}>
                Adds additional time to the active window so voters can participate.
              </p>

              <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
                <button
                  type="button"
                  className={`btn btn-sm ${extensionMinutes === 60 ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setExtensionMinutes(60)}
                >
                  +1 Hour
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${extensionMinutes === 1440 ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setExtensionMinutes(1440)}
                >
                  +1 Day
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${extensionMinutes === 10080 ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setExtensionMinutes(10080)}
                >
                  +7 Days
                </button>
              </div>

              <button className="btn btn-primary btn-sm" onClick={handleExtendDeadline} disabled={loading}>
                Apply Deadline Extension
              </button>
            </div>

            {/* Early Conclude Card */}
            <div
              style={{
                background: "rgba(239, 68, 68, 0.05)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "14px",
                padding: "20px",
              }}
            >
              <h3 style={{ fontSize: "1.05rem", marginBottom: "6px", color: "#f87171", display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertTriangle size={16} color="#ef4444" /> Early Termination
              </h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                Immediately terminates the election on-chain. Results are permanently finalized and no more votes can be submitted.
              </p>

              <button className="btn btn-danger btn-sm" onClick={handleCloseEarly} disabled={loading}>
                Conclude Election Early
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
