import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddDetailIdToPriceHistory1772715000000 implements MigrationInterface {
    name = 'AddDetailIdToPriceHistory1772715000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'order_price_history',
            new TableColumn({
                name: 'order_detail_id',
                type: 'uuid',
                isNullable: true,
            }),
        );

        await queryRunner.createForeignKey(
            'order_price_history',
            new TableForeignKey({
                columnNames: ['order_detail_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'order_details',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('order_price_history');
        if (table) {
            const foreignKey = table.foreignKeys.find(
                (fk) => fk.columnNames.indexOf('order_detail_id') !== -1,
            );
            if (foreignKey) {
                await queryRunner.dropForeignKey('order_price_history', foreignKey);
            }
        }
        await queryRunner.dropColumn('order_price_history', 'order_detail_id');
    }
}
