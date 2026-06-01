// ============================================================
// Local JSON File-based Database Fallback
// Provides a zero-install database mode when PostgreSQL is offline
// ============================================================
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../../data');

// Ensure database directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

export const readTable = async (tableName) => {
  const filePath = path.join(DATA_DIR, `${tableName}.json`);
  if (!existsSync(filePath)) {
    return [];
  }
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content || '[]');
  } catch {
    return [];
  }
};

export const writeTable = async (tableName, data) => {
  const filePath = path.join(DATA_DIR, `${tableName}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

export const insertRow = async (tableName, row) => {
  const table = await readTable(tableName);
  const newRow = {
    id: row.id || crypto.randomUUID(),
    ...row,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString()
  };
  table.push(newRow);
  await writeTable(tableName, table);
  return newRow;
};

export const updateRow = async (tableName, id, updates) => {
  const table = await readTable(tableName);
  const idx = table.findIndex(r => r.id === id);
  if (idx === -1) return null;

  table[idx] = {
    ...table[idx],
    ...updates,
    updated_at: new Date().toISOString()
  };
  await writeTable(tableName, table);
  return table[idx];
};

export const deleteRow = async (tableName, id) => {
  const table = await readTable(tableName);
  const filtered = table.filter(r => r.id !== id);
  await writeTable(tableName, filtered);
  return true;
};
