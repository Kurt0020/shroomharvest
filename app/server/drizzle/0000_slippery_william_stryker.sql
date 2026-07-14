CREATE TABLE `_health_check` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'ok',
	`checked_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `_health_check_id` PRIMARY KEY(`id`)
);
