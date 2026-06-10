-- Create the first organization and assign all existing users to it.
INSERT INTO "Organization" ("id", "name", "createdAt", "updatedAt")
VALUES ('org-bridge-to-thrive', 'Bridge to Thrive', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

UPDATE "User"
SET "organizationId" = 'org-bridge-to-thrive'
WHERE "organizationId" IS NULL;

-- Promote the platform super admin.
UPDATE "User"
SET "role" = 'SUPER_ADMIN'
WHERE lower("email") = 'steve@thriveinmn.com';
