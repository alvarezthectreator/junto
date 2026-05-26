const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000/api';

const accounts = [
  { name: 'Alice Johnson', username: 'alice_johnson', password: 'password123' },
  { name: 'Bob Williams', username: 'bob_williams', password: 'password123' },
  { name: 'Charlie Brown', username: 'charlie_brown', password: 'password123' },
  { name: 'Diana Prince', username: 'diana_prince', password: 'password123' }
];

const events = [
  { title: 'Morning Yoga Session', date: '2026-05-27', time: '07:00', location: 'City Park', capacity: 10, description: 'Join us for a relaxing morning yoga session at the park' },
  { title: 'Coffee Meetup & Networking', date: '2026-05-28', time: '10:00', location: 'Downtown Cafe', capacity: 8, description: 'Casual coffee meetup with interesting people' },
  { title: 'Sunset Beach Walk', date: '2026-05-29', time: '17:00', location: 'Marina Beach', capacity: 12, description: 'Beautiful sunset walk along the beach' },
  { title: 'Board Games Night', date: '2026-05-30', time: '19:00', location: 'Game Lounge', capacity: 6, description: 'Fun evening of board games and snacks' }
];

async function createAccountsAndEvents() {
  try {
    const createdAccounts = [];

    // Create accounts and their events
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      console.log(`\nCreating account: ${account.name}`);

      // Signup
      const signupRes = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: account.username,
          full_name: account.name,
          password: account.password
        })
      });

      if (!signupRes.ok) {
        throw new Error(`Signup failed: ${await signupRes.text()}`);
      }

      const userData = await signupRes.json();
      const userId = userData.user.id;
      const token = userData.session_token;

      createdAccounts.push({
        ...account,
        userId,
        token
      });

      console.log(`✓ Account created: ${account.username} (ID: ${userId})`);

      // Create event for this account
      const eventData = events[i];
      console.log(`Creating event: ${eventData.title}`);

      const eventRes = await fetch(`${API_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: eventData.title,
          date: eventData.date,
          time: eventData.time,
          location: eventData.location,
          capacity: eventData.capacity,
          description: eventData.description,
          host_id: userId
        })
      });

      if (!eventRes.ok) {
        console.error(`Event creation failed: ${await eventRes.text()}`);
      } else {
        const event = await eventRes.json();
        console.log(`✓ Event created: ${eventData.title}`);
      }
    }

    // Print login details
    console.log('\n\n========================================');
    console.log('LOGIN DETAILS FOR 4 ACCOUNTS');
    console.log('========================================\n');

    createdAccounts.forEach((account, idx) => {
      console.log(`Account ${idx + 1}:`);
      console.log(`  Name: ${account.name}`);
      console.log(`  Username: ${account.username}`);
      console.log(`  Password: ${account.password}`);
      console.log(`  User ID: ${account.userId}`);
      console.log(`  Event: ${events[idx].title}\n`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

createAccountsAndEvents();
