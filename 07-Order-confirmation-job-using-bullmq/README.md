# ⚡ BullMQ — Quick Revision Guide

> Production-ready job queue for Node.js, built on top of Redis.

---

## What is BullMQ?

BullMQ is a Node.js library that gives you everything raw Redis queuing is missing:

| Raw Redis | BullMQ |
|---|---|
| Manual LPUSH/BRPOP | `queue.add()` — automatic |
| No retries | ✅ Built-in retries with backoff |
| No delayed jobs | ✅ One option away |
| No priority | ✅ Built-in |
| No job status | ✅ Automatic tracking |
| No dashboard | ✅ Bull Board UI |
| No cron jobs | ✅ Built-in |

> BullMQ is just a smarter wrapper around the raw Redis List concepts you already know.

---

## The Three Core Files

Every BullMQ project has exactly three pieces:

```
queue.js   → defines the queue + Redis connection (shared by both)
api.js     → producer — adds jobs to the queue
worker.js  → consumer — processes jobs from the queue
```

They never talk to each other directly. **Redis is always the middleman.**

```
api.js  ──→  Redis Queue  ──→  worker.js
(adds)          ↑               (processes)
            queue.js
          (defines both)
```

---

## queue.js — The Foundation

```js
import { Queue } from 'bullmq';

const connection = {
    host: 'localhost',
    port: 6379,
};

const emailQueue = new Queue('emails', { connection });

export { emailQueue, connection };
```

### What it does
- Creates one Queue instance
- Defines the Redis connection
- Exports both so api.js and worker.js can import from one place

### Why a separate file?
If you define the queue inline in api.js, your worker has no way to import the same connection. One file = one source of truth for both.

---

## api.js — The Producer

```js
import express from 'express';
import { emailQueue } from './queue.js';

const app = express();
app.use(express.json());

app.post("/welcome-email", async(req, res) => {
    const job = await emailQueue.add(
        "send-welcome-email",       // job name
        {                           // job data
            to: req.body.to,
            name: req.body.name || "Learner"
        },
        {                           // job options
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 1000         // 1s → 2s → 4s between retries
            }
        }
    )
    res.json({ msg: "Welcome email job added to queue" })
})

app.listen(3000, () => console.log("running on port 3000"));
```

### The three arguments to queue.add()

| Argument | What it is | Example |
|---|---|---|
| Job name | A label for the job type | `"send-welcome-email"` |
| Job data | Payload the worker needs | `{ to, name }` |
| Options | How BullMQ handles this job | `attempts`, `backoff` |

### Key point
`res.json()` fires **immediately** after the job is pushed to Redis. The user doesn't wait for the email. The worker handles it in the background.

### attempts + backoff explained
```
attempts: 3     → try this job 3 times before marking as failed
backoff:
  type: exponential
  delay: 1000   → wait 1s before retry 1, 2s before retry 2, 4s before retry 3
```
Gives failing external services (email APIs) time to recover before retrying.

---

## worker.js — The Consumer

```js
import { Worker } from "bullmq";
import { connection } from "./queue.js";

const emailWorker = new Worker(
    "emails",                    // must match Queue name EXACTLY
    async(job) => {
        // your business logic goes here
        console.log("processing", job.id, job.name, job.data);

        await new Promise((resolve) => setTimeout(resolve, 1500)); // simulate work

        console.log("done", job.id, job.name, job.data);
    },
    { connection }
)

emailWorker.on("completed", (job) => {
    console.log("Job completed!", job.id, job.name, job.data);
})

emailWorker.on("failed", (job, err) => {
    console.log("Job failed!", job.id, err.message);
})
```

### The three arguments to new Worker()

| Argument | What it is |
|---|---|
| Queue name | Must match the Queue name in queue.js exactly |
| Processor function | Your actual logic — BullMQ calls this per job |
| Options | `{ connection }` — which Redis to watch |

### The job object inside processor

| Property | What it contains |
|---|---|
| `job.id` | Auto-incremented number BullMQ assigns |
| `job.name` | The label passed in queue.add() |
| `job.data` | The payload passed in queue.add() |

### Processor vs Event Listeners

```
Processor function   → WHERE you do the work
Event listeners      → WHERE you react to the outcome
```

- Processor completes without error → job marked `completed` → `completed` event fires
- Processor throws an error → job retried → after all attempts exhausted → `failed` event fires

### The queue name must match EXACTLY
```
new Queue("emails", ...)        // producer
new Worker("emails", ...)       // consumer ✅ watches the right list

new Queue("emails", ...)        // producer
new Worker("email", ...)        // consumer ❌ watches wrong list, never picks up jobs
```

---

## Job Lifecycle

Every job passes through these states:

```
queue.add() called
      ↓
  waiting      ← sitting in Redis, not picked up yet
      ↓
  active       ← worker picked it up, processor running now
      ↓
  completed ✅ ← processor finished without throwing

  OR

  failed ❌    ← processor threw an error
      ↓
  retrying     ← BullMQ waits (backoff delay) and tries again
      ↓
  failed ❌❌❌ ← all attempts exhausted
      ↓
  dead letter  ← stored in failed jobs, inspect manually
```

---

## How to Run

Always two separate terminals:

```bash
# Terminal 1 — your API
node src/api.js

# Terminal 2 — your worker (runs forever)
node src/worker.js
```

They run independently. Worker stays alive 24/7 waiting for jobs. API adds jobs whenever requests come in.

---

## Common Bugs to Watch For

| Bug | Symptom | Fix |
|---|---|---|
| `job,id` instead of `job.id` | ReferenceError → job fails 3 times | Change comma to dot |
| Missing `await` on `queue.add()` | Job may not be added before response fires | Always await queue.add() |
| Worker queue name doesn't match | Worker runs but never picks up jobs | Must be identical string |
| Mixed import/module.exports | SyntaxError on startup | Use only `export {}` with ES Modules |
| Empty import `import { } from` | connection is undefined in worker | Import `{ connection }` from queue.js |

---

## Mental Model — Reconstruct Any Time

```
Step 1 → queue.js
         Create Queue, define connection, export both

Step 2 → api.js
         Import emailQueue
         Inside route → await queue.add(name, data, options)
         Respond immediately — don't wait for job to finish

Step 3 → worker.js
         Import connection
         new Worker(same queue name, processor fn, { connection })
         Processor = your actual logic
         Event listeners = react to completed / failed
```

---

## What BullMQ Does Internally

You never write this — BullMQ handles it automatically:

```
Worker internally runs:
  BRPOP "emails"        ← blocks until a job arrives
  job arrives
  calls your processor function
  job succeeds → marks completed in Redis
  job fails    → waits backoff delay → retries
  all retries exhausted → moves to failed list
```

The raw Redis concepts you already learned — LPUSH, BRPOP, Lists — are exactly what BullMQ uses under the hood.

---

*Covers: What is BullMQ · queue.js · api.js · worker.js · Job lifecycle · queue.add() arguments · Processor vs events · Common bugs · How to run*