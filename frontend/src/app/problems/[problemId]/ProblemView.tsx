"use client";
import React, { useState } from 'react';
import { Box, Skeleton, Typography, Chip, Stack, Paper, Tabs, Tab, IconButton, Tooltip } from '@mui/material';
import SplitPane from '@/components/SplitPane';
import { useAppSelector } from '@/lib/hooks/hooks';
import { setCodesiriusLoading } from '@/lib/features/codesirius/codesiriusSlice';
import { useAppDispatch } from '@/lib/hooks/hooks';
import { useEffect } from 'react';
import LivePreview from '@/components/live-preview';
import { Code, Download } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { DifficultyBadge } from '@/components/DifficultyBadge';

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
    createdBy: number;
    status: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

interface ProblemViewProps {
    problem: Problem;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`problem-tabpanel-${index}`}
            aria-labelledby={`problem-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 2, height: '100%' }}>
                    {children}
                </Box>
            )}
        </div>
    );
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

const ProblemView = ({ problem }: ProblemViewProps) => {
    const dispatch = useAppDispatch();
    const isLoading = useAppSelector(state => state.codesirius.isCodesiriusLoading);
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        dispatch(setCodesiriusLoading(false));
    }, [dispatch]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

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

    if (isLoading) {
        return (
            <Box sx={{ 
                height: 'calc(100vh - 64px)', 
                p: 2,
                display: 'flex',
                flexDirection: 'column',
            }}>
                <SplitPane
                    leftWidth={50}
                    leftChildren={
                        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Tabs 
                                value={0}
                                sx={{
                                    borderBottom: 1,
                                    borderColor: 'divider',
                                    '& .MuiTab-root': {
                                        textTransform: 'none',
                                        fontWeight: 500,
                                    }
                                }}
                            >
                                <Tab label="Problem" />
                                <Tab label="Submissions" />
                            </Tabs>
                            <Box sx={{ p: 2, height: '100%' }}>
                                <Stack spacing={2}>
                                    <Skeleton variant="text" width="60%" height={40} />
                                    <Stack direction="row" spacing={1}>
                                        {[1, 2, 3].map((i) => (
                                            <Skeleton key={i} variant="rounded" width={80} height={24} />
                                        ))}
                                    </Stack>
                                    <Paper 
                                        elevation={0}
                                        sx={{ 
                                            p: 2,
                                            flex: 1,
                                            overflow: 'auto',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            backdropFilter: 'blur(10px)',
                                        }}
                                    >
                                        <Stack spacing={2}>
                                            <Skeleton variant="text" width="100%" height={24} />
                                            <Skeleton variant="text" width="100%" height={24} />
                                            <Skeleton variant="text" width="80%" height={24} />
                                            <Skeleton variant="text" width="90%" height={24} />
                                            <Skeleton variant="text" width="70%" height={24} />
                                        </Stack>
                                    </Paper>
                                </Stack>
                            </Box>
                        </Box>
                    }
                    rightChildren={
                        <Box sx={{ 
                            p: 2,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                        }}>
                            <Skeleton variant="rectangular" height="100%" />
                        </Box>
                    }
                />
            </Box>
        );
    }

    return (
        <Box sx={{ 
            height: 'calc(100vh - 64px)', 
            p: 2,
            display: 'flex',
            flexDirection: 'column',
        }}>
            <SplitPane
                leftWidth={50}
                leftChildren={
                    <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'background.paper' }}>
                            <Tabs value={tabValue} onChange={handleTabChange} aria-label="problem tabs">
                                <Tab label="Problem" />
                                <Tab label="Submissions" />
                            </Tabs>
                        </Box>
                        <TabPanel value={tabValue} index={0}>
                            <Box sx={{p: 2}}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <TitleTypography variant="h4">
                                            {problem.title}
                                        </TitleTypography>
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
                                                <Code sx={{fontSize: '1.2rem'}} />
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
                            </Box>
                        </TabPanel>
                        <TabPanel value={tabValue} index={1}>
                            <Box sx={{ p: 2 }}>
                                <Typography>Submissions will be shown here</Typography>
                            </Box>
                        </TabPanel>
                    </Box>
                }
                rightChildren={
                    <Box sx={{ 
                        p: 2,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        {/* TODO: Add code editor and submission form */}
                        <h2>Code Editor</h2>
                    </Box>
                }
            />
        </Box>
    );
};

export default ProblemView; 