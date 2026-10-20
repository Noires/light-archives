-- Rows seeded into the pre-rework (8347c89) schema before the current server synchronizes it.
INSERT INTO server (id, name, datacenter) VALUES (1, 'Alpha', 'Light'), (2, 'Lich', 'Light');
INSERT INTO user (id, email, discordId, role, verifiedAt) VALUES
  (1, 'old1@example.invalid', '1001', 'user', NOW()), (2, 'old2@example.invalid', '1002', 'moderator', NOW());
INSERT INTO `character` (id, lodestoneId, active, name, race, tribe, avatar, verifiedAt, serverId, userId, slogan, profession, currently)
  VALUES (1, 900001, 1, 'Alte Aria', 'elezen', 'wildwood', 'https://example.invalid/a.png', NOW(), 1, 1, 'Ein Spruch', 'Schmiedin', 'Unterwegs'),
         (2, 900002, 1, 'Alter Bran', 'hyur', 'midlander', 'https://example.invalid/b.png', NOW(), 2, 2, '', '', '');
INSERT INTO image (id, width, height, size, hash, filename, category, title, format, ownerId) VALUES
  (1, 640, 480, 1234, 'abc123', 'bild.png', 'artwork', 'Altes Bild', 'png', 1);
INSERT INTO story (id, title, content, type, ownerId) VALUES
  (1, 'Alte Geschichte', '<p>Es war einmal ein langer Text mit Umlauten: äöü ß.</p>', 'book', 1),
  (2, 'Tagebuch', '<p>Liebes Tagebuch</p>', 'diary', 2);
INSERT INTO event (id, title, details, startDateTime, endDateTime, source, eventType, adultOnly, closedEvent, hidden, ownerId)
  VALUES (1, 'Altes Fest', '<p>Fest</p>', '2026-11-01 19:00:00', '2026-11-01 23:00:00', 'website', 'TAVERN', 0, 0, 0, 1);
INSERT INTO event_registration (id, eventId, characterId) VALUES (1, 1, 2);
INSERT INTO venue (id, name, description, location, housingArea, ward, plot, serverId, ownerId, bannerId)
  VALUES (1, 'Zum Alten Krug', '<p>Taverne</p>', 'house', 'mist', 5, 12, 1, 1, 1);
INSERT INTO event_location (id, name, address, serverId, venueId, eventId) VALUES (1, 'Zum Alten Krug', 'Mist W5 P12', 1, 1, 1);
INSERT INTO wiki_page (id, title, content, editPermission, ownerId) VALUES (1, 'Limsa', '<p>Hafenstadt</p>', 'everyone', 1);
INSERT INTO free_company (id, lodestoneId, name, tag, foundedAt, serverId, leaderId, description)
  VALUES (1, '9000000000000001', 'Alte Gilde', 'ALT', '2020-01-01', 1, 1, '<p>FC</p>');
UPDATE `character` SET freeCompanyId = 1 WHERE id = 1;
INSERT INTO community (id, name, description, ownerId) VALUES (1, 'Alter Zirkel', '<p>Zirkel</p>', 1);
INSERT INTO community_membership (id, status, canEdit, canManageMembers, characterId, communityId)
  VALUES (1, 'confirmed', 1, 1, 1, 1), (2, 'applied', 0, 0, 2, 1);
INSERT INTO noticeboard_item (id, title, content, location, type, ownerId) VALUES (1, 'Aushang', '<p>Suche</p>', 'limsa_lominsa', 'aushang', 1);
