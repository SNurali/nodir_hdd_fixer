const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function resetPassword() {
    const client = new Client({
        host: 'localhost',
        port: 5436,
        user: 'hdd_fixer',
        password: 'hdd_fixer_secret',
        database: 'hdd_fixer_db',
    });

    await client.connect();

    // Hash password: "Test123!"
    const passwordHash = await bcrypt.hash('Test123!', 10);

    // Update all test users with the same password
    await client.query(`
        UPDATE users 
        SET password_hash = $1 
        WHERE email IN ('admin@test.uz', 'master@test.uz', 'operator@test.uz', 'client@test.uz')
    `, [passwordHash]);

    console.log('✅ Passwords reset to: Test123!');
    console.log('\nTest accounts:');
    console.log('  admin@test.uz    / Test123!');
    console.log('  master@test.uz   / Test123!');
    console.log('  operator@test.uz / Test123!');
    console.log('  client@test.uz   / Test123!');

    await client.end();
}

resetPassword().catch(console.error);
