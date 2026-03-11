import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGoogleIdToUsers1773242798429 implements MigrationInterface {
    name = 'AddGoogleIdToUsers1773242798429'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_price_history" DROP CONSTRAINT "FK_b95e991c97ee9e9e2386708396d"`);
        await queryRunner.query(`DROP INDEX "public"."idx_orders_deadline"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "orders_status_check"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "google_id" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_0bd5012aeb82628e07f6a1be53b" UNIQUE ("google_id")`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "account_settings" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`CREATE INDEX "idx_users_google_id" ON "users" ("google_id") `);
        await queryRunner.query(`ALTER TABLE "order_price_history" ADD CONSTRAINT "FK_b95e991c97ee9e9e2386708396d" FOREIGN KEY ("order_detail_id") REFERENCES "order_details"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_price_history" DROP CONSTRAINT "FK_b95e991c97ee9e9e2386708396d"`);
        await queryRunner.query(`DROP INDEX "public"."idx_users_google_id"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "account_settings" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_0bd5012aeb82628e07f6a1be53b"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "google_id"`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "orders_status_check" CHECK (((status)::text = ANY (ARRAY[('new'::character varying)::text, ('assigned'::character varying)::text, ('diagnosing'::character varying)::text, ('awaiting_approval'::character varying)::text, ('approved'::character varying)::text, ('in_repair'::character varying)::text, ('ready_for_pickup'::character varying)::text, ('unrepairable'::character varying)::text, ('issued'::character varying)::text, ('cancelled'::character varying)::text])))`);
        await queryRunner.query(`CREATE INDEX "idx_orders_deadline" ON "orders" ("deadline") WHERE ((deadline IS NOT NULL) AND ((status)::text <> ALL (ARRAY[('issued'::character varying)::text, ('cancelled'::character varying)::text])))`);
        await queryRunner.query(`ALTER TABLE "order_price_history" ADD CONSTRAINT "FK_b95e991c97ee9e9e2386708396d" FOREIGN KEY ("order_detail_id") REFERENCES "order_details"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
