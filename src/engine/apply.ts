import { MemoryStore } from "../memory/store";
import { Invoice } from "../types/invoice";
import { decideFromConfidence } from "./decide";
import { v4 as uuid } from "uuid";

export function applyAndLearn(invoice: Invoice) {
  console.log("RAW TEXT:", invoice.rawText);

  const db = MemoryStore.load();

  let normalized = { ...invoice.extracted };
  const proposedCorrections: string[] = [];
  const memoryUpdates: string[] = [];

  // ============================================
  // 1️⃣ VENDOR MEMORY — serviceDate
  // ============================================

  const vendorRule = db.vendors.find(
    (m) =>
      m.vendor === invoice.vendor && m.key === "serviceDateFromLeistungsdatum"
  );

  if (vendorRule && invoice.rawText) {
    const decision = decideFromConfidence(vendorRule.confidence);

    const match = invoice.rawText.match(
      /Leistungsdatum\s*[:\-]?\s*([\d./-]+)/i
    );

    if (match) {
      const learnedDate = match[1];

      if (decision === "auto_apply" && !normalized.serviceDate) {
        normalized.serviceDate = learnedDate;

        proposedCorrections.push(
          `AUTO — serviceDate set using vendor memory (${learnedDate})`
        );

        vendorRule.usageCount += 1;
        vendorRule.confidence = Math.min(1, vendorRule.confidence + 0.05);

        memoryUpdates.push(
          "Reinforced vendor memory: serviceDate from Leistungsdatum"
        );
      }

      if (decision === "suggest" && !normalized.serviceDate) {
        proposedCorrections.push(
          `SUGGEST — serviceDate may be ${learnedDate} (low confidence vendor rule)`
        );
      }

      if (decision === "escalate") {
        proposedCorrections.push(
          "ESCALATE — vendor memory uncertain, requires human review"
        );
      }
    }
  }

  // Learn new vendor rule if not exists
  if (!vendorRule && invoice.rawText?.includes("Leistungsdatum")) {
    const match = invoice.rawText.match(
      /Leistungsdatum\s*[:\-]?\s*([\d./-]+)/i
    );

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

  // ============================================
  // 2️⃣ VAT CORRECTION MEMORY — decision engine
  // ============================================

  const vatText = (invoice.rawText || "").toLowerCase();

  const vatIncluded = [
    "vat already included",
    "prices incl. vat",
    "mwst. inkl",
  ].some((p) => vatText.includes(p));

  const correctionRule = db.corrections.find(
    (c) => c.field === "taxTotal" && c.pattern === "vat_included"
  );

  if (vatIncluded) {
    const decision = decideFromConfidence(
      correctionRule ? correctionRule.confidence : 0.6
    );

    const recomputedTax = Number(
      (normalized.netTotal * normalized.taxRate).toFixed(2)
    );
    const recomputedGross = Number(
      (normalized.netTotal + recomputedTax).toFixed(2)
    );

    if (decision === "auto_apply") {
      normalized.taxTotal = recomputedTax;
      normalized.grossTotal = recomputedGross;

      proposedCorrections.push(
        "AUTO — adjusted totals because VAT is already included"
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
        correctionRule.confidence = Math.min(
          1,
          correctionRule.confidence + 0.05
        );

        memoryUpdates.push("Reinforced VAT correction rule");
      }
    }

    if (decision === "suggest") {
      proposedCorrections.push(
        "SUGGEST — VAT appears included, recommend adjusting totals"
      );
    }

    if (decision === "escalate") {
      proposedCorrections.push(
        "ESCALATE — VAT rule uncertain, requires human review"
      );
    }
  }

  // ============================================
  // AUDIT + SAVE
  // ============================================

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
