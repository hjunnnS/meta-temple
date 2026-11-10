ALTER TABLE accounts DROP CONSTRAINT accounts_email_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_email_check
 CHECK (email=lower(email) AND (email LIKE '%@example.test' OR email='test@bwm.kr'));
