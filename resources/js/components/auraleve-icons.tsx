import type { SVGProps } from 'react';

type AuraIconProps = SVGProps<SVGSVGElement> & {
    filled?: boolean;
    size?: number | string;
};

export function BeadsIcon({ size = 24, ...props }: AuraIconProps) {
    return (
        <svg
            {...props}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.4}
        >
            <circle cx="8" cy="8.5" r="4" />
            <circle cx="15.5" cy="12" r="3.2" />
            <circle cx="9.5" cy="17" r="2.6" />
        </svg>
    );
}

export function FlameIcon({ size = 24, ...props }: AuraIconProps) {
    return (
        <svg
            {...props}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.4}
        >
            <path d="M12 3.5c3 3.4 5.5 5.6 5.5 9a5.5 5.5 0 0 1-11 0c0-3.4 2.5-5.6 5.5-9Z" />
            <path d="M12 20v-6" />
        </svg>
    );
}

export function HandIcon({ size = 24, ...props }: AuraIconProps) {
    return (
        <svg
            {...props}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.4}
        >
            <path d="M12 3.5v9M8.5 7v6M15.5 7v6M5.5 11v3.5A6.5 6.5 0 0 0 12 21a6.5 6.5 0 0 0 6.5-6.5V11" />
        </svg>
    );
}

export function HeartIcon({
    filled = false,
    size = 24,
    ...props
}: AuraIconProps) {
    return (
        <svg
            {...props}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={filled ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth={filled ? 1.4 : 1.6}
        >
            <path d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z" />
        </svg>
    );
}

export function TruckIcon({ size = 24, ...props }: AuraIconProps) {
    return (
        <svg
            {...props}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
        >
            <path d="M2.5 6.5h11v10h-11z" />
            <path d="M13.5 10h4l3.5 3v3.5h-7.5" />
            <circle cx="6.5" cy="18.5" r="1.8" />
            <circle cx="16.5" cy="18.5" r="1.8" />
        </svg>
    );
}

export function LeafIcon({ size = 24, ...props }: AuraIconProps) {
    return (
        <svg
            {...props}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.35}
        >
            <path d="M20 4.5C12.5 4.8 6.8 8.9 5 17.8c7.7-.1 13.2-4.8 15-13.3Z" />
            <path d="M5 17.8c3.5-4.5 7.2-7.2 11.8-9" />
        </svg>
    );
}

export function MailIcon({ size = 24, ...props }: AuraIconProps) {
    return (
        <svg
            {...props}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.4}
        >
            <rect x="3" y="5.5" width="18" height="13" />
            <path d="m3 7 9 7 9-7" />
        </svg>
    );
}

export function InstagramIcon({ size = 24, ...props }: AuraIconProps) {
    return (
        <svg
            {...props}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
        >
            <rect x="4.5" y="4.5" width="15" height="15" rx="4" />
            <circle cx="12" cy="12" r="3.4" />
            <circle
                cx="16.6"
                cy="7.4"
                r=".8"
                fill="currentColor"
                stroke="none"
            />
        </svg>
    );
}

export function WhatsappIcon({ size = 24, ...props }: AuraIconProps) {
    return (
        <svg
            {...props}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.45}
        >
            <path d="M5.3 19.2 6.2 16A7.6 7.6 0 1 1 9 18.7l-3.7.5Z" />
            <path d="M9.4 8.7c.3-.5.5-.5.8-.5h.6c.2 0 .4.1.5.4l.8 1.9c.1.2 0 .4-.1.6l-.5.7c.6 1 1.5 1.8 2.6 2.3l.7-.6c.2-.1.4-.2.6-.1l1.8.8c.3.1.4.3.4.6v.5c0 .4-.3.7-.7.9-.7.3-1.6.3-2.9-.2-2.5-1-4.4-2.8-5.4-5.2-.4-1-.4-1.6.2-2.1Z" />
        </svg>
    );
}
