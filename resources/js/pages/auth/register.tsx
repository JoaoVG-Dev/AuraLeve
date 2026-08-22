import { Form, Head } from '@inertiajs/react';
import {
    AuraButton,
    AuraField,
    AuraLink,
    AuraPasswordField,
} from '@/components/aura/auth-ui';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
};

export default function Register({ passwordRules }: Props) {
    return (
        <>
            <Head title="Criar conta" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            <AuraField
                                label="Nome completo"
                                type="text"
                                name="name"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="name"
                                placeholder="Como está no documento"
                                error={errors.name}
                            />

                            <AuraField
                                label="E-mail"
                                type="email"
                                name="email"
                                required
                                tabIndex={2}
                                autoComplete="email"
                                placeholder="seu@email.com"
                                error={errors.email}
                            />

                            <AuraPasswordField
                                label="Senha"
                                name="password"
                                required
                                tabIndex={3}
                                autoComplete="new-password"
                                placeholder="Mínimo de 8 caracteres"
                                passwordrules={passwordRules}
                                error={errors.password}
                            />

                            <AuraPasswordField
                                label="Confirmar senha"
                                name="password_confirmation"
                                required
                                tabIndex={4}
                                autoComplete="new-password"
                                placeholder="Repita a senha"
                                passwordrules={passwordRules}
                                error={errors.password_confirmation}
                            />

                            <AuraButton
                                type="submit"
                                className="mt-2"
                                tabIndex={5}
                                processing={processing}
                                data-test="register-user-button"
                            >
                                CRIAR CONTA
                            </AuraButton>

                            <p className="text-center text-[13px] leading-6 text-[#a2988a]">
                                Ao criar sua conta você concorda em receber
                                avisos sobre o seu pedido.
                            </p>
                        </div>

                        <div className="text-center text-sm text-[#8a8178]">
                            Já tem conta?{' '}
                            <AuraLink href={login()} tabIndex={6}>
                                Entrar
                            </AuraLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Criar sua conta',
    description:
        'Leva um minuto — depois é só finalizar o pedido e acompanhar a produção da sua peça.',
};
