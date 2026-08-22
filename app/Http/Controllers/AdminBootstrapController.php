<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\AdminUserProvisioner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
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

            if (User::query()->where('is_admin', true)->exists()) {
                return response()->json([
                    'status' => 'locked',
                    'message' => 'Admin bootstrap is already locked.',
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
}
