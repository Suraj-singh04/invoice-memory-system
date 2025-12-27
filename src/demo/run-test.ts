import { loadJSON } from "../data/loader";
import { Invoice } from "../types/invoice";
import { applyAndLearn } from "../engine/apply";
import { processHumanResolutions } from "../engine/resolution";

const invoices = loadJSON<any[]>("invoices_extracted.json");

for (const inv of invoices) {
  console.log("\n================================");
  console.log("Processing:", inv.invoiceId);

  const invoice: Invoice = {
    id: inv.invoiceId,
    vendor: inv.vendor,
    invoiceNumber: inv.fields.invoiceNumber,
    date: inv.fields.invoiceDate,
    rawText: inv.rawText,
    extracted: inv.fields,
  };

  const result = applyAndLearn(invoice);

  console.log(JSON.stringify(result, null, 2));
}
console.log("\nProcessing human resolutions...");
processHumanResolutions();
console.log("Done.");