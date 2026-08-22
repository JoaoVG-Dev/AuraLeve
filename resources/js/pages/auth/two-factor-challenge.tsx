import { Form, Head, setLayoutProps } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useMemo, useState } from 'react';
import { AuraButton, AuraError, AuraField } from '@/components/aura/auth-ui';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';
import { store } from '@/routes/two-factor/login';

export default function TwoFactorChallenge() {
    const [showRecoveryInput, setShowRecoveryInput] = useState<boolean>(false);
    const [code, setCode] = useState<string>('');

    const authConfigContent = useMemo<{
        title: string;
        description: string;
        toggleText: string;
    }>(() => {
        if (showRecoveryInput) {
            return {
                title: 'Código de recuperação',
                description:
                    'Confirme o acesso à sua conta usando um dos códigos de emergência que você guardou.',
                toggleText: 'entrar com o código do aplicativo',
            };
        }

        return {
            title: 'Código de verificação',
            description:
                'Informe o código gerado pelo seu aplicativo autenticador.',
            toggleText: 'entrar com um código de recuperação',
        };
    }, [showRecoveryInput]);

    setLayoutProps({
        title: authConfigContent.title,
        description: authConfigContent.description,
    });

    const toggleRecoveryMode = (clearErrors: () => void): void => {
        setShowRecoveryInput(!showRecoveryInput);
        clearErrors();
        setCode('');
    };

    return (
        <>
            <Head title="Verificação em duas etapas" />

            <div className="space-y-6">
                <Form
                    {...store.form()}
                    className="space-y-5"
                    resetOnError
                    resetOnSuccess={!showRecoveryInput}
                >
                    {({ errors, processing, clearErrors }) => (
                        <>
                            {showRecoveryInput ? (
                                <AuraField
                                    label="Código de recuperação"
                                    name="recovery_code"
                                    type="text"
                                    placeholder="Informe o código de recuperação"
                                    autoFocus={showRecoveryInput}
                                    required
                                    error={errors.recovery_code}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center space-y-3 text-center">
                                    <div className="flex w-full items-center justify-center">
                                        <InputOTP
                                            name="code"
                                            maxLength={OTP_MAX_LENGTH}
                                            value={code}
                                            onChange={(value) => setCode(value)}
                                            disabled={processing}
                                            pattern={REGEXP_ONLY_DIGITS}
                                            autoFocus
                                        >
                                            <InputOTPGroup>
                                                {Array.from(
                                                    { length: OTP_MAX_LENGTH },
                                                    (_, index) => (
                                                        <InputOTPSlot
                                                            key={index}
                                                            index={index}
                                                        />
                                                    ),
                                                )}
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </div>
                                    <AuraError message={errors.code} />
                                </div>
                            )}

                            <AuraButton type="submit" processing={processing}>
                                CONTINUAR
                            </AuraButton>

                            <div className="text-center text-sm text-[#8a8178]">
                                <span>ou você pode </span>
                                <button
                                    type="button"
                                    className="cursor-pointer text-[#a97b34] underline decoration-[#e0cfa9] underline-offset-4 transition hover:text-[#7e5a20] hover:decoration-[#b0813c]"
                                    onClick={() =>
                                        toggleRecoveryMode(clearErrors)
                                    }
                                >
                                    {authConfigContent.toggleText}
                                </button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}
