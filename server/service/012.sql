ALTER TABLE private_rooms
 ADD COLUMN display_layout jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(display_layout)='array' AND jsonb_array_length(display_layout)<=18),
 ADD COLUMN display_revision integer NOT NULL DEFAULT 0 CHECK (display_revision>=0);
