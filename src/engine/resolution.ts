import { MemoryStore } from "../memory/store";
import { loadJSON } from "../data/loader";
import { v4 as uuid } from "uuid";

interface HumanCorrection {
  invoiceId: string;
  field: string;
  approved: boolean;
}

export function processHumanResolutions() {
  const db = MemoryStore.load();
  const corrections = loadJSON<HumanCorrection[]>("human_corrections.json");

  for (const correction of corrections) {
    // Vendor memory resolution

    if (correction.field === "serviceDate") {
      const rule = db.vendors.find(
        (r) => r.key === "serviceDateFromLeistungsdatum"
      );

      if (!rule) continue;

      if (correction.approved) {
        rule.confidence = Math.min(1, rule.confidence + 0.1);

        db.resolutions.push({
          id: uuid(),
          context: `Vendor rule: serviceDateFromLeistungsdatum / invoice ${correction.invoiceId}`,
          result: "approved",
          confidence: rule.confidence,
          updatedAt: new Date().toISOString(),
        });
      } else {
        rule.confidence = Math.max(0, rule.confidence - 0.2);

        db.resolutions.push({
          id: uuid(),
          context: `Vendor rule: serviceDateFromLeistungsdatum / invoice ${correction.invoiceId}`,
          result: "rejected",
          confidence: rule.confidence,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Correction memory resolution

    if (correction.field === "taxTotal") {
      const rule = db.corrections.find((r) => r.pattern === "vat_included");

      if (!rule) continue;

      if (correction.approved) {
        rule.confidence = Math.min(1, rule.confidence + 0.1);

        db.resolutions.push({
          id: uuid(),
          context: `Correction rule: vat_included / invoice ${correction.invoiceId}`,
          result: "approved",
          confidence: rule.confidence,
          updatedAt: new Date().toISOString(),
        });
      } else {
        rule.confidence = Math.max(0, rule.confidence - 0.2);

        db.resolutions.push({
          id: uuid(),
          context: `Correction rule: vat_included / invoice ${correction.invoiceId}`,
          result: "rejected",
          confidence: rule.confidence,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  MemoryStore.save(db);
}
