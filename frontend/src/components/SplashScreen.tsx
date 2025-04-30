"use client";
import React, { useEffect, useState } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { Code } from '@mui/icons-material';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const slideUp = keyframes`
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const AnimatedBox = styled(Box)(({ theme }) => ({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.palette.background.default,
    zIndex: 9999,
    animation: `${fadeIn} 0.5s ease-out forwards`,
}));

const LogoContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(4),
    '& .MuiSvgIcon-root': {
        fontSize: 64,
        color: theme.palette.primary.main,
        animation: `${pulse} 2s infinite ease-in-out`,
    },
}));

const TitleTypography = styled(Typography)(({ theme }) => ({
    fontWeight: 700,
    letterSpacing: '-0.5px',
    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: `${slideUp} 0.5s ease-out 0.2s forwards`,
    opacity: 0,
}));

const SubtitleTypography = styled(Typography)(({ theme }) => ({
    color: theme.palette.text.secondary,
    animation: `${slideUp} 0.5s ease-out 0.4s forwards`,
    opacity: 0,
}));

const LoadingBar = styled(Box)(({ theme }) => ({
    width: 200,
    height: 4,
    backgroundColor: theme.palette.mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.1)' 
        : 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    marginTop: theme.spacing(4),
    overflow: 'hidden',
    position: 'relative',
    '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: '30%',
        backgroundColor: theme.palette.primary.main,
        animation: 'loading 1.5s infinite ease-in-out',
    },
    '@keyframes loading': {
        '0%': {
            transform: 'translateX(-100%)',
        },
        '100%': {
            transform: 'translateX(400%)',
        },
    },
}));

const SplashScreen = () => {
    const theme = useTheme();
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 2000); // Show splash screen for 2 seconds

        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    return (
        <AnimatedBox>
            <LogoContainer>
                <Code />
                <TitleTypography variant="h3">
                    CodeSirius
                </TitleTypography>
            </LogoContainer>
            <SubtitleTypography variant="h6">
                Ace your coding interviews
            </SubtitleTypography>
            <LoadingBar />
        </AnimatedBox>
    );
};

export default SplashScreen; 