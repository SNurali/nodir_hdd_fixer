import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLifecycleActorFields1772581000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        if (!(await queryRunner.hasColumn('order_lifecycle', 'actor_id'))) {
            await queryRunner.addColumn(
                'order_lifecycle',
                new TableColumn({
                    name: 'actor_id',
                    type: 'uuid',
                    isNullable: true,
                }),
            );
        }

        if (!(await queryRunner.hasColumn('order_lifecycle', 'actor_role'))) {
            await queryRunner.addColumn(
                'order_lifecycle',
                new TableColumn({
                    name: 'actor_role',
                    type: 'varchar',
                    length: '50',
                    isNullable: true,
                }),
            );
        }

        if (!(await queryRunner.hasColumn('order_lifecycle', 'from_status'))) {
            await queryRunner.addColumn(
                'order_lifecycle',
                new TableColumn({
                    name: 'from_status',
                    type: 'varchar',
                    length: '50',
                    isNullable: true,
                }),
            );
        }

        if (!(await queryRunner.hasColumn('order_lifecycle', 'to_status'))) {
            await queryRunner.addColumn(
                'order_lifecycle',
                new TableColumn({
                    name: 'to_status',
                    type: 'varchar',
                    length: '50',
                    isNullable: true,
                }),
            );
        }

        if (!(await queryRunner.hasColumn('order_lifecycle', 'reason'))) {
            await queryRunner.addColumn(
                'order_lifecycle',
                new TableColumn({
                    name: 'reason',
                    type: 'text',
                    isNullable: true,
                }),
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (await queryRunner.hasColumn('order_lifecycle', 'reason')) {
            await queryRunner.dropColumn('order_lifecycle', 'reason');
        }

        if (await queryRunner.hasColumn('order_lifecycle', 'to_status')) {
            await queryRunner.dropColumn('order_lifecycle', 'to_status');
        }

        if (await queryRunner.hasColumn('order_lifecycle', 'from_status')) {
            await queryRunner.dropColumn('order_lifecycle', 'from_status');
        }

        if (await queryRunner.hasColumn('order_lifecycle', 'actor_role')) {
            await queryRunner.dropColumn('order_lifecycle', 'actor_role');
        }

        if (await queryRunner.hasColumn('order_lifecycle', 'actor_id')) {
            await queryRunner.dropColumn('order_lifecycle', 'actor_id');
        }
    }
}
