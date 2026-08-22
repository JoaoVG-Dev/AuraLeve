import { Form, Head } from '@inertiajs/react';
import { AuraButton, AuraPasswordField } from '@/components/aura/auth-ui';
import { store } from '@/routes/password/confirm';
/* @chisel-passkeys */
import {
    index as confirmOptions,
    store as confirmStore,
} from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyConfirmationController';
import PasskeyVerify from '@/components/passkey-verify';
/* @end-chisel-passkeys */

export default function ConfirmPassword() {
    return (
        <>
            <Head title="Confirmar senha" />

            {/* @chisel-passkeys */}
            <PasskeyVerify
                routes={{
                    options: confirmOptions(),
                    submit: confirmStore(),
                }}
                label="Confirmar com passkey"
                loadingLabel="Confirmando..."
                separator="ou confirme com a senha"
            />
            {/* @end-chisel-passkeys */}

            <Form {...store.form()} resetOnSuccess={['password']}>
                {({ processing, errors }) => (
                    <div className="grid gap-5">
                        <AuraPasswordField
                            label="Senha"
                            name="password"
                            placeholder="Sua senha"
                            autoComplete="current-password"
                            autoFocus
                            error={errors.password}
                        />

                        <AuraButton
                            type="submit"
                            className="mt-2"
                            processing={processing}
                            data-test="confirm-password-button"
                        >
                            CONFIRMAR
                        </AuraButton>
                    </div>
                )}
            </Form>
        </>
    );
}

ConfirmPassword.layout = {
    title: 'Confirmar senha',
    description:
        'Esta é uma área protegida. Confirme sua senha para continuar.',
};
