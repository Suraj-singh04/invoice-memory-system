import { recallMemory } from "../engine/recall";
import { loadJSON } from "../data/loader";
import { Invoice } from "../types/invoice";

const invoices = loadJSON<any[]>("invoices_extracted.json");

const first = invoices[0];

const invoice: Invoice = {
  id: first.invoiceId,
  vendor: first.vendor,
  invoiceNumber: first.fields.invoiceNumber,
  date: first.fields.invoiceDate,
  rawText: first.rawText,
  extracted: first.fields,
};

const result = recallMemory(invoice);

console.log("Recalled Memories:", result);
