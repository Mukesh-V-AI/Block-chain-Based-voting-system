import React, { useState } from "react";
import { Key, Copy, Check, X, ShieldAlert, Sparkles, UserCheck } from "lucide-react";
import { DEMO_ACCOUNTS } from "../utils/constants";
import { copyToClipboard, formatAddress } from "../utils/helpers";

export default function DemoAccountsModal({ isOpen, onClose }) {
  const [copiedKey, setCopiedKey] = useState(null);

  if (!isOpen) return null;

  const handleCopy = async (text, id) => {
    await copyToClipboard(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "720px", padding: "28px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.2))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Key size={22} color="#818cf8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.25rem" }}>Hardhat Test Accounts & Keys</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Import these accounts into MetaMask to test Admin and Voter roles immediately.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            background: "rgba(99, 102, 241, 0.08)",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            borderRadius: "12px",
            padding: "12px 16px",
            marginBottom: "20px",
            fontSize: "0.86rem",
            color: "#c7d2fe",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Sparkles size={18} color="#818cf8" />
          <span>
            <strong>How to test:</strong> In MetaMask, click your account avatar &rarr; <em>Add account or hardware wallet</em> &rarr; <em>Import account</em> &rarr; Paste any Private Key below!
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "420px", overflowY: "auto", paddingRight: "6px" }}>
          {DEMO_ACCOUNTS.map((acc, index) => (
            <div
              key={index}
              style={{
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "12px",
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    className={
                      acc.role.includes("Admin")
                        ? "badge badge-admin"
                        : acc.role.includes("Registered")
                        ? "badge badge-active"
                        : "badge badge-upcoming"
                    }
                  >
                    {acc.role}
                  </span>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{acc.description}</span>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "10px",
                  alignItems: "center",
                  background: "rgba(0,0,0,0.3)",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.84rem",
                }}
              >
                <div>
                  <span style={{ color: "var(--text-subtle)", marginRight: "8px" }}>Address:</span>
                  <span style={{ color: "#38bdf8" }}>{acc.address}</span>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleCopy(acc.address, `addr-${index}`)}
                  title="Copy Address"
                >
                  {copiedKey === `addr-${index}` ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "10px",
                  alignItems: "center",
                  background: "rgba(0,0,0,0.3)",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.82rem",
                }}
              >
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <span style={{ color: "var(--text-subtle)", marginRight: "8px" }}>Private Key:</span>
                  <span style={{ color: "#a5b4fc" }}>{acc.privateKey}</span>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleCopy(acc.privateKey, `pk-${index}`)}
                  title="Copy Private Key"
                >
                  {copiedKey === `pk-${index}` ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
