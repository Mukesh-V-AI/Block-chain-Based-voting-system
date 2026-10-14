import React, { useState } from "react";
import {
  FileCheck,
  ShieldCheck,
  Download,
  Copy,
  Check,
  ExternalLink,
  Code2,
  Database,
  Lock,
} from "lucide-react";
import { CONTRACT_ADDRESS, HARDHAT_CHAIN_ID } from "../utils/constants";
import { copyToClipboard, formatAddress, formatDate } from "../utils/helpers";

export default function AuditTrail({ elections }) {
  const [copied, setCopied] = useState(false);

  const handleCopyContract = async () => {
    await copyToClipboard(CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export JSON Report
  const exportJSON = () => {
    const report = {
      title: "BlockVote Academic Audit & Results Report",
      exportedAt: new Date().toISOString(),
      contractAddress: CONTRACT_ADDRESS,
      chainId: HARDHAT_CHAIN_ID,
      elections: elections.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        startTime: formatDate(e.startTime),
        endTime: formatDate(e.endTime),
        totalVotes: e.totalVotes,
        candidateCount: e.candidateCount,
        state: e.state === 1 ? "Active" : e.state === 2 ? "Concluded" : "Upcoming",
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `blockvote-audit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export CSV Report
  const exportCSV = () => {
    let csv = "Election ID,Title,Status,Candidate Count,Total Votes,Start Time,End Time\n";
    elections.forEach((e) => {
      const status = e.state === 1 ? "Active" : e.state === 2 ? "Concluded" : "Upcoming";
      csv += `"${e.id}","${e.title.replace(/"/g, '""')}","${status}",${e.candidateCount},${e.totalVotes},"${formatDate(e.startTime)}","${formatDate(e.endTime)}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `blockvote-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <div
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              background: "rgba(6, 182, 212, 0.15)",
              color: "#38bdf8",
              fontWeight: 700,
              fontSize: "0.82rem",
            }}
          >
            📋 ACADEMIC VERIFICATION
          </div>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Cryptographic Integrity & On-Chain Audit
          </span>
        </div>
        <h1 style={{ fontSize: "1.8rem" }}>Audit Trail & Blockchain Proofs</h1>
      </div>

      {/* Contract Verification Metadata Card */}
      <div className="glass-panel" style={{ padding: "28px", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
          <ShieldCheck size={22} color="#10b981" />
          Smart Contract Verification Spec
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div style={{ background: "rgba(0,0,0,0.3)", padding: "14px", borderRadius: "10px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-subtle)", textTransform: "uppercase" }}>
              Contract Address
            </span>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
              <code style={{ fontSize: "0.85rem", color: "#38bdf8" }}>{formatAddress(CONTRACT_ADDRESS)}</code>
              <button className="btn btn-secondary btn-sm" onClick={handleCopyContract} style={{ padding: "4px 8px" }}>
                {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              </button>
            </div>
          </div>

          <div style={{ background: "rgba(0,0,0,0.3)", padding: "14px", borderRadius: "10px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-subtle)", textTransform: "uppercase" }}>
              Network & Chain ID
            </span>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, marginTop: "4px", color: "#ffffff" }}>
              Hardhat Localhost ({HARDHAT_CHAIN_ID})
            </div>
          </div>

          <div style={{ background: "rgba(0,0,0,0.3)", padding: "14px", borderRadius: "10px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-subtle)", textTransform: "uppercase" }}>
              Consensus & Security
            </span>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, marginTop: "4px", color: "#34d399" }}>
              ReentrancyGuard + Ownable
            </div>
          </div>
        </div>

        {/* Core Security Properties */}
        <h3 style={{ fontSize: "1rem", color: "#cbd5e1", marginBottom: "12px" }}>
          Key System Invariants Enforced in Bytecode:
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
          <div style={{ background: "rgba(255,255,255,0.02)", padding: "12px 14px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <strong style={{ color: "#38bdf8", fontSize: "0.88rem" }}>1. Duplicate Vote Prevention</strong>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
              The contract inspects <code>voters[electionId][msg.sender].hasVoted</code> prior to recording state. Any repeated transaction reverts automatically.
            </p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", padding: "12px 14px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <strong style={{ color: "#818cf8", fontSize: "0.88rem" }}>2. Whitelist Eligibility Verification</strong>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Only addresses registered by the election administrator via <code>registerVoter</code> or <code>registerVotersBatch</code> have execution permissions.
            </p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", padding: "12px 14px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <strong style={{ color: "#c084fc", fontSize: "0.88rem" }}>3. Cryptographic Deadline Enforcement</strong>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
              The EVM enforces <code>block.timestamp &gt;= startTime &amp;&amp; block.timestamp &lt;= endTime</code>. Votes cannot be forged after the deadline.
            </p>
          </div>
        </div>
      </div>

      {/* Elections Summary Table & Export */}
      <div className="glass-panel" style={{ padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", margin: 0 }}>On-Chain Election Registry</h2>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Export data for academic paper evaluation, presentation, or grading.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn btn-secondary btn-sm" onClick={exportJSON}>
              <Download size={14} /> Export JSON
            </button>
            <button className="btn btn-secondary btn-sm" onClick={exportCSV}>
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                <th style={{ padding: "12px 14px" }}>ID</th>
                <th style={{ padding: "12px 14px" }}>Election Title</th>
                <th style={{ padding: "12px 14px" }}>Status</th>
                <th style={{ padding: "12px 14px" }}>Candidates</th>
                <th style={{ padding: "12px 14px" }}>Total Ballots</th>
                <th style={{ padding: "12px 14px" }}>Deadline</th>
              </tr>
            </thead>
            <tbody>
              {elections.map((el) => (
                <tr key={el.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "14px", fontFamily: "var(--font-mono)", color: "#38bdf8" }}>
                    #{el.id}
                  </td>
                  <td style={{ padding: "14px", fontWeight: 600, color: "#ffffff" }}>
                    {el.title}
                  </td>
                  <td style={{ padding: "14px" }}>
                    <span
                      className={`badge ${
                        el.state === 1
                          ? "badge-active"
                          : el.state === 2
                          ? "badge-ended"
                          : "badge-upcoming"
                      }`}
                    >
                      {el.state === 1 ? "Active" : el.state === 2 ? "Concluded" : "Upcoming"}
                    </span>
                  </td>
                  <td style={{ padding: "14px" }}>{el.candidateCount}</td>
                  <td style={{ padding: "14px", fontWeight: 700, color: "#38bdf8" }}>
                    {el.totalVotes}
                  </td>
                  <td style={{ padding: "14px", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                    {formatDate(el.endTime)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
