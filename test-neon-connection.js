const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_38JQOXwfUodv@ep-broad-bar-ajkujo13-pooler.c-3.us-east-2.aws.neon.tech/Advancia_payledger?sslmode=require&channel_binding=require';

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
