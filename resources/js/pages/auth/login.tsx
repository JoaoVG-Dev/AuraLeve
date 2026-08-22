import { Form, Head } from '@inertiajs/react';
import {
    AuraButton,
    AuraCheckbox,
    AuraField,
    AuraLink,
    AuraNotice,
    AuraPasswordField,
} from '@/components/aura/auth-ui';
/* @chisel-registration */
import { register } from '@/routes';
/* @end-chisel-registration */
import { store } from '@/routes/login';
import { request } from '@/routes/password';
/* @chisel-passkeys */
import PasskeyVerify from '@/components/passkey-verify';
/* @end-chisel-passkeys */

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Entrar" />

            {status && (
                <div className="mb-6">
                    <AuraNotice tone="success">{status}</AuraNotice>
                </div>
            )}

            {/* @chisel-passkeys */}
            <PasskeyVerify
                label="Entrar com passkey"
                loadingLabel="Autenticando..."
                separator="ou continue com e-mail"
            />
            {/* @end-chisel-passkeys */}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            <AuraField
                                label="E-mail"
                                type="email"
                                name="email"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="email"
                                placeholder="seu@email.com"
                                error={errors.email}
                            />

                            <AuraPasswordField
                                label="Senha"
                                name="password"
                                required
                                tabIndex={2}
                                autoComplete="current-password"
                                placeholder="Sua senha"
                                error={errors.password}
                                hint={
                                    canResetPassword ? (
                                        <AuraLink
                                            href={request()}
                                            tabIndex={5}
                                            className="text-[13px]"
                                        >
                                            Esqueci minha senha
                                        </AuraLink>
                                    ) : undefined
                                }
                            />

                            <AuraCheckbox
                                id="remember"
                                name="remember"
                                tabIndex={3}
                                label="Continuar conectada neste dispositivo"
                            />

                            <AuraButton
                                type="submit"
                                className="mt-2"
                                tabIndex={4}
                                processing={processing}
                                data-test="login-button"
                            >
                                ENTRAR
                            </AuraButton>
                        </div>

                        {/* @chisel-registration */}
                        <div className="text-center text-sm text-[#8a8178]">
                            Ainda não tem conta?{' '}
                            <AuraLink href={register()} tabIndex={5}>
                                Criar conta
                            </AuraLink>
                        </div>
                        {/* @end-chisel-registration */}
                    </>
                )}
            </Form>
        </>
    );
}

Login.layout = {
    title: 'Entrar na sua conta',
    description:
        'Acompanhe pedidos, salve endereços e volte para as peças que você separou.',
};
