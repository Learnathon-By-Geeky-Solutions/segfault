"use client";

import React, { useEffect } from 'react';
import { Box, Typography, Button, Paper, Container, useTheme } from '@mui/material';
import { Home as HomeIcon, Search as SearchIcon } from '@mui/icons-material';
import Link from 'next/link';
import { styled } from '@mui/material/styles';
import { useAppDispatch } from '@/lib/hooks/hooks';
import { AppDispatch } from '@/lib/store';
import { setCodesiriusLoading } from '@/lib/features/codesirius/codesiriusSlice';

const NotFoundContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: theme.palette.mode === 'dark' 
    ? 'linear-gradient(135deg, rgba(18, 18, 18, 0.95), rgba(30, 30, 30, 0.95))' 
    : 'linear-gradient(135deg, rgba(248, 249, 250, 0.95), rgba(255, 255, 255, 0.95))',
  '&::before': {
    content: '""',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: theme.palette.mode === 'dark' 
      ? 'radial-gradient(circle at 50% 50%, rgba(124, 77, 255, 0.15), transparent 70%)' 
      : 'radial-gradient(circle at 50% 50%, rgba(94, 53, 177, 0.15), transparent 70%)',
    zIndex: -1,
  },
  '&::after': {
    content: '""',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: theme.palette.mode === 'dark' 
      ? 'linear-gradient(45deg, rgba(18, 18, 18, 0.5), transparent)' 
      : 'linear-gradient(45deg, rgba(248, 249, 250, 0.5), transparent)',
    zIndex: -1,
  }
}));

const ErrorPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(6),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(3),
  maxWidth: 600,
  width: '100%',
  textAlign: 'center',
  background: theme.palette.mode === 'dark' 
    ? 'rgba(18, 18, 18, 0.8)' 
    : 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[8],
}));

const ErrorCode = styled(Typography)(({ theme }) => ({
  fontSize: '8rem',
  fontWeight: 700,
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  lineHeight: 1,
  marginBottom: theme.spacing(2),
}));

const ButtonGroup = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  marginTop: theme.spacing(3),
}));

export default function NotFound() {
  const dispatch = useAppDispatch<AppDispatch>();
  const theme = useTheme();

  useEffect(() => {
    dispatch(setCodesiriusLoading(false));
  }, [dispatch]);

  return (
    <NotFoundContainer>
      <ErrorPaper elevation={3}>
        <ErrorCode>404</ErrorCode>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Problem Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: '80%', mx: 'auto' }}>
          The problem you're looking for doesn't exist or has been moved. You can browse our collection of problems or return to the homepage.
        </Typography>
        <ButtonGroup>
          <Button
            variant="contained"
            size="large"
            startIcon={<HomeIcon />}
            component={Link}
            href="/"
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Go Home
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<SearchIcon />}
            component={Link}
            href="/problems"
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
              },
            }}
          >
            Browse Problems
          </Button>
        </ButtonGroup>
      </ErrorPaper>
    </NotFoundContainer>
  );
} 