import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class AddPriceHistoryTable1772582000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'order_price_history',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: 'uuid',
                },
                {
                    name: 'order_id',
                    type: 'uuid',
                },
                {
                    name: 'old_price',
                    type: 'decimal',
                    precision: 18,
                    scale: 2,
                },
                {
                    name: 'new_price',
                    type: 'decimal',
                    precision: 18,
                    scale: 2,
                },
                {
                    name: 'reason',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'changed_by',
                    type: 'uuid',
                    isNullable: true,
                },
                {
                    name: 'changed_at',
                    type: 'timestamptz',
                    default: 'NOW()',
                },
            ],
            foreignKeys: [
                {
                    columnNames: ['order_id'],
                    referencedTableName: 'orders',
                    referencedColumnNames: ['id'],
                    onDelete: 'CASCADE',
                },
                {
                    columnNames: ['changed_by'],
                    referencedTableName: 'users',
                    referencedColumnNames: ['id'],
                    onDelete: 'SET NULL',
                },
            ],
            indices: [
                {
                    name: 'idx_order_price_history_order_id',
                    columnNames: ['order_id'],
                },
                {
                    name: 'idx_order_price_history_changed_at',
                    columnNames: ['changed_at'],
                },
            ],
        }), true);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('order_price_history', true, true, true);
    }

}