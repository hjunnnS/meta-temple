CREATE TABLE offers (
 id text PRIMARY KEY,kind text NOT NULL REFERENCES products,days integer NOT NULL CHECK(days>0),
 price_krw integer NOT NULL CHECK(price_krw>0),enabled boolean NOT NULL DEFAULT true
);
INSERT INTO offers(id,kind,days,price_krw)
SELECT kind||'-test-'||days,kind,days,price FROM products CROSS JOIN (VALUES(7,3000),(30,10000)) AS fixture(days,price);
