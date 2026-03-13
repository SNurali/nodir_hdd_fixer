import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddGenderAndDateOfBirthToUsersAndClients1773300000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add columns to users table
        await queryRunner.addColumn(
            'users',
            new TableColumn({
                name: 'gender',
                type: 'varchar',
                length: '10',
                isNullable: true,
            }),
        );

        await queryRunner.addColumn(
            'users',
            new TableColumn({
                name: 'date_of_birth',
                type: 'date',
                isNullable: true,
            }),
        );

        // Add columns to clients table
        await queryRunner.addColumn(
            'clients',
            new TableColumn({
                name: 'gender',
                type: 'varchar',
                length: '10',
                isNullable: true,
            }),
        );

        await queryRunner.addColumn(
            'clients',
            new TableColumn({
                name: 'date_of_birth',
                type: 'date',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove columns from clients table
        await queryRunner.dropColumn('clients', 'date_of_birth');
        await queryRunner.dropColumn('clients', 'gender');

        // Remove columns from users table
        await queryRunner.dropColumn('users', 'date_of_birth');
        await queryRunner.dropColumn('users', 'gender');
    }
}
