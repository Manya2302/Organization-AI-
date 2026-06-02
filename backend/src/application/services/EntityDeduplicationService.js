import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

export class EntityDeduplicationService {
  // Built-in canonical rules fallback map
  static get canonicalRules() {
    return {
      'Department': {
        'human resources': 'Human Resources',
        'hr': 'Human Resources',
        'human resource department': 'Human Resources',
        'legal & compliance': 'Legal',
        'legal department': 'Legal',
        'legal': 'Legal',
        'finance & accounts': 'Finance',
        'finance': 'Finance',
        'accounts': 'Finance',
        'r&d': 'Research & Development',
        'research & development': 'Research & Development',
        'engineering': 'Engineering',
        'it': 'Engineering',
        'tech': 'Engineering'
      },
      'Policy': {
        'infosec policy': 'Information Security Policy',
        'information security policy': 'Information Security Policy',
        'isMS policy': 'Information Security Policy',
        'nda': 'Non-Disclosure Agreement Policy',
        'non-disclosure agreement': 'Non-Disclosure Agreement Policy',
        'privacy': 'Privacy Policy',
        'privacy policy': 'Privacy Policy',
        'gdpr policy': 'Privacy Policy'
      },
      'Vendor': {
        'microsoft corp': 'Microsoft',
        'msft': 'Microsoft',
        'microsoft': 'Microsoft',
        'amazon web services': 'Amazon Web Services',
        'aws': 'Amazon Web Services',
        'google cloud': 'Google Cloud Platform',
        'gcp': 'Google Cloud Platform',
        'google cloud platform': 'Google Cloud Platform'
      }
    };
  }

  static async normalizeAndRegister(organizationId, entityType, rawName) {
    if (!rawName || typeof rawName !== 'string') return rawName;
    const cleanRaw = rawName.trim();
    const cleanRawLower = cleanRaw.toLowerCase();

    // 1. Check database registry first
    try {
      const dbEntries = await query(
        `SELECT canonical_name, aliases FROM entity_deduplication_registry 
         WHERE organization_id = $1 AND entity_type = $2`,
        [organizationId, entityType]
      );

      for (const row of dbEntries.rows) {
        // If it matches canonical name directly
        if (row.canonical_name.toLowerCase() === cleanRawLower) {
          return row.canonical_name;
        }
        // If it is in the aliases array
        const aliases = Array.isArray(row.aliases) ? row.aliases : [];
        if (aliases.some(alias => alias.toLowerCase() === cleanRawLower)) {
          return row.canonical_name;
        }
      }

      // 2. Check build-in hardcoded rules
      const rules = this.canonicalRules[entityType];
      if (rules && rules[cleanRawLower]) {
        const canonical = rules[cleanRawLower];
        // Register it in the database registry
        await this.registerEntity(organizationId, entityType, canonical, cleanRaw);
        return canonical;
      }

      // 3. Fallback: register rawName as its own canonical name
      await this.registerEntity(organizationId, entityType, cleanRaw, cleanRaw);
      return cleanRaw;
    } catch (err) {
      logger.error('Error normalizing entity name:', err);
      return rawName;
    }
  }

  static async registerEntity(orgId, type, canonical, alias) {
    try {
      // Find existing
      const checkRes = await query(
        `SELECT id, aliases FROM entity_deduplication_registry 
         WHERE organization_id = $1 AND entity_type = $2 AND canonical_name = $3`,
        [orgId, type, canonical]
      );

      if (checkRes.rows.length > 0) {
        const row = checkRes.rows[0];
        const aliases = new Set(row.aliases || []);
        if (alias && alias !== canonical) {
          aliases.add(alias);
          await query(
            `UPDATE entity_deduplication_registry 
             SET aliases = $1, confidence_score = 0.95, updated_at = NOW() 
             WHERE id = $2`,
            [JSON.stringify(Array.from(aliases)), row.id]
          );
        }
        return row.id;
      } else {
        const aliases = alias && alias !== canonical ? [alias] : [];
        const res = await query(
          `INSERT INTO entity_deduplication_registry 
           (organization_id, entity_type, canonical_name, aliases, confidence_score)
           VALUES ($1, $2, $3, $4, 1.00)
           RETURNING id`,
          [orgId, type, canonical, JSON.stringify(aliases)]
        );
        return res.rows[0].id;
      }
    } catch (err) {
      logger.error('Error registering entity in registry:', err);
    }
  }

  static async getDeduplicatedRegistry(organizationId) {
    const res = await query(
      `SELECT * FROM entity_deduplication_registry 
       WHERE organization_id = $1 
       ORDER BY entity_type, canonical_name`,
      [organizationId]
    );
    return res.rows;
  }
}
