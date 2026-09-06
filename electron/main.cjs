const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');

let mainWindow;

function dataPath() {
  return path.join(app.getPath('userData'), 'memories.json');
}

async function readMemories() {
  try {
    const raw = await fs.readFile(dataPath(), 'utf8');
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

async function writeMemories(memories) {
  await fs.mkdir(path.dirname(dataPath()), { recursive: true });
  const temp = `${dataPath()}.tmp`;
  await fs.writeFile(temp, JSON.stringify(memories, null, 2), 'utf8');
  await fs.rename(temp, dataPath());
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 680,
    backgroundColor: '#070a12',
    title: 'NexusMind',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });
  mainWindow.removeMenu();
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
}

ipcMain.handle('memory:list', () => readMemories());

ipcMain.handle('memory:save', async (_event, input) => {
  if (!input || typeof input.content !== 'string' || !input.content.trim()) {
    return { ok: false, message: 'Memory content cannot be empty.' };
  }
  const memories = await readMemories();
  const now = new Date().toISOString();
  const record = {
    id: input.id || crypto.randomUUID(),
    title: typeof input.title === 'string' && input.title.trim() ? input.title.trim().slice(0, 160) : 'Untitled memory',
    content: input.content.trim().slice(0, 20000),
    tags: Array.isArray(input.tags) ? input.tags.filter((tag) => typeof tag === 'string').slice(0, 12) : [],
    pinned: Boolean(input.pinned),
    createdAt: input.createdAt || now,
    updatedAt: now
  };
  const index = memories.findIndex((item) => item.id === record.id);
  if (index >= 0) memories[index] = record; else memories.unshift(record);
  await writeMemories(memories);
  return { ok: true, data: record };
});

ipcMain.handle('memory:delete', async (_event, id) => {
  if (typeof id !== 'string') return { ok: false, message: 'Invalid memory id.' };
  const memories = await readMemories();
  const next = memories.filter((item) => item.id !== id);
  await writeMemories(next);
  return { ok: true, removed: memories.length - next.length };
});

ipcMain.handle('memory:clear', async () => {
  await writeMemories([]);
  return { ok: true };
});

ipcMain.handle('memory:export', async (_event, memories) => {
  const result = await dialog.showSaveDialog({
    title: 'Export NexusMind memories',
    defaultPath: 'nexusmind-memories.json',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (result.canceled || !result.filePath) return { ok: false, canceled: true };
  const safe = Array.isArray(memories) ? memories : await readMemories();
  await fs.writeFile(result.filePath, JSON.stringify(safe, null, 2), 'utf8');
  return { ok: true, path: result.filePath };
});

ipcMain.handle('memory:import', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Import NexusMind memories',
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (result.canceled || !result.filePaths[0]) return { ok: false, canceled: true };
  try {
    const parsed = JSON.parse(await fs.readFile(result.filePaths[0], 'utf8'));
    if (!Array.isArray(parsed)) throw new Error('The file must contain a JSON array.');
    const existing = await readMemories();
    const known = new Set(existing.map((item) => item.id));
    const incoming = parsed.filter((item) => item && typeof item === 'object' && typeof item.content === 'string')
      .map((item) => ({
        id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
        title: typeof item.title === 'string' ? item.title.slice(0, 160) : 'Imported memory',
        content: item.content.slice(0, 20000),
        tags: Array.isArray(item.tags) ? item.tags.filter((tag) => typeof tag === 'string').slice(0, 12) : [],
        pinned: Boolean(item.pinned),
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    const merged = [...incoming.filter((item) => !known.has(item.id)), ...existing];
    await writeMemories(merged);
    return { ok: true, count: incoming.filter((item) => !known.has(item.id)).length };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Import failed.' };
  }
});

ipcMain.handle('system:info', () => ({
  platform: process.platform,
  arch: process.arch,
  release: os.release(),
  memoryGB: Math.round(os.totalmem() / 1024 / 1024 / 1024),
  appVersion: app.getVersion()
}));

ipcMain.handle('open-external', async (_event, url) => {
  if (typeof url !== 'string') return { ok: false };
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return { ok: false };
    await shell.openExternal(parsed.toString());
    return { ok: true };
  } catch {
    return { ok: false };
  }
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
