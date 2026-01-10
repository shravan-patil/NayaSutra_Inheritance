export type CaseStatus = "pending" | "active" | "hearing" | "verdict_pending" | "closed" | "appealed";
export type EvidenceCategory = "document" | "video" | "audio" | "image" | "other";
export type RoleCategory = "judiciary" | "legal_practitioner" | "public_party";
export type EvidenceStatus = "draft" | "pending" | "signed" | "immutable";
export type EvidenceType = "forensic" | "cctv" | "witness" | "document" | "audio" | "other";

export interface Evidence {
  id: string;
  caseId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl?: string;
  thumbnailUrl?: string;
  type: EvidenceType;
  status: EvidenceStatus;
  uploadedBy: string;
  uploadedAt: string;
  hash?: string;
  signedBy?: string;
  signedAt?: string;
  signature?: string;
  hearingSessionId?: string;
}

export interface CustodyEvent {
  id: string;
  caseId: string;
  action: string;
  actor: string;
  timestamp: string;
  details: string;
  txHash?: string;
}

export interface AuthorizedPerson {
  id: string;
  name: string;
  role: string;
  department: string;
  govId: string;
  addedAt: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: RoleCategory;
  department?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Case {
  id: string;
  caseNumber: string;
  title: string;
  description?: string;
  status: CaseStatus;
  category: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  court?: string;
  judge?: string;
}
