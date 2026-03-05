import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddPaymentConstraints1712579000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add external_txn_id column if it doesn't exist
        const table = await queryRunner.getTable('payments');
        const columnExists = table?.columns.find(col => col.name === 'external_txn_id');
        
        if (!columnExists) {
            await queryRunner.addColumn('payments', new TableColumn({
                name: 'external_txn_id',
                type: 'varchar',
                length: '255',
                isNullable: true,
            }));
        }
        
        // Add provider column if it doesn't exist
        const providerColumnExists = table?.columns.find(col => col.name === 'provider');
        
        if (!providerColumnExists) {
            await queryRunner.addColumn('payments', new TableColumn({
                name: 'provider',
                type: 'varchar',
                length: '50',
                default: "'other'",
                isNullable: false,
            }));
        }

        // Create unique index on (provider, external_txn_id)
        try {
            await queryRunner.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_external_id 
                ON payments(provider, external_txn_id) 
                WHERE external_txn_id IS NOT NULL
            `);
        } catch (err) {
            // Handle case where index already exists
            console.log('Index idx_payments_provider_external_id already exists');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        try {
            await queryRunner.query(`DROP INDEX IF EXISTS idx_payments_provider_external_id`);
        } catch (err) {
            console.log('Index idx_payments_provider_external_id does not exist');
        }
        
        const table = await queryRunner.getTable('payments');
        const externalTxnCol = table?.columns.find(col => col.name === 'external_txn_id');
        const providerCol = table?.columns.find(col => col.name === 'provider');
        
        if (externalTxnCol) {
            await queryRunner.dropColumn('payments', 'external_txn_id');
        }
        
        if (providerCol) {
            await queryRunner.dropColumn('payments', 'provider');
        }
    }

}
