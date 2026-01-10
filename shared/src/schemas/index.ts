import { z } from "zod";

export const CaseSchema = z.object({
  id: z.string().uuid().optional(),
  caseNumber: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["pending", "active", "hearing", "verdict_pending", "closed", "appealed"]),
  category: z.string(),
  createdBy: z.string(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  court: z.string().optional(),
  judge: z.string().optional(),
});

export const EvidenceSchema = z.object({
  id: z.string().uuid().optional(),
  caseId: z.string().uuid(),
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number().positive(),
  fileUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  type: z.enum(["forensic", "cctv", "witness", "document", "audio", "other"]),
  status: z.enum(["draft", "pending", "signed", "immutable"]),
  uploadedBy: z.string().uuid(),
  uploadedAt: z.string().datetime(),
  hash: z.string().optional(),
  signedBy: z.string().uuid().optional(),
  signedAt: z.string().datetime().optional(),
  signature: z.string().optional(),
});

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["judiciary", "legal_practitioner", "public_party"]),
  department: z.string().optional(),
  avatar: z.string().url().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CaseInput = z.infer<typeof CaseSchema>;
export type EvidenceInput = z.infer<typeof EvidenceSchema>;
export type ProfileInput = z.infer<typeof ProfileSchema>;
