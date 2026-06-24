import { query } from '../../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

function parsePayload(value) {
  if (value == null) return {};
  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function normalizeItem(row) {
  return {
    id: row.id,
    item_type: row.item_type,
    title: row.title,
    summary: row.summary,
    severity: row.severity,
    status: row.status,
    payload: parsePayload(row.payload),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function toItemType(value) {
  return String(value || '').trim().toLowerCase();
}

function toText(value, fallback = '') {
  if (typeof value === 'string') return value;
  if (value == null) return fallback;
  return String(value);
}

function safeInteger(value, fallback = 100) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function getAdminDashboardItems(req, res) {
  try {
    const { type } = req.query;
    const limit = safeInteger(req.query.limit, 100);
    const offset = Math.max(0, Number.parseInt(String(req.query.offset ?? '0'), 10) || 0);
    const params = [];
    const conditions = [];

    let sql = 'SELECT * FROM admin_dashboard_items';

    if (type) {
      conditions.push('item_type = ?');
      params.push(toItemType(type));
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ' ORDER BY updated_at DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await query(sql, params);
    res.json({
      items: (result.rows || []).map(normalizeItem),
      total: (result.rows || []).length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createAdminDashboardItem(req, res) {
  try {
    const itemType = toItemType(req.body.item_type || req.body.itemType);
    const title = toText(req.body.title).trim();
    const summary = toText(req.body.summary, '').trim();
    const severity = toText(req.body.severity || req.body.status || 'standard').trim() || 'standard';
    const status = toText(req.body.status || 'open').trim() || 'open';
    const payload = req.body.payload ?? req.body;

    if (!itemType) {
      return res.status(400).json({ error: 'item_type is required' });
    }

    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await query(
      `INSERT INTO admin_dashboard_items (id, item_type, title, summary, severity, status, payload, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, itemType, title, summary || null, severity, status, JSON.stringify(payload), now, now]
    );

    const result = await query('SELECT * FROM admin_dashboard_items WHERE id = ?', [id]);
    res.status(201).json({
      item: normalizeItem(result.rows[0]),
      message: 'Dashboard item created',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateAdminDashboardItem(req, res) {
  try {
    const { itemId } = req.params;
    const existing = await query('SELECT * FROM admin_dashboard_items WHERE id = ?', [itemId]);

    if (!existing.rows || existing.rows.length === 0) {
      return res.status(404).json({ error: 'Dashboard item not found' });
    }

    const current = existing.rows[0];
    const nextPayload = req.body.payload ?? parsePayload(current.payload);
    const nextType = toItemType(req.body.item_type || req.body.itemType || current.item_type);
    const nextTitle = toText(req.body.title, current.title).trim() || current.title;
    const nextSummary = toText(req.body.summary, current.summary || '').trim();
    const nextSeverity = toText(req.body.severity || current.severity || 'standard').trim() || 'standard';
    const nextStatus = toText(req.body.status || current.status || 'open').trim() || 'open';
    const now = new Date().toISOString();

    await query(
      `UPDATE admin_dashboard_items
       SET item_type = ?, title = ?, summary = ?, severity = ?, status = ?, payload = ?, updated_at = ?
       WHERE id = ?`,
      [nextType, nextTitle, nextSummary || null, nextSeverity, nextStatus, JSON.stringify(nextPayload), now, itemId]
    );

    const result = await query('SELECT * FROM admin_dashboard_items WHERE id = ?', [itemId]);
    res.json({
      item: normalizeItem(result.rows[0]),
      message: 'Dashboard item updated',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteAdminDashboardItem(req, res) {
  try {
    const { itemId } = req.params;
    const result = await query('DELETE FROM admin_dashboard_items WHERE id = ?', [itemId]);

    if (!result.changes) {
      return res.status(404).json({ error: 'Dashboard item not found' });
    }

    res.json({ success: true, message: 'Dashboard item deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
