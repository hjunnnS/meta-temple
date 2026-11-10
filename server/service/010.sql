CREATE TABLE private_rooms (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 account_id uuid UNIQUE NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now()
);
