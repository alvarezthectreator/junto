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
      .replace(/UUID PRIMARY KEY DEFAULT gen_random_uuid\(\)/g, 'TEXT PRIMARY KEY')
      .replace(/UUID/g, 'TEXT')
      .replace(/POINT/g, 'TEXT')  // PostgreSQL POINT type to TEXT
      .replace(/DEFAULT gen_random_uuid\(\)/g, '')  // Remove UUID generation
      .replace(/text\[\]/g, 'TEXT')  // PostgreSQL arrays to TEXT
      .replace(/TEXT\[\]/g, 'TEXT')
      .replace(/\[\]/g, 'TEXT')  // Any array type to TEXT
      .replace(/CONSTRAINT .+? FOREIGN KEY/g, 'FOREIGN KEY')  // Remove CONSTRAINT keyword
      .replace(/ON UPDATE CASCADE/g, 'ON DELETE CASCADE');  // SQLite doesn't support ON UPDATE CASCADE
    
    // Remove SQL comments and INDEX creation statements (not part of table definitions)
    let cleanedSchema = sqliteSchema
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        // Skip comments, standalone CREATE INDEX statements
        return !trimmed.startsWith('--') && 
               !trimmed.startsWith('CREATE INDEX') && 
               !trimmed.startsWith('INDEX');
      })
      .join('\n');
    
    // Remove trailing commas from column lists
    cleanedSchema = cleanedSchema
      .replace(/,\s*,/g, ',')  // Remove double commas
      .replace(/,\s*\)/g, ')');  // Remove trailing commas before closing paren
    
    // Split and execute each statement properly
    const statements = cleanedSchema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('CREATE INDEX'));
    
    return new Promise((resolve, reject) => {
      let completed = 0;
      const total = statements.length;
      
      if (total === 0) {
        console.log('✅ Database tables created successfully');
        resolve();
        return;
      }
      
      statements.forEach(statement => {
        if (statement.trim()) {
          db.run(statement, (err) => {
            if (err) {
              // Only log if it's a real error, not a duplicate
              if (!err.message.includes('already exists')) {
                console.error('❌ Error executing statement:', statement.substring(0, 80));
                console.error('Error details:', err.message);
              }
            } else {
              console.log('✅ Table created');
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
