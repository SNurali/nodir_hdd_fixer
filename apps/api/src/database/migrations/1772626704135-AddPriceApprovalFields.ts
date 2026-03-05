import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPriceApprovalFields1772626704135 implements MigrationInterface {
    name = 'AddPriceApprovalFields1772626704135'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_price_history" DROP CONSTRAINT "FK_feb084fdfb9d9666eab4690d130"`);
        await queryRunner.query(`ALTER TABLE "order_price_history" DROP CONSTRAINT "FK_4ec95664a7893a0d8439319f8f3"`);
        await queryRunner.query(`DROP INDEX "public"."idx_orders_public_tracking_token"`);
        await queryRunner.query(`DROP INDEX "public"."idx_orders_version"`);
        await queryRunner.query(`DROP INDEX "public"."idx_payments_provider_external_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_order_price_history_changed_at"`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "price_approved_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "price_rejected_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "updated_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_e28921afbfd1899989718cc0d51"`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "cashier_by" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "UQ_0942ab806143ef6a2c888dce03b" UNIQUE ("external_txn_id")`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_e28921afbfd1899989718cc0d51" FOREIGN KEY ("cashier_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_price_history" ADD CONSTRAINT "FK_feb084fdfb9d9666eab4690d130" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_price_history" ADD CONSTRAINT "FK_4ec95664a7893a0d8439319f8f3" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_price_history" DROP CONSTRAINT "FK_4ec95664a7893a0d8439319f8f3"`);
        await queryRunner.query(`ALTER TABLE "order_price_history" DROP CONSTRAINT "FK_feb084fdfb9d9666eab4690d130"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_e28921afbfd1899989718cc0d51"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "UQ_0942ab806143ef6a2c888dce03b"`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "cashier_by" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_e28921afbfd1899989718cc0d51" FOREIGN KEY ("cashier_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "price_rejected_at"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "price_approved_at"`);
        await queryRunner.query(`CREATE INDEX "idx_order_price_history_changed_at" ON "order_price_history" ("changed_at") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_payments_provider_external_id" ON "payments" ("external_txn_id", "provider") WHERE (external_txn_id IS NOT NULL)`);
        await queryRunner.query(`CREATE INDEX "idx_orders_version" ON "orders" ("version") `);
        await queryRunner.query(`CREATE INDEX "idx_orders_public_tracking_token" ON "orders" ("public_tracking_token") `);
        await queryRunner.query(`ALTER TABLE "order_price_history" ADD CONSTRAINT "FK_4ec95664a7893a0d8439319f8f3" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_price_history" ADD CONSTRAINT "FK_feb084fdfb9d9666eab4690d130" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
