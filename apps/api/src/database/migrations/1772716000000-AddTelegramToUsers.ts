import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTelegramToUsers1772716000000 implements MigrationInterface {
    name = 'AddTelegramToUsers1772716000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (!(await queryRunner.hasColumn('users', 'telegram'))) {
            await queryRunner.query(`
                ALTER TABLE "users"
                ADD COLUMN "telegram" VARCHAR(100)
            `);
        }

        await queryRunner.query(`
            UPDATE "users" AS u
            SET "telegram" = c."telegram"
            FROM "clients" AS c
            WHERE c."user_id" = u."id"
              AND c."telegram" IS NOT NULL
              AND (u."telegram" IS NULL OR u."telegram" = '')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (await queryRunner.hasColumn('users', 'telegram')) {
            await queryRunner.query(`
                ALTER TABLE "users"
                DROP COLUMN "telegram"
            `);
        }
    }
}
