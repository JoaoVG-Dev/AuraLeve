<?php

namespace App\Providers;

use App\Database\NeonPostgresConnector;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\PostgresConnection;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        DB::extend('pgsql', function (array $config, string $name): PostgresConnection {
            $config['name'] = $name;
            $pdo = (new NeonPostgresConnector)->connect($config);

            return new PostgresConnection(
                $pdo,
                $config['database'] ?? '',
                $config['prefix'] ?? '',
                $config,
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::define('access-admin', function (User $user): bool {
            $adminEmails = config('auraleve.admin_emails', []);

            return $user->is_admin
                || in_array(strtolower($user->email), $adminEmails, true);
        });

        $this->configureDefaults();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
