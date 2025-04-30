import { SvgIcon } from "@mui/material";
import React from "react";
import { keyframes } from "@emotion/react";

export interface AnimatedSubmitIconProps {
    isSubmitting: boolean;
}

const flyAnimation = keyframes`
    0% {
        transform: rotate(-30deg) scale(0.8) translate(0, 0);
        opacity: 0.7;
    }
    20% {
        transform: rotate(-45deg) scale(1) translate(2px, -2px);
        opacity: 1;
    }
    60% {
        transform: rotate(-45deg) scale(1) translate(6px, -6px);
        opacity: 1;
    }
    100% {
        transform: rotate(-45deg) scale(0.9) translate(8px, -8px);
        opacity: 0.8;
    }
`;

const AnimatedSubmitIcon = ({ isSubmitting }: AnimatedSubmitIconProps) => {
    return (
        <SvgIcon
            viewBox="0 0 24 24"
            sx={{
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: 'rotate(-30deg)',
                animation: isSubmitting ? `${flyAnimation} 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite` : 'none',
                opacity: isSubmitting ? 1 : 0.7,
                filter: isSubmitting ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' : 'none',
                '& path': {
                    transition: 'fill 0.3s ease-in-out',
                    fill: 'currentColor'
                },
                '&:hover': {
                    opacity: 0.9,
                    transform: 'rotate(-30deg) scale(1.05)',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                }
            }}
        >
            <g>
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </g>
        </SvgIcon>
    );
};

export default AnimatedSubmitIcon; 