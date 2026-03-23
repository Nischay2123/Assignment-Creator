# 🧠 Agent Notes — AI Assessment Creator (Backend)

---

# 1. 🎯 Purpose of this Document

This document explains:

* System architecture
* Database design decisions
* Backend flow (end-to-end)
* Module responsibilities
* Tech stack usage
* Important trade-offs

👉 This is the **source of truth** for how the backend works.

---

# 2. 🧭 System Overview

AI Assessment Creator is a **configurable exam generation system**.

It allows a teacher to:

1. Define an **exam blueprint** (sections, difficulty, types)
2. Trigger AI-based generation
3. Receive structured output
4. Optionally download a PDF

---

# 3. 🏗️ High-Level Architecture

```
Frontend (Next.js)
        ↓
API Server (Express)
        ↓
BullMQ Queue (Redis)
        ↓
Worker (AI Generation)
        ↓
MongoDB (Store Result)
        ↓
WebSocket (Real-time Updates)
        ↓
PDF Worker (Optional)
        ↓
S3 (PDF Storage)
```

---

# 4. 🧱 Tech Stack (Why each is used)

| Tech                  | Purpose                   |
| --------------------- | ------------------------- |
| Node.js + Express     | API layer                 |
| MongoDB               | Persistent storage        |
| Redis                 | Queue + job state         |
| BullMQ                | Background job processing |
| WebSocket (Socket.io) | Real-time updates         |
| LLM (OpenAI/Claude)   | Question generation       |
| S3                    | PDF storage               |

---

# 5. 📦 Database Design

---

## 5.1 Assignment (Blueprint)

👉 Represents **user intent (input only)**

```
Assignment {
  _id

  title
  instructions
  dueDate

  sections: [
    {
      sectionId
      title
      instruction

      questionConfig: {
        type        // MCQ | SHORT | LONG
        count
        marksPerQuestion
        difficulty  // easy | medium | hard
      }
    }
  ]

  sourceMaterial? {
    type: "file" | "text"
    content
  }

  createdBy
  createdAt
  updatedAt
}
```

---

## 5.2 Generation (Execution + Output)

👉 Represents **AI execution + result**

```
Generation {
  _id

  assignmentId
  version

  status        // queued | processing | completed | failed

  result: {
    sections: [
      {
        sectionId
        title
        instruction

        questions: [
          {
            question
            type
            difficulty
            marks
            options?
          }
        ]
      }
    ]
  }

  pdfUrl
  pdfStatus     // pending | generated | failed

  prompt
  rawResponse
  error

  processingTimeMs

  createdAt
  completedAt
}
```

---

## 🔗 Relationship

```
Assignment (1) → (many) Generations
```

---

## 🧠 Key Design Decisions

### ✅ Embedded Questions (IMPORTANT)

* Questions are stored inside `Generation.result`
* Reason:

  * Faster reads
  * Simpler system
  * No reconstruction logic

---

### ❌ No Question Collection

* Avoid unnecessary normalization
* No reuse / analytics requirement currently

---

### ✅ Versioning

* Each regeneration = new Generation document
* Prevents overwriting

---

### ✅ Debug Layer (prompt + rawResponse)

* Helps debug AI issues
* Improves prompt iteration

---

# 6. 🔄 System Flow (End-to-End)

---

## Step 1: Create Assignment

```
POST /assignments
```

* Validate input
* Store in DB

---

## Step 2: Trigger Generation

```
POST /generations
```

* Create Generation (status = queued)
* Add job to BullMQ

---

## Step 3: Worker (AI Generation)

Worker executes:

1. Fetch Assignment
2. Build prompt
3. Call LLM
4. Parse JSON
5. Store result
6. Update status = completed

---

## Step 4: WebSocket Update

* Emit `generation:completed`
* Frontend updates UI

---

## Step 5: PDF Generation (Optional)

Separate job:

1. Take structured result
2. Generate PDF
3. Upload to S3
4. Save `pdfUrl`
5. Emit event

---

# 7. 🧩 Backend Modules

---

## assignment module

* Handles input
* Validation
* DB operations

---

## generation module

* Prompt builder
* AI integration
* Response parsing

---

## queue module

* Job producer
* Worker logic
* Retry handling

---

## websocket module

* Real-time communication
* Event emission

---

## pdf module

* PDF generation
* Upload to S3

---

# 8. ⚙️ Queue Design

---

## Queue Names

* `generation-queue`
* `pdf-queue`

---

## Jobs

### Generation Job

```
{ generationId }
```

---

### PDF Job

```
{ generationId }
```

---

## Retry Strategy

* Retry on failure (max 3)
* Exponential backoff

---

# 9. 🤖 AI Design

---

## Prompt Strategy

* Section-based
* Deterministic
* Strict JSON output

---

## Example Prompt

```
Generate question paper:

Section A:
- Type: MCQ
- Count: 5
- Difficulty: Medium

Return STRICT JSON only.
```

---

## Parsing Strategy

* Try JSON.parse
* Fallback cleanup
* Fail after retries

---

# 10. ⚠️ Edge Cases

* Invalid JSON from AI
* Partial sections
* Queue failure
* Redis disconnection
* WebSocket disconnect
* PDF failure

---

# 11. 🚀 Scaling Considerations

* Worker can scale horizontally
* Queue handles load
* DB reads optimized (embedded design)

---

# 12. 💡 Future Improvements

* Question analytics
* Difficulty balancing
* Multi-difficulty sections
* Question bank system
* Caching layer (Redis)

---

# 13. 🧠 Final Philosophy

This system prioritizes:

* Simplicity over premature optimization
* Async processing over blocking APIs
* Structured output over raw AI text

---

# 14. ✅ Summary

* Assignment = blueprint
* Generation = execution
* Queue = async processing
* Worker = AI + parsing
* WebSocket = real-time UX
* PDF = optional export layer

---

👉 This backend is designed to be:

* Clean
* Scalable
* Interview-ready
* Production-aligned
