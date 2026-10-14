import React, { useState, useEffect } from "react";
import { Clock, Users, CheckCircle, ArrowRight, Award } from "lucide-react";
import { formatCountdown, formatDate } from "../utils/helpers";

export default function ElectionCard({ election, onSelect }) {
  const [countdown, setCountdown] = useState({ text: "", isEnded: false });

  useEffect(() => {
    const update = () => {
      setCountdown(formatCountdown(election.endTime));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [election.endTime]);

  const stateEnum = Number(election.state);
  const isEnded = stateEnum === 2 || countdown.isEnded;
  const isUpcoming = stateEnum === 0 && !isEnded;
  const isActive = stateEnum === 1 && !isEnded;

  return (
    <div
      className="glass-panel glass-panel-interactive"
      style={{
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top ambient highlight gradient */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: isActive
            ? "linear-gradient(90deg, #10b981, #06b6d4)"
            : isUpcoming
            ? "linear-gradient(90deg, #f59e0b, #eab308)"
            : "linear-gradient(90deg, #8b5cf6, #6366f1)",
        }}
      />

      <div>
        {/* Status Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          {isActive && (
            <span className="badge badge-active">
              <span className="pulse-dot" /> Live Election
            </span>
          )}
          {isUpcoming && (
            <span className="badge badge-upcoming">
              <Clock size={12} /> Upcoming
            </span>
          )}
          {isEnded && (
            <span className="badge badge-ended">
              <CheckCircle size={12} /> Concluded
            </span>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "0.8rem",
              color: isEnded ? "var(--text-subtle)" : "#38bdf8",
              fontFamily: "var(--font-mono)",
            }}
          >
            <Clock size={13} />
            <span>{countdown.text}</span>
          </div>
        </div>

        {/* Title & Description */}
        <h3
          style={{
            fontSize: "1.2rem",
            marginBottom: "8px",
            lineHeight: "1.4",
            color: "#ffffff",
          }}
        >
          {election.title}
        </h3>

        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-muted)",
            marginBottom: "20px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: "1.5",
          }}
        >
          {election.description}
        </p>
      </div>

      {/* Meta Stats & Action */}
      <div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            padding: "12px",
            background: "rgba(0, 0, 0, 0.25)",
            borderRadius: "10px",
            marginBottom: "16px",
          }}
        >
          <div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-subtle)", textTransform: "uppercase" }}>
              Candidates
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#e2e8f0" }}>
              {Number(election.candidateCount)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-subtle)", textTransform: "uppercase" }}>
              Total Votes
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#38bdf8" }}>
              {Number(election.totalVotes)}
            </div>
          </div>
        </div>

        <button
          className={`btn ${isActive ? "btn-primary" : "btn-secondary"}`}
          style={{ width: "100%", justifyContent: "space-between" }}
          onClick={() => onSelect(election.id)}
        >
          <span>
            {isActive ? "Enter Ballot & Vote" : isEnded ? "View Final Results" : "Inspect Candidates"}
          </span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
