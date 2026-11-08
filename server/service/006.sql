CREATE TABLE staff_roles(account_id uuid NOT NULL REFERENCES accounts, role text NOT NULL CHECK(role IN ('desk','catalog','moderation')), PRIMARY KEY(account_id,role));
CREATE TABLE staff_audit(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, actor uuid NOT NULL REFERENCES accounts, role text NOT NULL, action text NOT NULL, target text NOT NULL, before_state jsonb NOT NULL, after_state jsonb NOT NULL, reason text NOT NULL, changed_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE offers ADD COLUMN revision integer NOT NULL DEFAULT 1;
ALTER TABLE reservations ADD COLUMN quoted_price integer, ADD COLUMN quoted_days integer;
UPDATE reservations r SET quoted_price=f.price_krw,quoted_days=f.days FROM offers f WHERE r.offer_id=f.id;
