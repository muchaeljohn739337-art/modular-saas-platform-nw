const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_nECsrJB8L2IA@ep-withered-sun-ahto03l2.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function testConnection() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    console.log('🔌 Connecting to Neon PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    // Test basic query
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL Version:', result.rows[0].version);
    
    // Check if database exists
    const dbResult = await client.query('SELECT current_database()');
    console.log('🗄️ Current Database:', dbResult.rows[0].current_database);
    
    // List tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('📋 Tables in database:');
    if (tablesResult.rows.length === 0) {
      console.log('   No tables found (empty database)');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }
    
    // Create a test table to verify write access
    console.log('🔧 Creating test table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS connection_test (
        id SERIAL PRIMARY KEY,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert test data
    console.log('📝 Inserting test data...');
    const insertResult = await client.query(
      'INSERT INTO connection_test (message) VALUES ($1) RETURNING *',
      ['Neon connection test successful!']
    );
    console.log('✅ Inserted:', insertResult.rows[0]);
    
    // Query test data
    const selectResult = await client.query('SELECT * FROM connection_test ORDER BY created_at DESC LIMIT 5');
    console.log('📊 Recent test records:');
    selectResult.rows.forEach(row => {
      console.log(`   - ${row.id}: ${row.message} (${row.created_at})`);
    });
    
    console.log('✅ Connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('🔍 Error details:', error);
  } finally {
    await client.end();
    console.log('🔌 Connection closed');
  }
}

testConnection();
