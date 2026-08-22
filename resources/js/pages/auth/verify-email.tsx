import { Form, Head } from '@inertiajs/react';
import { AuraButton, AuraLink, AuraNotice } from '@/components/aura/auth-ui';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <>
            <Head title="Confirmar e-mail" />

            {status === 'verification-link-sent' && (
                <div className="mb-6">
                    <AuraNotice tone="success">
                        Enviamos um novo link de confirmação para o e-mail
                        cadastrado.
                    </AuraNotice>
                </div>
            )}

            <Form {...send.form()} className="space-y-6">
                {({ processing }) => (
                    <>
                        <AuraButton
                            type="submit"
                            variant="ghost"
                            processing={processing}
                        >
                            REENVIAR E-MAIL DE CONFIRMAÇÃO
                        </AuraButton>

                        <div className="text-center text-sm text-[#8a8178]">
                            <AuraLink href={logout()}>Sair da conta</AuraLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Confirme seu e-mail',
    description:
        'Enviamos um link para o seu e-mail. Clique nele para liberar o acesso à sua conta.',
};
