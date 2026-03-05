import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddOrderFields1712578000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add diagnostics_report column
        await queryRunner.addColumn('orders', new TableColumn({
            name: 'diagnostics_report',
            type: 'text',
            isNullable: true,
        }));

        // Add estimated_price column
        await queryRunner.addColumn('orders', new TableColumn({
            name: 'estimated_price',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
            isNullable: true,
        }));

        // Add estimated_days column
        await queryRunner.addColumn('orders', new TableColumn({
            name: 'estimated_days',
            type: 'integer',
            default: 0,
            isNullable: true,
        }));

        // Add version column for optimistic locking
        await queryRunner.addColumn('orders', new TableColumn({
            name: 'version',
            type: 'integer',
            default: 1,
            isNullable: false,
        }));

        // Add public_tracking_token column
        await queryRunner.addColumn('orders', new TableColumn({
            name: 'public_tracking_token',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: true,
        }));

        // Add updated_by column
        await queryRunner.addColumn('orders', new TableColumn({
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
        }));
        
        // Add updated_at column
        await queryRunner.addColumn('orders', new TableColumn({
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: true,
        }));

        // Add indexes
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_orders_public_tracking_token ON orders(public_tracking_token)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_orders_version ON orders(version)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove indexes
        await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_public_tracking_token`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_version`);

        // Remove columns
        await queryRunner.dropColumn('orders', 'updated_at');
        await queryRunner.dropColumn('orders', 'updated_by');
        await queryRunner.dropColumn('orders', 'public_tracking_token');
        await queryRunner.dropColumn('orders', 'version');
        await queryRunner.dropColumn('orders', 'estimated_days');
        await queryRunner.dropColumn('orders', 'estimated_price');
        await queryRunner.dropColumn('orders', 'diagnostics_report');
    }

}
