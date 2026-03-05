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
    console.log('🌱 Starting seed...');

    // Seed Roles
    const roles = [
        {
            name_rus: 'Администратор',
            name_cyr: 'Администратор',
            name_lat: 'Administrator',
            name_eng: 'admin',
        },
        {
            name_rus: 'Оператор',
            name_cyr: 'Оператор',
            name_lat: 'Operator',
            name_eng: 'operator',
        },
        {
            name_rus: 'Мастер',
            name_cyr: 'Уста',
            name_lat: 'Usta',
            name_eng: 'master',
        },
        {
            name_rus: 'Клиент',
            name_cyr: 'Мижоз',
            name_lat: 'Mijoz',
            name_eng: 'client',
        },
    ];

    for (const role of roles) {
        const exists = await dataSource.query(
            `SELECT id FROM roles WHERE name_eng = $1`,
            [role.name_eng],
        );
        if (exists.length === 0) {
            await dataSource.query(
                `INSERT INTO roles (name_rus, name_cyr, name_lat, name_eng)
         VALUES ($1, $2, $3, $4)`,
                [role.name_rus, role.name_cyr, role.name_lat, role.name_eng],
            );
            console.log(`  ✅ Role '${role.name_eng}' created`);
        } else {
            console.log(`  ⏭️  Role '${role.name_eng}' already exists`);
        }
    }

    // Seed Admin User
    const adminRole = await dataSource.query(
        `SELECT id FROM roles WHERE name_eng = 'admin'`,
    );
    if (adminRole.length > 0) {
        const adminExists = await dataSource.query(
            `SELECT id FROM users WHERE email = 'admin@hdd-fixer.uz'`,
        );
        if (adminExists.length === 0) {
            const passwordHash = await bcrypt.hash('admin123', 10);
            await dataSource.query(
                `INSERT INTO users (full_name, email, phone, password_hash, role_id, preferred_language)
         VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    'System Admin',
                    'admin@hdd-fixer.uz',
                    '+998900000001',
                    passwordHash,
                    adminRole[0].id,
                    'ru',
                ],
            );
            console.log(`  ✅ Admin user created (admin@hdd-fixer.uz / admin123)`);
        } else {
            console.log(`  ⏭️  Admin user already exists`);
        }
    }

    // Seed Sample Equipments
    const equipments = [
        {
            name_rus: 'Жесткий диск',
            name_cyr: 'Қаттиқ диск',
            name_lat: 'Qattiq disk',
            name_eng: 'Hard Drive',
        },
        {
            name_rus: 'Ноутбук',
            name_cyr: 'Ноутбук',
            name_lat: 'Noutbuk',
            name_eng: 'Laptop',
        },
        {
            name_rus: 'Настольный компьютер',
            name_cyr: 'Стол компьютери',
            name_lat: 'Stol kompyuteri',
            name_eng: 'Desktop PC',
        },
        {
            name_rus: 'SSD накопитель',
            name_cyr: 'SSD хотира',
            name_lat: 'SSD xotira',
            name_eng: 'SSD Drive',
        },
        {
            name_rus: 'Сервер',
            name_cyr: 'Сервер',
            name_lat: 'Server',
            name_eng: 'Server',
        },
    ];

    for (const eq of equipments) {
        const exists = await dataSource.query(
            `SELECT id FROM equipments WHERE name_eng = $1`,
            [eq.name_eng],
        );
        if (exists.length === 0) {
            await dataSource.query(
                `INSERT INTO equipments (name_rus, name_cyr, name_lat, name_eng) VALUES ($1, $2, $3, $4)`,
                [eq.name_rus, eq.name_cyr, eq.name_lat, eq.name_eng],
            );
            console.log(`  ✅ Equipment '${eq.name_eng}' created`);
        }
    }

    // Seed Sample Services
    const services = [
        {
            name_rus: 'Диагностика',
            name_cyr: 'Диагностика',
            name_lat: 'Diagnostika',
            name_eng: 'Diagnostics',
        },
        {
            name_rus: 'Восстановление данных',
            name_cyr: 'Маълумотларни тиклаш',
            name_lat: "Ma'lumotlarni tiklash",
            name_eng: 'Data Recovery',
        },
        {
            name_rus: 'Замена компонентов',
            name_cyr: 'Компонентларни алмаштириш',
            name_lat: 'Komponentlarni almashtirish',
            name_eng: 'Component Replacement',
        },
        {
            name_rus: 'Чистка и профилактика',
            name_cyr: 'Тозалаш ва профилактика',
            name_lat: 'Tozalash va profilaktika',
            name_eng: 'Cleaning & Maintenance',
        },
    ];

    for (const svc of services) {
        const exists = await dataSource.query(
            `SELECT id FROM services WHERE name_eng = $1`,
            [svc.name_eng],
        );
        if (exists.length === 0) {
            await dataSource.query(
                `INSERT INTO services (name_rus, name_cyr, name_lat, name_eng) VALUES ($1, $2, $3, $4)`,
                [svc.name_rus, svc.name_cyr, svc.name_lat, svc.name_eng],
            );
            console.log(`  ✅ Service '${svc.name_eng}' created`);
        }
    }

    // Seed Sample Issues
    const issues = [
        {
            name_rus: 'Не включается',
            name_cyr: 'Ишга тушмаяпти',
            name_lat: "Ishga tushmayapti",
            name_eng: 'Does not power on',
        },
        {
            name_rus: 'Посторонние шумы',
            name_cyr: 'Бегона шовқинлар',
            name_lat: "Begona shovqinlar",
            name_eng: 'Unusual noises',
        },
        {
            name_rus: 'Потеря данных',
            name_cyr: 'Маълумот йўқолиши',
            name_lat: "Ma'lumot yo'qolishi",
            name_eng: 'Data loss',
        },
        {
            name_rus: 'Медленная работа',
            name_cyr: 'Секин ишлаяпти',
            name_lat: 'Sekin ishlayapti',
            name_eng: 'Slow performance',
        },
        {
            name_rus: 'Перегрев',
            name_cyr: 'Қизиб кетиш',
            name_lat: 'Qizib ketish',
            name_eng: 'Overheating',
        },
    ];

    for (const issue of issues) {
        const exists = await dataSource.query(
            `SELECT id FROM issues WHERE name_eng = $1`,
            [issue.name_eng],
        );
        if (exists.length === 0) {
            await dataSource.query(
                `INSERT INTO issues (name_rus, name_cyr, name_lat, name_eng) VALUES ($1, $2, $3, $4)`,
                [issue.name_rus, issue.name_cyr, issue.name_lat, issue.name_eng],
            );
            console.log(`  ✅ Issue '${issue.name_eng}' created`);
        }
    }

    console.log('\n🌱 Seed completed!');
    await dataSource.destroy();
}

runSeed().catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
});
