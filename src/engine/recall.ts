import { MemoryStore } from "../memory/store";
import { Invoice } from "../types/invoice";

export function recallMemory(invoice: Invoice) {
  const db = MemoryStore.load();

  // Example: Recall vendor memory
  const vendorMemories = db.vendors.filter(
    (vm) => vm.vendor === invoice.vendor
  );

  MemoryStore.save({
    ...db,
    auditLog: [
      ...db.auditLog,
      {
        step: "recall",
        timestamp: new Date().toISOString(),
        details: `Recalled ${vendorMemories.length} vendor memories for ${invoice.vendor}`,
      },
    ],
  });

  return { vendorMemories };
}
