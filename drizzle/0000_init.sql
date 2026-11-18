CREATE TABLE `practice_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`area` text NOT NULL,
	`ref` text,
	`minutes` integer NOT NULL,
	`note` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `practice_log_date` ON `practice_log` (`date`);--> statement-breakpoint
CREATE INDEX `practice_log_ref` ON `practice_log` (`ref`);--> statement-breakpoint
CREATE TABLE `progress` (
	`ref` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`tempo` integer,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
