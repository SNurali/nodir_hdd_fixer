import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1709344000000 implements MigrationInterface {
  name = 'InitialSchema1709344000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // Roles
    await queryRunner.query(`
      CREATE TABLE roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name_rus VARCHAR(100) NOT NULL,
        name_cyr VARCHAR(100) NOT NULL,
        name_lat VARCHAR(100) NOT NULL,
        name_eng VARCHAR(100) NOT NULL,
        created_by UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Users
    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20) UNIQUE,
        password_hash VARCHAR(255),
        role_id UUID NOT NULL REFERENCES roles(id),
        preferred_language VARCHAR(6) NOT NULL DEFAULT 'ru'
          CHECK (preferred_language IN ('uz-cyr', 'uz-lat', 'ru', 'en')),
        fcm_token TEXT,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_users_role_id ON users(role_id)`);
    await queryRunner.query(`CREATE INDEX idx_users_email ON users(email)`);
    await queryRunner.query(`CREATE INDEX idx_users_phone ON users(phone)`);

    // Add FK from roles.created_by -> users.id
    await queryRunner.query(`
      ALTER TABLE roles ADD CONSTRAINT fk_roles_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
    `);

    // Clients
    await queryRunner.query(`
      CREATE TABLE clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        telegram VARCHAR(100),
        email VARCHAR(255),
        preferred_language VARCHAR(6) NOT NULL DEFAULT 'ru'
          CHECK (preferred_language IN ('uz-cyr', 'uz-lat', 'ru', 'en')),
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_clients_phone ON clients(phone)`);
    await queryRunner.query(`CREATE INDEX idx_clients_user_id ON clients(user_id)`);
    await queryRunner.query(`
      CREATE INDEX idx_clients_full_name ON clients
        USING gin(to_tsvector('simple', full_name))
    `);

    // Equipments
    await queryRunner.query(`
      CREATE TABLE equipments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name_rus VARCHAR(255) NOT NULL,
        name_cyr VARCHAR(255) NOT NULL,
        name_lat VARCHAR(255) NOT NULL,
        name_eng VARCHAR(255) NOT NULL,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Services
    await queryRunner.query(`
      CREATE TABLE services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name_rus VARCHAR(255) NOT NULL,
        name_cyr VARCHAR(255) NOT NULL,
        name_lat VARCHAR(255) NOT NULL,
        name_eng VARCHAR(255) NOT NULL,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Issues
    await queryRunner.query(`
      CREATE TABLE issues (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name_rus VARCHAR(255) NOT NULL,
        name_cyr VARCHAR(255) NOT NULL,
        name_lat VARCHAR(255) NOT NULL,
        name_eng VARCHAR(255) NOT NULL,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Orders
    await queryRunner.query(`
      CREATE TABLE orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_date DATE NOT NULL DEFAULT CURRENT_DATE,
        order_time TIME NOT NULL DEFAULT CURRENT_TIME,
        status VARCHAR(30) NOT NULL DEFAULT 'new'
          CHECK (status IN (
            'new', 'accepted', 'in_progress', 'waiting_for_parts',
            'completed', 'unrepairable', 'issued'
          )),
        deadline TIMESTAMPTZ,
        language VARCHAR(6) NOT NULL DEFAULT 'ru'
          CHECK (language IN ('uz-cyr', 'uz-lat', 'ru', 'en')),
        client_id UUID NOT NULL REFERENCES clients(id),
        total_qty INTEGER NOT NULL DEFAULT 0,
        total_price_uzs DECIMAL(18,2) NOT NULL DEFAULT 0,
        total_paid_uzs DECIMAL(18,2) NOT NULL DEFAULT 0,
        total_paid_usd DECIMAL(18,2) NOT NULL DEFAULT 0,
        total_paid_eur DECIMAL(18,2) NOT NULL DEFAULT 0,
        currency_rate_usd DECIMAL(12,4) DEFAULT 0,
        currency_rate_eur DECIMAL(12,4) DEFAULT 0,
        total_completed_orders INTEGER NOT NULL DEFAULT 0,
        closed_at TIMESTAMPTZ,
        closed_by UUID REFERENCES users(id),
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_orders_client_id ON orders(client_id)`);
    await queryRunner.query(`CREATE INDEX idx_orders_status ON orders(status)`);
    await queryRunner.query(`CREATE INDEX idx_orders_created_by ON orders(created_by)`);
    await queryRunner.query(`CREATE INDEX idx_orders_created_at ON orders(created_at DESC)`);
    await queryRunner.query(`
      CREATE INDEX idx_orders_deadline ON orders(deadline)
        WHERE deadline IS NOT NULL AND status NOT IN ('completed', 'issued')
    `);

    // Order Details
    await queryRunner.query(`
      CREATE TABLE order_details (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        service_id UUID NOT NULL REFERENCES services(id),
        equipment_id UUID NOT NULL REFERENCES equipments(id),
        issue_id UUID NOT NULL REFERENCES issues(id),
        description_of_issue TEXT,
        price DECIMAL(18,2) NOT NULL DEFAULT 0,
        attached_to UUID REFERENCES users(id),
        attached_at TIMESTAMPTZ,
        accepted_by UUID REFERENCES users(id),
        accepted_at TIMESTAMPTZ,
        took_equipment_at TIMESTAMPTZ,
        took_equipment_by UUID REFERENCES users(id),
        returned_at TIMESTAMPTZ,
        returned_by UUID REFERENCES users(id),
        is_completed SMALLINT NOT NULL DEFAULT 0
          CHECK (is_completed IN (0, 1, 2)),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_order_details_order_id ON order_details(order_id)`);
    await queryRunner.query(`
      CREATE INDEX idx_order_details_attached_to ON order_details(attached_to)
        WHERE attached_to IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX idx_order_details_is_completed ON order_details(is_completed)
        WHERE is_completed = 0
    `);

    // Order Lifecycle
    await queryRunner.query(`
      CREATE TABLE order_lifecycle (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        order_details_id UUID REFERENCES order_details(id) ON DELETE CASCADE,
        comments TEXT,
        is_completed SMALLINT NOT NULL DEFAULT 0,
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_order_lifecycle_order_id ON order_lifecycle(order_id)`);
    await queryRunner.query(`
      CREATE INDEX idx_order_lifecycle_details_id ON order_lifecycle(order_details_id)
        WHERE order_details_id IS NOT NULL
    `);

    // Payments
    await queryRunner.query(`
      CREATE TABLE payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        payment_type VARCHAR(20) NOT NULL
          CHECK (payment_type IN (
            'UZCARD', 'HUMO', 'VISA', 'CLICK',
            'PAYME', 'CASH', 'FREE', 'PAYNET', 'UZUM'
          )),
        paid_amount DECIMAL(18,2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'UZS'
          CHECK (currency IN ('UZS', 'USD', 'EUR')),
        paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        cashier_by UUID REFERENCES users(id)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_payments_order_id ON payments(order_id)`);

    // Notifications
    await queryRunner.query(`
      CREATE TABLE notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        order_id UUID REFERENCES orders(id),
        channel VARCHAR(10) NOT NULL CHECK (channel IN ('email', 'sms', 'push')),
        template_key VARCHAR(100) NOT NULL,
        language VARCHAR(6) NOT NULL,
        payload JSONB DEFAULT '{}',
        status VARCHAR(10) NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending', 'sent', 'failed')),
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        sent_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_notifications_user_id ON notifications(user_id)`);
    await queryRunner.query(`
      CREATE INDEX idx_notifications_status ON notifications(status)
        WHERE status = 'pending'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS notifications CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS payments CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS order_lifecycle CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS order_details CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS orders CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS issues CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS services CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS equipments CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS clients CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS users CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS roles CASCADE`);
  }
}
