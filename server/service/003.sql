CREATE TABLE draws(slot_id text PRIMARY KEY REFERENCES slots,closes_at timestamptz NOT NULL);
CREATE TABLE entries(account_id uuid PRIMARY KEY REFERENCES accounts,slot_id text NOT NULL REFERENCES draws ON DELETE CASCADE,offer_id text NOT NULL REFERENCES offers,inscription jsonb NOT NULL);
ALTER TABLE reservations ADD COLUMN offer_id text REFERENCES offers, ADD COLUMN inscription jsonb, ADD COLUMN payment_lock boolean NOT NULL DEFAULT false;
CREATE UNIQUE INDEX one_held_per_account ON reservations(account_id) WHERE released_at IS NULL;
ALTER TABLE orders ADD COLUMN offer_id text REFERENCES offers,ADD COLUMN term_days integer,ADD COLUMN status text NOT NULL DEFAULT 'pending',
 ADD COLUMN inscription jsonb NOT NULL DEFAULT '{}';
CREATE TABLE test_receipts(order_id uuid PRIMARY KEY REFERENCES orders,amount_krw integer NOT NULL,account_id uuid NOT NULL REFERENCES accounts,status text NOT NULL DEFAULT 'pending');
CREATE TABLE receipt_events(id uuid PRIMARY KEY,order_id uuid NOT NULL REFERENCES orders);
