import { MigrationInterface, QueryRunner } from 'typeorm';

export class RebuildOrderStatuses1772713000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "orders"
            SET "status" = CASE "status"
                WHEN 'accepted' THEN 'assigned'
                WHEN 'pending_approval' THEN 'awaiting_approval'
                WHEN 'waiting_for_approval' THEN 'awaiting_approval'
                WHEN 'awaiting_client_approval' THEN 'awaiting_approval'
                WHEN 'in_progress' THEN 'in_repair'
                WHEN 'waiting_for_parts' THEN 'in_repair'
                WHEN 'completed' THEN 'ready_for_pickup'
                ELSE "status"
            END
        `);

        await queryRunner.query(`
            UPDATE "order_lifecycle"
            SET
                "from_status" = CASE "from_status"
                    WHEN 'accepted' THEN 'assigned'
                    WHEN 'pending_approval' THEN 'awaiting_approval'
                    WHEN 'waiting_for_approval' THEN 'awaiting_approval'
                    WHEN 'awaiting_client_approval' THEN 'awaiting_approval'
                    WHEN 'in_progress' THEN 'in_repair'
                    WHEN 'waiting_for_parts' THEN 'in_repair'
                    WHEN 'completed' THEN 'ready_for_pickup'
                    ELSE "from_status"
                END,
                "to_status" = CASE "to_status"
                    WHEN 'accepted' THEN 'assigned'
                    WHEN 'pending_approval' THEN 'awaiting_approval'
                    WHEN 'waiting_for_approval' THEN 'awaiting_approval'
                    WHEN 'awaiting_client_approval' THEN 'awaiting_approval'
                    WHEN 'in_progress' THEN 'in_repair'
                    WHEN 'waiting_for_parts' THEN 'in_repair'
                    WHEN 'completed' THEN 'ready_for_pickup'
                    ELSE "to_status"
                END
        `);

        await queryRunner.query(`
            UPDATE "order_lifecycle"
            SET "metadata" =
                jsonb_set(
                    jsonb_set(
                        jsonb_set(
                            jsonb_set(
                                "metadata",
                                '{old_value}',
                                to_jsonb(CASE "metadata"->>'old_value'
                                    WHEN 'accepted' THEN 'assigned'
                                    WHEN 'pending_approval' THEN 'awaiting_approval'
                                    WHEN 'waiting_for_approval' THEN 'awaiting_approval'
                                    WHEN 'awaiting_client_approval' THEN 'awaiting_approval'
                                    WHEN 'in_progress' THEN 'in_repair'
                                    WHEN 'waiting_for_parts' THEN 'in_repair'
                                    WHEN 'completed' THEN 'ready_for_pickup'
                                    ELSE "metadata"->>'old_value'
                                END),
                                true
                            ),
                            '{new_value}',
                            to_jsonb(CASE "metadata"->>'new_value'
                                WHEN 'accepted' THEN 'assigned'
                                WHEN 'pending_approval' THEN 'awaiting_approval'
                                WHEN 'waiting_for_approval' THEN 'awaiting_approval'
                                WHEN 'awaiting_client_approval' THEN 'awaiting_approval'
                                WHEN 'in_progress' THEN 'in_repair'
                                WHEN 'waiting_for_parts' THEN 'in_repair'
                                WHEN 'completed' THEN 'ready_for_pickup'
                                ELSE "metadata"->>'new_value'
                            END),
                            true
                        ),
                        '{from_status}',
                        to_jsonb(CASE "metadata"->>'from_status'
                            WHEN 'accepted' THEN 'assigned'
                            WHEN 'pending_approval' THEN 'awaiting_approval'
                            WHEN 'waiting_for_approval' THEN 'awaiting_approval'
                            WHEN 'awaiting_client_approval' THEN 'awaiting_approval'
                            WHEN 'in_progress' THEN 'in_repair'
                            WHEN 'waiting_for_parts' THEN 'in_repair'
                            WHEN 'completed' THEN 'ready_for_pickup'
                            ELSE "metadata"->>'from_status'
                        END),
                        true
                    ),
                    '{to_status}',
                    to_jsonb(CASE "metadata"->>'to_status'
                        WHEN 'accepted' THEN 'assigned'
                        WHEN 'pending_approval' THEN 'awaiting_approval'
                        WHEN 'waiting_for_approval' THEN 'awaiting_approval'
                        WHEN 'awaiting_client_approval' THEN 'awaiting_approval'
                        WHEN 'in_progress' THEN 'in_repair'
                        WHEN 'waiting_for_parts' THEN 'in_repair'
                        WHEN 'completed' THEN 'ready_for_pickup'
                        ELSE "metadata"->>'to_status'
                    END),
                    true
                )
            WHERE "metadata" IS NOT NULL
        `);

        await queryRunner.query(`
            DO $$
            DECLARE r RECORD;
            BEGIN
                FOR r IN
                    SELECT conname
                    FROM pg_constraint
                    WHERE conrelid = 'orders'::regclass
                      AND contype = 'c'
                      AND pg_get_constraintdef(oid) ILIKE '%status%'
                LOOP
                    EXECUTE format('ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS %I', r.conname);
                END LOOP;
            END$$
        `);

        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD CONSTRAINT "orders_status_check"
            CHECK (
                (status)::text = ANY (
                    (ARRAY[
                        'new'::character varying,
                        'assigned'::character varying,
                        'diagnosing'::character varying,
                        'awaiting_approval'::character varying,
                        'approved'::character varying,
                        'in_repair'::character varying,
                        'ready_for_pickup'::character varying,
                        'unrepairable'::character varying,
                        'issued'::character varying,
                        'cancelled'::character varying
                    ])::text[]
                )
            )
        `);

        await queryRunner.query(`DROP INDEX IF EXISTS "idx_orders_deadline"`);
        await queryRunner.query(`
            CREATE INDEX "idx_orders_deadline" ON "orders" ("deadline")
            WHERE (
                (deadline IS NOT NULL)
                AND ((status)::text <> ALL ((ARRAY['issued'::character varying, 'cancelled'::character varying])::text[]))
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "orders"
            SET "status" = CASE "status"
                WHEN 'assigned' THEN 'accepted'
                WHEN 'awaiting_approval' THEN 'pending_approval'
                WHEN 'in_repair' THEN 'in_progress'
                WHEN 'ready_for_pickup' THEN 'completed'
                ELSE "status"
            END
        `);

        await queryRunner.query(`
            UPDATE "order_lifecycle"
            SET
                "from_status" = CASE "from_status"
                    WHEN 'assigned' THEN 'accepted'
                    WHEN 'awaiting_approval' THEN 'pending_approval'
                    WHEN 'in_repair' THEN 'in_progress'
                    WHEN 'ready_for_pickup' THEN 'completed'
                    ELSE "from_status"
                END,
                "to_status" = CASE "to_status"
                    WHEN 'assigned' THEN 'accepted'
                    WHEN 'awaiting_approval' THEN 'pending_approval'
                    WHEN 'in_repair' THEN 'in_progress'
                    WHEN 'ready_for_pickup' THEN 'completed'
                    ELSE "to_status"
                END
        `);

        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_status_check"`);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD CONSTRAINT "orders_status_check"
            CHECK (
                (status)::text = ANY (
                    (ARRAY[
                        'new'::character varying,
                        'accepted'::character varying,
                        'diagnosing'::character varying,
                        'pending_approval'::character varying,
                        'approved'::character varying,
                        'in_progress'::character varying,
                        'waiting_for_parts'::character varying,
                        'completed'::character varying,
                        'unrepairable'::character varying,
                        'issued'::character varying,
                        'cancelled'::character varying
                    ])::text[]
                )
            )
        `);

        await queryRunner.query(`DROP INDEX IF EXISTS "idx_orders_deadline"`);
        await queryRunner.query(`
            CREATE INDEX "idx_orders_deadline" ON "orders" ("deadline")
            WHERE (
                (deadline IS NOT NULL)
                AND ((status)::text <> ALL ((ARRAY['completed'::character varying, 'issued'::character varying])::text[]))
            )
        `);
    }
}
