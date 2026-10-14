// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BlockVote - Decentralized Voting Smart Contract
 * @notice Academic Demonstration:
 *         This smart contract demonstrates transparent, tamper-proof state transitions and
 *         eligibility enforcement on Ethereum. Because all transactions and storage on a public
 *         blockchain are visible, votes and voter addresses are transparent on-chain and are
 *         NOT cryptographically secret or private.
 */
contract BlockVote is Ownable, ReentrancyGuard {
    enum ElectionState {
        NotStarted,
        Active,
        Ended
    }

    struct Candidate {
        uint256 id;
        string name;
        string party;
        string avatarUrl;
        uint256 voteCount;
    }

    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 votedCandidateId;
        uint256 voteTimestamp;
    }

    struct Election {
        uint256 id;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 candidateCount;
        uint256 totalVotes;
        bool exists;
        bool forceEnded;
        address creator;
    }

    struct ElectionView {
        uint256 id;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 candidateCount;
        uint256 totalVotes;
        ElectionState state;
        address creator;
    }

    // Storage
    uint256 public electionCounter;
    mapping(uint256 => Election) public elections;
    mapping(uint256 => mapping(uint256 => Candidate)) public candidates;
    mapping(uint256 => mapping(address => Voter)) public voters;

    // Additional Election Admins authorized by the Owner
    mapping(address => bool) public isElectionAdmin;

    // Events
    event ElectionCreated(
        uint256 indexed electionId,
        string title,
        uint256 startTime,
        uint256 endTime,
        address indexed creator
    );
    event CandidateAdded(
        uint256 indexed electionId,
        uint256 indexed candidateId,
        string name,
        string party
    );
    event VoterRegistered(uint256 indexed electionId, address indexed voter);
    event VotersBatchRegistered(uint256 indexed electionId, uint256 count);
    event VoteCast(
        uint256 indexed electionId,
        uint256 indexed candidateId,
        address indexed voter,
        uint256 timestamp
    );
    event ElectionClosed(uint256 indexed electionId, uint256 closedAt);
    event ElectionDeadlineExtended(uint256 indexed electionId, uint256 newEndTime);

    // Modifiers
    modifier onlyAdmin() {
        require(
            msg.sender == owner() || isElectionAdmin[msg.sender],
            "BlockVote: Caller is not an authorized administrator"
        );
        _;
    }

    modifier electionMustExist(uint256 _electionId) {
        require(elections[_electionId].exists, "BlockVote: Election does not exist");
        _;
    }

    constructor() Ownable(msg.sender) {
        isElectionAdmin[msg.sender] = true;
    }

    /**
     * @notice Authorize or revoke an election administrator
     */
    function setAdmin(address _admin, bool _status) external onlyOwner {
        require(_admin != address(0), "BlockVote: Invalid address");
        isElectionAdmin[_admin] = _status;
    }

    /**
     * @notice Academic disclaimer view function
     */
    function academicDisclaimer() external pure returns (string memory) {
        return "BlockVote is an educational demo. Public blockchain transactions are transparent, meaning voter addresses and selections are verifiable on-chain and not anonymous.";
    }

    /**
     * @notice Create a new election
     */
    function createElection(
        string memory _title,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime
    ) external onlyAdmin returns (uint256) {
        require(bytes(_title).length > 0, "BlockVote: Election title cannot be empty");
        require(_startTime < _endTime, "BlockVote: Start time must precede end time");
        require(_endTime > block.timestamp, "BlockVote: End time must be in the future");

        electionCounter++;
        uint256 newElectionId = electionCounter;

        Election storage el = elections[newElectionId];
        el.id = newElectionId;
        el.title = _title;
        el.description = _description;
        el.startTime = _startTime;
        el.endTime = _endTime;
        el.candidateCount = 0;
        el.totalVotes = 0;
        el.exists = true;
        el.forceEnded = false;
        el.creator = msg.sender;

        emit ElectionCreated(newElectionId, _title, _startTime, _endTime, msg.sender);
        return newElectionId;
    }

    /**
     * @notice Add a candidate to an election
     */
    function addCandidate(
        uint256 _electionId,
        string memory _name,
        string memory _party,
        string memory _avatarUrl
    ) external onlyAdmin electionMustExist(_electionId) returns (uint256) {
        require(!elections[_electionId].forceEnded, "BlockVote: Election is already closed");
        require(bytes(_name).length > 0, "BlockVote: Candidate name cannot be empty");

        Election storage el = elections[_electionId];
        el.candidateCount++;
        uint256 newCandidateId = el.candidateCount;

        candidates[_electionId][newCandidateId] = Candidate({
            id: newCandidateId,
            name: _name,
            party: _party,
            avatarUrl: _avatarUrl,
            voteCount: 0
        });

        emit CandidateAdded(_electionId, newCandidateId, _name, _party);
        return newCandidateId;
    }

    /**
     * @notice Register a single eligible voter
     */
    function registerVoter(uint256 _electionId, address _voter)
        external
        onlyAdmin
        electionMustExist(_electionId)
    {
        require(_voter != address(0), "BlockVote: Invalid voter address");
        require(!voters[_electionId][_voter].isRegistered, "BlockVote: Voter already registered");

        voters[_electionId][_voter].isRegistered = true;
        emit VoterRegistered(_electionId, _voter);
    }

    /**
     * @notice Batch register multiple eligible voters
     */
    function registerVotersBatch(uint256 _electionId, address[] calldata _votersList)
        external
        onlyAdmin
        electionMustExist(_electionId)
    {
        require(_votersList.length > 0, "BlockVote: Empty voter list");
        for (uint256 i = 0; i < _votersList.length; i++) {
            address v = _votersList[i];
            if (v != address(0) && !voters[_electionId][v].isRegistered) {
                voters[_electionId][v].isRegistered = true;
                emit VoterRegistered(_electionId, v);
            }
        }
        emit VotersBatchRegistered(_electionId, _votersList.length);
    }

    /**
     * @notice Cast a vote for a candidate in an active election
     */
    function vote(uint256 _electionId, uint256 _candidateId)
        external
        nonReentrant
        electionMustExist(_electionId)
    {
        Election storage el = elections[_electionId];

        // 1. Check election status and deadline
        require(!el.forceEnded, "BlockVote: Election has been concluded by admin");
        require(block.timestamp >= el.startTime, "BlockVote: Election has not started yet");
        require(block.timestamp <= el.endTime, "BlockVote: Election deadline has passed");

        // 2. Check voter eligibility
        require(voters[_electionId][msg.sender].isRegistered, "BlockVote: You are not registered to vote in this election");
        require(!voters[_electionId][msg.sender].hasVoted, "BlockVote: Duplicate voting is not permitted. You have already voted.");

        // 3. Check candidate validity
        require(
            _candidateId >= 1 && _candidateId <= el.candidateCount,
            "BlockVote: Invalid candidate ID"
        );

        // 4. Record the vote
        Voter storage v = voters[_electionId][msg.sender];
        v.hasVoted = true;
        v.votedCandidateId = _candidateId;
        v.voteTimestamp = block.timestamp;

        candidates[_electionId][_candidateId].voteCount++;
        el.totalVotes++;

        emit VoteCast(_electionId, _candidateId, msg.sender, block.timestamp);
    }

    /**
     * @notice Early termination of an election
     */
    function closeElectionEarly(uint256 _electionId)
        external
        onlyAdmin
        electionMustExist(_electionId)
    {
        require(!elections[_electionId].forceEnded, "BlockVote: Election already force-ended");
        elections[_electionId].forceEnded = true;
        emit ElectionClosed(_electionId, block.timestamp);
    }

    /**
     * @notice Extend election deadline
     */
    function extendElectionDeadline(uint256 _electionId, uint256 _newEndTime)
        external
        onlyAdmin
        electionMustExist(_electionId)
    {
        Election storage el = elections[_electionId];
        require(!el.forceEnded, "BlockVote: Cannot extend closed election");
        require(_newEndTime > el.endTime, "BlockVote: New end time must be after current end time");
        require(_newEndTime > block.timestamp, "BlockVote: New end time must be in future");

        el.endTime = _newEndTime;
        emit ElectionDeadlineExtended(_electionId, _newEndTime);
    }

    // ==========================================
    // GETTERS & VIEW FUNCTIONS
    // ==========================================

    /**
     * @notice Compute current state of an election
     */
    function getElectionState(uint256 _electionId)
        public
        view
        electionMustExist(_electionId)
        returns (ElectionState)
    {
        Election storage el = elections[_electionId];
        if (el.forceEnded || block.timestamp > el.endTime) {
            return ElectionState.Ended;
        } else if (block.timestamp < el.startTime) {
            return ElectionState.NotStarted;
        } else {
            return ElectionState.Active;
        }
    }

    /**
     * @notice Fetch full details for a single election
     */
    function getElection(uint256 _electionId)
        external
        view
        electionMustExist(_electionId)
        returns (ElectionView memory)
    {
        Election storage el = elections[_electionId];
        return ElectionView({
            id: el.id,
            title: el.title,
            description: el.description,
            startTime: el.startTime,
            endTime: el.endTime,
            candidateCount: el.candidateCount,
            totalVotes: el.totalVotes,
            state: getElectionState(_electionId),
            creator: el.creator
        });
    }

    /**
     * @notice Return all candidates for an election
     */
    function getCandidates(uint256 _electionId)
        external
        view
        electionMustExist(_electionId)
        returns (Candidate[] memory)
    {
        uint256 count = elections[_electionId].candidateCount;
        Candidate[] memory candidateList = new Candidate[](count);

        for (uint256 i = 1; i <= count; i++) {
            candidateList[i - 1] = candidates[_electionId][i];
        }

        return candidateList;
    }

    /**
     * @notice Return voter status for a specific address in an election
     */
    function getVoterStatus(uint256 _electionId, address _voter)
        external
        view
        electionMustExist(_electionId)
        returns (
            bool isRegistered,
            bool hasVoted,
            uint256 votedCandidateId,
            uint256 voteTimestamp
        )
    {
        Voter storage v = voters[_electionId][_voter];
        return (v.isRegistered, v.hasVoted, v.votedCandidateId, v.voteTimestamp);
    }

    /**
     * @notice Return list of all created elections
     */
    function getAllElections()
        external
        view
        returns (ElectionView[] memory)
    {
        uint256 count = electionCounter;
        ElectionView[] memory allList = new ElectionView[](count);

        for (uint256 i = 1; i <= count; i++) {
            Election storage el = elections[i];
            allList[i - 1] = ElectionView({
                id: el.id,
                title: el.title,
                description: el.description,
                startTime: el.startTime,
                endTime: el.endTime,
                candidateCount: el.candidateCount,
                totalVotes: el.totalVotes,
                state: getElectionState(i),
                creator: el.creator
            });
        }

        return allList;
    }
}
