/**
 * Squad Events Schema
 * Enables users to create and manage squads for group outings
 */

export const squadSchema = `
CREATE TABLE IF NOT EXISTS squads (
  id UUID PRIMARY KEY,
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  profile_photo_url TEXT,
  is_public BOOLEAN DEFAULT false,
  max_members INT DEFAULT 20,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS squad_members (
  id UUID PRIMARY KEY,
  squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- creator, member, moderator
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(squad_id, user_id)
);

CREATE TABLE IF NOT EXISTS squad_invites (
  id UUID PRIMARY KEY,
  squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  invited_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_by_user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, declined, cancelled
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(squad_id, invited_user_id)
);

CREATE TABLE IF NOT EXISTS squad_events (
  id UUID PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, squad_id)
);

CREATE INDEX IF NOT EXISTS idx_squad_members_squad_id ON squad_members(squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_user_id ON squad_members(user_id);
CREATE INDEX IF NOT EXISTS idx_squad_invites_squad_id ON squad_invites(squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_invites_invited_user ON squad_invites(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_squad_events_event_id ON squad_events(event_id);
CREATE INDEX IF NOT EXISTS idx_squad_events_squad_id ON squad_events(squad_id);
`;

export interface Squad {
  id: string;
  created_by_user_id: string;
  name: string;
  description?: string;
  profile_photo_url?: string;
  is_public: boolean;
  max_members: number;
  created_at: string;
  updated_at: string;
  memberCount?: number;
  isCreator?: boolean;
}

export interface SquadMember {
  id: string;
  squad_id: string;
  user_id: string;
  role: 'creator' | 'member' | 'moderator';
  joined_at: string;
  user?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface SquadInvite {
  id: string;
  squad_id: string;
  invited_user_id: string;
  invited_by_user_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  expires_at?: string;
  created_at: string;
  squad?: Squad;
}
