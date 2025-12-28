# 🧠 Invoice Memory System — AI Learning Engine

> A lightweight, explainable “memory layer” for invoice processing — using JSON storage, confidence scores, and human feedback to continuously improve behavior without a database or heavy ML models.

## 📌 Goal

Modern invoice extraction systems often repeat mistakes:

- same vendor corrections every month  
- wrong tax calculations  
- manual reviews that never become reusable knowledge  

This project implements a memory system that:

✔ learns from past invoices  
✔ stores knowledge in JSON  
✔ uses confidence scoring  
✔ applies or escalates decisions safely  
✔ incorporates human approvals/rejections  

All implemented using simple, auditable TypeScript.

---

## 🏗 Architecture

Memory is stored in:

```
memory.json
```

It contains four key sections:

### 1️⃣ Vendor Memory

Learns vendor-specific normalization rules.

Example:

> “Leistungsdatum” → `serviceDate`

Stores:

- vendor
- key
- confidence
- usageCount
- last update timestamp

---

### 2️⃣ Correction Memory

Captures recurring business corrections.

Example:

> VAT already included → recompute totals

Structure:

```json
{
  "field": "taxTotal",
  "pattern": "vat_included",
  "correction": "recompute totals when VAT included text appears",
  "confidence": 0.6
}
```

---

### 3️⃣ Resolution Memory (Human Feedback)

Tracks what humans decided:

- approved
- rejected
- manual_review

This is used to reinforce or decay confidence.

---

### 4️⃣ Audit Log

Every important operation is logged so the system is explainable.

---

## 🧠 Decision Engine

Each rule has a **confidence value (0 — 1)**.

Confidence determines behavior:

| Confidence | Behavior |
|-----------:|----------|
| ≥ 0.8 | **AUTO APPLY** |
| 0.4 – 0.79 | **SUGGEST** |
| < 0.4 | **ESCALATE (human review)** |

This prevents unsafe automation.

---

## 🔁 Learning Loop

### ▶ First encounter
The system detects patterns and stores them with **initial confidence**.

Example:

Vendor rule learns:

```
Leistungsdatum → serviceDate
confidence: 0.6
```

---

### ▶ Repeated usage
Over time:

✔ Correct decisions increase confidence  
❌ Rejections decrease confidence  

In our demo:

- VAT rule reached **1.0 → always auto-applies**
- Vendor rule was repeatedly rejected → dropped to **0**, system escalates instead

This demonstrates **safe learning + unlearning**.

---

## ⚙️ Running the project

Install dependencies:

```bash
npm install
```

Run demo script:

```bash
npx ts-node src/demo/run-test.ts
```

This will:

✔ load invoices  
✔ apply memory  
✔ show learning behavior  
✔ print decisions

---

## 🧾 Example behaviors

### ✅ Auto-apply when trusted
```
AUTO — adjusted totals because VAT is already included
```

### ⚠ Escalate when uncertain
```
ESCALATE — vendor memory uncertain, requires human review
```

---

## 🧩 Tech Stack

- TypeScript
- Node.js
- JSON storage (no DB)
- Simple deterministic decision logic

No external ML or AI models — intentionally transparent.

---

## 🚀 Possible Future Enhancements

- duplicate invoice detection
- disable unreliable rules automatically
- dashboard to view & manage memory
- storing explanations to show why decisions happened
- sync memory to a database

---

## ✅ Summary

This project demonstrates:

✔ persistent memory  
✔ vendor intelligence  
✔ business rule learning  
✔ human feedback integration  
✔ confidence-driven automation  
✔ complete transparency  

This is designed to mimic how real production invoice systems gradually become smarter — while staying safe and explainable.
