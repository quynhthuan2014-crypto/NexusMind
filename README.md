# NexusMind

> Your local-first second brain for memories, ideas, decisions and project context.

NexusMind is a desktop memory workspace built with Electron. It helps you capture structured memories, search them locally, pin important context, import/export JSON, and ask a lightweight local assistant for relevant saved information.

## Features

- **Memory library** — create, edit, delete and pin memories.
- **Fast local search** — searches titles, content and tags with simple relevance scoring.
- **Context assistant** — ask questions and retrieve matching local memories without requiring an external model.
- **Import / export** — portable JSON backup format.
- **Local-first storage** — memory data is saved under Electron's application data directory.
- **Privacy by design** — no bundled API keys and no automatic upload of your memory store.
- **Secure Electron boundary** — `contextIsolation` enabled, `nodeIntegration` disabled and sandbox enabled.
- **Cross-platform packaging** — configuration for Windows NSIS, macOS DMG and Linux AppImage.

## Start

Requirements: Node.js 20+ and npm 10+.

```bash
npm install
npm test
npm run check
npm start
```

Create an installer with:

```bash
npm run dist
```

## Data model

A memory is stored as a small JSON object:

```json
{
  "id": "uuid",
  "title": "Project idea",
  "content": "A note worth remembering.",
  "tags": ["project", "idea"],
  "pinned": true,
  "createdAt": "2026-09-06T00:00:00.000Z",
  "updatedAt": "2026-09-06T00:00:00.000Z"
}
```

## Architecture

```text
Electron main process
  ├── local JSON memory store
  ├── import/export dialogs
  ├── system information
  └── secure preload bridge
           │
           ▼
Renderer
  ├── Overview
  ├── Memory library
  ├── Search
  ├── Ask Nexus
  └── Settings

Shared
  └── deterministic memory tokenizer / search / context builder
```

The optional external AI layer is deliberately not required for the app to be useful. A future provider can consume the context returned by the local memory layer while keeping the storage format stable.

## Development notes

The project avoids a UI framework and build bundler in the MVP to keep the dependency surface small and make repository verification straightforward. Electron loads the renderer directly from `renderer/index.html`.

## License

See `LICENSE`. The repository uses source-available terms rather than MIT.

## Security

See `SECURITY.md` before adding new tools, external integrations or model providers.
