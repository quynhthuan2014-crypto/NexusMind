# Security

NexusMind is intentionally local-first. The MVP does not ship API credentials and does not execute arbitrary shell commands from memory text.

## Electron boundary

The renderer runs with `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: true`. The preload exposes only the small memory/system API required by the UI.

## External links

The main process accepts only `http:` and `https:` URLs and opens them through Electron's explicit external-link API.

## Memory imports

Imported JSON is validated as an array of memory-like records, content is bounded, and unknown fields are ignored when records are normalized.

## Reporting

Please open a private security report through the repository's available GitHub security features when a vulnerability could expose local data or permit unintended code execution. Do not publish secrets, API keys or private files in an issue.
