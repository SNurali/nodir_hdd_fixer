import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanupLegacyStatusDuplicates1772711000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasActionType = await queryRunner.hasColumn('order_lifecycle', 'action_type');
        if (!hasActionType) return;

        // Legacy duplicate rows created before status-history fix.
        // We keep rich "Статус изменён с ... на ..." records and remove
        // short "Status changed to ..." duplicates.
        await queryRunner.query(`
            DELETE FROM "order_lifecycle"
            WHERE action_type = 'status_change'
              AND comments ILIKE 'Status changed to %'
        `);
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // Irreversible cleanup migration
    }
}
