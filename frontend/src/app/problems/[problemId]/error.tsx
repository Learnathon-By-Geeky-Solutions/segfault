"use client";

import React, { useEffect } from 'react';
import { Box, Typography, Button, Paper, useTheme } from '@mui/material';
import { Home as HomeIcon, Search as SearchIcon } from '@mui/icons-material';
import Link from 'next/link';
import { styled } from '@mui/material/styles';
import { useAppDispatch } from '@/lib/hooks/hooks';
import { AppDispatch } from '@/lib/store';
import { setCodesiriusLoading } from '@/lib/features/codesirius/codesiriusSlice';

const ErrorContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: theme.palette.mode === 'dark' 
    ? 'linear-gradient(135deg, rgba(18, 18, 18, 0.95), rgba(30, 30, 30, 0.95))' 
    : 'linear-gradient(135deg, rgba(248, 249, 250, 0.95), rgba(255, 255, 255, 0.95))',
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

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const dispatch = useAppDispatch<AppDispatch>();
  const theme = useTheme();

  useEffect(() => {
    dispatch(setCodesiriusLoading(false));
  }, [dispatch]);

  // Handle 401/403 as 404
  const statusCode = error.message.includes('401') || error.message.includes('403') ? 404 : 500;

  return (
    <ErrorContainer>
      <ErrorPaper elevation={3}>
        <ErrorCode>{statusCode}</ErrorCode>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          {statusCode === 404 ? 'Problem Not Found' : 'Something went wrong'}
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: '80%', mx: 'auto' }}>
          {statusCode === 404 
            ? "The problem you're looking for doesn't exist or has been moved."
            : "We encountered an unexpected error. Please try again later."}
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
    </ErrorContainer>
  );
}