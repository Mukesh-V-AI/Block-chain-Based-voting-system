import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  Award,
  Vote,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Lock,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useWeb3 } from "../context/Web3Context";
import {
  formatDate,
  formatCountdown,
  calculatePercentage,
  formatAddress,
  parseContractError,
} from "../utils/helpers";

export default function ElectionDetails({ electionId, onBack, onOpenAdminTab }) {
  const { account, contract, readContract, isCorrectNetwork, isAdmin, refreshData } = useWeb3();

  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [voterStatus, setVoterStatus] = useState({
    isRegistered: false,
    hasVoted: false,
    votedCandidateId: 0,
    voteTimestamp: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txSuccess, setTxSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [countdown, setCountdown] = useState({ text: "", isEnded: false });

  const activeContract = contract || readContract;

  // Fetch election details, candidates, and voter status
  const loadDetails = useCallback(async () => {
    if (!activeContract || !electionId) return;

    try {
      setLoading(true);
      setErrorMessage(null);

      // 1. Fetch Election Info
      const elData = await activeContract.getElection(electionId);
      const parsedElection = {
        id: Number(elData.id),
        title: elData.title,
        description: elData.description,
        startTime: Number(elData.startTime),
        endTime: Number(elData.endTime),
        candidateCount: Number(elData.candidateCount),
        totalVotes: Number(elData.totalVotes),
        state: Number(elData.state),
        creator: elData.creator,
      };
      setElection(parsedElection);

      // 2. Fetch Candidates
      const cList = await activeContract.getCandidates(electionId);
      const parsedCandidates = cList.map((c) => ({
        id: Number(c.id),
        name: c.name,
        party: c.party,
        avatarUrl: c.avatarUrl,
        voteCount: Number(c.voteCount),
      }));
      setCandidates(parsedCandidates);

      // 3. Fetch Voter Status if wallet connected
      if (account && activeContract) {
        const vStatus = await activeContract.getVoterStatus(electionId, account);
        setVoterStatus({
          isRegistered: vStatus.isRegistered,
          hasVoted: vStatus.hasVoted,
          votedCandidateId: Number(vStatus.votedCandidateId),
          voteTimestamp: Number(vStatus.voteTimestamp),
        });
      }
    } catch (err) {
      console.error("Failed to load election details:", err);
      setErrorMessage("Failed to query blockchain state for this election.");
    } finally {
      setLoading(false);
    }
  }, [activeContract, electionId, account]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  // Update Countdown
  useEffect(() => {
    if (!election) return;
    const update = () => {
      setCountdown(formatCountdown(election.endTime));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [election]);

  // Cast Vote Handler
  const handleVoteSubmit = async () => {
    if (!contract || !selectedCandidate) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const tx = await contract.vote(electionId, selectedCandidate.id);
      const receipt = await tx.wait();

      // Trigger Confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      setTxSuccess({
        hash: receipt.hash,
        candidateName: selectedCandidate.name,
      });

      setSelectedCandidate(null);
      await loadDetails();
      refreshData();
    } catch (err) {
      console.error("Vote submission error:", err);
      setErrorMessage(parseContractError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !election) {
    return (
      <div className="glass-panel" style={{ padding: "60px 20px", textAlign: "center" }}>
        <div className="shimmer" style={{ height: "40px", width: "50%", margin: "0 auto 20px auto", borderRadius: "8px" }} />
        <div className="shimmer" style={{ height: "20px", width: "80%", margin: "0 auto 40px auto", borderRadius: "8px" }} />
        <p style={{ color: "var(--text-muted)" }}>Reading Ethereum state from contract...</p>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="glass-panel" style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "#ef4444" }}>Election not found or error loading data.</p>
        <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: "14px" }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>
    );
  }

  const isEnded = Number(election.state) === 2 || countdown.isEnded;
  const isUpcoming = Number(election.state) === 0 && !isEnded;
  const isActive = Number(election.state) === 1 && !isEnded;

  // Find winner if ended
  let maxVotes = -1;
  let winnerId = null;
  if (isEnded && candidates.length > 0 && election.totalVotes > 0) {
    candidates.forEach((c) => {
      if (c.voteCount > maxVotes) {
        maxVotes = c.voteCount;
        winnerId = c.id;
      }
    });
  }

  const votedCandidateObj = candidates.find((c) => c.id === voterStatus.votedCandidateId);

  return (
    <div>
      {/* Top Navigation */}
      <div style={{ marginBottom: "20px" }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onBack}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <ArrowLeft size={16} /> Back to Elections
        </button>
      </div>

      {/* Main Election Header Card */}
      <div
        className="glass-panel"
        style={{
          padding: "32px",
          marginBottom: "24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              {isActive && (
                <span className="badge badge-active">
                  <span className="pulse-dot" /> Voting Active
                </span>
              )}
              {isUpcoming && (
                <span className="badge badge-upcoming">
                  <Clock size={12} /> Upcoming
                </span>
              )}
              {isEnded && (
                <span className="badge badge-ended">
                  <CheckCircle size={12} /> Voting Ended
                </span>
              )}
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Election #{election.id}
              </span>
            </div>

            <h1 style={{ fontSize: "1.8rem", marginBottom: "10px", color: "#ffffff" }}>
              {election.title}
            </h1>

            <p style={{ color: "#cbd5e1", maxWidth: "800px", lineHeight: "1.6" }}>
              {election.description}
            </p>
          </div>

          {/* Countdown & Total votes pill */}
          <div
            style={{
              background: "rgba(0, 0, 0, 0.4)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "14px",
              padding: "16px 20px",
              textAlign: "right",
              minWidth: "180px",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)", textTransform: "uppercase" }}>
              {isActive ? "Time Remaining" : "Election Status"}
            </div>
            <div
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: isEnded ? "#a855f7" : "#38bdf8",
                fontFamily: "var(--font-mono)",
                marginTop: "2px",
              }}
            >
              {countdown.text}
            </div>

            <div style={{ marginTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "8px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-subtle)" }}>Total Ballots Cast: </span>
              <strong style={{ color: "#ffffff", fontSize: "0.95rem" }}>{election.totalVotes}</strong>
            </div>
          </div>
        </div>

        {/* Schedule & Creator Info */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "24px",
            fontSize: "0.82rem",
            color: "var(--text-muted)",
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: "16px",
            marginTop: "16px",
          }}
        >
          <div>
            <span style={{ color: "var(--text-subtle)" }}>Voting Window: </span>
            {formatDate(election.startTime)} &rarr; {formatDate(election.endTime)}
          </div>
          <div>
            <span style={{ color: "var(--text-subtle)" }}>Created By: </span>
            <code style={{ color: "#38bdf8" }}>{formatAddress(election.creator)}</code>
          </div>
          {isAdmin && (
            <button
              onClick={onOpenAdminTab}
              style={{
                background: "none",
                border: "none",
                color: "#f472b6",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.82rem",
                padding: 0,
              }}
            >
              ⚙️ Manage in Admin Console
            </button>
          )}
        </div>
      </div>

      {/* Voter Personal Status Banner */}
      <div
        className="glass-panel"
        style={{
          padding: "20px 24px",
          marginBottom: "28px",
          borderLeft: voterStatus.hasVoted
            ? "4px solid #10b981"
            : voterStatus.isRegistered
            ? "4px solid #6366f1"
            : "4px solid #f59e0b",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-subtle)", textTransform: "uppercase", fontWeight: 700 }}>
              Your Wallet Voting Status
            </div>

            {!account ? (
              <div style={{ marginTop: "4px", color: "#fbbf24", display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertTriangle size={18} />
                <span>Connect your MetaMask wallet above to verify your voter eligibility.</span>
              </div>
            ) : voterStatus.hasVoted ? (
              <div style={{ marginTop: "4px", color: "#34d399", display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle size={18} />
                <span>
                  <strong>Vote Recorded on Ethereum!</strong> You cast your ballot for{" "}
                  <strong>{votedCandidateObj ? votedCandidateObj.name : `Candidate #${voterStatus.votedCandidateId}`}</strong>{" "}
                  on {formatDate(voterStatus.voteTimestamp)}. Duplicate voting is blocked.
                </span>
              </div>
            ) : voterStatus.isRegistered ? (
              <div style={{ marginTop: "4px", color: "#818cf8", display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles size={18} />
                <span>
                  <strong>Eligible & Registered!</strong> Your address (<code>{formatAddress(account)}</code>) has been
                  verified by the election administrator. You can cast your vote below.
                </span>
              </div>
            ) : (
              <div style={{ marginTop: "4px", color: "#f87171", display: "flex", alignItems: "center", gap: "8px" }}>
                <Lock size={18} />
                <span>
                  <strong>Not Registered:</strong> Address <code>{formatAddress(account)}</code> is not registered for
                  this election. Only addresses registered by the election admin can vote.
                </span>
              </div>
            )}
          </div>

          {account && (
            <div style={{ display: "flex", gap: "8px" }}>
              <span className={`badge ${voterStatus.isRegistered ? "badge-active" : "badge-upcoming"}`}>
                {voterStatus.isRegistered ? "Registered Voter" : "Unregistered"}
              </span>
              <span className={`badge ${voterStatus.hasVoted ? "badge-active" : "badge-upcoming"}`}>
                {voterStatus.hasVoted ? "Ballot Cast" : "Pending Vote"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error Message Box */}
      {errorMessage && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            borderRadius: "12px",
            padding: "14px 18px",
            marginBottom: "24px",
            color: "#fca5a5",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <AlertTriangle size={20} color="#ef4444" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Vote Success Box */}
      {txSuccess && (
        <div
          style={{
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "24px",
            color: "#6ee7b7",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <CheckCircle size={22} color="#10b981" />
            <strong style={{ fontSize: "1.05rem" }}>Ballot Successfully Cast & Confirmed!</strong>
          </div>
          <p style={{ margin: "0 0 8px 32px", fontSize: "0.9rem" }}>
            Your vote for <strong>{txSuccess.candidateName}</strong> is permanently etched onto the blockchain ledger.
          </p>
          <div style={{ margin: "0 0 0 32px", fontSize: "0.82rem", fontFamily: "var(--font-mono)" }}>
            Tx Hash: <span style={{ color: "#38bdf8" }}>{txSuccess.hash}</span>
          </div>
        </div>
      )}

      {/* Candidates Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
        <h2 style={{ fontSize: "1.4rem", color: "#ffffff" }}>
          Candidates & Live Results ({candidates.length})
        </h2>
        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          {isEnded ? "Final Tally" : "Real-time Blockchain Tally"}
        </span>
      </div>

      {/* Candidates List Grid */}
      {candidates.length === 0 ? (
        <div className="glass-panel" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
          <p>No candidates have been registered for this election yet.</p>
          {isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={onOpenAdminTab} style={{ marginTop: "12px" }}>
              Add Candidates in Admin Panel
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {candidates.map((cand) => {
            const percentage = calculatePercentage(cand.voteCount, election.totalVotes);
            const isWinner = isEnded && cand.id === winnerId;
            const isUserChoice = voterStatus.hasVoted && voterStatus.votedCandidateId === cand.id;
            const canVote = isActive && voterStatus.isRegistered && !voterStatus.hasVoted;

            return (
              <div
                key={cand.id}
                className="glass-panel"
                style={{
                  padding: "20px 24px",
                  position: "relative",
                  border: isUserChoice
                    ? "2px solid #10b981"
                    : isWinner
                    ? "2px solid #8b5cf6"
                    : "1px solid var(--border-subtle)",
                  backgroundColor: isUserChoice
                    ? "rgba(16, 185, 129, 0.05)"
                    : isWinner
                    ? "rgba(139, 92, 246, 0.05)"
                    : "var(--bg-card)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "16px",
                  }}
                >
                  {/* Candidate Profile Info */}
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    {cand.avatarUrl ? (
                      <img
                        src={cand.avatarUrl}
                        alt={cand.name}
                        style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "14px",
                          objectFit: "cover",
                          border: "2px solid rgba(255, 255, 255, 0.1)",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "14px",
                          background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.2rem",
                          fontWeight: 700,
                          color: "white",
                        }}
                      >
                        {cand.name.charAt(0)}
                      </div>
                    )}

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <h3 style={{ margin: 0, fontSize: "1.15rem", color: "#ffffff" }}>
                          {cand.name}
                        </h3>
                        {isWinner && (
                          <span className="badge badge-ended" style={{ display: "inline-flex", gap: "4px" }}>
                            <Award size={12} /> Winner
                          </span>
                        )}
                        {isUserChoice && (
                          <span className="badge badge-active" style={{ display: "inline-flex", gap: "4px" }}>
                            <CheckCircle size={12} /> Your Vote
                          </span>
                        )}
                      </div>
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        {cand.party || "Independent Candidate"}
                      </p>
                    </div>
                  </div>

                  {/* Vote Count & Action Button */}
                  <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <div style={{ textAlign: "right", minWidth: "100px" }}>
                      <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff" }}>
                        {cand.voteCount} <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>votes</span>
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "#38bdf8", fontWeight: 600 }}>
                        {percentage}%
                      </div>
                    </div>

                    {canVote && (
                      <button
                        className="btn btn-primary"
                        onClick={() => setSelectedCandidate(cand)}
                        disabled={isSubmitting}
                      >
                        <Vote size={16} /> Vote
                      </button>
                    )}
                  </div>
                </div>

                {/* Animated Vote Share Progress Bar */}
                <div
                  style={{
                    marginTop: "16px",
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "9999px",
                    height: "8px",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${percentage}%`,
                      background: isWinner
                        ? "linear-gradient(90deg, #8b5cf6, #c084fc)"
                        : "linear-gradient(90deg, #6366f1, #06b6d4)",
                      borderRadius: "9999px",
                      transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vote Confirmation Modal */}
      {selectedCandidate && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setSelectedCandidate(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ padding: "30px", maxWidth: "500px" }}
          >
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "rgba(99, 102, 241, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px auto",
                }}
              >
                <Vote size={28} color="#818cf8" />
              </div>
              <h3 style={{ fontSize: "1.35rem", marginBottom: "6px" }}>Confirm Your Vote</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                This action will trigger an on-chain transaction that permanently writes your ballot to the Ethereum state.
              </p>
            </div>

            <div
              style={{
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "14px",
                padding: "16px",
                marginBottom: "20px",
              }}
            >
              <div style={{ fontSize: "0.78rem", color: "var(--text-subtle)", textTransform: "uppercase" }}>
                Selected Candidate
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ffffff", marginTop: "2px" }}>
                {selectedCandidate.name}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#38bdf8" }}>
                {selectedCandidate.party}
              </div>
              <div
                style={{
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  marginTop: "12px",
                  paddingTop: "10px",
                  fontSize: "0.8rem",
                  color: "#cbd5e1",
                }}
              >
                <strong>Voter Address:</strong> <code>{formatAddress(account)}</code>
              </div>
            </div>

            <div
              style={{
                background: "rgba(245, 158, 11, 0.08)",
                border: "1px solid rgba(245, 158, 11, 0.2)",
                borderRadius: "10px",
                padding: "12px",
                marginBottom: "24px",
                fontSize: "0.82rem",
                color: "#fde68a",
                display: "flex",
                gap: "8px",
              }}
            >
              <ShieldAlert size={16} style={{ flexShrink: 0 }} />
              <span>
                Reminder: Duplicate voting is strictly blocked by the smart contract. You cannot change your choice once confirmed.
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedCandidate(null)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleVoteSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Confirming in MetaMask..." : "Submit Vote"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
