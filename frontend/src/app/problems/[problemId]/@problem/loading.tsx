"use client";
import React from 'react';
import { Box, Skeleton, Stack, Paper, Typography, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

const ProblemCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    borderRadius: '12px',
    background: theme.palette.mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.05)' 
        : 'rgba(0, 0, 0, 0.02)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${theme.palette.divider}`,
    transition: 'all 0.3s ease',
}));

const SampleTestCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    borderRadius: '8px',
    background: theme.palette.mode === 'dark' 
        ? 'rgba(0, 0, 0, 0.2)' 
        : 'rgba(0, 0, 0, 0.03)',
    border: `1px solid ${theme.palette.divider}`,
}));

const CodeBlock = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    borderRadius: '6px',
    background: theme.palette.mode === 'dark' 
        ? 'rgba(0, 0, 0, 0.3)' 
        : 'rgba(0, 0, 0, 0.05)',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    border: `1px solid ${theme.palette.divider}`,
}));

const Loading = () => {
    const theme = useTheme();

    return (
        <Box sx={{p: 2}}>
            {/* Title and Badges */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Skeleton 
                        variant="text" 
                        width={300} 
                        height={40} 
                        sx={{ 
                            borderRadius: 1,
                            bgcolor: theme.palette.mode === 'dark' 
                                ? 'rgba(255, 255, 255, 0.1)' 
                                : 'rgba(0, 0, 0, 0.1)',
                        }}
                    />
                    <Skeleton 
                        variant="rounded" 
                        width={80} 
                        height={24} 
                        sx={{ 
                            borderRadius: 4,
                            bgcolor: theme.palette.mode === 'dark' 
                                ? 'rgba(255, 255, 255, 0.1)' 
                                : 'rgba(0, 0, 0, 0.1)',
                        }}
                    />
                </Box>
                <Skeleton 
                    variant="circular" 
                    width={40} 
                    height={40} 
                    sx={{ 
                        bgcolor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.1)' 
                            : 'rgba(0, 0, 0, 0.1)',
                    }}
                />
            </Box>

            {/* Tags */}
            <Stack direction="row" spacing={1} sx={{mb: 3}}>
                {[1, 2, 3].map((i) => (
                    <Skeleton 
                        key={i}
                        variant="rounded" 
                        width={80} 
                        height={24} 
                        sx={{ 
                            borderRadius: 4,
                            bgcolor: theme.palette.mode === 'dark' 
                                ? 'rgba(255, 255, 255, 0.1)' 
                                : 'rgba(0, 0, 0, 0.1)',
                        }}
                    />
                ))}
            </Stack>

            {/* Problem Description */}
            <ProblemCard elevation={0}>
                <Stack spacing={2}>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton 
                            key={i}
                            variant="text" 
                            width={`${Math.random() * 30 + 70}%`} 
                            height={24} 
                            sx={{ 
                                borderRadius: 1,
                                bgcolor: theme.palette.mode === 'dark' 
                                    ? 'rgba(255, 255, 255, 0.1)' 
                                    : 'rgba(0, 0, 0, 0.1)',
                            }}
                        />
                    ))}
                </Stack>
            </ProblemCard>

            {/* Sample Tests */}
            <Box sx={{mt: 4}}>
                <Typography 
                    variant="h6" 
                    sx={{ 
                        color: 'primary.main',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 2,
                    }}
                >
                    Sample Tests
                </Typography>
                <Stack spacing={3}>
                    {[1, 2].map((testIndex) => (
                        <SampleTestCard key={testIndex} elevation={0}>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography 
                                        variant="subtitle2" 
                                        color="text.secondary" 
                                        gutterBottom
                                        sx={{ fontWeight: 500 }}
                                    >
                                        Input
                                    </Typography>
                                    <CodeBlock elevation={0}>
                                        <Skeleton 
                                            variant="text" 
                                            width="100%" 
                                            height={60} 
                                            sx={{ 
                                                borderRadius: 1,
                                                bgcolor: theme.palette.mode === 'dark' 
                                                    ? 'rgba(255, 255, 255, 0.1)' 
                                                    : 'rgba(0, 0, 0, 0.1)',
                                            }}
                                        />
                                    </CodeBlock>
                                </Box>
                                <Box>
                                    <Typography 
                                        variant="subtitle2" 
                                        color="text.secondary" 
                                        gutterBottom
                                        sx={{ fontWeight: 500 }}
                                    >
                                        Output
                                    </Typography>
                                    <CodeBlock elevation={0}>
                                        <Skeleton 
                                            variant="text" 
                                            width="100%" 
                                            height={60} 
                                            sx={{ 
                                                borderRadius: 1,
                                                bgcolor: theme.palette.mode === 'dark' 
                                                    ? 'rgba(255, 255, 255, 0.1)' 
                                                    : 'rgba(0, 0, 0, 0.1)',
                                            }}
                                        />
                                    </CodeBlock>
                                </Box>
                            </Stack>
                        </SampleTestCard>
                    ))}
                </Stack>
            </Box>
        </Box>
    );
};

export default Loading;
