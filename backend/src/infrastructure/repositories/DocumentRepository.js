// ============================================================
// Infrastructure: Document Repository (PostgreSQL + JSON Fallback)
// ============================================================
import { query, withTransaction, isLocalJSONDb } from '../database/connection.js';
import { readTable, writeTable, insertRow, updateRow } from '../database/jsonDb.js';
import { Document, DocumentVersion } from '../../core/entities/Document.js';
import crypto from 'crypto';

export class DocumentRepository {
  // Find all documents for an organization
  async findByOrganization(organizationId, filters = {}) {
    if (isLocalJSONDb) {
      const documents = await readTable('documents');
      const users = await readTable('users');

      let filtered = documents.filter(d => d.organization_id === organizationId);

      const isDeletedVal = filters.isDeleted !== undefined ? filters.isDeleted : false;
      filtered = filtered.filter(d => d.is_deleted === isDeletedVal);

      if (filters.category) {
        filtered = filtered.filter(d => d.category === filters.category);
      }
      if (filters.department) {
        filtered = filtered.filter(d => d.department === filters.department);
      }
      if (filters.ownerId) {
        filtered = filtered.filter(d => d.owner_id === filters.ownerId);
      }
      if (filters.ocrStatus) {
        filtered = filtered.filter(d => d.ocr_status === filters.ocrStatus);
      }

      if (filters.search) {
        const term = filters.search.toLowerCase();
        filtered = filtered.filter(d =>
          (d.name && d.name.toLowerCase().includes(term)) ||
          (d.description && d.description.toLowerCase().includes(term)) ||
          (d.ocr_text && d.ocr_text.toLowerCase().includes(term))
        );
      }

      // Sort by created_at DESC
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Limit and Offset
      let results = filtered;
      if (filters.offset !== undefined && filters.limit !== undefined) {
        results = filtered.slice(filters.offset, filters.offset + filters.limit);
      } else if (filters.limit !== undefined) {
        results = filtered.slice(0, filters.limit);
      }

      return results.map(row => {
        const u = users.find(user => user.id === row.owner_id);
        return new Document({
          ...row,
          uploaded_by: u ? u.name : null,
          uploader_employee_id: u ? u.employee_id : null
        });
      });
    }

    let sql = `
      SELECT d.*, 
             u.name as uploaded_by,
             u.employee_id as uploader_employee_id
      FROM documents d
      LEFT JOIN users u ON d.owner_id = u.id
      WHERE d.organization_id = $1
    `;
    const params = [organizationId];
    let idx = 2;

    if (filters.isDeleted !== undefined) {
      sql += ` AND d.is_deleted = $${idx++}`;
      params.push(filters.isDeleted);
    } else {
      sql += ` AND d.is_deleted = FALSE`;
    }

    if (filters.category) {
      sql += ` AND d.category = $${idx++}`;
      params.push(filters.category);
    }
    if (filters.department) {
      sql += ` AND d.department = $${idx++}`;
      params.push(filters.department);
    }
    if (filters.ownerId) {
      sql += ` AND d.owner_id = $${idx++}`;
      params.push(filters.ownerId);
    }
    if (filters.ocrStatus) {
      sql += ` AND d.ocr_status = $${idx++}`;
      params.push(filters.ocrStatus);
    }

    // Full-text search
    if (filters.search) {
      sql += ` AND (d.name ILIKE $${idx} OR d.description ILIKE $${idx} OR d.ocr_text ILIKE $${idx})`;
      params.push(`%${filters.search}%`);
      idx++;
    }

    sql += ' ORDER BY d.created_at DESC';

    if (filters.limit) {
      sql += ` LIMIT $${idx++}`;
      params.push(filters.limit);
    }
    if (filters.offset) {
      sql += ` OFFSET $${idx++}`;
      params.push(filters.offset);
    }

    const result = await query(sql, params);
    return result.rows.map(row => new Document(row));
  }

