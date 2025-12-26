export type MemoryConfidence = number; // 0 to 1

export interface VendorMemory {
  id: string;
  vendor: string;
  key: string;
  value: string;
  confidence: MemoryConfidence;
  usageCount: number;
  updatedAt: string;
}

export interface CorrectionMemory {
  id: string;
  field: string;
  pattern: string;
  correction: string;
  confidence: MemoryConfidence;
  usageCount: number;
  updatedAt: string;
}

export interface ResolutionMemory {
  id: string;
  context: string;
  result: "approved" | "rejected" | "manual_review";
  confidence: MemoryConfidence;
  updatedAt: string;
}

export interface AuditLogEntry {
  step: "recall" | "apply" | "decide" | "learn";
  timestamp: string;
  details: string;
}
