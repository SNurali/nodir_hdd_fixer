import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAuditFields1772536401027 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'order_lifecycle',
            new TableColumn({
                name: 'action_type',
                type: 'varchar',
                length: '50',
                isNullable: true,
            }),
        );

        await queryRunner.addColumn(
            'order_lifecycle',
            new TableColumn({
                name: 'metadata',
                type: 'jsonb',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('order_lifecycle', 'action_type');
        await queryRunner.dropColumn('order_lifecycle', 'metadata');
    }
}
