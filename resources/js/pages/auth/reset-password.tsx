import { Form, Head } from '@inertiajs/react';
import {
    AuraButton,
    AuraField,
    AuraPasswordField,
} from '@/components/aura/auth-ui';
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
    passwordRules: string;
};

export default function ResetPassword({ token, email, passwordRules }: Props) {
    return (
        <>
            <Head title="Nova senha" />

            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
            >
                {({ processing, errors }) => (
                    <div className="grid gap-5">
                        <AuraField
                            label="E-mail"
                            type="email"
                            name="email"
                            autoComplete="email"
                            defaultValue={email}
                            readOnly
                            error={errors.email}
                        />

                        <AuraPasswordField
                            label="Nova senha"
                            name="password"
                            autoComplete="new-password"
                            autoFocus
                            placeholder="Mínimo de 8 caracteres"
                            passwordrules={passwordRules}
                            error={errors.password}
                        />

                        <AuraPasswordField
                            label="Confirmar nova senha"
                            name="password_confirmation"
                            autoComplete="new-password"
                            placeholder="Repita a nova senha"
                            passwordrules={passwordRules}
                            error={errors.password_confirmation}
                        />

                        <AuraButton
                            type="submit"
                            className="mt-2"
                            processing={processing}
                            data-test="reset-password-button"
                        >
                            SALVAR NOVA SENHA
                        </AuraButton>
                    </div>
                )}
            </Form>
        </>
    );
}

ResetPassword.layout = {
    title: 'Definir nova senha',
    description: 'Escolha uma senha nova para voltar a acessar sua conta.',
};
