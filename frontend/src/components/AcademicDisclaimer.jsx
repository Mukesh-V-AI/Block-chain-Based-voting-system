import React, { useState } from "react";
import { ShieldAlert, Info, X, ExternalLink } from "lucide-react";

export default function AcademicDisclaimer() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="academic-banner">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldAlert size={16} color="#fbbf24" />
          <span>
            <strong>Academic Demo Notice:</strong> Votes and voter addresses are recorded publicly on Ethereum and are <em>not secret or anonymous</em>.
          </span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: "none",
            border: "none",
            color: "#818cf8",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "0.82rem",
            textDecoration: "underline",
            fontWeight: "600",
          }}
        >
          <Info size={14} /> Learn More
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <ShieldAlert size={24} color="#f59e0b" />
                <h3 style={{ margin: 0, fontSize: "1.3rem" }}>Academic Demonstration Notice</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ color: "#cbd5e1", fontSize: "0.95rem", lineHeight: "1.7" }}>
              <p style={{ marginBottom: "14px" }}>
                <strong>BlockVote</strong> is engineered as an educational proof-of-concept demonstrating
                decentralized consensus, immutable state storage, and algorithmic voter eligibility checks on the EVM.
              </p>

              <div style={{
                background: "rgba(245, 158, 11, 0.1)",
                border: "1px solid rgba(245, 158, 11, 0.25)",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "16px"
              }}>
                <h4 style={{ color: "#fbbf24", marginBottom: "6px", fontSize: "1rem" }}>
                  Public Transparency vs. Ballot Secrecy
                </h4>
                <p style={{ margin: 0, fontSize: "0.9rem" }}>
                  By design in basic smart contracts, all transaction payloads (e.g. <code>vote(electionId, candidateId)</code>)
                  and contract state variables are visible to any node or block explorer on the network.
                  True anonymous voting in production systems requires advanced Zero-Knowledge Proofs (zk-SNARKs)
                  or homomorphic encryption.
                </p>
              </div>

              <p style={{ marginBottom: "20px", color: "#94a3b8", fontSize: "0.88rem" }}>
                This project provides tamper-proof auditability, duplicate vote rejection, and strict admin eligibility
                enforcement for institutional and campus elections.
              </p>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="btn btn-primary btn-sm" onClick={() => setShowModal(false)}>
                  Understood & Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
