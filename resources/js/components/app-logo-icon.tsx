import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(
    props: ImgHTMLAttributes<HTMLImageElement>,
) {
    return (
        <img
            {...props}
            src="/images/brand/auraleve-symbol.png"
            alt=""
            draggable={false}
        />
    );
}
