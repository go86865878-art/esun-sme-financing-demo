CREATE TABLE `study_events` (
	`user_id` text NOT NULL,
	`event_id` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `event_id`)
);
