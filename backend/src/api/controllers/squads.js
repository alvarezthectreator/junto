import db from '../../db/init.js';
import { v4 as uuid } from 'uuid';

// Create a new squad
async function createSquad(req, res) {
  try {
    const { name, description, isPublic, maxMembers } = req.body;
    const userId = req.userId;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Squad name is required' });
    }

    const squadId = uuid();
    const memberId = uuid();

    db.run(
      `INSERT INTO squads (id, created_by_user_id, name, description, is_public, max_members)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [squadId, userId, name.trim(), description || null, isPublic ? 1 : 0, maxMembers || 20],
      function (err) {
        if (err) {
          console.error('Error creating squad:', err);
          return res.status(500).json({ error: 'Failed to create squad' });
        }

        // Add creator as first member with 'creator' role
        db.run(
          `INSERT INTO squad_members (id, squad_id, user_id, role)
           VALUES (?, ?, ?, ?)`,
          [memberId, squadId, userId, 'creator'],
          function (err) {
            if (err) {
              console.error('Error adding creator to squad:', err);
              return res.status(500).json({ error: 'Failed to add creator to squad' });
            }

            res.json({
              id: squadId,
              name,
              description,
              is_public: isPublic,
              max_members: maxMembers || 20,
              created_by_user_id: userId,
              created_at: new Date().toISOString(),
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in createSquad:', error);
    res.status(500).json({ error: 'Failed to create squad' });
  }
}

// Get user's squads
async function getUserSquads(req, res) {
  try {
    const userId = req.params.userId;

    db.all(
      `SELECT s.*, COUNT(DISTINCT sm.user_id) as memberCount,
              (s.created_by_user_id = ?) as isCreator
       FROM squads s
       LEFT JOIN squad_members sm ON s.id = sm.squad_id
       WHERE s.created_by_user_id = ? OR sm.user_id = ?
       GROUP BY s.id
       ORDER BY s.created_at DESC`,
      [userId, userId, userId],
      (err, squads) => {
        if (err) {
          console.error('Error fetching user squads:', err);
          return res.status(500).json({ error: 'Failed to fetch squads' });
        }
        res.json(squads || []);
      }
    );
  } catch (error) {
    console.error('Error in getUserSquads:', error);
    res.status(500).json({ error: 'Failed to fetch user squads' });
  }
}

// Get squad details
async function getSquadDetails(req, res) {
  try {
    const { squadId } = req.params;

    db.get(
      `SELECT s.*, COUNT(DISTINCT sm.user_id) as memberCount
       FROM squads s
       LEFT JOIN squad_members sm ON s.id = sm.squad_id
       WHERE s.id = ?
       GROUP BY s.id`,
      [squadId],
      (err, squad) => {
        if (err) {
          console.error('Error fetching squad:', err);
          return res.status(500).json({ error: 'Failed to fetch squad' });
        }

        if (!squad) {
          return res.status(404).json({ error: 'Squad not found' });
        }

        // Get squad members
        db.all(
          `SELECT sm.*, u.display_name, u.avatar_url
           FROM squad_members sm
           LEFT JOIN users u ON sm.user_id = u.id
           WHERE sm.squad_id = ?
           ORDER BY CASE WHEN sm.role = 'creator' THEN 0 WHEN sm.role = 'moderator' THEN 1 ELSE 2 END`,
          [squadId],
          (err, members) => {
            if (err) {
              console.error('Error fetching squad members:', err);
              return res.status(500).json({ error: 'Failed to fetch squad members' });
            }

            res.json({
              ...squad,
              members: members || [],
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in getSquadDetails:', error);
    res.status(500).json({ error: 'Failed to fetch squad details' });
  }
}

// Invite users to squad
async function inviteUsersToSquad(req, res) {
  try {
    const { squadId } = req.params;
    const { userIds } = req.body;
    const inviterId = req.userId;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs are required' });
    }

    // Verify requester is squad member
    db.get(
      `SELECT * FROM squad_members WHERE squad_id = ? AND user_id = ?`,
      [squadId, inviterId],
      (err, membership) => {
        if (err || !membership) {
          return res.status(403).json({ error: 'Not authorized to invite to this squad' });
        }

        // Get squad details for member count check
        db.get(
          `SELECT COUNT(*) as count FROM squad_members WHERE squad_id = ?`,
          [squadId],
          (err, result) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to check squad capacity' });
            }

            // Get squad max members
            db.get(
              `SELECT max_members FROM squads WHERE id = ?`,
              [squadId],
              (err, squad) => {
                if (err || !squad) {
                  return res.status(500).json({ error: 'Failed to fetch squad' });
                }

                const invites = [];
                let completed = 0;

                userIds.forEach((userId) => {
                  if (result.count >= squad.max_members) {
                    completed++;
                    return;
                  }

                  const inviteId = uuid();
                  db.run(
                    `INSERT INTO squad_invites (id, squad_id, invited_user_id, invited_by_user_id)
                     VALUES (?, ?, ?, ?)
                     ON CONFLICT(squad_id, invited_user_id) DO NOTHING`,
                    [inviteId, squadId, userId, inviterId],
                    function (err) {
                      completed++;
                      if (!err && this.changes > 0) {
                        invites.push({
                          id: inviteId,
                          squad_id: squadId,
                          invited_user_id: userId,
                          status: 'pending',
                        });
                      }

                      if (completed === userIds.length) {
                        res.json({
                          message: `${invites.length} invitations sent`,
                          invites,
                        });
                      }
                    }
                  );
                });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in inviteUsersToSquad:', error);
    res.status(500).json({ error: 'Failed to send invitations' });
  }
}

// Accept squad invite
async function acceptSquadInvite(req, res) {
  try {
    const { inviteId } = req.params;
    const userId = req.userId;

    db.get(
      `SELECT * FROM squad_invites WHERE id = ? AND invited_user_id = ?`,
      [inviteId, userId],
      (err, invite) => {
        if (err || !invite) {
          return res.status(404).json({ error: 'Invite not found' });
        }

        if (invite.status !== 'pending') {
          return res.status(400).json({ error: 'Invite already processed' });
        }

        const memberId = uuid();
        db.run(
          `INSERT INTO squad_members (id, squad_id, user_id, role)
           VALUES (?, ?, ?, ?)`,
          [memberId, invite.squad_id, userId, 'member'],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to add member to squad' });
            }

            db.run(
              `UPDATE squad_invites SET status = ? WHERE id = ?`,
              ['accepted', inviteId],
              (err) => {
                if (err) {
                  return res.status(500).json({ error: 'Failed to update invite' });
                }

                res.json({ message: 'Invite accepted' });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in acceptSquadInvite:', error);
    res.status(500).json({ error: 'Failed to accept invite' });
  }
}

// Decline squad invite
async function declineSquadInvite(req, res) {
  try {
    const { inviteId } = req.params;
    const userId = req.userId;

    db.get(
      `SELECT * FROM squad_invites WHERE id = ? AND invited_user_id = ?`,
      [inviteId, userId],
      (err, invite) => {
        if (err || !invite) {
          return res.status(404).json({ error: 'Invite not found' });
        }

        db.run(
          `UPDATE squad_invites SET status = ? WHERE id = ?`,
          ['declined', inviteId],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to decline invite' });
            }

            res.json({ message: 'Invite declined' });
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in declineSquadInvite:', error);
    res.status(500).json({ error: 'Failed to decline invite' });
  }
}

// Remove member from squad
async function removeSquadMember(req, res) {
  try {
    const { squadId, memberId } = req.params;
    const requesterId = req.userId;

    // Check if requester is creator or moderator
    db.get(
      `SELECT * FROM squad_members WHERE squad_id = ? AND user_id = ?`,
      [squadId, requesterId],
      (err, requesterMember) => {
        if (
          err ||
          !requesterMember ||
          (requesterMember.role !== 'creator' && requesterMember.role !== 'moderator')
        ) {
          return res.status(403).json({ error: 'Not authorized to remove members' });
        }

        db.run(
          `DELETE FROM squad_members WHERE squad_id = ? AND user_id = ?`,
          [squadId, memberId],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to remove member' });
            }

            res.json({ message: 'Member removed' });
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in removeSquadMember:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
}

// Delete squad
async function deleteSquad(req, res) {
  try {
    const { squadId } = req.params;
    const userId = req.userId;

    db.get(
      `SELECT * FROM squads WHERE id = ? AND created_by_user_id = ?`,
      [squadId, userId],
      (err, squad) => {
        if (err || !squad) {
          return res.status(403).json({ error: 'Not authorized to delete this squad' });
        }

        db.run(`DELETE FROM squads WHERE id = ?`, [squadId], (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to delete squad' });
          }

          res.json({ message: 'Squad deleted' });
        });
      }
    );
  } catch (error) {
    console.error('Error in deleteSquad:', error);
    res.status(500).json({ error: 'Failed to delete squad' });
  }
}

export {
  createSquad,
  getUserSquads,
  getSquadDetails,
  inviteUsersToSquad,
  acceptSquadInvite,
  declineSquadInvite,
  removeSquadMember,
  deleteSquad,
};
