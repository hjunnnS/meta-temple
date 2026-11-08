ALTER TABLE orders ADD COLUMN install_attempts integer NOT NULL DEFAULT 0,
 ADD COLUMN next_attempt_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX due_recovery ON orders(next_attempt_at) WHERE status IN ('paid','recovering','refund_pending','refund_failed');
