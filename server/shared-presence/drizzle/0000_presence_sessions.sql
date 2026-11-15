CREATE TABLE `presence_sessions` (
 `session_id` text PRIMARY KEY NOT NULL,
 `token_hash` text NOT NULL,
 `channel` integer NOT NULL,
 `sequence` integer NOT NULL,
 `pose` text NOT NULL,
 `updated_at` integer NOT NULL,
 `joined_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `presence_channel_updated` ON `presence_sessions` (`channel`, `updated_at`);
