import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../../../../../.env');
dotenv.config({ path: envPath });

async function runSeed() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'hdd_fixer',
        password: process.env.DB_PASSWORD || 'hdd_fixer_secret',
        database: process.env.DB_DATABASE || 'hdd_fixer_db',
    });

    await dataSource.initialize();
    console.log('🌱 Starting test users seed...');

    // Get roles
    const adminRole = await dataSource.query(`SELECT id FROM roles WHERE name_eng = 'admin'`);
    const operatorRole = await dataSource.query(`SELECT id FROM roles WHERE name_eng = 'operator'`);
    const masterRole = await dataSource.query(`SELECT id FROM roles WHERE name_eng = 'master'`);
    const clientRole = await dataSource.query(`SELECT id FROM roles WHERE name_eng = 'client'`);

    if (!adminRole.length || !operatorRole.length || !masterRole.length || !clientRole.length) {
        console.error('❌ Roles not found! Run roles seed first.');
        await dataSource.destroy();
        return;
    }

    // Test users data with unique phones
    const testUsers = [
        {
            full_name: 'Admin Test',
            email: 'admin@test.uz',
            phone: '+998901111111',
            password: 'admin123',
            role_id: adminRole[0].id,
            role_name: 'admin'
        },
        {
            full_name: 'Operator Test',
            email: 'operator@test.uz',
            phone: '+998902222222',
            password: 'operator123',
            role_id: operatorRole[0].id,
            role_name: 'operator'
        },
        {
            full_name: 'Master Test',
            email: 'master@test.uz',
            phone: '+998903333333',
            password: 'master123',
            role_id: masterRole[0].id,
            role_name: 'master'
        },
        {
            full_name: 'Client Test',
            email: 'client@test.uz',
            phone: '+998904444444',
            password: 'client123',
            role_id: clientRole[0].id,
            role_name: 'client'
        }
    ];

    for (const userData of testUsers) {
        // Check if user exists
        const exists = await dataSource.query(
            `SELECT id FROM users WHERE email = $1`,
            [userData.email]
        );

        if (exists.length > 0) {
            console.log(`  ⏭️  User '${userData.email}' already exists`);
            continue;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(userData.password, 10);

        // Create user
        await dataSource.query(
            `INSERT INTO users (full_name, email, phone, password_hash, role_id, preferred_language)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                userData.full_name,
                userData.email,
                userData.phone,
                passwordHash,
                userData.role_id,
                'ru'
            ]
        );

        console.log(`  ✅ User created: ${userData.email} / ${userData.password} (${userData.role_name})`);

        // If client role, also create client record
        if (userData.role_name === 'client') {
            const userId = await dataSource.query(
                `SELECT id FROM users WHERE email = $1`,
                [userData.email]
            );

            if (userId.length > 0) {
                await dataSource.query(
                    `INSERT INTO clients (user_id, full_name, phone, preferred_language)
                     VALUES ($1, $2, $3, $4)`,
                    [
                        userId[0].id,
                        userData.full_name,
                        userData.phone,
                        'ru'
                    ]
                );
                console.log(`     └─ Client record created`);
            }
        }
    }

    console.log('\n📋 Test Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Admin:    admin@test.uz    / admin123');
    console.log('  Operator: operator@test.uz / operator123');
    console.log('  Master:   master@test.uz   / master123');
    console.log('  Client:   client@test.uz   / client123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await dataSource.destroy();
}

runSeed().catch(console.error);
