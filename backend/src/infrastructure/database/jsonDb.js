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
import bcrypt from 'bcryptjs';

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

export const seedLocalJSONDbIfEmpty = async () => {
  const users = await readTable('users');
  if (users.length > 0) return;

  // Import dynamically to avoid circular/premature imports
  const { logger } = await import('../logging/logger.js');
  logger.info('🌱 Seeding Local JSON Database with default credentials...');
  
  const orgId = "acme-tech-org-uuid";
  const orgs = [
    {
      id: orgId,
      name: 'Acme Tech Solutions Pvt. Ltd.',
      slug: 'acme-tech-solutions',
      company_type: 'Private Limited',
      industry: 'Technology',
      company_email: 'admin@acmetech.com',
      contact_number: '+91 98765 43210',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      number_of_employees: '50-100',
      is_active: true,
      subscription_plan: 'community',
      max_storage_gb: 10,
      max_users: 50,
      settings: {}
    }
  ];
  await writeTable('organizations', orgs);

  const defaultHash = await bcrypt.hash('SecureVault@2025', 12);
  const superAdminHash = await bcrypt.hash('admin@123', 12);

  const demoUsers = [
    {
      id: "super-admin-uuid",
      organization_id: orgId,
      employee_id: 'EMP000',
      name: 'Manya Parikh',
      email: 'manyaparikh23@gmail.com',
      password_hash: superAdminHash,
      role: 'SuperAdmin',
      department: null,
      designation: 'System Architect',
      is_active: true,
      is_verified: true,
      joining_date: new Date().toISOString(),
      skills: ['Security', 'Cloud']
    },
    {
      id: "ent-admin-uuid",
      organization_id: orgId,
      employee_id: 'EMP001',
      name: 'Alok Sharma',
      email: 'alok@acmetech.com',
      password_hash: defaultHash,
      role: 'EnterpriseAdmin',
      department: null,
      designation: 'Director of Technology',
      is_active: true,
      is_verified: true,
      joining_date: new Date().toISOString(),
      skills: ['Management', 'Cloud Security']
    },
    {
      id: "dept-mgr-uuid",
      organization_id: orgId,
      employee_id: 'EMP002',
      name: 'Priya Patel',
      email: 'priya@acmetech.com',
      password_hash: defaultHash,
      role: 'DepartmentManager',
      department: 'Legal',
      designation: 'Lead Legal Counsel',
      is_active: true,
      is_verified: true,
      joining_date: new Date().toISOString(),
      skills: ['Contract Law', 'Compliance']
    },
    {
      id: "employee-1-uuid",
      organization_id: orgId,
      employee_id: 'EMP003',
      name: 'Rohan Verma',
      email: 'rohan@acmetech.com',
      password_hash: defaultHash,
      role: 'Employee',
      department: 'Finance',
      designation: 'Senior Accountant',
      is_active: true,
      is_verified: true,
      joining_date: new Date().toISOString(),
      skills: ['Taxation', 'Excel', 'Audit']
    },
    {
      id: "employee-2-uuid",
      organization_id: orgId,
      employee_id: 'EMP004',
      name: 'Neha Gupta',
      email: 'neha@acmetech.com',
      password_hash: defaultHash,
      role: 'Employee',
      department: 'HR',
      designation: 'Talent Acquisition',
      is_active: true,
      is_verified: true,
      joining_date: new Date().toISOString(),
      skills: ['Recruiting', 'Onboarding']
    }
  ];
  await writeTable('users', demoUsers);
  
  // Seed model registry
  const models = [
    { id: 'm-1', model_name: 'Qwen3 8B', provider: 'ollama', version: 'latest', model_type: 'llm', status: 'available', supports_embeddings: true, supports_chat: true, supports_summary: true, supports_classification: true, active: true },
    { id: 'm-2', model_name: 'DeepSeek R1', provider: 'ollama', version: 'latest', model_type: 'llm', status: 'available', supports_embeddings: false, supports_chat: true, supports_summary: true, supports_classification: false, active: false }
  ];
  await writeTable('ai_models', models);

  logger.info('  ✅ Local JSON Database seeded successfully.');
};
