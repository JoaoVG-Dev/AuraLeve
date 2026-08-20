# Database Setup

AuraLeve uses PostgreSQL hosted on Neon.

The application uses a single Laravel `pgsql` connection. Laravel 13 supports pooled PostgreSQL connections natively with a nested direct endpoint inside that same connection.

Application queries use the pooled Neon endpoint from `DB_HOST`. Migrations, schema operations, `db:show`, `db:table`, and maintenance commands automatically prefer the nested direct endpoint when it is configured, so no separate `pgsql_direct` connection is needed.

## Required environment variables

Never commit `.env` or real database credentials.

```env
DB_CONNECTION=pgsql
DB_POOLED=true
DB_HOST=your-neon-pooled-host.neon.tech
DB_PORT=5432
DB_DATABASE=your_neon_database
DB_USERNAME=your_neon_username
DB_PASSWORD=your_neon_password
DB_SSLMODE=require
DB_DIRECT_HOST=your-neon-direct-host.neon.tech
DB_DIRECT_PORT=5432
DB_DIRECT_USERNAME=your_neon_direct_username
DB_DIRECT_PASSWORD=your_neon_direct_password
DB_DIRECT_SSLMODE=require
```

`DB_HOST` should point to the pooled Neon host used by the application. `DB_DIRECT_HOST` should point to the direct Neon host used for migrations and administrative operations. Both endpoints require SSL: `DB_SSLMODE=require` for pooled traffic and `DB_DIRECT_SSLMODE=require` for direct traffic.

`DB_DIRECT_USERNAME` and `DB_DIRECT_PASSWORD` may match the pooled credentials when Neon uses the same role for both endpoints. If they are omitted locally, the application configuration falls back to `DB_USERNAME` and `DB_PASSWORD`.

## Testing strategy

The PHPUnit suite uses a dedicated Neon branch named `testing`. Test credentials and hosts live in `.env.testing`, which must never be committed.

`phpunit.xml` keeps safe test drivers for cache, session, queue, and mail, and keeps `DB_URL` empty so URL-style connection strings cannot override the explicit `.env.testing` fields. The old SQLite overrides have been removed:

```xml
<!-- Removed so .env.testing controls the test database -->
<!-- <env name="DB_CONNECTION" value="sqlite"/> -->
<!-- <env name="DB_DATABASE" value=":memory:"/> -->
<env name="DB_URL" value=""/>
```

The test branch must use PostgreSQL:

```env
APP_ENV=testing
DB_ENVIRONMENT=testing
DB_BRANCH=testing
DB_CONNECTION=pgsql
DB_POOLED=true
DB_HOST=your-neon-testing-pooled-host.neon.tech
DB_PORT=5432
DB_DATABASE=your_neon_testing_database
DB_USERNAME=your_neon_testing_username
DB_PASSWORD=your_neon_testing_password
DB_SSLMODE=require
DB_DIRECT_HOST=your-neon-testing-direct-host.neon.tech
DB_DIRECT_PORT=5432
DB_DIRECT_USERNAME=your_neon_testing_direct_username
DB_DIRECT_PASSWORD=your_neon_testing_direct_password
DB_DIRECT_SSLMODE=require
DB_TESTING_HOST=your-neon-testing-pooled-host.neon.tech
DB_TESTING_DIRECT_HOST=your-neon-testing-direct-host.neon.tech
```

`DB_TESTING_HOST` and `DB_TESTING_DIRECT_HOST` are safety markers. They must match the active testing pooled and direct hosts. The application also compares testing hosts against the normal `.env` hosts and refuses to boot in `APP_ENV=testing` if a testing host matches a non-testing host.

## Test database safety guard

`App\Support\TestingDatabaseSafetyGuard` runs during Laravel boot in the testing environment. It fails loudly before the test suite can run unless all of these are true:

- `APP_ENV=testing`
- the active database connection is `pgsql`
- pooling is enabled
- pooled and direct SSL modes are `require`
- `DB_ENVIRONMENT=testing`
- `DB_BRANCH=testing`
- active pooled and direct hosts match the `DB_TESTING_*` safety markers
- active pooled and direct hosts are Neon hosts
- active pooled and direct hosts do not match the normal `.env` pooled or direct hosts

This protects commands that use `RefreshDatabase`. `RefreshDatabase` must never run against the main development or production branch.

SQLite in-memory tests are no longer the active strategy. SQLite remains useful for very small unit-level persistence checks, but it cannot validate PostgreSQL-specific behavior such as concurrency, locking, reservation, transaction semantics, or future inventory flows.

## Recreating the testing branch

If the test database needs to be reset, recreate or reset the `testing` branch from the current main project branch in Neon. Then update `.env.testing` with the new pooled and direct testing branch values and refresh the `DB_TESTING_*` safety markers.

Do not run Laravel destructive schema commands against development or production. Run the safe validation commands below before running the test suite.

## Validation commands

```powershell
php -m | Select-String -Pattern '^(pdo_pgsql|pgsql)$'
php artisan config:clear
php artisan about
php artisan db:show
php artisan migrate:status
php artisan about --env=testing
php artisan db:show --env=testing
php artisan migrate:status --env=testing
php artisan test
vendor/bin/pint --test
npm run build
```

On Windows PowerShell, use `npm.cmd run build` if `npm run build` is blocked by the script execution policy.

## Troubleshooting missing PostgreSQL extensions

If `pdo_pgsql` or `pgsql` are missing from `php -m`, enable them in the loaded PHP configuration file shown by:

```powershell
php --ini
```

On Windows, this usually means enabling these lines in `php.ini` and then opening a new terminal:

```ini
extension=pdo_pgsql
extension=pgsql
```

If the DLL files are not present in PHP's `ext` directory, install a PHP build that includes the PostgreSQL extensions.