  // Full-text search
  async fullTextSearch(organizationId, searchTerm) {
    if (isLocalJSONDb) {
      return this.findByOrganization(organizationId, { search: searchTerm });
    }
    const result = await query(
      `SELECT d.*, u.name as uploaded_by,
              ts_rank(to_tsvector('english', coalesce(d.name,'') || ' ' || coalesce(d.ocr_text,'') || ' ' || coalesce(d.description,'')),
                      plainto_tsquery('english', $2)) as rank
       FROM documents d
       LEFT JOIN users u ON d.owner_id = u.id
       WHERE d.organization_id = $1
         AND d.is_deleted = FALSE
         AND to_tsvector('english', coalesce(d.name,'') || ' ' || coalesce(d.ocr_text,'') || ' ' || coalesce(d.description,''))
             @@ plainto_tsquery('english', $2)
       ORDER BY rank DESC
       LIMIT 20`,
      [organizationId, searchTerm]
    );
    return result.rows.map(row => new Document(row));
  }

  // Find by ID (with versions)
  async findById(id, organizationId = null) {
    if (isLocalJSONDb) {
      const documents = await readTable('documents');
      const users = await readTable('users');
      let docData = documents.find(d => d.id === id);
      if (organizationId && docData && docData.organization_id !== organizationId) {
        return null;
      }
      if (!docData) return null;

      const u = users.find(user => user.id === docData.owner_id);
      const doc = new Document({
        ...docData,
        uploaded_by: u ? u.name : null
      });
      doc.versions = await this.getVersions(id);
      return doc;
    }

    let sql = `
      SELECT d.*, u.name as uploaded_by FROM documents d
      LEFT JOIN users u ON d.owner_id = u.id
      WHERE d.id = $1
    `;
    const params = [id];
    if (organizationId) {
      sql += ' AND d.organization_id = $2';
      params.push(organizationId);
    }

    const result = await query(sql, params);
    if (!result.rows[0]) return null;

    const doc = new Document(result.rows[0]);
    doc.versions = await this.getVersions(id);
    return doc;
  }

  // Get document versions
  async getVersions(documentId) {
    if (isLocalJSONDb) {
      const versions = await readTable('document_versions');
      const users = await readTable('users');
      const filtered = versions.filter(v => v.document_id === documentId);
      filtered.sort((a, b) => b.version_number - a.version_number);
      return filtered.map(row => {
        const u = users.find(user => user.id === row.uploaded_by);
        return new DocumentVersion({
          ...row,
          uploaded_by: u ? u.name : null
        });
      });
    }

    const result = await query(
      `SELECT dv.*, u.name as uploaded_by
       FROM document_versions dv
       LEFT JOIN users u ON dv.uploaded_by = u.id
       WHERE dv.document_id = $1
       ORDER BY dv.version_number DESC`,
      [documentId]
    );
    return result.rows.map(row => new DocumentVersion(row));
  }

