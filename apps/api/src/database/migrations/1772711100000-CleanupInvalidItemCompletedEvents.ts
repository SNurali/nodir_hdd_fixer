import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanupInvalidItemCompletedEvents1772711100000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasActionType = await queryRunner.hasColumn('order_lifecycle', 'action_type');
        if (!hasActionType) return;

        // Remove item_completed events that happened before order actually
        // entered repair, and events for orders that never entered it.
        // Supports both old (in_progress) and new (in_repair) status values.
        await queryRunner.query(`
            WITH first_repair_status AS (
                SELECT
                    order_id,
                    MIN(created_at) AS first_repair_at
                FROM order_lifecycle
                WHERE action_type = 'status_change'
                  AND (
                    to_status IN ('in_progress', 'in_repair')
                    OR metadata ->> 'new_value' IN ('in_progress', 'in_repair')
                  )
                GROUP BY order_id
            )
            DELETE FROM order_lifecycle l
            WHERE l.action_type = 'item_completed'
              AND (
                NOT EXISTS (
                    SELECT 1
                    FROM first_repair_status f
                    WHERE f.order_id = l.order_id
                )
                OR l.created_at < (
                    SELECT f.first_repair_at
                    FROM first_repair_status f
                    WHERE f.order_id = l.order_id
                )
              )
        `);
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // Irreversible cleanup migration
    }
}
