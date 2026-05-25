import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import process from 'process';
import { query, DB_TYPE } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function initializeDatabase() {
  try {
    console.log(`📦 Creating database tables (${DB_TYPE})...`);
    
    // Choose schema based on database type
    const schemaFile = DB_TYPE === 'postgres' ? 'schema-postgres.sql' : 'schema.sql';
    const schema = readFileSync(join(__dirname, schemaFile), 'utf8');
    
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
    
    let completed = 0;
    const total = statements.length;
    
    if (total === 0) {
      console.log('✅ No statements to execute');
      return;
    }
    
    // Execute all statements for PostgreSQL
    if (DB_TYPE === 'postgres') {
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await query(statement);
            console.log(`✅ Executed statement ${++completed}/${total}`);
          } catch (err) {
            console.error(`❌ Error executing statement ${completed + 1}:`);
            console.error('Statement:', statement.substring(0, 100) + '...');
            console.error('Error:', err.message);
            // Continue with other statements
          }
        }
      }
    } else {
      // SQLite execution (callback-based)
      return new Promise((resolve, reject) => {
        const executeStatements = (index) => {
          if (index >= statements.length) {
            console.log('✅ Database tables created successfully');
            resolve();
            return;
          }
          
          const statement = statements[index];
          if (statement.trim()) {
            query(statement)
              .then(() => {
                console.log(`✅ Executed statement ${index + 1}/${total}`);
                executeStatements(index + 1);
              })
              .catch(err => {
                console.error(`❌ Error executing statement ${index + 1}:`);
                console.error('Statement:', statement.substring(0, 100) + '...');
                console.error('Error:', err.message);
                executeStatements(index + 1);
              });
          } else {
            executeStatements(index + 1);
          }
        };
        
        executeStatements(0);
      });
    }
    
    console.log('✅ Database tables created successfully');
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
