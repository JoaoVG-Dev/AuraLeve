import { Link } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { useId, useState } from 'react';

const cx = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(' ');

const fieldClass =
    'h-12 w-full rounded-full border bg-[#fffdf9] px-5 text-[15px] text-[#26221e] outline-none transition placeholder:text-[#b8ac99] focus:ring-4';

const toneClass = (error?: string) =>
    error
        ? 'border-[#c98a76] focus:border-[#a8503a] focus:ring-[rgba(168,80,58,.14)]'
        : 'border-[#e6dcc9] focus:border-[#b0813c] focus:ring-[rgba(176,129,60,.14)]';

export function AuraLabel({
    children,
    htmlFor,
}: {
    children: ReactNode;
    htmlFor?: string;
}) {
    return (
        <label
            htmlFor={htmlFor}
            className="text-[11px] tracking-[.16em] text-[#8a8178] uppercase"
        >
            {children}
        </label>
    );
}

export function AuraError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return <p className="px-5 text-[13px] text-[#a8503a]">{message}</p>;
}

type FieldProps = Omit<ComponentProps<'input'>, 'className'> & {
    label: string;
    error?: string;
    hint?: ReactNode;
};

export function AuraField({ label, error, hint, id, ...props }: FieldProps) {
    const generatedId = useId();
    const fieldId = id ?? generatedId;

    return (
        <div className="grid gap-2">
            <div className="flex items-baseline justify-between gap-4">
                <AuraLabel htmlFor={fieldId}>{label}</AuraLabel>
                {hint}
            </div>
            <input
                id={fieldId}
                className={cx(fieldClass, toneClass(error))}
                {...props}
            />
            <AuraError message={error} />
        </div>
    );
}

export function AuraPasswordField({
    label,
    error,
    hint,
    id,
    ...props
}: Omit<FieldProps, 'type'>) {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const [visible, setVisible] = useState(false);

    return (
        <div className="grid gap-2">
            <div className="flex items-baseline justify-between gap-4">
                <AuraLabel htmlFor={fieldId}>{label}</AuraLabel>
                {hint}
            </div>
            <div className="relative">
                <input
                    id={fieldId}
                    type={visible ? 'text' : 'password'}
                    className={cx(fieldClass, toneClass(error), 'pr-14')}
                    {...props}
                />
                <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setVisible((current) => !current)}
                    aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute inset-y-0 right-0 grid w-13 place-items-center rounded-r-full text-[#a2988a] transition hover:text-[#26221e]"
                >
                    {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
            </div>
            <AuraError message={error} />
        </div>
    );
}

export function AuraButton({
    children,
    processing = false,
    variant = 'solid',
    className,
    ...props
}: ComponentProps<'button'> & {
    processing?: boolean;
    variant?: 'solid' | 'ghost';
}) {
    return (
        <button
            className={cx(
                'inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-xs tracking-[.16em] transition disabled:cursor-not-allowed disabled:opacity-60',
                variant === 'solid'
                    ? 'bg-[#b0813c] text-[#fffdf8] hover:bg-[#96702f]'
                    : 'border border-[#e6dcc9] bg-[#fffdf9] text-[#5c554d] hover:border-[#d5c3a0] hover:text-[#26221e]',
                className,
            )}
            disabled={processing || props.disabled}
            {...props}
        >
            {processing && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {children}
        </button>
    );
}

export function AuraCheckbox({
    label,
    ...props
}: Omit<ComponentProps<'input'>, 'type'> & { label: string }) {
    const generatedId = useId();
    const fieldId = props.id ?? generatedId;

    return (
        <label
            htmlFor={fieldId}
            className="flex cursor-pointer items-center gap-3 text-sm text-[#5c554d]"
        >
            <input
                id={fieldId}
                type="checkbox"
                className="h-4.5 w-4.5 rounded-[6px] border border-[#d9cdb8] accent-[#b0813c]"
                {...props}
            />
            {label}
        </label>
    );
}

export function AuraLink({
    children,
    className,
    ...props
}: ComponentProps<typeof Link>) {
    return (
        <Link
            className={cx(
                'text-[#a97b34] underline decoration-[#e0cfa9] underline-offset-4 transition hover:text-[#7e5a20] hover:decoration-[#b0813c]',
                className,
            )}
            {...props}
        >
            {children}
        </Link>
    );
}

export function AuraNotice({
    children,
    tone = 'info',
}: {
    children: ReactNode;
    tone?: 'info' | 'success';
}) {
    return (
        <div
            className={cx(
                'rounded-[18px] border p-4 text-sm leading-6',
                tone === 'success'
                    ? 'border-[#dfe6cf] bg-[#f4f7ec] text-[#4d5a38]'
                    : 'border-[#ece3d2] bg-[#f9f4e9] text-[#5c554d]',
            )}
        >
            {children}
        </div>
    );
}
