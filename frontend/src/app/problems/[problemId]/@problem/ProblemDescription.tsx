    "use client";
import React from 'react';
import { Box, Typography, Chip, Stack, Paper, IconButton, Tooltip, Button, Fab } from '@mui/material';
import { Download, Edit as EditIcon, Publish as PublishIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import LivePreview from '@/components/live-preview';
import Link from 'next/link';
import { useAppDispatch } from '@/lib/hooks/hooks';
import { AppDispatch } from '@/lib/store';
import { setCodesiriusLoading } from '@/lib/features/codesirius/codesiriusSlice';

interface Problem {
    id: number;
    title: string;
    description: string;
    languages: Array<{
        id: number;
        name: string;
        version: string;
    }>;
    tags: Array<{
        id: number;
        name: string;
        description: string;
    }>;
    executionConstraints: Array<{
        id: number;
        languageId: number;
        timeLimit: number;
        memoryLimit: number;
    }>;
    sampleTests: Array<{
        id: number;
        input: string;
        output: string;
    }>;
    hiddenTestBundle: {
        id: number;
        test_count: number;
    };
    status: 'DRAFT' | 'PUBLISHED';
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

interface ProblemDescriptionProps {
    problem: Problem;
}

const ProblemCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    borderRadius: '12px',
    background: theme.palette.mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.05)' 
        : 'rgba(0, 0, 0, 0.02)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${theme.palette.divider}`,
    transition: 'all 0.3s ease',
    '&:hover': {
        boxShadow: theme.shadows[4],
    }
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

const TitleTypography = styled(Typography)(({ theme }) => ({
    fontWeight: 600,
    letterSpacing: '-0.5px',
    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
}));

const DraftChip = styled(Chip)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' 
        ? 'rgba(255, 152, 0, 0.1)' 
        : 'rgba(255, 152, 0, 0.1)',
    color: theme.palette.warning.main,
    fontWeight: 500,
    '&:hover': {
        backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(255, 152, 0, 0.2)' 
            : 'rgba(255, 152, 0, 0.2)',
    }
}));

const TagChip = styled(Chip)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' 
        ? 'rgba(124, 77, 255, 0.1)' 
        : 'rgba(94, 53, 177, 0.1)',
    color: 'primary.main',
    fontWeight: 500,
    '&:hover': {
        backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(124, 77, 255, 0.2)' 
            : 'rgba(94, 53, 177, 0.2)',
    }
}));

const CompleteButton = styled(Button)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' 
        ? 'rgba(76, 175, 80, 0.1)' 
        : 'rgba(76, 175, 80, 0.1)',
    color: theme.palette.success.main,
    fontWeight: 500,
    '&:hover': {
        backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(76, 175, 80, 0.2)' 
            : 'rgba(76, 175, 80, 0.2)',
    }
})) as typeof Button;

const FloatingButton = styled(Fab)(({ theme }) => ({
    position: 'fixed',
    bottom: theme.spacing(3),
    left: theme.spacing(3),
    backgroundColor: theme.palette.success.main,
    color: theme.palette.common.white,
    '&:hover': {
        backgroundColor: theme.palette.success.dark,
    },
    zIndex: theme.zIndex.speedDial,
})) as typeof Fab;

const ProblemDescription = ({ problem }: ProblemDescriptionProps) => {
    const dispatch = useAppDispatch<AppDispatch>();
    const handleDownload = async () => {
        const element = document.getElementById('preview-content');
        if (element) {
            const html2pdf = (await import('html2pdf.js')).default;
            const opt = {
                margin: 1,
                filename: `${problem.title}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff'
                },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(element).save();
        }
    };

    const handlePublish = () => {
        dispatch(setCodesiriusLoading(true));
    };

    return (
        <Box sx={{p: 2}}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TitleTypography variant="h4">
                        {problem.title}
                    </TitleTypography>
                    {problem.status === 'DRAFT' && (
                        <DraftChip
                            label="Draft"
                            size="small"
                        />
                    )}
                    <DifficultyBadge difficulty={problem.difficulty} />
                </Box>
                <Tooltip title="Download Problem Statement">
                    <IconButton 
                        onClick={handleDownload}
                        sx={{ 
                            color: 'primary.main',
                            '&:hover': {
                                backgroundColor: 'rgba(128, 23, 245, 0.1)',
                                transform: 'scale(1.1)',
                            },
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <Download />
                    </IconButton>
                </Tooltip>
            </Box>
            <Box id="preview-content">
                <Stack direction="row" spacing={1} sx={{mb: 3}}>
                    {problem.tags.map((tag, index) => (
                        <TagChip
                            key={index}
                            label={tag.name}
                            size="small"
                        />
                    ))}
                </Stack>
                <ProblemCard elevation={0}>
                    <LivePreview 
                        title={problem.title} 
                        description={problem.description} 
                        hideHeader={true}
                        hideTitle={true}
                    />
                </ProblemCard>
                
                {problem.sampleTests && problem.sampleTests.length > 0 && (
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
                            {problem.sampleTests.map((test, index) => (
                                <SampleTestCard key={index} elevation={0}>
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
                                                {test.input}
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
                                                {test.output}
                                            </CodeBlock>
                                        </Box>
                                    </Stack>
                                </SampleTestCard>
                            ))}
                        </Stack>
                    </Box>
                )}
            </Box>
            {problem.status === 'DRAFT' && (
                <FloatingButton
                    variant="extended"
                    component={Link}
                    href={`/problems/create/${problem.id}/step/5`}
                    onClick={handlePublish}
                    sx={{
                        textTransform: 'none',
                    }}
                >
                    <PublishIcon sx={{ mr: 1 }} />
                    Publish
                </FloatingButton>
            )}
        </Box>
    );
};

export default ProblemDescription; 