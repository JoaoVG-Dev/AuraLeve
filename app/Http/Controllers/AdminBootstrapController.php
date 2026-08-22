<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\AdminUserProvisioner;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Throwable;

class AdminBootstrapController extends Controller
{
    /**
     * Create the first admin user in a deployed environment.
     */
    public function __invoke(
        Request $request,
        AdminUserProvisioner $provisioner,
    ): JsonResponse {
        $setupToken = (string) env('AURALEVE_ADMIN_SETUP_TOKEN', '');
        $providedToken = (string) $request->header(
            'X-Auraleve-Setup-Token',
            $request->input('token', ''),
        );

        abort_if($setupToken === '', 404);
        abort_unless(hash_equals($setupToken, $providedToken), 404);

        try {
            Artisan::call('migrate', ['--force' => true]);
            $createdTables = $this->ensureOperationalTables();

            if ($request->boolean('diagnostics')) {
                return $this->diagnostics($request, $provisioner, $createdTables);
            }

            if (User::query()->where('is_admin', true)->exists()) {
                return response()->json([
                    'status' => 'locked',
                    'message' => 'Admin bootstrap is already locked.',
                    'created_tables' => $createdTables,
                ], 409);
            }

            abort_unless($provisioner->hasConfiguredCredentials(), 422, 'Admin credentials are not configured.');

            $user = $provisioner->provision();

            return response()->json([
                'status' => 'created',
                'admin' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'is_admin' => $user->is_admin,
                ],
                'created_tables' => $createdTables,
            ], 201);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'status' => 'error',
                'type' => class_basename($exception),
                'message' => $exception->getMessage(),
            ], 500);
        }
    }

    /**
     * Repair operational tables when a hosted database was partially migrated.
     *
     * @return list<string>
     */
    private function ensureOperationalTables(): array
    {
        $createdTables = [];

        if (! Schema::hasTable('sessions')) {
            Schema::create('sessions', function (Blueprint $table): void {
                $table->string('id')->primary();
                $table->foreignId('user_id')->nullable()->index();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->longText('payload');
                $table->integer('last_activity')->index();
            });

            $createdTables[] = 'sessions';
        }

        if (! Schema::hasTable('cache')) {
            Schema::create('cache', function (Blueprint $table): void {
                $table->string('key')->primary();
                $table->mediumText('value');
                $table->bigInteger('expiration')->index();
            });

            $createdTables[] = 'cache';
        }

        if (! Schema::hasTable('cache_locks')) {
            Schema::create('cache_locks', function (Blueprint $table): void {
                $table->string('key')->primary();
                $table->string('owner');
                $table->bigInteger('expiration')->index();
            });

            $createdTables[] = 'cache_locks';
        }

        if (! Schema::hasTable('jobs')) {
            Schema::create('jobs', function (Blueprint $table): void {
                $table->id();
                $table->string('queue')->index();
                $table->longText('payload');
                $table->unsignedSmallInteger('attempts');
                $table->unsignedInteger('reserved_at')->nullable();
                $table->unsignedInteger('available_at');
                $table->unsignedInteger('created_at');
            });

            $createdTables[] = 'jobs';
        }

        if (! Schema::hasTable('job_batches')) {
            Schema::create('job_batches', function (Blueprint $table): void {
                $table->string('id')->primary();
                $table->string('name');
                $table->integer('total_jobs');
                $table->integer('pending_jobs');
                $table->integer('failed_jobs');
                $table->longText('failed_job_ids');
                $table->mediumText('options')->nullable();
                $table->integer('cancelled_at')->nullable();
                $table->integer('created_at');
                $table->integer('finished_at')->nullable();
            });

            $createdTables[] = 'job_batches';
        }

        if (! Schema::hasTable('failed_jobs')) {
            Schema::create('failed_jobs', function (Blueprint $table): void {
                $table->id();
                $table->string('uuid')->unique();
                $table->string('connection');
                $table->string('queue');
                $table->longText('payload');
                $table->longText('exception');
                $table->timestamp('failed_at')->useCurrent();

                $table->index(['connection', 'queue', 'failed_at']);
            });

            $createdTables[] = 'failed_jobs';
        }

        return $createdTables;
    }

    /**
     * Run token-protected checks for the hosted login pipeline.
     *
     * @param  list<string>  $createdTables
     */
    private function diagnostics(
        Request $request,
        AdminUserProvisioner $provisioner,
        array $createdTables,
    ): JsonResponse {
        $email = strtolower(trim((string) env('AURALEVE_ADMIN_EMAIL', '')));
        $password = (string) env('AURALEVE_ADMIN_PASSWORD', '');
        $admin = User::query()->where('email', $email)->first();

        $diagnostics = [
            'status' => 'diagnostics',
            'created_tables' => $createdTables,
            'config' => [
                'app_env' => app()->environment(),
                'app_key_configured' => filled(config('app.key')),
                'cache_default' => config('cache.default'),
                'session_driver' => config('session.driver'),
                'session_table' => config('session.table'),
                'database_default' => config('database.default'),
                'postgres_search_path' => config('database.connections.pgsql.search_path'),
                'admin_credentials_configured' => $provisioner->hasConfiguredCredentials(),
            ],
            'tables' => array_fill_keys([
                'users',
                'sessions',
                'cache',
                'cache_locks',
                'jobs',
                'job_batches',
                'failed_jobs',
            ], false),
            'checks' => [],
        ];

        foreach (array_keys($diagnostics['tables']) as $table) {
            $diagnostics['tables'][$table] = Schema::hasTable($table);
        }

        $diagnostics['checks']['cache'] = $this->probe(function (): bool {
            Cache::put('auraleve-bootstrap-diagnostic', 'ok', 60);
            $passed = Cache::get('auraleve-bootstrap-diagnostic') === 'ok';
            Cache::forget('auraleve-bootstrap-diagnostic');

            return $passed;
        });

        $diagnostics['checks']['session'] = $this->probe(function () use ($request): bool {
            $request->session()->put('auraleve_bootstrap_diagnostic', now()->toIso8601String());
            $request->session()->save();

            return $request->session()->has('auraleve_bootstrap_diagnostic');
        });

        $diagnostics['checks']['admin_exists'] = $this->probe(
            fn (): bool => $admin instanceof User && $admin->is_admin,
        );

        $diagnostics['checks']['password_hash'] = $this->probe(
            fn (): bool => $admin instanceof User && Hash::check($password, $admin->password),
        );

        $diagnostics['checks']['auth_attempt'] = $this->probe(function () use ($email, $password): bool {
            $authenticated = Auth::guard('web')->attempt([
                'email' => $email,
                'password' => $password,
            ]);

            Auth::guard('web')->logout();

            return $authenticated;
        });

        return response()->json($diagnostics);
    }

    /**
     * @param  callable(): mixed  $callback
     * @return array<string, mixed>
     */
    private function probe(callable $callback): array
    {
        try {
            return [
                'ok' => true,
                'value' => $callback(),
            ];
        } catch (Throwable $exception) {
            report($exception);

            return [
                'ok' => false,
                'type' => class_basename($exception),
                'message' => $exception->getMessage(),
            ];
        }
    }
}
