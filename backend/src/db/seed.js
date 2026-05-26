import pool from './connection.js';
import { v4 as uuidv4 } from 'uuid';

const MOCK_USERS = [
  { phone: '+2348123456789', name: 'Chioma Okonkwo', display: 'Chioma', gender: 'Female', city: 'Lagos', occupation: 'Product Manager', bio: 'Love art, food, and good conversations', interests: ['art', 'food', 'travel'] },
  { phone: '+2348187654321', name: 'Tunde Adebayo', display: 'Tunde', gender: 'Male', city: 'Lagos', occupation: 'Software Engineer', bio: 'Tech enthusiast, gym lover', interests: ['tech', 'fitness', 'music'] },
  { phone: '+2348165432198', name: 'Zainab Hassan', display: 'Zainab', gender: 'Female', city: 'Abuja', occupation: 'Lawyer', bio: 'Exploring new experiences', interests: ['travel', 'fitness', 'reading'] },
  { phone: '+2348145678901', name: 'Amara Nwosu', display: 'Amara', gender: 'Female', city: 'Lagos', occupation: 'Designer', bio: 'Creative soul, coffee addict', interests: ['art', 'design', 'food'] },
  { phone: '+2348134567890', name: 'Olajide Okafor', display: 'Olajide', gender: 'Male', city: 'Lagos', occupation: 'Entrepreneur', bio: 'Building startups and friendships', interests: ['business', 'travel', 'networking'] },
];

const MOCK_EVENTS = [
  { title: 'Sunset Art Gallery Tour', description: 'Explore contemporary Nigerian art at Lekki gallery', type: 'art', city: 'Lagos', address: 'Lekki Penninsula', tier: 2, hostIndex: 0 },
  { title: 'Tech Networking Lunch', description: 'Connect with founders and tech professionals', type: 'networking', city: 'Lagos', address: 'VI', tier: 1, hostIndex: 1 },
  { title: 'Fitness & Brunch Social', description: 'Morning workout followed by brunch', type: 'fitness', city: 'Lagos', address: 'Ikoyi', tier: 1, hostIndex: 2 },
  { title: 'Weekend Wine Tasting', description: 'Explore African wines with friends', type: 'dining', city: 'Abuja', address: 'Maitama', tier: 3, hostIndex: 3 },
  { title: 'Jazz Night Experience', description: 'Live jazz performance and cocktails', type: 'music', city: 'Lagos', address: 'Island', tier: 2, hostIndex: 4 },
];

const BILLING_TIERS = {
  1: { name: 'Starter', hostFee: 50000, guestFee: 25000 },
  2: { name: 'Social', hostFee: 150000, guestFee: 75000 },
  3: { name: 'Premium', hostFee: 300000, guestFee: 150000 },
  4: { name: 'Elite', hostFee: 500000, guestFee: 250000 }
};

export async function seedDatabase() {
  const client = await pool.connect();
  try {
    // Check if already seeded
    const userCheck = await client.query('SELECT COUNT(*) FROM users');
    if (userCheck.rows[0].count > 0) {
      console.log('✅ Database already seeded, skipping...');
      return;
    }

    console.log('🌱 Seeding database with mock data...');

    // Seed Users
    const userIds = [];
    for (const mockUser of MOCK_USERS) {
      const profileId = `JNT-2024-${String(userIds.length + 1).padStart(5, '0')}`;
      const result = await client.query(
        `INSERT INTO users (phone_number, full_name, display_name, gender, city, occupation, bio, profile_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [mockUser.phone, mockUser.name, mockUser.display, mockUser.gender, mockUser.city, mockUser.occupation, mockUser.bio, profileId]
      );
      userIds.push(result.rows[0].id);

      // Create user profile
      await client.query(
        `INSERT INTO user_profiles (user_id, interests, last_active)
         VALUES ($1, $2, NOW())`,
        [result.rows[0].id, JSON.stringify(mockUser.interests)]
      );
    }
    console.log(`✅ Created ${userIds.length} users`);

    // Seed Events
    for (const mockEvent of MOCK_EVENTS) {
      const tier = mockEvent.tier;
      const tierData = BILLING_TIERS[tier];
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * 30) + 1);

      await client.query(
        `INSERT INTO events (host_id, title, description, event_type, location_city, location_address, event_date, event_time, billing_tier, host_fee, guest_fee, max_guests, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          userIds[mockEvent.hostIndex],
          mockEvent.title,
          mockEvent.description,
          mockEvent.type,
          mockEvent.city,
          mockEvent.address,
          eventDate.toISOString().split('T')[0],
          '18:00',
          tier,
          tierData.hostFee,
          tierData.guestFee,
          15,
          'active'
        ]
      );
    }
    console.log(`✅ Created ${MOCK_EVENTS.length} events`);

    // Seed some swipes for Nearby Mode
    for (let i = 0; i < userIds.length; i++) {
      for (let j = 0; j < userIds.length; j++) {
        if (i !== j && Math.random() > 0.6) {
          const direction = Math.random() > 0.5 ? 'right' : 'left';
          await client.query(
            `INSERT INTO swipes (swiper_id, swiped_user_id, direction)
             VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
            [userIds[i], userIds[j], direction]
          );
        }
      }
    }

    // Seed some matches
    for (let i = 0; i < Math.min(3, userIds.length - 1); i++) {
      await client.query(
        `INSERT INTO matches (user1_id, user2_id, matched_at)
         VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING`,
        [userIds[i], userIds[i + 1]]
      );
    }
    console.log('✅ Created swipes and matches');

    // Seed trusted contacts
    for (let i = 0; i < userIds.length; i++) {
      await client.query(
        `INSERT INTO trusted_contacts (user_id, contact_name, contact_phone, is_primary)
         VALUES ($1, $2, $3, $4)`,
        [userIds[i], 'Emergency Contact', '+2349000000000', true]
      );
    }
    console.log('✅ Created trusted contacts');

    console.log('✅ Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding complete');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
