import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommentsTranslationsToOrderLifecycle1773488400000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasCommentsEn = await queryRunner.hasColumn('order_lifecycle', 'comments_en');
        if (!hasCommentsEn) {
            await queryRunner.query(`
                ALTER TABLE "order_lifecycle"
                ADD COLUMN "comments_en" text
            `);
        }

        const hasCommentsUz = await queryRunner.hasColumn('order_lifecycle', 'comments_uz');
        if (!hasCommentsUz) {
            await queryRunner.query(`
                ALTER TABLE "order_lifecycle"
                ADD COLUMN "comments_uz" text
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "order_lifecycle"
            DROP COLUMN IF EXISTS "comments_en",
            DROP COLUMN IF EXISTS "comments_uz"
        `);
    }
}
