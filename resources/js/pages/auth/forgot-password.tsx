import { Form, Head } from '@inertiajs/react';
import {
    AuraButton,
    AuraField,
    AuraLink,
    AuraNotice,
} from '@/components/aura/auth-ui';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <>
            <Head title="Recuperar senha" />

            {status && (
                <div className="mb-6">
                    <AuraNotice tone="success">{status}</AuraNotice>
                </div>
            )}

            <div className="space-y-6">
                <Form {...email.form()} className="grid gap-6">
                    {({ processing, errors }) => (
                        <>
                            <AuraField
                                label="E-mail"
                                type="email"
                                name="email"
                                autoComplete="off"
                                autoFocus
                                placeholder="seu@email.com"
                                error={errors.email}
                            />

                            <AuraButton
                                type="submit"
                                processing={processing}
                                data-test="email-password-reset-link-button"
                            >
                                ENVIAR LINK DE RECUPERAÇÃO
                            </AuraButton>
                        </>
                    )}
                </Form>

                <div className="text-center text-sm text-[#8a8178]">
                    Lembrou a senha? <AuraLink href={login()}>Entrar</AuraLink>
                </div>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Recuperar senha',
    description:
        'Informe o e-mail da sua conta e enviamos um link para você criar uma nova senha.',
};
