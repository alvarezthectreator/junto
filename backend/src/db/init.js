import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import process from 'process';
import db from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function initializeDatabase() {
  try {
    console.log('📦 Creating database tables...');
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    
    // Split by semicolon and filter out comments and empty lines
    const statements = schema
      .split(';')
      .map(stmt => {
        // Remove SQL comments
        return stmt
          .split('\n')
          .filter(line => !line.trim().startsWith('--'))
          .join('\n')
          .trim();
      })
      .filter(stmt => stmt.length > 0);
    
    return new Promise((resolve) => {
      let completed = 0;
      const total = statements.length;
      
      if (total === 0) {
        console.log('✅ No statements to execute');
        resolve();
        return;
      }
      
      statements.forEach((statement, index) => {
        if (statement.trim()) {
          db.run(statement, (err) => {
            if (err) {
              console.error(`❌ Error executing statement ${index + 1}:`);
              console.error('Statement:', statement.substring(0, 100) + '...');
              console.error('Error:', err.message);
            } else {
              console.log(`✅ Executed statement ${index + 1}`);
            }
            completed++;
            if (completed === total) {
              console.log('✅ Database tables created successfully');
              resolve();
            }
          });
        }
      });
    });
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => {
      console.log('✅ Database initialized');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Database initialization failed:', err);
      process.exit(1);
    });
}
