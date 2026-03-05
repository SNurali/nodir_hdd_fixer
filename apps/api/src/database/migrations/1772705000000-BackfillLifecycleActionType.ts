import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillLifecycleActionType1772705000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasActionType = await queryRunner.hasColumn('order_lifecycle', 'action_type');
        if (!hasActionType) return;

        await queryRunner.query(`
            ALTER TABLE "order_lifecycle"
            ALTER COLUMN "action_type" SET DEFAULT 'status_change'
        `);

        await queryRunner.query(`
            UPDATE "order_lifecycle"
            SET "action_type" = CASE
                WHEN comments ILIKE '%order created%' OR comments ILIKE '%заказ создан%' THEN 'order_created'
                WHEN comments ILIKE '%цена одобрена%' OR comments ILIKE '%price approved%' THEN 'price_approved'
                WHEN comments ILIKE '%цена отклонена%' OR comments ILIKE '%price rejected%' THEN 'price_rejected'
                WHEN comments ILIKE '%цена установлена%' OR comments ILIKE '%price set%' OR comments ILIKE '%prices updated%' THEN 'price_set'
                WHEN comments ILIKE '%total price updated%' OR comments ILIKE '%общая цена изменена%' THEN 'price_updated'
                WHEN comments ILIKE '%master assigned%' OR comments ILIKE '%мастер назначен%' THEN 'master_assigned'
                WHEN comments ILIKE '%item completed%' OR comments ILIKE '%работа выполн%' THEN 'item_completed'
                WHEN comments ILIKE '%order closed%' OR comments ILIKE '%заказ закрыт%' THEN 'order_closed'
                WHEN comments ILIKE '%status changed%' OR comments ILIKE '%статус измен%' THEN 'status_change'
                ELSE 'status_change'
            END
            WHERE "action_type" IS NULL OR "action_type" = '' OR "action_type" = 'null'
        `);

        const hasActorId = await queryRunner.hasColumn('order_lifecycle', 'actor_id');
        if (hasActorId) {
            await queryRunner.query(`
                UPDATE "order_lifecycle"
                SET "actor_id" = "created_by"
                WHERE "actor_id" IS NULL
            `);
        }

        const hasReason = await queryRunner.hasColumn('order_lifecycle', 'reason');
        if (hasReason) {
            await queryRunner.query(`
                UPDATE "order_lifecycle"
                SET "reason" = comments
                WHERE "reason" IS NULL AND comments IS NOT NULL
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasActionType = await queryRunner.hasColumn('order_lifecycle', 'action_type');
        if (!hasActionType) return;

        await queryRunner.query(`
            ALTER TABLE "order_lifecycle"
            ALTER COLUMN "action_type" DROP DEFAULT
        `);
    }
}
