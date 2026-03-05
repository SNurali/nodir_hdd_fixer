import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserAvatarUrl1772714000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        if (!(await queryRunner.hasColumn('users', 'avatar_url'))) {
            await queryRunner.addColumn(
                'users',
                new TableColumn({
                    name: 'avatar_url',
                    type: 'varchar',
                    length: '1024',
                    isNullable: true,
                }),
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (await queryRunner.hasColumn('users', 'avatar_url')) {
            await queryRunner.dropColumn('users', 'avatar_url');
        }
    }
}
