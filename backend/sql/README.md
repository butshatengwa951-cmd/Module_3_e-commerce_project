# StockWell database migrations

## Live Aiven database

The live StockWell database is **not** rebuilt from `schema.sql`.

Use migrations in this order:

1. `integration_hardening.sql` — baseline integration/governance tables and PayFast preparation.
2. `stokvel_delivery_addresses.sql` — proposal, voting, address and delivery structures.
3. `final_hardening.sql` — current final hardening: one-Stokvel-per-member enforcement, company-role cleanup, contribution user attribution and officer-role preservation.

Run migrations against the existing database only after checking the command and the target database. These scripts are designed to be additive/idempotent where practical.

## Legacy files

- `schema.sql` is a **destructive/reset bootstrap** from an earlier project version. Do not run it against the live Aiven database.
- `stokvel_features.sql` is an older feature migration and is not the current migration path.
- `stokvel_governance_payfast.sql` is an older governance migration that references the retired `stokvels.chairperson_id` design. Do not run it against the current live schema.

## Current role model

- `users.role`: `member` or `admin` — company/platform role.
- `stokvel_member_roles.stokvel_role`: `MEMBER`, `CHAIRPERSON`, or `TREASURER` — role inside a specific Stokvel.

The current application uses one Stokvel membership per user. `final_hardening.sql` will stop with an explicit error instead of creating the unique constraint if duplicate memberships already exist.
