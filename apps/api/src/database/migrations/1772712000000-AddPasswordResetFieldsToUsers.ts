import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPasswordResetFieldsToUsers1772712000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        if (!(await queryRunner.hasColumn('users', 'password_reset_token_hash'))) {
            await queryRunner.addColumn(
                'users',
                new TableColumn({
                    name: 'password_reset_token_hash',
                    type: 'varchar',
                    length: '128',
                    isNullable: true,
                }),
            );
        }

        if (!(await queryRunner.hasColumn('users', 'password_reset_expires_at'))) {
            await queryRunner.addColumn(
                'users',
                new TableColumn({
                    name: 'password_reset_expires_at',
                    type: 'timestamptz',
                    isNullable: true,
                }),
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (await queryRunner.hasColumn('users', 'password_reset_expires_at')) {
            await queryRunner.dropColumn('users', 'password_reset_expires_at');
        }

        if (await queryRunner.hasColumn('users', 'password_reset_token_hash')) {
            await queryRunner.dropColumn('users', 'password_reset_token_hash');
        }
    }
}
