import { query } from '../../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

export async function getVenues(req, res) {
  try {
    const { category, city, all } = req.query;
    let sql = `SELECT v.*,
      (SELECT COUNT(*) FROM venue_reviews vr WHERE vr.venue_id = v.id) AS review_count,
      (SELECT AVG(rating) FROM venue_reviews vr WHERE vr.venue_id = v.id) AS avg_rating
      FROM venues v`;
    const params = [];
    const conditions = [];
    if (all !== 'true') {
      conditions.push(`is_active = 1`);
    }
    if (city) { conditions.push(`city = ?`); params.push(city); }
    if (category) { conditions.push(`category = ?`); params.push(category); }
    if (conditions.length) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    sql += ` ORDER BY v.name ASC`;
    const result = await query(sql, params);
    res.json({ venues: result.rows || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getVenueById(req, res) {
  try {
    const { id } = req.params;
    const result = await query(`SELECT * FROM venues WHERE id = ?`, [id]);
    if (!result.rows || result.rows.length === 0) return res.status(404).json({ error: 'Venue not found' });
    const reviews = await query(
      `SELECT vr.*, u.display_name as reviewer_name FROM venue_reviews vr LEFT JOIN users u ON vr.user_id = u.id WHERE vr.venue_id = ? ORDER BY vr.created_at DESC`,
      [id]
    );
    const avg = await query(`SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM venue_reviews WHERE venue_id = ?`, [id]);
    res.json({
      venue: result.rows[0],
      reviews: reviews.rows || [],
      rating: {
        average: Math.round((avg.rows[0]?.avg_rating || 0) * 10) / 10,
        total: avg.rows[0]?.total || 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createVenue(req, res) {
  try {
    const { name, category, description, address, city, latitude, longitude, photo_urls, opening_hours, price_range, phone, website } = req.body;
    if (!name || !category || !city) return res.status(400).json({ error: 'name, category, and city are required' });
    const id = uuidv4();
    await query(
      `INSERT INTO venues (id, name, category, description, address, city, latitude, longitude, photo_urls, opening_hours, price_range, phone, website, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
      [id, name, category, description || null, address || null, city, latitude || null, longitude || null,
       JSON.stringify(photo_urls || []), opening_hours || null, price_range || null, phone || null, website || null]
    );
    res.status(201).json({ id, message: 'Venue created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateVenue(req, res) {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      description,
      address,
      city,
      latitude,
      longitude,
      photo_urls,
      opening_hours,
      price_range,
      phone,
      website,
      is_active,
    } = req.body;

    await query(
      `UPDATE venues SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        description = COALESCE(?, description),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        latitude = COALESCE(?, latitude),
        longitude = COALESCE(?, longitude),
        photo_urls = COALESCE(?, photo_urls),
        opening_hours = COALESCE(?, opening_hours),
        price_range = COALESCE(?, price_range),
        phone = COALESCE(?, phone),
        website = COALESCE(?, website),
        is_active = COALESCE(?, is_active),
        updated_at = datetime('now')
       WHERE id = ?`,
      [
        name || null,
        category || null,
        description || null,
        address || null,
        city || null,
        latitude ?? null,
        longitude ?? null,
        photo_urls ? JSON.stringify(photo_urls) : null,
        opening_hours || null,
        price_range || null,
        phone || null,
        website || null,
        typeof is_active === 'boolean' ? (is_active ? 1 : 0) : null,
        id,
      ]
    );

    const result = await query(`SELECT * FROM venues WHERE id = ?`, [id]);
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    res.json({ venue: result.rows[0], message: 'Venue updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteVenue(req, res) {
  try {
    const { id } = req.params;
    await query(`DELETE FROM venues WHERE id = ?`, [id]);
    res.json({ success: true, message: 'Venue deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function addVenueReview(req, res) {
  try {
    const { venue_id } = req.params;
    const { user_id, rating, review } = req.body;
    if (!user_id || !rating) return res.status(400).json({ error: 'user_id and rating are required' });
    const id = uuidv4();
    await query(
      `INSERT INTO venue_reviews (id, venue_id, user_id, rating, review, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [id, venue_id, user_id, rating, review || null]
    );
    res.status(201).json({ id, message: 'Review added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteVenueReview(req, res) {
  try {
    const { id } = req.params;
    await query(`DELETE FROM venue_reviews WHERE id = ?`, [id]);
    res.json({ success: true, message: 'Venue review deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function seedVenues(req, res) {
  try {
    const sampleVenues = [
      { name: 'Silverbird Cinemas', category: 'Cinema', description: 'Premier cinema experience with the latest blockbusters', address: 'Ahmadu Bello Way, Victoria Island', city: 'Lagos', price_range: '₦2,000 – ₦5,000', opening_hours: '10am – 11pm daily', photo_urls: ['https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800'] },
      { name: 'Eko Hotel Tennis Club', category: 'Tennis', description: 'Professional tennis courts with coaching available', address: 'Eko Hotel, Victoria Island', city: 'Lagos', price_range: '₦5,000/hour', opening_hours: '6am – 9pm daily', photo_urls: ['https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800'] },
      { name: 'Hard Rock Cafe Lagos', category: 'Bar', description: 'Iconic bar and restaurant with live music', address: '23 Ozumba Mbadiwe Ave, Victoria Island', city: 'Lagos', price_range: '₦5,000 – ₦20,000', opening_hours: '12pm – 2am daily', photo_urls: ['https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800'] },
      { name: 'Elegushi Beach', category: 'Beach', description: 'Popular private beach with bars and activities', address: 'Ikate, Lekki', city: 'Lagos', price_range: '₦1,000 entry', opening_hours: '8am – 10pm daily', photo_urls: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'] },
      { name: 'Snooker Palace Ikeja', category: 'Snooker', description: 'Top-class snooker tables in a relaxed setting', address: '14 Allen Avenue, Ikeja', city: 'Lagos', price_range: '₦1,500/hour', opening_hours: '12pm – 12am daily', photo_urls: ['https://images.unsplash.com/photo-1611116274987-1d4b7b7d3d1a?w=800'] },
      { name: 'Terra Kulture', category: 'Art Gallery', description: 'Art gallery, restaurant and cultural centre', address: 'Plot 1376 Tiamiyu Savage St, Victoria Island', city: 'Lagos', price_range: '₦2,000 – ₦10,000', opening_hours: '9am – 9pm daily', photo_urls: ['https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800'] },
      { name: 'Altitude Beach Club', category: 'Lounge', description: 'Rooftop lounge with stunning ocean views', address: 'Oniru, Victoria Island', city: 'Lagos', price_range: '₦10,000 – ₦50,000', opening_hours: '4pm – 4am Fri–Sun', photo_urls: ['https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800'] },
      { name: 'Ikoyi Club Gym', category: 'Gym', description: 'Full-equipped gym and fitness centre', address: 'Ikoyi Club, Lagos', city: 'Lagos', price_range: '₦3,000/day', opening_hours: '5am – 10pm daily', photo_urls: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800'] },
    ];

    for (const v of sampleVenues) {
      const existing = await query(`SELECT id FROM venues WHERE name = ? AND city = ?`, [v.name, v.city]);
      if (!existing.rows || existing.rows.length === 0) {
        await query(
          `INSERT INTO venues (id, name, category, description, address, city, photo_urls, opening_hours, price_range, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
          [uuidv4(), v.name, v.category, v.description, v.address, v.city, JSON.stringify(v.photo_urls), v.opening_hours, v.price_range]
        );
      }
    }
    res.json({ message: 'Venues seeded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
