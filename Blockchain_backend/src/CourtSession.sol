// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CourtAccessControl.sol";
import "./FIRRegistry.sol";

contract CourtSession {
    enum CaseStatus {
        CREATED,
        PRE_TRIAL,
        IN_SESSION,
        CLOSED
    }

    struct Case {
        string id;
        string linkedFirId;
        string title;
        string accused;
        string filer;
        CaseStatus status;
        address assignedJudge;
        uint256 creationDate;
        address defence;
        address prosecution;
        uint256 nextSessionId;
        string metaData;
        address assignedClerk;
    }

    struct SessionDetails {
        uint256 sessionId;
        uint256 scheduledDate;
        string description;
        bool isConcluded;
    }

    struct CurrSession {
        string caseId;
        uint256 sessionId;
        string ipfsCid;
        bool isAdjourned;
        uint256 startTimestamp;
        uint256 endTimestamp;
    }

    CourtAccessControl public accessControl;
    FIRRegistry public firRegistry;

    mapping(string => Case) public cases;
    mapping(string => address) public assignedJudgeMap;
    mapping(string => mapping(string => address)) public isAssignedLawyer;
    mapping(string => string[]) public caseProofLinks; // New mapping for case proof links

    // Fixed naming convention (camelCase)
    mapping(string => mapping(uint256 => SessionDetails)) public nextSessions;
    mapping(string => mapping(uint256 => CurrSession)) public sessions;

    event CaseCreated(string indexed caseId, string title, string linkedFirId);
    event CaseStatusChanged(string indexed caseId, CaseStatus status);
    event JudgeAssigned(string indexed caseId, address judge);
    event LawyerAssigned(string indexed caseId, address lawyer, string role);
    event NextSessionscheduled(
        string indexed caseId,
        uint256 indexed sessionId,
        uint256 date
    );
    event SessionPublished(
        string indexed caseId,
        uint256 indexed sessionId,
        string ipfsCid
    );
    event ProofLinkAdded(string indexed caseId, string proofLink);

    // --- OPTIMIZED MODIFIERS ---
    modifier onlyClerk() {
        _checkClerk();
        _;
    }

    modifier onlyAssignedJudge(string memory _caseId) {
        _checkAssignedJudge(_caseId);
        _;
    }

    function _checkClerk() internal view {
        require(
            accessControl.hasRole(accessControl.CLERK_ROLE(), msg.sender),
            "Only Clerk"
        );
    }

    function _checkAssignedJudge(string memory _caseId) internal view {
        require(cases[_caseId].assignedJudge == msg.sender, "Not the Judge");
    }

    constructor(address _accessControl, address _firRegistry) {
        accessControl = CourtAccessControl(_accessControl);
        firRegistry = FIRRegistry(_firRegistry);
    }

    function createCase(
        string memory _caseId,
        string memory _title,
        string memory _firId,
        address _prosecution,
        address _defence,
        address _judge,
        string memory _metaData
    ) external onlyClerk {
        require(bytes(cases[_caseId].id).length == 0, "Case already exists");
        
        // Validate role assignments with revert statements
        require(_prosecution != address(0), "Invalid prosecution address");
        require(_defence != address(0), "Invalid defence address");
        require(_judge != address(0), "Invalid judge address");
        
        // Check if prosecution address has lawyer role
        require(accessControl.isLawyer(_prosecution), "Prosecution must be a lawyer");
        
        // Check if defence address has lawyer role
        require(accessControl.isLawyer(_defence), "Defence must be a lawyer");
        
        // Check if judge address has judge role
        require(accessControl.isJudge(_judge), "Judge must be a judge");

        string memory _accused = "";
        string memory _filer = "";

        if (bytes(_firId).length > 0) {
            firRegistry.markForwarded(_firId, 0); // Pass 0 since we're using string caseId now
            (, , _accused, _filer, , ) = FIRRegistry(address(firRegistry)).firs(
                _firId
            );
        }

        cases[_caseId] = Case({
            id: _caseId,
            linkedFirId: _firId,
            title: _title,
            accused: _accused,
            filer: _filer,
            status: CaseStatus.CREATED,
            assignedJudge: _judge,
            creationDate: block.timestamp,
            defence: _defence,
            prosecution: _prosecution,
            nextSessionId: 1,
            metaData: _metaData,
            assignedClerk: msg.sender
        });

        emit CaseCreated(_caseId, _title, _firId);
        emit JudgeAssigned(_caseId, _judge);
        emit LawyerAssigned(_caseId, _prosecution, "prosecution");
        emit LawyerAssigned(_caseId, _defence, "defence");
    }

    function reassignLawyer(
        string memory _caseId,
        address _lawyer,
        string calldata _role
    ) external onlyClerk {
        require(bytes(cases[_caseId].id).length != 0, "Case does not exist");
        require(_lawyer != address(0), "Invalid lawyer address");
        require(accessControl.isLawyer(_lawyer), "User is not a Lawyer");
        
        // Validate role string
        bytes32 roleHash = keccak256(bytes(_role));
        require(
            roleHash == keccak256("defence") || roleHash == keccak256("prosecution"),
            "Invalid role. Must be 'defence' or 'prosecution'"
        );

        isAssignedLawyer[_caseId][_role] = _lawyer;

        if (keccak256(bytes(_role)) == keccak256("defence")) {
            cases[_caseId].defence = _lawyer;
        } else if (keccak256(bytes(_role)) == keccak256("prosecution")) {
            cases[_caseId].prosecution = _lawyer;
        }
        emit LawyerAssigned(_caseId, _lawyer, _role);
    }

    function reassignJudge(string memory _caseId, address _judge) external onlyClerk {
        require(bytes(cases[_caseId].id).length != 0, "Case does not exist");
        require(_judge != address(0), "Invalid judge address");
        require(accessControl.isJudge(_judge), "User is not a Judge");
        
        cases[_caseId].assignedJudge = _judge;
        emit JudgeAssigned(_caseId, _judge);
    }

    function scheduleSession(
        string memory _caseId,
        uint256 _date,
        string memory _desc
    ) external onlyAssignedJudge(_caseId) {
        uint256 sId = cases[_caseId].nextSessionId;
        nextSessions[_caseId][sId] = SessionDetails({
            sessionId: sId,
            scheduledDate: _date,
            description: _desc,
            isConcluded: false
        });
        cases[_caseId].nextSessionId++;
        cases[_caseId].status = CaseStatus.IN_SESSION;
        emit NextSessionscheduled(_caseId, sId, _date);
    }

    /**
     * @dev Finalize a session in a single transaction
     * Frontend provides start/end timestamps and IPFS CID
     */
    function finalizeSession(
        string memory _caseId,
        string memory _ipfsCid,
        bool _isAdjourned,
        uint256 _startTimestamp,
        uint256 _endTimestamp
    ) external onlyAssignedJudge(_caseId) {
        require(bytes(cases[_caseId].id).length != 0, "Case does not exist");
        require(bytes(_ipfsCid).length > 0, "IPFS CID required");
        require(_startTimestamp > 0, "Invalid start timestamp");
        require(_endTimestamp > _startTimestamp, "End must be after start");

        uint256 sId = cases[_caseId].nextSessionId;
        
        // Store the finalized session
        sessions[_caseId][sId] = CurrSession({
            caseId: _caseId,
            sessionId: sId,
            ipfsCid: _ipfsCid,
            isAdjourned: _isAdjourned,
            startTimestamp: _startTimestamp,
            endTimestamp: _endTimestamp
        });

        // Increment session ID for next session
        cases[_caseId].nextSessionId++;
        cases[_caseId].status = _isAdjourned ? CaseStatus.IN_SESSION : CaseStatus.CLOSED;

        emit SessionPublished(_caseId, sId, _ipfsCid);
    }

    function addProofLink(
        string memory _caseId,
        string memory _proofLink
    ) external onlyAssignedJudge(_caseId) {
        require(bytes(cases[_caseId].id).length != 0, "Case does not exist");
        caseProofLinks[_caseId].push(_proofLink);
        emit ProofLinkAdded(_caseId, _proofLink);
    }

    function getSessionDetails(
        string memory _caseId,
        uint256 _sessionId
    ) external view returns (CurrSession memory) {
        return sessions[_caseId][_sessionId];
    }

    function getCaseSigners(
        string memory _caseId
    )
        external
        view
        returns (
            address clerk,
            address judge,
            address defence,
            address prosecution
        )
    {
        return (
            cases[_caseId].assignedClerk,
            cases[_caseId].assignedJudge,
            cases[_caseId].defence,
            cases[_caseId].prosecution
        );
    }

    function getCaseProofLinks(
        string memory _caseId
    ) external view returns (string[] memory) {
        return caseProofLinks[_caseId];
    }

    function getNextSessionDetails(
        string memory _caseId
    ) external view returns (SessionDetails memory) {
        // Safe check to prevent underflow if no sessions exist
        if (cases[_caseId].nextSessionId <= 1) {
            return SessionDetails(0, 0, "", false); // Return empty if no session scheduled
        }

        // Logic: The "next" session is the one currently scheduled but not yet happened
        // or the last one added.
        uint256 sessionId = cases[_caseId].nextSessionId - 1;
        return nextSessions[_caseId][sessionId];
    }

    function updateNextSessionState(
        string memory _caseId,
        uint256 _sessionId,
        uint256 _newDate,
        string memory _description
    ) external onlyAssignedJudge(_caseId) {
        require(bytes(cases[_caseId].id).length != 0, "Case does not exist");
        require(_sessionId < cases[_caseId].nextSessionId, "Invalid session ID");
        
        // Update the session details
        SessionDetails storage session = nextSessions[_caseId][_sessionId];
        session.scheduledDate = _newDate;
        session.description = _description;
        
        emit NextSessionscheduled(_caseId, _sessionId, _newDate);
    }
}
