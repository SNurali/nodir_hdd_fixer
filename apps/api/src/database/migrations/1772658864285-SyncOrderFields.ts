import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncOrderFields1772658864285 implements MigrationInterface {
    name = 'SyncOrderFields1772658864285'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_details" ADD "master_accepted_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "order_details" ADD "completed_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "order_details" ADD "completed_comments" text`);
        await queryRunner.query(`ALTER TABLE "order_details" ADD "attached_by" uuid`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "price_approved_by" uuid`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "cancelled_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "cancelled_by" uuid`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "accepted_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "accepted_by" uuid`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "price_last_updated" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "price_last_updated_by" uuid`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "price_rejected_by" uuid`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "price_rejection_reason" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "price_rejection_reason"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "price_rejected_by"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "price_last_updated_by"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "price_last_updated"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "accepted_by"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "accepted_at"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "cancelled_by"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "cancelled_at"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "price_approved_by"`);
        await queryRunner.query(`ALTER TABLE "order_details" DROP COLUMN "attached_by"`);
        await queryRunner.query(`ALTER TABLE "order_details" DROP COLUMN "completed_comments"`);
        await queryRunner.query(`ALTER TABLE "order_details" DROP COLUMN "completed_at"`);
        await queryRunner.query(`ALTER TABLE "order_details" DROP COLUMN "master_accepted_at"`);
    }

}
