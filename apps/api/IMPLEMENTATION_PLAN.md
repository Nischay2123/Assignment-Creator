# Assignment And Generation Implementation Plan

## Goal

Add backend support for:

- creating and reading assignment blueprints
- creating and reading generation runs
- preserving a modular file layout that matches the existing `user` module
- logging generation requests instead of enqueueing background jobs for now

## Module Structure

Follow the existing API pattern:

```text
apps/api/src/modules/assignment/
  assignment.model.ts
  assignment.validation.ts
  assignment.service.ts
  assignment.controller.ts
  assignment.routes.ts

apps/api/src/modules/generation/
  generation.model.ts
  generation.validation.ts
  generation.service.ts
  generation.controller.ts
  generation.routes.ts
```

Shared interfaces live in:

```text
apps/api/src/common/types/assignment.types.ts
apps/api/src/common/types/generation.types.ts
```

## Assignment Scope

`Assignment` stores the blueprint only:

- `title`
- `instructions`
- `dueDate`
- `sections`
- optional `sourceMaterial`
- timestamps

Endpoints:

- `POST /api/assignments`
- `GET /api/assignments`
- `GET /api/assignments/:id`

## Generation Scope

`Generation` stores execution metadata and output:

- `assignmentId`
- `version`
- `status`
- optional `result`
- optional `prompt`
- optional `rawResponse`
- optional `error`
- `pdfStatus`
- optional `processingTimeMs`
- optional `completedAt`
- timestamps

Endpoints:

- `POST /api/generations`
- `GET /api/generations`
- `GET /api/generations/:id`

## Current Queue Placeholder

For now, `POST /api/generations` will:

1. validate the assignment exists
2. compute the next generation version
3. create a generation record with `status = queued`
4. log the job payload and metadata through the shared logger

This keeps the API contract ready for BullMQ later without introducing Redis yet.

## Next Phase

When queue support is added later:

1. replace the log call with a queue producer
2. add a worker that updates generation status
3. populate `result`, `rawResponse`, and `completedAt`
4. add WebSocket updates if real-time status is needed
