import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../../../../.env');
dotenv.config({ path: envPath });

export default new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'hdd_fixer',
    password: process.env.DB_PASSWORD || 'hdd_fixer_secret',
    database: process.env.DB_DATABASE || 'hdd_fixer_db',
    entities: [__dirname + '/entities/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    synchronize: false,
    logging: true,
});