  // Create a new document record
  async create(documentData) {
    if (isLocalJSONDb) {
      const docId = crypto.randomUUID();
      const docRow = {
        id: docId,
        organization_id: documentData.organizationId,
        owner_id: documentData.ownerId,
        name: documentData.name,
        original_filename: documentData.originalFilename,
        file_path: documentData.filePath,
        file_size: parseInt(documentData.fileSize),
        file_type: documentData.fileType || 'unknown',
        mime_type: documentData.mimeType || 'application/octet-stream',
        category: documentData.category || 'General',
        department: documentData.department || null,
        tags: documentData.tags || [],
        description: documentData.description || null,
        version: 1,
        ocr_status: 'pending',
        ocr_text: null,
        ocr_word_count: null,
        vector_indexed: false,
        is_deleted: false
      };

      const doc = await insertRow('documents', docRow);

      await insertRow('document_versions', {
        document_id: docId,
        version_number: 1,
        file_name: documentData.originalFilename,
        file_path: documentData.filePath,
        file_size: parseInt(documentData.fileSize),
        uploaded_by: documentData.ownerId
      });

      await insertRow('ocr_queue', {
        document_id: docId,
        organization_id: documentData.organizationId,
        status: 'queued'
      });

      return new Document(doc);
    }

    return await withTransaction(async (client) => {
      // Insert document
      const docResult = await client.query(
        `INSERT INTO documents (
          organization_id, owner_id, name, original_filename, file_path, file_size,
          file_type, mime_type, category, department, tags, description, version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          documentData.organizationId,
          documentData.ownerId,
          documentData.name,
          documentData.originalFilename,
          documentData.filePath,
          documentData.fileSize,
          documentData.fileType || 'unknown',
          documentData.mimeType || 'application/octet-stream',
          documentData.category || 'General',
          documentData.department || null,
          JSON.stringify(documentData.tags || []),
          documentData.description || null,
          1
        ]
      );

      const doc = docResult.rows[0];

      // Create initial version entry
      await client.query(
        `INSERT INTO document_versions (document_id, version_number, file_name, file_path, file_size, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [doc.id, 1, documentData.originalFilename, documentData.filePath, documentData.fileSize, documentData.ownerId]
      );

      // Queue for OCR processing
      await client.query(
        `INSERT INTO ocr_queue (document_id, organization_id, status) VALUES ($1, $2, 'queued')`,
        [doc.id, documentData.organizationId]
      );

      return new Document(doc);
    });
  }

  // Add new version to document
  async addVersion(documentId, versionData, organizationId) {
    if (isLocalJSONDb) {
      const documents = await readTable('documents');
      const docIdx = documents.findIndex(d => d.id === documentId);
      if (docIdx === -1) throw new Error('Document not found');

      const nextVersion = (documents[docIdx].version || 1) + 1;

      // Update doc
      documents[docIdx] = {
        ...documents[docIdx],
        name: versionData.fileName,
        original_filename: versionData.fileName,
        file_path: versionData.filePath,
        file_size: parseInt(versionData.fileSize),
        version: nextVersion,
        ocr_status: 'pending',
        updated_at: new Date().toISOString()
      };
      await writeTable('documents', documents);

      // Insert version
      await insertRow('document_versions', {
        document_id: documentId,
        version_number: nextVersion,
        file_name: versionData.fileName,
        file_path: versionData.filePath,
        file_size: parseInt(versionData.fileSize),
        uploaded_by: versionData.uploadedBy,
        change_notes: versionData.changeNotes || null
      });

      // Re-queue OCR
      const queue = await readTable('ocr_queue');
      const qIdx = queue.findIndex(q => q.document_id === documentId);
      if (qIdx !== -1) {
        queue[qIdx].status = 'queued';
        queue[qIdx].updated_at = new Date().toISOString();
        await writeTable('ocr_queue', queue);
      } else {
        await insertRow('ocr_queue', {
          document_id: documentId,
          organization_id: organizationId,
          status: 'queued'
        });
      }

      return new Document(documents[docIdx]);
    }

    return await withTransaction(async (client) => {
      // Get current version number
      const docResult = await client.query('SELECT version FROM documents WHERE id = $1', [documentId]);
      if (!docResult.rows[0]) throw new Error('Document not found');
      const nextVersion = docResult.rows[0].version + 1;

      // Update document record
      const updatedDoc = await client.query(
        `UPDATE documents SET
           name = $2, original_filename = $2, file_path = $3, file_size = $4,
           version = $5, ocr_status = 'pending', updated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [documentId, versionData.fileName, versionData.filePath, versionData.fileSize, nextVersion]
      );

      // Insert version record
      await client.query(
        `INSERT INTO document_versions (document_id, version_number, file_name, file_path, file_size, uploaded_by, change_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [documentId, nextVersion, versionData.fileName, versionData.filePath, versionData.fileSize, versionData.uploadedBy, versionData.changeNotes || null]
      );

      // Re-queue OCR
      await client.query(
        `INSERT INTO ocr_queue (document_id, organization_id, status) VALUES ($1, $2, 'queued')
         ON CONFLICT DO NOTHING`,
        [documentId, organizationId]
      );

      return new Document(updatedDoc.rows[0]);
    });
  }

  // Update OCR result
  async updateOCR(documentId, ocrText, wordCount) {
    if (isLocalJSONDb) {
      await updateRow('documents', documentId, {
        ocr_text: ocrText,
        ocr_word_count: wordCount,
        ocr_status: 'completed'
      });

      const queue = await readTable('ocr_queue');
      const qIdx = queue.findIndex(q => q.document_id === documentId);
      if (qIdx !== -1) {
        queue[qIdx].status = 'completed';
        queue[qIdx].completed_at = new Date().toISOString();
        await writeTable('ocr_queue', queue);
      }
      return;
    }

    await query(
      `UPDATE documents SET ocr_text = $2, ocr_word_count = $3, ocr_status = 'completed', updated_at = NOW()
       WHERE id = $1`,
      [documentId, ocrText, wordCount]
    );
    await query(
      `UPDATE ocr_queue SET status = 'completed', completed_at = NOW() WHERE document_id = $1`,
      [documentId]
    );
  }

  // Soft delete
  async softDelete(id, deletedBy) {
    if (isLocalJSONDb) {
      await updateRow('documents', id, {
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy
      });
      return;
    }
    await query(
      `UPDATE documents SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = $2, updated_at = NOW()
       WHERE id = $1`,
      [id, deletedBy]
    );
  }

  // Restore from trash
  async restore(id) {
    if (isLocalJSONDb) {
      await updateRow('documents', id, {
        is_deleted: false,
        deleted_at: null,
        deleted_by: null
      });
      return;
    }
    await query(
      `UPDATE documents SET is_deleted = FALSE, deleted_at = NULL, deleted_by = NULL, updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
  }

  // Update vector index status
  async markVectorIndexed(documentId, chromaDocId) {
    if (isLocalJSONDb) {
      await updateRow('documents', documentId, {
        vector_indexed: true,
        chroma_doc_id: chromaDocId
      });
      return;
    }
    await query(
      `UPDATE documents SET vector_indexed = TRUE, chroma_doc_id = $2, updated_at = NOW()
       WHERE id = $1`,
      [documentId, chromaDocId]
    );
  }

  // Analytics: count by category
  async getStorageStats(organizationId) {
    if (isLocalJSONDb) {
      const documents = await readTable('documents');
      const filtered = documents.filter(d => d.organization_id === organizationId && d.is_deleted === false);

      const statsMap = {};
      for (const doc of filtered) {
        const key = `${doc.category || 'General'}_${doc.department || ''}`;
        if (!statsMap[key]) {
          statsMap[key] = {
            category: doc.category || 'General',
            doc_count: 0,
            total_bytes: 0,
            department: doc.department || null
          };
        }
        statsMap[key].doc_count += 1;
        statsMap[key].total_bytes += parseInt(doc.file_size || 0);
      }

      return Object.values(statsMap).sort((a, b) => b.total_bytes - a.total_bytes);
    }

    const result = await query(
      `SELECT 
         category,
         COUNT(*) as doc_count,
         SUM(file_size) as total_bytes,
         department
       FROM documents
       WHERE organization_id = $1 AND is_deleted = FALSE
       GROUP BY category, department
       ORDER BY total_bytes DESC`,
      [organizationId]
    );
    return result.rows;
  }

  // Get upload activity per day
  async getUploadActivity(organizationId, days = 7) {
    if (isLocalJSONDb) {
      const documents = await readTable('documents');
      const filtered = documents.filter(d => d.organization_id === organizationId && d.is_deleted === false);

      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - days);

      const activityMap = {};
      for (const doc of filtered) {
        const createdDate = new Date(doc.created_at);
        if (createdDate >= limitDate) {
          const dateStr = createdDate.toISOString().split('T')[0];
          activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
        }
      }

      return Object.entries(activityMap).map(([date, count]) => ({
        date,
        count
      })).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    const result = await query(
      `SELECT 
         DATE(created_at) as date,
         COUNT(*) as count
       FROM documents
       WHERE organization_id = $1 
         AND created_at >= NOW() - INTERVAL '${days} days'
         AND is_deleted = FALSE
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [organizationId]
    );
    return result.rows;
  }
}

export default new DocumentRepository();

