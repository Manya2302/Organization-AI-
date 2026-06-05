import pool from './connection.js';

export async function migrateWorkflows() {
  console.log('Running compliance workflows table migration...');
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // compliance_workflows table
    await client.query(`
      CREATE TABLE IF NOT EXISTS compliance_workflows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        control_id UUID REFERENCES compliance_controls(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'Draft',
        deadline TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // workflow_steps table
    await client.query(`
      CREATE TABLE IF NOT EXISTS workflow_steps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        workflow_id UUID REFERENCES compliance_workflows(id) ON DELETE CASCADE,
        step_name VARCHAR(255) NOT NULL,
        assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // workflow_approvals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS workflow_approvals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        workflow_id UUID REFERENCES compliance_workflows(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        is_approved BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // workflow_comments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS workflow_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        workflow_id UUID REFERENCES compliance_workflows(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        comment_text TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query('COMMIT');
    console.log('Compliance workflows table migration complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Compliance workflows table migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}
