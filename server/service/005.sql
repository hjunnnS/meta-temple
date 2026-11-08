ALTER TABLE installations ADD COLUMN hidden boolean NOT NULL DEFAULT false;
CREATE VIEW public_offerings AS
 SELECT i.id, s.kind, CASE WHEN o.inscription->>'tag'='true' THEN o.inscription->>'name' END AS name,
        o.inscription->>'text' AS text
 FROM installations i JOIN orders o ON i.order_id=o.id JOIN slots s ON s.id=i.slot_id
 WHERE NOT i.hidden AND i.removed_at IS NULL AND i.starts_at<=now() AND i.ends_at>now()
   AND o.inscription->>'public'='true';
