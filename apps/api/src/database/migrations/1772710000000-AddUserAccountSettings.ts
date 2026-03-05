import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserAccountSettings1772710000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        if (!(await queryRunner.hasColumn('users', 'account_settings'))) {
            await queryRunner.addColumn(
                'users',
                new TableColumn({
                    name: 'account_settings',
                    type: 'jsonb',
                    isNullable: true,
                    default: "'{}'::jsonb",
                }),
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (await queryRunner.hasColumn('users', 'account_settings')) {
            await queryRunner.dropColumn('users', 'account_settings');
        }
    }
}
