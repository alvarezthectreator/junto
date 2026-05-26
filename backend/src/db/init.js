import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function initializeDatabase() {
  try {
    console.log('📦 Creating database tables...');
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    
    // SQLite converts SERIAL to INTEGER and AUTO_INCREMENT, removes CONSTRAINTS
    let sqliteSchema = schema
      .replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
      .replace(/UUID PRIMARY KEY/g, 'TEXT PRIMARY KEY')
      .replace(/UUID/g, 'TEXT')
      .replace(/\[\]/g, 'JSON')  // PostgreSQL arrays to JSON
      .replace(/text\[\]/g, 'JSON')
      .replace(/CONSTRAINT .+? FOREIGN KEY/g, 'FOREIGN KEY')
      .replace(/ON DELETE CASCADE/g, 'ON DELETE CASCADE')
      .replace(/ON UPDATE CASCADE/g, 'ON UPDATE CASCADE');
    
    // Split and execute each statement
    const statements = sqliteSchema.split(';').filter(stmt => stmt.trim());
    
    return new Promise((resolve, reject) => {
      let completed = 0;
      const total = statements.length;
      
      statements.forEach(statement => {
        if (statement.trim()) {
          db.run(statement, (err) => {
            if (err) {
              console.error('❌ Error executing statement:', statement.substring(0, 50));
              console.error('Error details:', err);
            } else {
              completed++;
              if (completed === total) {
                console.log('✅ Database tables created successfully');
                resolve();
              }
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
