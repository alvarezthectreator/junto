/**
 * Follow-up API Controller
 * Endpoints for managing event follow-ups and engagement
 */

import { getFollowupStatus, markFollowupResponded, getFollowupAnalytics } from '../../services/followupScheduler.js';

/**
 * GET /api/followups/event/:eventId
 * Get follow-up status for all attendees of an event
 */
export const getEventFollowups = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    // Verify user is the host of this event
    const eventCheckSql = 'SELECT host_id FROM events WHERE id = ?';
    req.db.get(eventCheckSql, [eventId], async (err, event) => {
      if (err || !event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      if (event.host_id !== req.user?.id) {
        return res.status(403).json({ error: 'Only the host can view follow-ups' });
      }

      try {
        const followups = await getFollowupStatus(req.db, eventId);
        res.json({
          event_id: eventId,
          followups,
          stats: {
            total: followups.length,
            sent: followups.filter(f => f.followup_sent).length,
            opened: followups.reduce((sum, f) => sum + (f.opened || 0), 0),
          }
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch follow-ups' });
      }
    });
  } catch (error) {
    console.error('Error in getEventFollowups:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * POST /api/followups/event/:eventId/user/:userId/respond
 * Mark a user as having responded to a follow-up (feedback, rating, photo)
 */
export const respondToFollowup = async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    const { response_type } = req.body;

    if (!eventId || !userId || !response_type) {
      return res.status(400).json({ error: 'Event ID, User ID, and response type are required' });
    }

    // Valid response types
    const validTypes = ['feedback', 'rating', 'photos', 'other'];
    if (!validTypes.includes(response_type)) {
      return res.status(400).json({ error: 'Invalid response type' });
    }

    // Verify event exists
    const eventCheckSql = 'SELECT id FROM events WHERE id = ?';
    req.db.get(eventCheckSql, [eventId], async (err, event) => {
      if (err || !event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      try {
        await markFollowupResponded(req.db, eventId, userId, response_type);
        res.json({ success: true, message: 'Follow-up marked as responded' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to update follow-up status' });
      }
    });
  } catch (error) {
    console.error('Error in respondToFollowup:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /api/followups/host/:hostId/analytics
 * Get follow-up engagement analytics for a host
 */
export const getHostFollowupAnalytics = async (req, res) => {
  try {
    const { hostId } = req.params;

    if (!hostId) {
      return res.status(400).json({ error: 'Host ID is required' });
    }

    // Verify user is accessing their own analytics or is admin
    if (req.user?.id !== hostId) {
      return res.status(403).json({ error: 'You can only view your own analytics' });
    }

    try {
      const analytics = await getFollowupAnalytics(req.db, hostId);

      // Calculate aggregate stats
      const totalFollowups = analytics.reduce((sum, a) => sum + a.followups_sent, 0);
      const totalOpened = analytics.reduce((sum, a) => sum + a.followups_opened, 0);
      const totalResponses = analytics.reduce((sum, a) => sum + a.responses_received, 0);
      const openRate = totalFollowups > 0 ? Math.round((totalOpened / totalFollowups) * 100) : 0;
      const responseRate = totalFollowups > 0 ? Math.round((totalResponses / totalFollowups) * 100) : 0;

      res.json({
        events: analytics,
        aggregate: {
          total_followups_sent: totalFollowups,
          total_opened: totalOpened,
          total_responses: totalResponses,
          open_rate_percentage: openRate,
          response_rate_percentage: responseRate,
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  } catch (error) {
    console.error('Error in getHostFollowupAnalytics:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /api/followups/user/:userId
 * Get follow-ups this user has received (as an attendee)
 */
export const getUserFollowups = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Verify user is accessing their own data
    if (req.user?.id !== userId) {
      return res.status(403).json({ error: 'You can only view your own follow-ups' });
    }

    const sql = `
      SELECT 
        e.id as event_id,
        e.title,
        e.event_date,
        e.event_time,
        u.id as host_id,
        u.display_name as host_name,
        u.profile_id as host_profile_id,
        n.id as notification_id,
        n.is_read,
        n.created_at as followup_sent_at,
        ea.followup_response_type,
        ea.followup_responded_at
      FROM event_applications ea
      INNER JOIN events e ON ea.event_id = e.id
      INNER JOIN users u ON e.host_id = u.id
      LEFT JOIN notifications n ON ea.user_id = n.user_id 
        AND n.event_id = e.id 
        AND n.notification_type = 'event_followup'
      WHERE ea.user_id = ? AND ea.followup_sent = 1
      ORDER BY ea.created_at DESC
      LIMIT 50
    `;

    req.db.all(sql, [userId], (err, followups) => {
      if (err) {
        console.error('Error fetching user follow-ups:', err);
        return res.status(500).json({ error: 'Failed to fetch follow-ups' });
      }

      res.json({
        followups: followups || [],
        count: (followups || []).length,
        pending: (followups || []).filter(f => !f.followup_response_type).length,
        responded: (followups || []).filter(f => f.followup_response_type).length,
      });
    });
  } catch (error) {
    console.error('Error in getUserFollowups:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * POST /api/followups/:eventId/resend
 * Manually resend follow-up to specific users
 */
export const resendFollowup = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userIds } = req.body;

    if (!eventId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'Event ID and user IDs array are required' });
    }

    // Verify user is the host
    const eventCheckSql = 'SELECT host_id FROM events WHERE id = ?';
    req.db.get(eventCheckSql, [eventId], async (err, event) => {
      if (err || !event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      if (event.host_id !== req.user?.id) {
        return res.status(403).json({ error: 'Only the host can resend follow-ups' });
      }

      try {
        const promises = userIds.map(userId => {
          return new Promise((resolve) => {
            // Reset followup_sent flag for manual resend
            const resetSql = `
              UPDATE event_applications 
              SET followup_sent = 0
              WHERE event_id = ? AND user_id = ?
            `;

            req.db.run(resetSql, [eventId, userId], (err) => {
              if (err) {
                console.error('Error resetting follow-up:', err);
              }
              resolve();
            });
          });
        });

        await Promise.all(promises);
        res.json({ 
          success: true, 
          message: `Follow-ups will be resent to ${userIds.length} user(s) in the next scheduler run` 
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to resend follow-ups' });
      }
    });
  } catch (error) {
    console.error('Error in resendFollowup:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
