import db from '../../db/init.js';
import { v4 as uuid } from 'uuid';

// Create a check-in record for an event
async function checkIntoEvent(req, res) {
  try {
    const { eventId, userLocationLat, userLocationLon, eventLocationLat, eventLocationLon, distanceFromEvent } = req.body;
    const userId = req.userId;

    if (!eventId || userLocationLat === undefined || userLocationLon === undefined) {
      return res.status(400).json({ error: 'Missing required check-in data' });
    }

    // Verify user is attending the event
    db.get(
      `SELECT * FROM event_applications 
       WHERE event_id = ? AND user_id = ? AND status IN ('accepted', 'pending')`,
      [eventId, userId],
      (err, application) => {
        if (err || !application) {
          return res.status(403).json({ error: 'You must be attending this event to check in' });
        }

        const checkInId = uuid();
        db.run(
          `INSERT INTO event_check_ins (id, event_id, user_id, user_location_lat, user_location_lon, event_location_lat, event_location_lon, distance_from_event, checked_in_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [checkInId, eventId, userId, userLocationLat, userLocationLon, eventLocationLat || null, eventLocationLon || null, distanceFromEvent || null, new Date().toISOString()],
          (err) => {
            if (err) {
              console.error('Error creating check-in:', err);
              return res.status(500).json({ error: 'Failed to check in' });
            }

            // Update application status to 'checked_in'
            db.run(
              `UPDATE event_applications SET status = 'checked_in' WHERE id = ?`,
              [application.id],
              (err) => {
                if (err) {
                  console.error('Error updating application status:', err);
                }

                res.json({
                  checkIn: {
                    id: checkInId,
                    event_id: eventId,
                    user_id: userId,
                    checked_in_at: new Date().toISOString(),
                    distance_from_event: distanceFromEvent,
                  },
                  message: 'Successfully checked in to the event!',
                });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in checkIntoEvent:', error);
    res.status(500).json({ error: 'Failed to check in' });
  }
}

// Get user's check-in history
async function getUserCheckIns(req, res) {
  try {
    const userId = req.params.userId;

    db.all(
      `SELECT eci.*, e.title, e.event_date, e.event_time, e.location_city
       FROM event_check_ins eci
       LEFT JOIN events e ON eci.event_id = e.id
       WHERE eci.user_id = ?
       ORDER BY eci.checked_in_at DESC`,
      [userId],
      (err, checkIns) => {
        if (err) {
          console.error('Error fetching check-ins:', err);
          return res.status(500).json({ error: 'Failed to fetch check-ins' });
        }

        res.json(checkIns || []);
      }
    );
  } catch (error) {
    console.error('Error in getUserCheckIns:', error);
    res.status(500).json({ error: 'Failed to fetch check-ins' });
  }
}

// Get event check-in stats
async function getEventCheckIns(req, res) {
  try {
    const { eventId } = req.params;

    db.all(
      `SELECT eci.*, u.display_name, u.profile_id
       FROM event_check_ins eci
       LEFT JOIN users u ON eci.user_id = u.id
       WHERE eci.event_id = ?
       ORDER BY eci.checked_in_at DESC`,
      [eventId],
      (err, checkIns) => {
        if (err) {
          console.error('Error fetching event check-ins:', err);
          return res.status(500).json({ error: 'Failed to fetch event check-ins' });
        }

        // Calculate stats
        const stats = {
          totalCheckIns: checkIns.length,
          averageDistance: checkIns.length > 0
            ? (checkIns.reduce((sum, ci) => sum + (ci.distance_from_event || 0), 0) / checkIns.length).toFixed(3)
            : 0,
          checkIns: checkIns || [],
        };

        res.json(stats);
      }
    );
  } catch (error) {
    console.error('Error in getEventCheckIns:', error);
    res.status(500).json({ error: 'Failed to fetch event check-ins' });
  }
}

// Check if user has checked in to an event
async function hasCheckedIn(req, res) {
  try {
    const { eventId, userId } = req.params;

    db.get(
      `SELECT * FROM event_check_ins WHERE event_id = ? AND user_id = ?`,
      [eventId, userId],
      (err, checkIn) => {
        if (err) {
          console.error('Error checking check-in status:', err);
          return res.status(500).json({ error: 'Failed to check in status' });
        }

        res.json({
          hasCheckedIn: !!checkIn,
          checkIn: checkIn || null,
        });
      }
    );
  } catch (error) {
    console.error('Error in hasCheckedIn:', error);
    res.status(500).json({ error: 'Failed to check in status' });
  }
}

export {
  checkIntoEvent,
  getUserCheckIns,
  getEventCheckIns,
  hasCheckedIn,
};
