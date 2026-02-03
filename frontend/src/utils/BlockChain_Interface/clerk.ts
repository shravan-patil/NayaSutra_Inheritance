import { ethers } from "ethers";
import { MetaMaskInpageProvider } from "@metamask/providers";

declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider;
  }
}
// --- Configuration ---
// Safely access environment variables
const COURT_ADDR = import.meta.env.VITE_COURT_ADDR || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

const COURT_ABI = [
    // Writes
    "function createCase(string _caseId, string _title, string _firId, address _prosecution, address _defence, address _judge, string _metaData) external",
    "function reassignLawyer(string _caseId, address _lawyer, string _role) external",
    "function reassignJudge(string _caseId, address _judge) external",

    // Reads
    "function cases(string) view returns (string id, string linkedFirId, string title, string accused, string filer, uint8 status, address assignedJudge, uint256 creationDate, address defence, address prosecution, uint256 nextSessionId, string metaData, address assignedClerk)",
    "function getCaseSigners(string _caseId) view returns (address clerk, address judge, address defence, address prosecution)",
    "function getCaseProofLinks(string _caseId) view returns (string[])",

    // Events
    "event CaseCreated(string indexed caseId, string title, string linkedFirId)"
];

// --- Types ---
export interface CaseDetails {
    id: string;
    linkedFirId: string;
    title: string;
    accused: string;
    filer: string;
    status: number;
    assignedJudge: string;
    creationDate: string; // Formatted Date String
    defence: string;
    prosecution: string;
    metaData: string;
    assignedClerk: string;
}

export interface CaseParticipants {
    clerk: string;
    judge: string;
    defence: string;
    prosecution: string;
}

export interface CreateCaseResponse {
    txHash: string;
    caseId: string;
}

// --- Internal Helper ---
const getClerkContract = async (): Promise<ethers.Contract> => {
    if (!window.ethereum) throw new Error("No Wallet Found");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(COURT_ADDR, COURT_ABI, signer);
};

// --- API Functions ---

/**
 * Validates if a string is a valid Ethereum address
 */
const isValidEthereumAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Creates a new Court Case linked to an FIR with direct assignment of prosecution, defence, and judge
 * @param {string} caseId - Case ID (e.g. "CASE-2024-001")
 * @param {string} title - Case Title (e.g. "State vs John Doe")
 * @param {string} firIdString - The FIR ID String (e.g. "MH-2024-001")
 * @param {string} prosecutionAddress - The prosecution lawyer's address
 * @param {string} defenceAddress - The defence lawyer's address
 * @param {string} judgeAddress - The judge's address
 * @param {string} metaData - Additional JSON metadata
 */
export const clerkCreateCase = async (
    caseId: string,
    title: string, 
    firIdString: string,
    prosecutionAddress: string,
    defenceAddress: string,
    judgeAddress: string,
    metaData: string
): Promise<CreateCaseResponse> => {
    const contract = await getClerkContract();

    // Validate addresses to prevent ENS resolution
    if (!isValidEthereumAddress(prosecutionAddress)) {
        throw new Error("Invalid prosecution address format");
    }
    if (!isValidEthereumAddress(defenceAddress)) {
        throw new Error("Invalid defence address format");
    }
    if (!isValidEthereumAddress(judgeAddress)) {
        throw new Error("Invalid judge address format");
    }

    console.log(`Creating case ${caseId} linked to FIR ${firIdString} with direct assignments...`);

    // Contract call
    const tx = await contract.createCase(
        caseId, 
        title, 
        firIdString, 
        prosecutionAddress,
        defenceAddress,
        judgeAddress,
        metaData
    );
    console.log("Tx Sent:", tx.hash);

    const receipt = await tx.wait();

    // Parse Logs to find Case ID
    const event = receipt.logs
        .map((log: any) => {
            try { return contract.interface.parseLog(log); }
            catch (e) { return null; }
        })
        .find((parsed: any) => parsed && parsed.name === "CaseCreated");

    if (!event) throw new Error("CaseCreated event not found in receipt!");

    const newCaseId = event.args.caseId.toString();
    console.log(`Case Created! ID: ${newCaseId}`);

    return {
        txHash: tx.hash,
        caseId: newCaseId
    };
};

/**
 * Reassigns a lawyer to a specific case
 */
export const clerkReassignLawyer = async (
    caseId: string, 
    lawyerAddress: string, 
    role: string
): Promise<ethers.ContractTransactionReceipt | null> => {
    const contract = await getClerkContract();

    // Validate address to prevent ENS resolution
    if (!isValidEthereumAddress(lawyerAddress)) {
        throw new Error("Invalid lawyer address format");
    }

    const tx = await contract.reassignLawyer(
        caseId,
        lawyerAddress,
        role.toLowerCase()
    );
    console.log(`Reassigning ${role}... Tx: ${tx.hash}`);
    return await tx.wait();
};

/**
 * Reassigns a judge to a specific case
 */
export const clerkReassignJudge = async (
    caseId: string, 
    judgeAddress: string
): Promise<ethers.ContractTransactionReceipt | null> => {
    const contract = await getClerkContract();

    // Validate address to prevent ENS resolution
    if (!isValidEthereumAddress(judgeAddress)) {
        throw new Error("Invalid judge address format");
    }

    const tx = await contract.reassignJudge(caseId, judgeAddress);
    console.log(`Reassigning Judge... Tx: ${tx.hash}`);
    return await tx.wait();
};

/**
 * Fetches the participants (Clerk, Judge, Lawyers) for a case
 */
export const getCaseParticipants = async (caseId: string): Promise<CaseParticipants> => {
    const contract = await getClerkContract();

    // Call getCaseSigners
    // Ethers v6 returns a Result object (array-like) for multiple return values
    const signers = await contract.getCaseSigners(caseId);

    return {
        clerk: signers.clerk,
        judge: signers.judge,
        defence: signers.defence,
        prosecution: signers.prosecution
    };
};

/**
 * Fetches full details for a case
 */
export const getCaseDetails = async (caseId: string): Promise<CaseDetails> => {
    const contract = await getClerkContract();
    const c = await contract.cases(caseId);

    // Map the struct returned by ethers v6
    return {
        id: c.id.toString(),
        linkedFirId: c.linkedFirId, // String
        title: c.title,
        accused: c.accused,
        filer: c.filer,
        status: Number(c.status), // Enum to number
        assignedJudge: c.assignedJudge,
        // Convert BigInt timestamp to Date string
        creationDate: new Date(Number(c.creationDate) * 1000).toLocaleString(),
        defence: c.defence,
        prosecution: c.prosecution,
        metaData: c.metaData,
        assignedClerk: c.assignedClerk
    };
};

/**
 * Fetches proof links for a case
 */
export const getCaseProofLinks = async (caseId: string): Promise<string[]> => {
    const contract = await getClerkContract();
    const proofLinks = await contract.getCaseProofLinks(caseId);
    return Array.from(proofLinks);
};