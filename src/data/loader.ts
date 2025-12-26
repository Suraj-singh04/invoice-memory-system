import fs from "fs";
import path from "path";

export function loadJSON<T>(fileName: string): T {
  const filePath = path.join(__dirname, fileName);
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data) as T;
}
