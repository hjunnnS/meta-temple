-- Preserve old reservations/orders and their quoted terms. Retire only the old test catalogue option.
UPDATE offers SET enabled=false,revision=revision+1 WHERE days=30 AND id LIKE '%-test-30' AND enabled;
INSERT INTO offers(id,kind,days,price_krw)
SELECT kind||'-test-'||days,kind,days,price
FROM products CROSS JOIN (VALUES(21,9000),(49,21000)) AS fixture(days,price)
ON CONFLICT(id) DO NOTHING;
