import { MemoryStore } from "../memory/store";
import { Invoice } from "../types/invoice";
import { v4 as uuid } from "uuid";

export function applyAndLearn(invoice: Invoice) {
  console.log("RAW TEXT:", invoice.rawText);

  const db = MemoryStore.load();

  let normalized = { ...invoice.extracted };
  const proposedCorrections: string[] = [];
  const memoryUpdates: string[] = [];

  const vendorRule = db.vendors.find(
    (m) =>
      m.vendor === invoice.vendor && m.key === "serviceDateFromLeistungsdatum"
  );

  // Use memory first
  if (vendorRule && !normalized.serviceDate && invoice.rawText) {
    const match = invoice.rawText.match(
      /Leistungsdatum\s*[:\-]?\s*([\d./-]+)/i
    );

    if (match) {
      normalized.serviceDate = match[1];

      proposedCorrections.push(
        `serviceDate auto-filled using learned vendor memory (${match[1]})`
      );

      vendorRule.usageCount += 1;
      vendorRule.confidence = Math.min(1, vendorRule.confidence + 0.05);

      memoryUpdates.push(
        "Reinforced vendor memory: serviceDate from Leistungsdatum"
      );
    }
  }

  // Learn if memory does not exist yet
  if (!vendorRule && invoice.rawText?.includes("Leistungsdatum")) {
    const match = invoice.rawText.match(
      /Leistungsdatum\s*[:\-]?\s*([\d./-]+)/i
    );

    console.log("MATCH RESULT:", match);

    if (match && !normalized.serviceDate) {
      const learnedDate = match[1];

      normalized.serviceDate = learnedDate;

      proposedCorrections.push(
        `Inferred serviceDate as ${learnedDate} based on vendor rules.`
      );

      db.vendors.push({
        id: uuid(),
        vendor: "Supplier GmbH",
        key: "serviceDateFromLeistungsdatum",
        value: "map rawText to serviceDate",
        confidence: 0.6,
        usageCount: 1,
        updatedAt: new Date().toISOString(),
      });

      memoryUpdates.push(
        "Learned: Leistungsdatum → serviceDate for Supplier GmbH"
      );
    }
  }

  const vatText = (invoice.rawText || "").toLowerCase();

  const vatPatterns = [
    "vat already included",
    "prices incl. vat",
    "mwst. inkl",
  ];

  const vatIncluded = vatPatterns.some((p) => vatText.includes(p));

  // find existing correction rule
  const correctionRule = db.corrections.find(
    (c) => c.field === "taxTotal" && c.pattern === "vat_included"
  );

  if (vatIncluded) {
    const recomputedTax = Number(
      (normalized.netTotal * normalized.taxRate).toFixed(2)
    );

    const recomputedGross = Number(
      (normalized.netTotal + recomputedTax).toFixed(2)
    );

    normalized.taxTotal = recomputedTax;
    normalized.grossTotal = recomputedGross;

    proposedCorrections.push(
      "Adjusted totals because VAT is already included (VAT correction rule)"
    );

    if (!correctionRule) {
      db.corrections.push({
        id: uuid(),
        field: "taxTotal",
        pattern: "vat_included",
        correction: "recompute totals when VAT included text appears",
        source: "system",
        confidence: 0.6,
        usageCount: 1,
        updatedAt: new Date().toISOString(),
      });

      memoryUpdates.push("Learned VAT correction rule (Parts AG)");
    } else {
      correctionRule.usageCount += 1;
      correctionRule.confidence = Math.min(1, correctionRule.confidence + 0.05);

      memoryUpdates.push("Reinforced VAT correction rule");
    }
  }

  db.auditLog.push({
    step: "apply",
    timestamp: new Date().toISOString(),
    details: `Applied rules and proposed ${proposedCorrections.length} corrections.`,
  });

  MemoryStore.save(db);

  return {
    normalizedInvoice: normalized,
    proposedCorrections,
    memoryUpdates,
  };
}
