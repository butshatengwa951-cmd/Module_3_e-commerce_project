# StockWell database migrations

## Live Aiven database

The live StockWell database is **not** rebuilt from a destructive bootstrap. There is intentionally no `schema.sql` in this branch.

Apply additive migrations to the existing database in this order:

1. `integration_hardening.sql` — baseline integration/governance tables and PayFast preparation.
2. `stokvel_delivery_addresses.sql` — proposal, voting, address and delivery structures.
3. `final_hardening.sql` — one-Stokvel-per-member enforcement, company-role cleanup, contribution attribution and officer-role preservation.
4. `auth_sessions.sql` — persisted refresh-session storage used by login, refresh and logout.

Run migrations against the intended database only after checking the target and taking the normal database backup/safety precautions. These scripts are designed to be additive/idempotent where practical.

## Legacy migration policy

Superseded bootstrap and governance SQL has been removed from this branch rather than leaving destructive scripts available to accidentally run:

- The old destructive `schema.sql` bootstrap has been removed.
- The obsolete `stokvel_governance_payfast.sql` migration has been removed.
- The superseded `stokvel_features.sql` migration has been removed.

**Warning:** do not recreate a full database from an old branch's `schema.sql` or governance migration. The current application expects the integrated schema and role model documented here.

## Current role model

- `users.role`: `member` or `admin` — company/platform role.
- `stokvel_member_roles.stokvel_role`: `MEMBER`, `CHAIRPERSON`, or `TREASURER` — role inside a specific Stokvel.

The current application uses one Stokvel membership per user. `final_hardening.sql` will stop with an explicit error instead of creating the unique constraint if duplicate memberships already exist.
