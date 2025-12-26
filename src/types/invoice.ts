export interface Invoice {
  id: string;
  vendor: string;
  invoiceNumber: number;
  date: string;

  rawText?: string;

  extracted?: Record<string, any>;
  normalized?: Record<string, any>;
}
