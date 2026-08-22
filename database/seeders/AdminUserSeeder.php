<?php

namespace Database\Seeders;

use App\Support\AdminUserProvisioner;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    /**
     * Seed an admin user from environment variables.
     */
    public function run(AdminUserProvisioner $provisioner): void
    {
        if (! $provisioner->hasConfiguredCredentials()) {
            $this->command?->warn(
                'Admin seed skipped. Set AURALEVE_ADMIN_EMAIL and AURALEVE_ADMIN_PASSWORD.',
            );

            return;
        }

        $user = $provisioner->provision();

        $this->command?->info("Admin user ready: {$user->email}");
    }
}
