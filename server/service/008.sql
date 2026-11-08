ALTER TABLE accounts ALTER COLUMN email DROP NOT NULL, ADD COLUMN deletion_requested_at timestamptz, ADD COLUMN erased_at timestamptz;
CREATE TABLE operation_alerts(kind text NOT NULL,target text NOT NULL,detected_at timestamptz NOT NULL DEFAULT now(),acknowledged_at timestamptz,resolved_at timestamptz,PRIMARY KEY(kind,target));
CREATE VIEW operation_faults AS
 SELECT CASE WHEN status='pending' THEN 'payment_delay' WHEN status='refund_failed' THEN 'refund_failure' ELSE 'install_failure' END AS kind,id::text AS target FROM orders
 WHERE status IN ('recovering','refund_pending','refund_failed') OR (status='pending' AND created_at<=now()-interval '10 minutes')
 UNION ALL SELECT 'reservation_delay',slot_id FROM draws WHERE closes_at<=now()-interval '10 minutes'
 UNION ALL SELECT 'reservation_delay',id::text FROM reservations WHERE released_at IS NULL AND NOT payment_lock AND expires_at<=now()-interval '5 minutes';
