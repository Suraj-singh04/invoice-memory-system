export type Decision = "auto_apply" | "suggest" | "escalate";

export function decideFromConfidence(conf: number): Decision {
  if (conf >= 0.8) return "auto_apply";
  if (conf >= 0.4) return "suggest";
  return "escalate";
}
