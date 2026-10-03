# Solvanta Node.js SDK

Official Node.js / TypeScript SDK for the [Solvanta](https://solvanta.dev) solver platform.

## Install

```bash
npm install solvanta
```

## Quick Start

```typescript
import { Solvanta, Tasks } from "solvanta";

const client = new Solvanta("sk_...");

// Solve a ReCaptcha V3
const result = await client.solve(Tasks.ReCaptchaV3, {
  url: "https://example.com",
  sitekey: "6Le...",
  action: "login",
});

console.log(result.id);           // solve UUID
console.log(result.result.token); // captcha token
console.log(result.credits_used); // credits charged
```

## Usage

### Create a Client

```typescript
import { Solvanta } from "solvanta";

const client = new Solvanta("sk_...");

// With options
const client = new Solvanta("sk_...", {
  baseUrl: "https://custom-endpoint.example.com",
  timeout: 60_000,
});
```

### Solve

```typescript
// ReCaptcha V2
const res = await client.solve("ReCaptchaV2Task", {
  url: "https://example.com",
  sitekey: "6Le...",
  invisible: false,
});

// Cloudflare
const res = await client.solve("CloudflareTask", {
  url: "https://example.com",
  proxy: "http://user:pass@host:port",
});

// Arkose / FunCaptcha
const res = await client.solve("ArkoseTask", {
  url: "https://example.com",
  sitekey: "pk_...",
});

// With idempotency key (safe retries)
const res = await client.solve(
  "ReCaptchaV3Task",
  { url: "https://example.com", sitekey: "6Le..." },
  { idempotencyKey: "req_abc123" },
);
```

### Retrieve a Solve

```typescript
const solve = await client.getSolve("uuid-here");
console.log(solve.status); // "solved" | "processing" | "failed"
```

### List Solve History

```typescript
const history = await client.listSolves(50);
for (const solve of history.solves) {
  console.log(solve.id, solve.task, solve.status);
}
```

### Discover Services

```typescript
const catalog = await client.services();
for (const svc of catalog.services) {
  console.log(svc.task, svc.credits, svc.configured ? "ready" : "offline");
}
```

### Dashboard

```typescript
const dash = await client.dashboard();
console.log(`Balance: ${dash.balance} credits`);
console.log(`Total solves: ${dash.total_solves}`);
```

## Typed Results

Import task-specific result types for full IntelliSense:

```typescript
import type { ReCaptchaResult, CloudflareResult } from "solvanta";

const res = await client.solve<ReCaptchaResult>("ReCaptchaV3Task", {
  url: "https://example.com",
  sitekey: "6Le...",
});

// res.result is typed as ReCaptchaResult
console.log(res.result?.token);
```

Available result types: `ReCaptchaResult`, `CloudflareResult`, `ArkoseResult`, `ForterResult`, `Metadata1Result`.

## Task Constants

Use the `Tasks` enum for autocomplete:

```typescript
import { Tasks } from "solvanta";

Tasks.ReCaptchaV2           // "ReCaptchaV2Task"
Tasks.ReCaptchaV2Enterprise // "ReCaptchaV2EnterpriseTask"
Tasks.ReCaptchaV3           // "ReCaptchaV3Task"
Tasks.ReCaptchaV3Enterprise // "ReCaptchaV3EnterpriseTask"
Tasks.Cloudflare            // "CloudflareTask"
Tasks.Arkose                // "ArkoseTask"
Tasks.Forter                // "ForterTask"
Tasks.NuData                // "NuDataTask"
Tasks.ThreatMetrix          // "ThreatMetrixTask"
Tasks.UeMsm                 // "UeMsmTask"
Tasks.Metadata1             // "Metadata1Task"
```

## Error Handling

```typescript
import { Solvanta, SolvantaError } from "solvanta";

try {
  await client.solve("ReCaptchaV3Task", { url: "...", sitekey: "..." });
} catch (err) {
  if (err instanceof SolvantaError) {
    console.error(err.code);       // "insufficient_credits"
    console.error(err.message);    // human-readable message
    console.error(err.statusCode); // 402
  }
}
```

## Requirements

- Node.js 18+ (uses native `fetch`)
- Zero external dependencies
