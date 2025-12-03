const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./sqlite.db');

console.log('📊 Database Investigation...\n');

// Check all tables
db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
  if (err) {
    console.error('❌ Error getting tables:', err.message);
    db.close();
    return;
  }
  
  console.log('📋 Tables in database:');
  tables.forEach(t => console.log('  -', t.name));
  console.log('');
  
  // Check users
  db.all('SELECT * FROM users', [], (err, users) => {
    if (err) {
      console.error('❌ Error querying users:', err.message);
    } else {
      console.log(`👥 Users: ${users.length} found`);
      users.forEach((user, i) => {
        console.log(`  ${i + 1}. ${user.email} (${user.name}) - ID: ${user.id}`);
      });
      console.log('');
    }
    
    // Check refresh tokens
    db.all('SELECT * FROM refresh_tokens', [], (err, tokens) => {
      if (err) {
        console.error('❌ Error querying tokens:', err.message);
      } else {
        console.log(`🔑 Refresh Tokens: ${tokens.length} found`);
        tokens.forEach((token, i) => {
          console.log(`  ${i + 1}. User ID: ${token.userId}, Expires: ${token.expiresAt}`);
        });
      }
      
      db.close();
      
      console.log('\n✅ Query complete!');
    });
  });
});
