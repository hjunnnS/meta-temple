CREATE TABLE accounts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 email text UNIQUE NOT NULL CHECK (email=lower(email) AND email LIKE '%@example.test')
);
CREATE TABLE login_links (digest text PRIMARY KEY, account_id uuid NOT NULL REFERENCES accounts, expires_at timestamptz NOT NULL);
CREATE TABLE sessions (digest text PRIMARY KEY, account_id uuid NOT NULL REFERENCES accounts, expires_at timestamptz NOT NULL);
CREATE TABLE products (kind text PRIMARY KEY);
CREATE TABLE slots (
 id text PRIMARY KEY, temple_id text NOT NULL, zone_id text NOT NULL,
 kind text NOT NULL REFERENCES products, x double precision NOT NULL,y double precision NOT NULL,z double precision NOT NULL,
 rotation_y double precision NOT NULL,layout_version text NOT NULL, UNIQUE(id,kind)
);
CREATE TABLE reservations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),account_id uuid NOT NULL REFERENCES accounts,slot_id text NOT NULL,kind text NOT NULL,
 expires_at timestamptz NOT NULL, released_at timestamptz, FOREIGN KEY(slot_id,kind) REFERENCES slots(id,kind), UNIQUE(id,account_id,slot_id)
);
CREATE UNIQUE INDEX active_reservation ON reservations(slot_id) WHERE released_at IS NULL;
CREATE TABLE orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),reservation_id uuid UNIQUE NOT NULL,account_id uuid NOT NULL,slot_id text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), amount_krw integer NOT NULL CHECK(amount_krw>=0),
 FOREIGN KEY(reservation_id,account_id,slot_id) REFERENCES reservations(id,account_id,slot_id), UNIQUE(id,account_id,slot_id)
);
CREATE TABLE installations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid UNIQUE NOT NULL,account_id uuid NOT NULL,slot_id text NOT NULL,
 starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL CHECK(ends_at>starts_at),removed_at timestamptz,
 FOREIGN KEY(order_id,account_id,slot_id) REFERENCES orders(id,account_id,slot_id)
);
CREATE UNIQUE INDEX installed_slot ON installations(slot_id) WHERE removed_at IS NULL;
CREATE TABLE events (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,kind text NOT NULL,account_id uuid REFERENCES accounts,order_id uuid REFERENCES orders,created_at timestamptz NOT NULL DEFAULT now());
