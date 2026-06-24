-- PostgreSQL Schema for Junto
-- This schema is used for production deployments on Railway/Vercel

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
  avatar_image TEXT,
  reliability_score NUMERIC DEFAULT 100,
  profile_id VARCHAR(20) UNIQUE,
  referred_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- User Profiles (extended profile info)
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  interests TEXT,
  avatar_image TEXT,
  profile_photos TEXT,
  last_active TIMESTAMP,
  travel_mode_enabled BOOLEAN DEFAULT false,
  travel_destination_city VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
  cover_photo_url TEXT,
  is_squad_event BOOLEAN DEFAULT false,
  billing_tier INT DEFAULT 1,
  host_fee INT,
  guest_fee INT,
  max_guests INT,
  current_guests_count INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  financial_agreement_signed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event Applications
CREATE TABLE IF NOT EXISTS event_applications (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  personal_note TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  financial_agreement_signed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

-- Conversations (for organizing messages)
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user1_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_id TEXT,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user1_id, user2_id)
);

-- Swipes (for Nearby Mode)
CREATE TABLE IF NOT EXISTS swipes (
  id TEXT PRIMARY KEY,
  swiper_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  swiped_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  direction VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(swiper_id, swiped_user_id)
);

-- Matches (mutual swipes)
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  user1_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user1_id, user2_id)
);

-- Trusted Contacts (for Safety Centre)
CREATE TABLE IF NOT EXISTS trusted_contacts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_name VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Safety Alerts (SOS)
CREATE TABLE IF NOT EXISTS safety_alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) DEFAULT 'sos',
  location_latitude FLOAT,
  location_longitude FLOAT,
  status VARCHAR(50) DEFAULT 'active',
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blocked Users
CREATE TABLE IF NOT EXISTS blocked_users (
  id TEXT PRIMARY KEY,
  blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(blocker_id, blocked_user_id)
);

-- Admin dashboard items
CREATE TABLE IF NOT EXISTS admin_dashboard_items (
  id TEXT PRIMARY KEY,
  item_type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  severity VARCHAR(20) DEFAULT 'standard',
  status VARCHAR(20) DEFAULT 'open',
  payload JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50),
  related_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  related_event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
  title VARCHAR(255),
  body TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Push subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_data TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, subscription_data)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

-- Notification delivery queue
CREATE TABLE IF NOT EXISTS notification_delivery_queue (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_id TEXT REFERENCES notifications(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  url TEXT,
  notification_type VARCHAR(50),
  payload TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 5,
  next_attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_error TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_delivery_queue_status ON notification_delivery_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_queue_next_attempt ON notification_delivery_queue(next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_queue_user ON notification_delivery_queue(user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_events_host ON events(host_id);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(location_city);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_applications_user ON event_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_event ON event_applications(event_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_swipes_user ON swipes(swiper_id);
CREATE INDEX IF NOT EXISTS idx_matches_user ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  plan_id VARCHAR(50) NOT NULL,
  billing_cycle VARCHAR(20) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  provider VARCHAR(50) DEFAULT 'manual',
  amount INT DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'NGN',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  current_period_end TIMESTAMP,
  canceled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);

-- Cancellation penalty log
CREATE TABLE IF NOT EXISTS reliability_penalty_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  penalty_percent NUMERIC NOT NULL,
  previous_score NUMERIC NOT NULL,
  new_score NUMERIC NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reliability_penalty_log_user_id
  ON reliability_penalty_log(user_id);
