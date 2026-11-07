-- Seed suspended_at from the latest user.deactivated audit log entry
-- Idempotent: only updates non-deleted users where suspended_at is currently NULL
WITH latest_admin_action AS (
  SELECT DISTINCT ON (entity_id)
    entity_id AS user_id,
    action,
    created_at
  FROM audit_logs
  WHERE entity_type = 'User'
    AND action IN ('user.deactivated', 'user.activated')
  ORDER BY entity_id, created_at DESC
)
UPDATE "users" u
SET "suspended_at" = la.created_at
FROM latest_admin_action la
WHERE u.id = la.user_id
  AND la.action = 'user.deactivated'
  AND u.deleted_at IS NULL
  AND u.suspended_at IS NULL;
