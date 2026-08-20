<?php

namespace App\Support;

use Illuminate\Contracts\Foundation\Application;
use RuntimeException;

class TestingDatabaseSafetyGuard
{
    public function __construct(private readonly Application $app) {}

    public function ensureSafe(): void
    {
        if (! $this->app->environment('testing')) {
            return;
        }

        $failures = [];
        $defaultConnection = config('database.default');
        $connection = config("database.connections.{$defaultConnection}", []);

        $this->require($failures, is_file(base_path('.env.testing')), 'Missing .env.testing file.');
        $this->require($failures, $defaultConnection === 'pgsql', 'The testing database connection must be pgsql.');
        $this->require($failures, ($connection['driver'] ?? null) === 'pgsql', 'The active testing connection must use the PostgreSQL driver.');
        $this->require($failures, $this->truthy($connection['pooled'] ?? false), 'The testing PostgreSQL connection must enable pooling.');
        $this->require($failures, ($connection['sslmode'] ?? null) === 'require', 'The pooled testing connection must require SSL.');
        $this->require($failures, data_get($connection, 'direct.sslmode') === 'require', 'The direct testing connection must require SSL.');

        $databaseEnvironment = $this->envString('DB_ENVIRONMENT');
        $databaseBranch = $this->envString('DB_BRANCH');
        $this->require($failures, $databaseEnvironment === 'testing', 'DB_ENVIRONMENT must explicitly be testing.');
        $this->require($failures, $databaseBranch === 'testing', 'DB_BRANCH must explicitly be testing.');

        $host = $this->stringOrNull($connection['host'] ?? null);
        $directHost = $this->stringOrNull(data_get($connection, 'direct.host'));
        $expectedHost = $this->envString('DB_TESTING_HOST');
        $expectedDirectHost = $this->envString('DB_TESTING_DIRECT_HOST');

        $this->require($failures, $host !== null, 'The testing pooled database host is missing.');
        $this->require($failures, $directHost !== null, 'The testing direct database host is missing.');
        $this->require($failures, $expectedHost !== null, 'DB_TESTING_HOST must identify the testing pooled host.');
        $this->require($failures, $expectedDirectHost !== null, 'DB_TESTING_DIRECT_HOST must identify the testing direct host.');
        $this->require($failures, $host === $expectedHost, 'The active testing pooled host does not match DB_TESTING_HOST.');
        $this->require($failures, $directHost === $expectedDirectHost, 'The active testing direct host does not match DB_TESTING_DIRECT_HOST.');
        $this->require($failures, $this->isNeonHost($host), 'The testing pooled host must be a Neon host.');
        $this->require($failures, $this->isNeonHost($directHost), 'The testing direct host must be a Neon host.');

        foreach ($this->normalEnvironmentHosts() as $normalHost) {
            if ($host === $normalHost || $directHost === $normalHost) {
                $failures[] = 'A testing database host matches a non-testing host from .env.';
                break;
            }
        }

        if ($failures !== []) {
            throw new RuntimeException(
                "Unsafe testing database configuration:\n- ".implode("\n- ", array_unique($failures))
            );
        }
    }

    /**
     * @param  list<string>  $failures
     */
    private function require(array &$failures, bool $condition, string $message): void
    {
        if (! $condition) {
            $failures[] = $message;
        }
    }

    private function envString(string $key): ?string
    {
        return $this->stringOrNull(env($key));
    }

    private function stringOrNull(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        return $value === '' ? null : $value;
    }

    private function truthy(mixed $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    private function isNeonHost(?string $host): bool
    {
        return $host !== null && str_ends_with($host, '.neon.tech');
    }

    /**
     * @return list<string>
     */
    private function normalEnvironmentHosts(): array
    {
        $hosts = [];

        foreach (['DB_HOST', 'DB_DIRECT_HOST'] as $key) {
            $host = $this->environmentFileValue(base_path('.env'), $key);

            if ($host !== null) {
                $hosts[] = $host;
            }
        }

        return array_values(array_unique($hosts));
    }

    private function environmentFileValue(string $path, string $key): ?string
    {
        if (! is_file($path)) {
            return null;
        }

        foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
            $line = trim($line);

            if ($line === '' || str_starts_with($line, '#') || ! str_contains($line, '=')) {
                continue;
            }

            [$name, $value] = explode('=', $line, 2);

            if ($name !== $key) {
                continue;
            }

            $value = trim($value);
            $value = trim($value, "\"'");

            return $value === '' ? null : $value;
        }

        return null;
    }
}
