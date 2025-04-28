"use client";

import React, { useEffect } from 'react';
import { useAppDispatch } from "@/lib/hooks/hooks";
import { AppDispatch } from "@/lib/store";
import { setCodesiriusLoading } from "@/lib/features/codesirius/codesiriusSlice";
import { Box, Button, Container, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { Home } from "@mui/icons-material";

export default function NotFound() {
    const dispatch = useAppDispatch<AppDispatch>();
    const router = useRouter();

    useEffect(() => {
        dispatch(setCodesiriusLoading(false));
    }, [dispatch]);

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '80vh',
                    textAlign: 'center',
                    gap: 3
                }}
            >
                <Typography variant="h1" component="h1" sx={{ fontSize: '6rem', fontWeight: 'bold' }}>
                    404
                </Typography>
                <Typography variant="h4" component="h2" gutterBottom>
                    Problem Not Found
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    The problem you are looking for does not exist or you do not have permission to access it.
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Home />}
                    onClick={() => router.push('/')}
                    sx={{ mt: 2 }}
                >
                    Go to Home
                </Button>
            </Box>
        </Container>
    );
} 