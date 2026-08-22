<?php

namespace App\Database;

use Illuminate\Database\Connectors\PostgresConnector;

class NeonPostgresConnector extends PostgresConnector
{
    /**
     * Create a DSN string from a configuration.
     *
     * @param  array<string, mixed>  $config
     */
    protected function getDsn(array $config): string
    {
        $dsn = parent::getDsn($config);
        $endpoint = $this->endpoint($config);

        if ($endpoint === null || str_contains($dsn, 'options=endpoint=')) {
            return $dsn;
        }

        return "{$dsn};options=endpoint={$endpoint}";
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function endpoint(array $config): ?string
    {
        $endpoint = $config['neon_endpoint'] ?? null;

        if (! is_string($endpoint) || $endpoint === '') {
            $endpoint = $this->endpointFromHost($config['host'] ?? null);
        }

        return is_string($endpoint) && preg_match('/^ep-[a-z0-9-]+$/', $endpoint)
            ? $endpoint
            : null;
    }

    private function endpointFromHost(mixed $host): ?string
    {
        if (! is_string($host) || ! str_contains($host, 'neon.tech')) {
            return null;
        }

        $endpoint = explode('.', $host)[0];

        return is_string($endpoint) ? $endpoint : null;
    }
}
