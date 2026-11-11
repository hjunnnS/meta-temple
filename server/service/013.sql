-- A local test product only. Real prices, duration and refund rules are undecided.
CREATE TABLE private_room_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 offer_id text NOT NULL CHECK (offer_id='private-room-local-test'),
 offer_revision integer NOT NULL DEFAULT 1 CHECK(offer_revision=1),
 amount_krw integer NOT NULL DEFAULT 0 CHECK(amount_krw=0),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN('pending','paid','cancelled')),
 created_at timestamptz NOT NULL DEFAULT now(),paid_at timestamptz,
 CHECK ((status='paid')=(paid_at IS NOT NULL))
);
CREATE UNIQUE INDEX one_pending_room_order ON private_room_orders(account_id) WHERE status='pending';
