<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class AdminUserProvisioner
{
    /**
     * Determine whether admin seed credentials are configured.
     */
    public function hasConfiguredCredentials(): bool
    {
        return $this->email() !== '' && $this->password() !== '';
    }

    /**
     * Create or update the configured admin user.
     */
    public function provision(): User
    {
        $email = $this->email();
        $password = $this->password();

        Validator::make(
            ['email' => $email, 'password' => $password],
            [
                'email' => ['required', 'email:rfc', 'max:255'],
                'password' => [
                    'required',
                    app()->isProduction()
                        ? Password::min(12)
                            ->mixedCase()
                            ->letters()
                            ->numbers()
                            ->symbols()
                        : Password::min(12)->mixedCase()->numbers(),
                ],
            ],
        )->validate();

        $user = User::query()->firstOrNew(['email' => $email]);

        $user->forceFill([
            'name' => trim((string) env('AURALEVE_ADMIN_NAME', 'Admin AuraLeve')) ?: 'Admin AuraLeve',
            'email' => $email,
            'email_verified_at' => now(),
            'is_admin' => true,
            'password' => $password,
        ])->save();

        return $user;
    }

    protected function email(): string
    {
        return strtolower(trim((string) env('AURALEVE_ADMIN_EMAIL', '')));
    }

    protected function password(): string
    {
        return (string) env('AURALEVE_ADMIN_PASSWORD', '');
    }
}
