-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  email VARCHAR(255),
  gender VARCHAR(50),
  city VARCHAR(100),
  occupation VARCHAR(255),
  bio TEXT,
  date_of_birth DATE,
  intro_video_url VARCHAR(500),
  profile_id VARCHAR(20) UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- User Profiles (extended profile info)
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  interests TEXT, -- comma-separated interests
  profile_photos TEXT, -- JSON array of photo URLs
  last_active DATETIME,
  travel_mode_enabled BOOLEAN DEFAULT false,
  travel_destination_city VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  host_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(100),
  location_city VARCHAR(100) NOT NULL,
  location_address VARCHAR(500),
  location_latitude FLOAT,
  location_longitude FLOAT,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  cover_photo_url VARCHAR(500),
  billing_tier INT DEFAULT 1,
  host_fee INT,
  guest_fee INT,
  max_guests INT,
  current_guests_count INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  financial_agreement_signed BOOLEAN DEFAULT false,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Event Applications
CREATE TABLE IF NOT EXISTS event_applications (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  personal_note TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  financial_agreement_signed BOOLEAN DEFAULT false,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  message_type VARCHAR(50) DEFAULT 'text',
  media_url VARCHAR(500),
  is_read BOOLEAN DEFAULT false,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

-- Conversations (for organizing messages)
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user1_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_id TEXT,
  last_message_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user1_id, user2_id)
);

-- Swipes (for Nearby Mode)
CREATE TABLE IF NOT EXISTS swipes (
  id TEXT PRIMARY KEY,
  swiper_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  swiped_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  direction VARCHAR(10) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(swiper_id, swiped_user_id)
);

-- Matches (mutual swipes)
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  user1_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  matched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user1_id, user2_id)
);

-- Trusted Contacts (for Safety Centre)
CREATE TABLE IF NOT EXISTS trusted_contacts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_name VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Safety Alerts (SOS)
CREATE TABLE IF NOT EXISTS safety_alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) DEFAULT 'sos',
  location_latitude FLOAT,
  location_longitude FLOAT,
  status VARCHAR(50) DEFAULT 'active',
  resolved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Blocked Users
CREATE TABLE IF NOT EXISTS blocked_users (
  id TEXT PRIMARY KEY,
  blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(blocker_id, blocked_user_id)
);

-- Reports/Flags
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_type VARCHAR(100),
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  reviewed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50),
  related_user_id TEXT REFERENCES users(id),
  related_event_id TEXT REFERENCES events(id),
  title VARCHAR(255),
  body TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(location_city);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_host ON events(host_id);
CREATE INDEX IF NOT EXISTS idx_applications_event ON event_applications(event_id);
CREATE INDEX IF NOT EXISTS idx_applications_user ON event_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_swipes_swiper ON swipes(swiper_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
