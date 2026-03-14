import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to fix empty client data by syncing from users table.
 * 
 * This fixes orders where client.full_name and client.phone are empty
 * because the client was created via Google OAuth or before the sync fix.
 */
export class FixEmptyClientData1773600000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update clients with empty full_name from users table
        await queryRunner.query(`
            UPDATE clients c
            SET full_name = u.full_name
            FROM users u
            WHERE c.user_id = u.id
            AND (c.full_name IS NULL OR c.full_name = '' OR c.full_name = 'Guest Client')
            AND u.full_name IS NOT NULL
            AND u.full_name != ''
        `);

        // Update clients with empty phone from users table
        await queryRunner.query(`
            UPDATE clients c
            SET phone = u.phone
            FROM users u
            WHERE c.user_id = u.id
            AND (c.phone IS NULL OR c.phone = '')
            AND u.phone IS NOT NULL
            AND u.phone != ''
        `);

        // Update clients with empty telegram from users table
        await queryRunner.query(`
            UPDATE clients c
            SET telegram = u.telegram
            FROM users u
            WHERE c.user_id = u.id
            AND c.telegram IS NULL
            AND u.telegram IS NOT NULL
            AND u.telegram != ''
        `);

        // Update clients with empty email from users table
        await queryRunner.query(`
            UPDATE clients c
            SET email = u.email
            FROM users u
            WHERE c.user_id = u.id
            AND (c.email IS NULL OR c.email = '')
            AND u.email IS NOT NULL
            AND u.email != ''
        `);

        // Log how many records were updated
        const result = await queryRunner.query(`
            SELECT COUNT(*) as count FROM clients 
            WHERE full_name IS NOT NULL AND full_name != '' 
            AND phone IS NOT NULL AND phone != ''
        `);
        
        console.log(`[Migration] Clients with valid data: ${result[0]?.count || 0}`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No rollback - this is a data fix migration
        console.log('[Migration] FixEmptyClientData: no rollback for data fix');
    }
}