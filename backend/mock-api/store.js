const fs = require('fs');
const path = require('path');

function createMemoryStore() {
  let records = [];
  let idSeq = 1;
  return {
    mode: 'memory',
    load() {},
    getRecords() { return records; },
    setRecords(next) { records = next; },
    nextId() { return idSeq++; },
    reset() { records = []; idSeq = 1; },
    info() { return { persisted: false, mode: 'memory' }; },
    persist() {},
  };
}

function createFileStore(dataFile) {
  const dataDir = path.dirname(dataFile);
  let records = [];
  let idSeq = 1;

  const ensureDir = () => {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  };

  const persist = () => {
    ensureDir();
    fs.writeFileSync(dataFile, JSON.stringify({ idSeq, records }, null, 2), 'utf8');
  };

  const load = () => {
    ensureDir();
    if (!fs.existsSync(dataFile)) return persist();
    try {
      const raw = fs.readFileSync(dataFile, 'utf8');
      const db = JSON.parse(raw || '{}');
      records = Array.isArray(db.records) ? db.records : [];
      idSeq = Number(db.idSeq || 1);
    } catch {
      records = [];
      idSeq = 1;
      persist();
    }
  };

  return {
    mode: 'file',
    load,
    getRecords() { return records; },
    setRecords(next) { records = next; },
    nextId() { return idSeq++; },
    reset() { records = []; idSeq = 1; persist(); },
    info() { return { persisted: true, mode: 'file', dataFile }; },
    persist,
  };
}

async function createStore({ mode, dataFile, dsn }) {
  if (mode === 'memory') return createMemoryStore();
  if (mode === 'mysql') {
    const { createMySQLStore } = require('./mysql-store');
    return createMySQLStore({ dsn });
  }
  return createFileStore(dataFile);
}

module.exports = { createStore };
