/**
 * Truncate Ethereum address for UI display
 */
export function formatAddress(address) {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Format timestamp (in seconds) to localized date string
 */
export function formatDate(timestamp) {
  if (!timestamp) return "N/A";
  const num = typeof timestamp === "bigint" ? Number(timestamp) : Number(timestamp);
  if (num === 0) return "N/A";
  return new Date(num * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Calculate dynamic countdown from current time to end timestamp
 */
export function formatCountdown(endTime) {
  const endSec = typeof endTime === "bigint" ? Number(endTime) : Number(endTime);
  const nowSec = Math.floor(Date.now() / 1000);
  const diffSec = endSec - nowSec;

  if (diffSec <= 0) {
    return { text: "Concluded", isEnded: true, diffSec: 0 };
  }

  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;

  let text = "";
  if (days > 0) text += `${days}d `;
  if (hours > 0 || days > 0) text += `${hours}h `;
  text += `${minutes}m ${seconds}s`;

  return { text, isEnded: false, diffSec };
}

/**
 * Calculate percentage with 1 decimal place
 */
export function calculatePercentage(count, total) {
  const c = Number(count || 0);
  const t = Number(total || 0);
  if (t === 0) return 0;
  return Math.round((c / t) * 1000) / 10;
}

/**
 * Copy text with fallback
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Clipboard copy failed:", err);
    return false;
  }
}

/**
 * Parse smart contract revert errors into clean user messages
 */
export function parseContractError(err) {
  if (!err) return "An unexpected error occurred.";

  const message = err.reason || err.message || JSON.stringify(err);

  // Common BlockVote contract requires
  if (message.includes("Caller is not an authorized administrator")) {
    return "Permission Denied: You must be an authorized admin to perform this action.";
  }
  if (message.includes("You have already voted") || message.includes("Duplicate voting is not permitted")) {
    return "Duplicate Vote Prevented: Your wallet has already cast a ballot for this election.";
  }
  if (message.includes("You are not registered to vote")) {
    return "Voter Ineligible: This wallet address has not been registered by the election admin.";
  }
  if (message.includes("Election deadline has passed")) {
    return "Voting Closed: The deadline for this election has passed.";
  }
  if (message.includes("Election has not started yet")) {
    return "Election Upcoming: Voting has not opened yet.";
  }
  if (message.includes("Election has been concluded by admin")) {
    return "Election Concluded: The administrator has closed this election.";
  }
  if (message.includes("user rejected action") || message.includes("ACTION_REJECTED")) {
    return "Transaction cancelled by user in MetaMask.";
  }

  return message.slice(0, 160);
}
