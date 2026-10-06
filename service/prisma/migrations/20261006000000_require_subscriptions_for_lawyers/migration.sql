UPDATE "users"
SET "subscription_status" = 'PENDING_PAYMENT',
    "is_active" = false
WHERE "role" = 'LAWYER'
  AND "subscription_status" = 'NOT_REQUIRED';
