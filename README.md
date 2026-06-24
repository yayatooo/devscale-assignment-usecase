# First Assignment Tasks — Devscale

Repository ini berisi implementasi beberapa basic LLM use case menggunakan TypeScript, Zod, OpenRouter, dan Anvia.

## Assignment Overview

![First Assignment Tasks](./docs/first-assignment.png)

| Task   | Case                                                                                           |
| ------ | ---------------------------------------------------------------------------------------------- |
| Task 1 | Customer menanyakan kemungkinan charge dua kali dan meminta perbaikan segera.                  |
| Task 2 | Menerima meeting transcript panjang dan perlu menghasilkan decisions, risks, dan action items. |
| Task 3 | User memberikan nama perusahaan dan meminta profil singkat beserta website dan industrinya.    |

---

## Tech Stack

* TypeScript
* Node.js
* Zod
* OpenRouter
* Anvia Core
* Anvia OpenAI Provider

---

# Task 1 — Billing Support Routing

**File:** `src/usecase-01.ts`

### Problem

Customer mengirim pesan:

> “Why was I charged twice? Please fix it now.”

AI tidak boleh langsung menyimpulkan bahwa customer benar-benar terkena duplicate charge, menjanjikan refund, atau menyalahkan payment provider.

Sistem perlu menentukan informasi apa yang kurang sebelum memberi jawaban.

### Use Case Method

**Prompt Routing + Structured Extraction**

### Why This Method?

Pesan customer perlu diklasifikasikan terlebih dahulu agar diarahkan ke support agent yang sesuai, seperti:

* `billing`
* `technical`
* `general`

Setelah intent terdeteksi, AI juga mengekstrak informasi penting untuk menentukan langkah berikutnya, seperti:

* tingkat keyakinan klasifikasi
* urgency
* apakah informasi sudah cukup
* informasi transaksi yang masih dibutuhkan
* recommended next step

### Flow

```txt
Customer Message
→ Intent Router
→ Structured Output with Zod
→ Billing Prompt Selection
→ User-Friendly Clarification Response
```

### Example Router Output

```ts
{
  intent: "billing",
  confidence: 0.98,
  urgency: "high",
  hasEnoughContext: false,
  missingInformation: [
    "order_id",
    "transaction_reference",
    "charge_amount",
    "charge_date",
    "transaction_status",
  ],
  suggestedNextStep: "request_transaction_verification",
}
```

### Expected Behavior

AI tidak langsung menjawab penyebab charge dua kali.

Sebagai gantinya, AI meminta data minimum yang dibutuhkan untuk investigasi, seperti Order ID, nominal charge, tanggal transaksi, dan status transaksi.

---

# Task 2 — Meeting Transcript Analysis

**File:** `src/usecase-02.ts`

### Problem

Sistem menerima meeting transcript yang panjang dan perlu menghasilkan informasi yang mudah ditindaklanjuti, meliputi:

* meeting summary
* confirmed decisions
* risks and blockers
* unresolved questions
* action items
* owner dan deadline apabila disebutkan

### Use Case Method

**Plan and Execute + Streaming Output**

### Why This Method?

Transcript panjang lebih aman diproses dalam beberapa langkah daripada meminta satu prompt besar langsung menghasilkan semua output.

Model pertama membuat rencana analisis. Setelah itu, setiap step dieksekusi menggunakan transcript yang sama sebagai context. Terakhir, hasil setiap step digabungkan menjadi final meeting outcome.

Streaming digunakan pada tahap final agar hasil dapat ditampilkan secara bertahap kepada user.

### Flow

```txt
Meeting Transcript
→ Create Analysis Plan
→ Execute Each Analysis Step
→ Collect Step Outputs
→ Combine Results
→ Stream Final Meeting Outcome
```

### Example Plan

```txt
1. Identify the meeting topic and overall context
2. Extract confirmed decisions
3. Identify risks, blockers, and unresolved questions
4. Extract action items, owners, and deadlines
5. Combine findings into a final meeting outcome
```

### Expected Output Format

```txt
1. Meeting Summary
2. Decisions
3. Risks and Blockers
4. Unresolved Questions
5. Action Items
```

### Important Rules

* Do not invent decisions.
* Do not invent action owners.
* Do not invent deadlines.
* Use `not specified` when owner or deadline is not mentioned in the transcript.
* Remove duplicate information during final aggregation.

---

# Task 3 — Company Profile Lookup

**File:** `src/usecase-03.ts`

### Problem

User memberikan nama perusahaan dan meminta informasi singkat seperti:

* company name
* company profile
* website
* industry

Contoh input:

```txt
PT Astra International Tbk
```

### Use Case Method

**Context Injection + Extraction Pipeline**

### Why This Method?

Model tidak boleh mengarang website, industri, atau informasi perusahaan.

Sistem perlu memperoleh informasi perusahaan dari sumber data terlebih dahulu, lalu memasukkan data tersebut sebagai context ke model. Setelah itu, model mengekstrak informasi ke format yang konsisten menggunakan schema.

### Flow

```txt
Company Name
→ Retrieve Company Information
→ Inject Retrieved Context
→ Extract Structured Company Profile
→ Return Clean User Response
```

### Example Output Schema

```ts
{
  companyName: string,
  shortProfile: string,
  website: string,
  industry: string,
  confidence: number,
}
```

### Important Rules

* Only use company information available in the provided context.
* Do not invent a website.
* Do not guess the industry when the source is unclear.
* Return `not found` or `not specified` when information is unavailable.

---

# Key Learning Outcomes

Melalui assignment ini, saya mempelajari beberapa fundamental LLM use case:

| Use Case              | Main Purpose                                                               |
| --------------------- | -------------------------------------------------------------------------- |
| Prompt Routing        | Mengarahkan user request ke prompt atau agent yang tepat.                  |
| Structured Extraction | Mengubah natural language menjadi object yang tervalidasi oleh Zod.        |
| Plan and Execute      | Memecah task kompleks menjadi beberapa langkah kecil.                      |
| Context Injection     | Memberikan context eksternal agar model tidak menjawab berdasarkan asumsi. |
| Streaming             | Menampilkan output model secara bertahap.                                  |

---

# Running Locally

Install dependency:

```bash
pnpm install
```

Create `.env`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
TAVILY_API_KEY=your_tavaly_api_key
```

Run a specific use case:

```bash
pnpm tsx src/usecase-01.ts
```

Or run in watch mode:

```bash
pnpm tsx watch src/usecase-01.ts
```

Run TypeScript type checking:

```bash
pnpm tsc --noEmit
```
