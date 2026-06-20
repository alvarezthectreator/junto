-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) UNIQUE,
  full_name VARCHAR(255),
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
  referred_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- User Profiles (extended profile info)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  interests TEXT[], -- array of interests
  avatar_image TEXT,
  profile_photos TEXT[], -- array of photo URLs
  last_active TIMESTAMP,
  travel_mode_enabled BOOLEAN DEFAULT false,
  travel_destination_city VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(100),
  category VARCHAR(50), -- Movies, Food, Beach, Music, Sports, Travel, Wellness, etc.
  location_city VARCHAR(100) NOT NULL,
  location_address VARCHAR(500),
  location_coordinates POINT, -- latitude, longitude
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  cover_photo_url TEXT,
  is_squad_event BOOLEAN DEFAULT false,
  billing_tier INT DEFAULT 1, -- 1-4 for Starter, Social, Premium, Elite
  host_fee INT, -- in naira
  guest_fee INT, -- in naira
  max_guests INT,
  current_guests_count INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active', -- active, completed, cancelled, expired
  financial_agreement_signed BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false,
  is_visible_to_travelers BOOLEAN DEFAULT true,
  is_tour_guide BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event Applications
CREATE TABLE IF NOT EXISTS event_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  personal_note TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, declined, rejected
  financial_agreement_signed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  message_type VARCHAR(50) DEFAULT 'text', -- text, image, video, voice
  media_url VARCHAR(500),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (conversation_id, created_at),
  INDEX (sender_id, receiver_id)
);

-- Conversations (for organizing messages)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_id UUID,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user1_id, user2_id)
);

-- Swipes (for Nearby Mode)
CREATE TABLE IF NOT EXISTS swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  swiped_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  direction VARCHAR(10) NOT NULL, -- 'right' or 'left'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(swiper_id, swiped_user_id)
);

-- Matches (mutual swipes)
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user1_id, user2_id)
);

-- Trusted Contacts (for Safety Centre)
CREATE TABLE IF NOT EXISTS trusted_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_name VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Safety Alerts (SOS)
CREATE TABLE IF NOT EXISTS safety_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) DEFAULT 'sos', -- sos, report, etc.
  location_latitude FLOAT,
  location_longitude FLOAT,
  status VARCHAR(50) DEFAULT 'active', -- active, resolved
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blocked Users
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(blocker_id, blocked_user_id)
);

-- Reports/Flags
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_type VARCHAR(100),
  description TEXT,
  evidence_urls TEXT,
  escalation_level VARCHAR(20) DEFAULT 'standard',
  escalation_reason TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, reviewed, resolved
  reviewed_at TIMESTAMP,
  reviewed_by TEXT,
  review_note TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50), -- match, message, event_accepted, etc.
  related_user_id UUID REFERENCES users(id),
  related_event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  title VARCHAR(255),
  body TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reliability penalty log for cancellation penalties
CREATE TABLE IF NOT EXISTS reliability_penalty_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  penalty_percent NUMERIC NOT NULL,
  previous_score NUMERIC NOT NULL,
  new_score NUMERIC NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reliability_penalty_log_user_id
  ON reliability_penalty_log(user_id);

-- Event Saves (Wishlist/Bookmarks - Save Event for Later)
CREATE TABLE IF NOT EXISTS event_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, event_id)
);

-- Event Ratings
CREATE TABLE IF NOT EXISTS event_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, event_id)
);

-- Host Ratings (trust score system)
CREATE TABLE IF NOT EXISTS host_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rated_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(rated_by_user_id, host_id, event_id)
);

-- Push Notification Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_data TEXT NOT NULL, -- JSON stringified PushSubscription
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, subscription_data)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

CREATE TABLE IF NOT EXISTS notification_delivery_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  url TEXT,
  notification_type VARCHAR(50),
  payload TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  next_attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_error TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_delivery_queue_status ON notification_delivery_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_queue_next_attempt ON notification_delivery_queue(next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_queue_user ON notification_delivery_queue(user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(location_city);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_host ON events(host_id);
CREATE INDEX IF NOT EXISTS idx_applications_event ON event_applications(event_id);
CREATE INDEX IF NOT EXISTS idx_applications_user ON event_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_swipes_swiper ON swipes(swiper_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
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

-- Email/Phone Verification Table
CREATE TABLE IF NOT EXISTS email_phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  phone_number VARCHAR(20),
  verification_code VARCHAR(6) NOT NULL,
  verification_type VARCHAR(20) NOT NULL, -- 'email' or 'phone'
  is_verified BOOLEAN DEFAULT false,
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  verified_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_phone_verifications_user ON email_phone_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_phone_verifications_code ON email_phone_verifications(verification_code);
CREATE INDEX IF NOT EXISTS idx_email_phone_verifications_expires ON email_phone_verifications(expires_at);

-- OTP Codes (for email-based authentication)
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires ON otp_codes(expires_at);
