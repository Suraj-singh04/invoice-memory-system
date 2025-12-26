import fs from "fs";
import path from "path";
import {
  VendorMemory,
  CorrectionMemory,
  ResolutionMemory,
  AuditLogEntry,
} from "../types/memory.js";

const DB_PATH = path.join(__dirname, "../../memory.json");

interface MemoryDB {
  vendors: VendorMemory[];
  corrections: CorrectionMemory[];
  resolutions: ResolutionMemory[];
  auditLog: AuditLogEntry[];
}
function loadDB(): MemoryDB {
  if (!fs.existsSync(DB_PATH)) {
    const empty: MemoryDB = {
      vendors: [],
      corrections: [],
      resolutions: [],
      auditLog: [],
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(empty, null, 2));
    return empty;
  }
  const data = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(data) as MemoryDB;
}

function saveDB(db: MemoryDB) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export const MemoryStore = {
  load: loadDB,
  save: saveDB,
};
