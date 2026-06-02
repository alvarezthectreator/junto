/**
 * Anti-Fraud Detection Schema
 * Stores fraud scores, flags, and logs for user behavior analysis
 */

export const fraudDetectionSchema = {
  tables: {
    fraud_scores: {
      name: 'fraud_scores',
      columns: {
        id: 'TEXT PRIMARY KEY',
        user_id: 'TEXT NOT NULL UNIQUE',
        risk_score: 'INTEGER DEFAULT 0',
        behavior_score: 'INTEGER DEFAULT 0',
        identity_score: 'INTEGER DEFAULT 100',
        payment_score: 'INTEGER DEFAULT 100',
        verification_status: 'VARCHAR(50) DEFAULT "unverified"',
        flags_count: 'INTEGER DEFAULT 0',
        last_updated: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
      },
      indexes: ['idx_fraud_scores_user_id', 'idx_fraud_scores_risk_score'],
      foreignKeys: ['FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE'],
    },
    
    account_flags: {
      name: 'account_flags',
      columns: {
        id: 'TEXT PRIMARY KEY',
        user_id: 'TEXT NOT NULL',
        flag_type: 'VARCHAR(50) NOT NULL',
        severity: 'VARCHAR(20) DEFAULT "medium"',
        description: 'TEXT',
        action_taken: 'VARCHAR(50) DEFAULT "none"',
        reviewed: 'BOOLEAN DEFAULT 0',
        reviewed_by: 'TEXT',
        notes: 'TEXT',
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
      },
      indexes: ['idx_account_flags_user_id', 'idx_account_flags_reviewed', 'idx_account_flags_severity'],
      foreignKeys: [
        'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE',
        'FOREIGN KEY(reviewed_by) REFERENCES users(id) ON DELETE SET NULL',
      ],
    },
    
    fraud_logs: {
      name: 'fraud_logs',
      columns: {
        id: 'TEXT PRIMARY KEY',
        user_id: 'TEXT NOT NULL',
        event_type: 'VARCHAR(100) NOT NULL',
        description: 'TEXT',
        metadata: 'TEXT',
        ip_address: 'VARCHAR(50)',
        user_agent: 'TEXT',
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
      },
      indexes: ['idx_fraud_logs_user_id', 'idx_fraud_logs_event_type', 'idx_fraud_logs_created_at'],
      foreignKeys: ['FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE'],
    },
    
    suspicious_activities: {
      name: 'suspicious_activities',
      columns: {
        id: 'TEXT PRIMARY KEY',
        user_id: 'TEXT NOT NULL',
        activity_type: 'VARCHAR(100) NOT NULL',
        description: 'TEXT',
        confidence_score: 'INTEGER DEFAULT 0',
        resolved: 'BOOLEAN DEFAULT 0',
        resolution_reason: 'TEXT',
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        resolved_at: 'TIMESTAMP',
      },
      indexes: ['idx_suspicious_activities_user_id', 'idx_suspicious_activities_resolved'],
      foreignKeys: ['FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE'],
    },
  },
};

export const createFraudDetectionTables = (db) => {
  return new Promise((resolve, reject) => {
    const schema = fraudDetectionSchema;
    const tableEntries = Object.entries(schema.tables);
    let created = 0;

    tableEntries.forEach(([tableKey, tableSchema]) => {
      const columns = Object.entries(tableSchema.columns)
        .map(([name, definition]) => `${name} ${definition}`)
        .join(', ');

      const foreignKeys = tableSchema.foreignKeys
        .map(fk => `, ${fk}`)
        .join('');

      const createTableSql = `
        CREATE TABLE IF NOT EXISTS ${tableSchema.name} (
          ${columns}${foreignKeys}
        )
      `;

      db.run(createTableSql, (err) => {
        if (err && !err.message.includes('already exists')) {
          console.error(`Error creating ${tableSchema.name} table:`, err);
        } else if (!err) {
          console.log(`✓ Fraud detection table ${tableSchema.name} created`);
          
          // Create indexes
          tableSchema.indexes.forEach(indexName => {
            const createIndexSql = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableSchema.name}(${getIndexColumns(indexName)});`;
            db.run(createIndexSql, (indexErr) => {
              if (indexErr && !indexErr.message.includes('already exists')) {
                console.warn(`⚠️  Index creation warning for ${indexName}:`, indexErr.message);
              }
            });
          });
        }

        created++;
        if (created === tableEntries.length) {
          console.log(`✓ All fraud detection tables created`);
          resolve();
        }
      });
    });
  });
};

function getIndexColumns(indexName: string): string {
  const mapping: { [key: string]: string } = {
    'idx_fraud_scores_user_id': 'user_id',
    'idx_fraud_scores_risk_score': 'risk_score',
    'idx_account_flags_user_id': 'user_id',
    'idx_account_flags_reviewed': 'reviewed',
    'idx_account_flags_severity': 'severity',
    'idx_fraud_logs_user_id': 'user_id',
    'idx_fraud_logs_event_type': 'event_type',
    'idx_fraud_logs_created_at': 'created_at',
    'idx_suspicious_activities_user_id': 'user_id',
    'idx_suspicious_activities_resolved': 'resolved',
  };
  return mapping[indexName] || 'id';
}
