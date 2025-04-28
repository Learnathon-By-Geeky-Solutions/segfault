"use client"
import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Stack,
    Button,
    Checkbox,
    FormControlLabel,
    Paper,
    Divider,
    Chip,
    Grid,
    Alert,
    Fade,
    Container,
    CircularProgress,
} from '@mui/material';
import {
    Description,
    Code,
    Timer,
    Memory,
    CheckCircle,
    Warning,
    Publish,
    ArrowForward,
    PlayArrow,
    Stop,
    Visibility,
    VisibilityOff,
    BugReport,
    Check,
    Close,
} from '@mui/icons-material';
import { Language, Tag } from './types';
import {APIError, ExecutionConstraint} from '@/lib/features/api/types';
import { useAppDispatch, useAppSelector } from '@/lib/hooks/hooks';
import { setCodesiriusLoading } from '@/lib/features/codesirius/codesiriusSlice';
import { usePublishProblemMutation } from '@/lib/features/api/problemsApiSlice';
import { useRouter } from 'next/navigation';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import LivePreview from '@/components/live-preview';
import { useNotification } from '@/contexts/NotificationContext';
import {isFetchBaseQueryError} from "@/lib/utils/isFetchBaseQueryError";

interface TestCase {
    id: number;
    input: string;
    output: string;
}

interface HiddenTestBundle {
    test_count: number;
    // Add other properties as needed
}

interface ReferenceSolution {
    languageId: number;
    verdict: string;
    memory_usage: number;
    execution_time: number;
}

interface ReviewAndPublishProps {
    problemId: number;
    title: string;
    description: string;
    languages: Language[];
    tags: Tag[];
    executionConstraints: ExecutionConstraint[];
    sampleTests: TestCase[];
    hiddenTestBundle: HiddenTestBundle | null;
    referenceSolutions: ReferenceSolution[];
}

const TestCaseCard = ({ title, count, icon, color }: { title: string, count: number, icon: React.ReactNode, color: string }) => (
    <Paper 
        elevation={0} 
        sx={{ 
            p: 2, 
            background: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.02)'
                : 'rgba(0, 0, 0, 0.02)',
            borderRadius: 2,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            willChange: 'transform, background',
            '&:hover': {
                transform: 'translateX(4px)',
                background: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.04)'
                    : 'rgba(0, 0, 0, 0.04)',
                '& .test-case-icon': {
                    transform: 'scale(1.1) rotate(5deg)',
                },
                '& .test-case-count': {
                    transform: 'scale(1.1)',
                },
            },
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                background: color,
                borderRadius: '2px 0 0 2px',
            },
        }}
    >
        <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
                <Box 
                    className="test-case-icon"
                    sx={{ 
                        color,
                        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        willChange: 'transform',
                    }}
                >
                    {icon}
                </Box>
                <Typography variant="subtitle2" fontWeight="500">
                    {title}
                </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography 
                    variant="h6" 
                    className="test-case-count"
                    sx={{ 
                        color,
                        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        willChange: 'transform',
                    }}
                >
                    {count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    test cases
                </Typography>
            </Stack>
        </Stack>
    </Paper>
);

const ConstraintCard = ({ language, timeLimit, memoryLimit }: { language: string, timeLimit: string | number, memoryLimit: string | number }) => (
    <Paper 
        elevation={0} 
        sx={{ 
            p: 2, 
            background: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.02)'
                : 'rgba(0, 0, 0, 0.02)',
            borderRadius: 2,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            willChange: 'transform, background',
            '&:hover': {
                transform: 'translateX(4px)',
                background: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.04)'
                    : 'rgba(0, 0, 0, 0.04)',
                '& .constraint-icon': {
                    transform: 'scale(1.1)',
                },
                '& .constraint-value': {
                    transform: 'scale(1.05)',
                },
            },
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                background: '#FF9800',
                borderRadius: '2px 0 0 2px',
            },
        }}
    >
        <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
                <Code 
                    className="constraint-icon"
                    sx={{ 
                        color: '#FF9800',
                        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        willChange: 'transform',
                    }}
                />
                <Typography variant="subtitle2" fontWeight="500">
                    {language}
                </Typography>
            </Stack>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <Stack spacing={0.5}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Timer 
                                sx={{ 
                                    color: '#FF9800',
                                    fontSize: '1rem',
                                }}
                            />
                            <Typography variant="caption" color="text.secondary">
                                Time Limit
                            </Typography>
                        </Stack>
                        <Typography 
                            variant="h6" 
                            className="constraint-value"
                            sx={{ 
                                color: '#FF9800',
                                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                willChange: 'transform',
                            }}
                        >
                            {timeLimit}s
                        </Typography>
                    </Stack>
                </Grid>
                <Grid item xs={6}>
                    <Stack spacing={0.5}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Memory 
                                sx={{ 
                                    color: '#FF9800',
                                    fontSize: '1rem',
                                }}
                            />
                            <Typography variant="caption" color="text.secondary">
                                Memory Limit
                            </Typography>
                        </Stack>
                        <Typography 
                            variant="h6" 
                            className="constraint-value"
                            sx={{ 
                                color: '#FF9800',
                                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                willChange: 'transform',
                            }}
                        >
                            {memoryLimit}MB
                        </Typography>
                    </Stack>
                </Grid>
            </Grid>
        </Stack>
    </Paper>
);

const SolutionCard = ({ language, version, verdict, memoryUsage, executionTime }: { 
    language: string,
    version: string,
    verdict: string, 
    memoryUsage: number, 
    executionTime: number 
}) => (
    <Paper 
        elevation={0} 
        sx={{ 
            p: 2, 
            background: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.02)'
                : 'rgba(0, 0, 0, 0.02)',
            borderRadius: 2,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            willChange: 'transform, background',
            '&:hover': {
                transform: 'translateX(4px)',
                background: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.04)'
                    : 'rgba(0, 0, 0, 0.04)',
                '& .solution-icon': {
                    transform: 'scale(1.1)',
                },
            },
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                background: verdict === 'ACCEPTED' ? 'success.main' : 'error.main',
                borderRadius: '2px 0 0 2px',
            },
        }}
    >
        <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
                <Code 
                    className="solution-icon"
                    sx={{ 
                        color: verdict === 'ACCEPTED' ? 'success.main' : 'error.main',
                        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        willChange: 'transform',
                    }}
                />
                <Stack>
                    <Typography variant="subtitle2" fontWeight="500">
                        {language}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        v{version}
                    </Typography>
                </Stack>
                <Box sx={{ flexGrow: 1 }} />
                <Chip
                    size="small"
                    icon={verdict === 'ACCEPTED' ? <Check sx={{ fontSize: 16 }} /> : <Close sx={{ fontSize: 16 }} />}
                    label={verdict === 'ACCEPTED' ? 'Accepted' : 'Not Accepted'}
                    color={verdict === 'ACCEPTED' ? 'success' : 'error'}
                    sx={{ 
                        background: (theme) => verdict === 'ACCEPTED' 
                            ? theme.palette.mode === 'dark' 
                                ? 'rgba(76, 175, 80, 0.2)' 
                                : 'rgba(76, 175, 80, 0.1)'
                            : theme.palette.mode === 'dark'
                                ? 'rgba(244, 67, 54, 0.2)'
                                : 'rgba(244, 67, 54, 0.1)',
                        '& .MuiChip-icon': {
                            color: verdict === 'ACCEPTED' ? 'success.main' : 'error.main',
                        },
                        '& .MuiChip-label': {
                            color: verdict === 'ACCEPTED' ? 'success.main' : 'error.main',
                            fontWeight: 500,
                        },
                    }}
                />
            </Stack>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <Stack spacing={0.5}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Memory 
                                sx={{ 
                                    color: 'text.secondary',
                                    fontSize: '1rem',
                                }}
                            />
                            <Typography variant="caption" color="text.secondary">
                                Memory Usage
                            </Typography>
                        </Stack>
                        <Typography variant="body2">
                            {memoryUsage}MB
                        </Typography>
                    </Stack>
                </Grid>
                <Grid item xs={6}>
                    <Stack spacing={0.5}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Timer 
                                sx={{ 
                                    color: 'text.secondary',
                                    fontSize: '1rem',
                                }}
                            />
                            <Typography variant="caption" color="text.secondary">
                                Execution Time
                            </Typography>
                        </Stack>
                        <Typography variant="body2">
                            {executionTime}s
                        </Typography>
                    </Stack>
                </Grid>
            </Grid>
        </Stack>
    </Paper>
);

const ReviewAndPublish = ({
    problemId,
    title,
    description,
    languages,
    tags,
    executionConstraints,
    sampleTests,
    hiddenTestBundle,
    referenceSolutions,
}: ReviewAndPublishProps) => {
    const [consent, setConsent] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const [publishProblem] = usePublishProblemMutation();
    const isLoading = useAppSelector((state) => state.codesirius.isCodesiriusLoading);
    const { showNotification } = useNotification();

    useEffect(() => {
        dispatch(setCodesiriusLoading(false));
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const getValidationErrors = (): string[] => {
        const errors: string[] = [];

        if (!title.trim()) {
            errors.push("Problem title is required");
        }

        if (!description.trim()) {
            errors.push("Problem description is required");
        }

        if (languages.length === 0) {
            errors.push("At least one programming language must be selected");
        }

        if (tags.length === 0) {
            errors.push("At least one tag must be selected");
        }

        // Check if all languages have execution constraints
        const languagesWithConstraints = new Set(executionConstraints.map(ec => ec.languageId));
        const missingConstraints = languages.filter(lang => !languagesWithConstraints.has(lang.id));
        if (missingConstraints.length > 0) {
            errors.push(`Missing execution constraints for: ${missingConstraints.map(lang => `${lang.name} v${lang.version}`).join(", ")}`);
        }

        if (sampleTests.length === 0) {
            errors.push("At least one sample test case is required");
        }

        if (!hiddenTestBundle) {
            errors.push("Hidden test bundle is required");
        }

        // Check if all languages have reference solutions and they are accepted
        const languagesWithSolutions = new Set(referenceSolutions.map(rs => rs.languageId));
        const missingSolutions = languages.filter(lang => !languagesWithSolutions.has(lang.id));
        if (missingSolutions.length > 0) {
            errors.push(`Missing reference solutions for: ${missingSolutions.map(lang => `${lang.name} v${lang.version}`).join(", ")}`);
        }

        const nonAcceptedSolutions = referenceSolutions.filter(rs => rs.verdict !== "ACCEPTED");
        if (nonAcceptedSolutions.length > 0) {
            const languagesWithNonAccepted = nonAcceptedSolutions.map(rs => {
                const lang = languages.find(l => l.id === rs.languageId);
                return lang ? `${lang.name} v${lang.version}` : "Unknown";
            });
            errors.push(`Reference solutions not accepted for: ${languagesWithNonAccepted.join(", ")}`);
        }

        return errors;
    };

    const validationErrors = getValidationErrors();
    const canPublish = consent && validationErrors.length === 0;

    const handlePublish = async () => {
        if (!consent) {
            showNotification("Please confirm that you have reviewed all the information", "error", "Review Required");
            return;
        }

        try {
            dispatch(setCodesiriusLoading(true));
            const res = await publishProblem({problemId}).unwrap();
            if (res.status === 200) {
                showNotification("Problem published successfully", "success");
                router.push(`/problems/${problemId}`);
            }
        } catch (err) {
            console.error(err);
            if (isFetchBaseQueryError(err)) {
                const apiError = err.data as APIError;
                if (apiError.status === 400 && apiError.errors) {
                    apiError.errors.forEach((error) => {
                        showNotification(error.message, "error", "Publication Error");
                    });
                }
            }
        } finally {
            dispatch(setCodesiriusLoading(false));
        }
    };

    const SectionCard = ({ children, icon, title }: { children: React.ReactNode, icon: React.ReactNode, title: string }) => (
        <Card elevation={0} sx={{ 
            background: (theme) => theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.02)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'transform, box-shadow',
            '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: (theme) => theme.palette.mode === 'dark'
                    ? '0 8px 24px rgba(0, 0, 0, 0.12)'
                    : '0 8px 24px rgba(0, 0, 0, 0.08)',
            },
        }}>
            <CardContent>
                <Stack spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        {icon}
                        <Typography variant="h6" fontWeight="600">
                            {title}
                        </Typography>
                    </Stack>
                    {children}
                </Stack>
            </CardContent>
        </Card>
    );

    if (!isLoaded) {
        return null;
    }

    return (
        <Fade in timeout={300}>
            <Container maxWidth="lg" sx={{ 
                height: '100%',
                overflow: 'auto',
                py: 2,
                '&::-webkit-scrollbar': {
                    width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                    background: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.05)',
                    borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                    background: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '4px',
                    transition: 'background 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    willChange: 'background',
                    '&:hover': {
                        background: (theme) => theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.2)'
                            : 'rgba(0, 0, 0, 0.2)',
                    },
                },
            }}>
                <Stack spacing={3}>
                    {/* Problem Overview Section */}
                    <SectionCard icon={<Description sx={{ color: 'primary.main', fontSize: 24 }} />} title="Problem Overview">
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography variant="h6" fontWeight="500" gutterBottom>
                                    {title}
                                </Typography>
                                <Paper elevation={0} sx={{ 
                                    p: 2,
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    borderRadius: 2,
                                }}>
                                    <Markdown
                                        remarkPlugins={[remarkGfm, remarkMath]}
                                        rehypePlugins={[rehypeKatex, rehypeRaw]}
                                        components={{
                                            h1: ({node, ...props}) => <Typography variant="h5" component="h1" sx={{ mt: 0.75, mb: 0.5 }} {...props} />,
                                            h2: ({node, ...props}) => <Typography variant="h6" component="h2" sx={{ mt: 0.75, mb: 0.5 }} {...props} />,
                                            h3: ({node, ...props}) => <Typography variant="subtitle1" component="h3" sx={{ mt: 0.75, mb: 0.5 }} {...props} />,
                                            h4: ({node, ...props}) => <Typography variant="subtitle2" component="h4" sx={{ mt: 0.5, mb: 0.25 }} {...props} />,
                                            h5: ({node, ...props}) => <Typography variant="body1" fontWeight="bold" component="h5" sx={{ mt: 0.5, mb: 0.25 }} {...props} />,
                                            h6: ({node, ...props}) => <Typography variant="body2" fontWeight="bold" component="h6" sx={{ mt: 0.5, mb: 0.25 }} {...props} />,
                                            p: ({node, ...props}) => <Typography variant="body2" sx={{ mb: 0.5, mt: 0 }} {...props} />,
                                            code: ({node, className, children, ...props}) => {
                                                const match = /language-(\w+)/.exec(className || '');
                                                const isInline = !match;
                                                return (
                                                    <Typography
                                                        component="code"
                                                        sx={{
                                                            backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                                            padding: isInline ? '0.15em 0.3em' : '0.4em',
                                                            borderRadius: 1,
                                                            fontSize: '0.85em',
                                                            fontFamily: 'monospace',
                                                            display: isInline ? 'inline-block' : 'block',
                                                            ...(isInline ? {} : {
                                                                overflow: 'auto',
                                                                whiteSpace: 'pre',
                                                                my: 0.25,
                                                            }),
                                                        }}
                                                        {...props}
                                                    >
                                                        {children}
                                                    </Typography>
                                                );
                                            },
                                            blockquote: ({node, children, ...props}) => (
                                                <Box
                                                    component="blockquote"
                                                    sx={{
                                                        borderLeft: '3px solid',
                                                        borderColor: 'primary.main',
                                                        padding: 0.75,
                                                        margin: '0.2em 0',
                                                        backgroundColor: (theme) =>
                                                            theme.palette.mode === 'dark'
                                                                ? 'rgba(255, 255, 255, 0.05)'
                                                                : 'rgba(0, 0, 0, 0.03)',
                                                        borderRadius: '0 4px 4px 0',
                                                        '& p': {
                                                            margin: 0,
                                                            color: 'text.secondary',
                                                            fontStyle: 'italic',
                                                        },
                                                        '& p:not(:last-child)': {
                                                            marginBottom: 0.25,
                                                        },
                                                    }}
                                                    {...props}
                                                >
                                                    {children}
                                                </Box>
                                            ),
                                            table: ({node, children, ...props}) => (
                                                <Box
                                                    sx={{
                                                        overflowX: 'auto',
                                                        my: 1,
                                                        maxWidth: '100%',
                                                        display: 'block',
                                                    }}
                                                >
                                                    <Box
                                                        component="table"
                                                        sx={{
                                                            borderCollapse: 'collapse',
                                                            width: 'auto',
                                                            minWidth: '50%',
                                                            maxWidth: '100%',
                                                            fontSize: '0.85rem',
                                                            '& th, & td': {
                                                                border: '1px solid',
                                                                borderColor: 'divider',
                                                                padding: 0.75,
                                                                fontSize: 'inherit',
                                                            },
                                                            '& th': {
                                                                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                                                fontWeight: 'bold',
                                                            },
                                                            '& tr:not(:last-child)': {
                                                                marginBottom: 0,
                                                            },
                                                        }}
                                                        {...props}
                                                    >
                                                        {children}
                                                    </Box>
                                                </Box>
                                            ),
                                            ul: ({node, children, ...props}) => (
                                                <Box component="ul" sx={{ pl: 2, my: 0.25, '& li': { fontSize: '0.875rem' } }} {...props}>
                                                    {children}
                                                </Box>
                                            ),
                                            ol: ({node, children, ...props}) => (
                                                <Box component="ol" sx={{ pl: 2, my: 0.25, '& li': { fontSize: '0.875rem' } }} {...props}>
                                                    {children}
                                                </Box>
                                            ),
                                            a: ({node, children, ...props}) => (
                                                <Typography
                                                    component="a"
                                                    variant="body2"
                                                    sx={{
                                                        color: 'primary.main',
                                                        textDecoration: 'none',
                                                        '&:hover': {
                                                            textDecoration: 'underline',
                                                        },
                                                    }}
                                                    {...props}
                                                >
                                                    {children}
                                                </Typography>
                                            ),
                                            img: ({node, ...props}) => (
                                                <Box
                                                    component="img"
                                                    sx={{
                                                        maxWidth: '100%',
                                                        height: 'auto',
                                                        borderRadius: 1,
                                                        my: 0.25,
                                                    }}
                                                    {...props}
                                                />
                                            ),
                                            span: ({node, children, ...props}) => (
                                                <span {...props}>{children}</span>
                                            ),
                                        }}
                                    >
                                        {description}
                                    </Markdown>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Stack spacing={1}>
                                    <Typography variant="subtitle2" fontWeight="500" sx={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                    }}>
                                        <Code sx={{ color: 'primary.main' }} />
                                        Supported Languages
                                    </Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                        {languages.map((lang) => (
                                            <Chip
                                                key={lang.id}
                                                label={`${lang.name} v${lang.version}`}
                                                size="small"
                                                sx={{ 
                                                    m: 0.5,
                                                    background: (theme) => theme.palette.mode === 'dark'
                                                        ? 'rgba(255, 255, 255, 0.1)'
                                                        : 'rgba(0, 0, 0, 0.05)',
                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    willChange: 'transform, background',
                                                    '&:hover': {
                                                        background: (theme) => theme.palette.mode === 'dark'
                                                            ? 'rgba(255, 255, 255, 0.15)'
                                                            : 'rgba(0, 0, 0, 0.08)',
                                                        transform: 'translateY(-1px)',
                                                    },
                                                }}
                                            />
                                        ))}
                                    </Stack>
                                </Stack>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Stack spacing={1}>
                                    <Typography variant="subtitle2" fontWeight="500" sx={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                    }}>
                                        <CheckCircle sx={{ color: 'primary.main' }} />
                                        Tags
                                    </Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                        {tags.map((tag) => (
                                            <Chip
                                                key={tag.id}
                                                label={tag.name}
                                                size="small"
                                                sx={{ 
                                                    m: 0.5,
                                                    background: 'rgba(255, 255, 255, 0.1)',
                                                    '&:hover': {
                                                        background: 'rgba(255, 255, 255, 0.15)',
                                                    },
                                                }}
                                            />
                                        ))}
                                    </Stack>
                                </Stack>
                            </Grid>
                        </Grid>
                    </SectionCard>

                    {/* Execution Constraints Section */}
                    <SectionCard icon={<Timer sx={{ color: 'primary.main', fontSize: 24 }} />} title="Execution Constraints">
                        <Grid container spacing={2}>
                            {executionConstraints.map((constraint) => {
                                const language = languages.find(lang => lang.id === constraint.languageId);
                                return (
                                    <Grid item xs={12} md={6} key={constraint.languageId}>
                                        <ConstraintCard
                                            language={language?.name || ''}
                                            timeLimit={constraint.timeLimit}
                                            memoryLimit={constraint.memoryLimit}
                                        />
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </SectionCard>

                    {/* Test Cases Section */}
                    <SectionCard icon={<BugReport sx={{ color: 'primary.main', fontSize: 24 }} />} title="Test Cases">
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TestCaseCard
                                    title="Sample Tests"
                                    count={sampleTests.length}
                                    icon={<Visibility sx={{ fontSize: 28 }} />}
                                    color="#4CAF50"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TestCaseCard
                                    title="Hidden Tests"
                                    count={hiddenTestBundle?.test_count || 0}
                                    icon={<VisibilityOff sx={{ fontSize: 28 }} />}
                                    color="#2196F3"
                                />
                            </Grid>
                        </Grid>

                        {/* Test Case Details */}
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" fontWeight="500" gutterBottom>
                                Sample Test Cases
                            </Typography>
                            <Stack spacing={1}>
                                {sampleTests.map((test, index) => (
                                    <Paper
                                        key={test.id}
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            background: 'rgba(255, 255, 255, 0.02)',
                                            borderRadius: 2,
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                background: 'rgba(255, 255, 255, 0.04)',
                                            },
                                        }}
                                    >
                                        <Stack spacing={1}>
                                            <Typography variant="subtitle2" color="primary.main">
                                                Test Case {index + 1}
                                            </Typography>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} md={6}>
                                                    <Stack spacing={0.5}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Input
                                                        </Typography>
                                                        <Paper
                                                            elevation={0}
                                                            sx={{
                                                                p: 1,
                                                                background: 'rgba(0, 0, 0, 0.1)',
                                                                borderRadius: 1,
                                                                fontFamily: 'monospace',
                                                                fontSize: '0.875rem',
                                                                whiteSpace: 'pre-wrap',
                                                            }}
                                                        >
                                                            {test.input}
                                                        </Paper>
                                                    </Stack>
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <Stack spacing={0.5}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Expected Output
                                                        </Typography>
                                                        <Paper
                                                            elevation={0}
                                                            sx={{
                                                                p: 1,
                                                                background: 'rgba(0, 0, 0, 0.1)',
                                                                borderRadius: 1,
                                                                fontFamily: 'monospace',
                                                                fontSize: '0.875rem',
                                                                whiteSpace: 'pre-wrap',
                                                            }}
                                                        >
                                                            {test.output}
                                                        </Paper>
                                                    </Stack>
                                                </Grid>
                                            </Grid>
                                        </Stack>
                                    </Paper>
                                ))}
                            </Stack>
                        </Box>
                    </SectionCard>

                    {/* Reference Solutions Section */}
                    <SectionCard icon={<Code sx={{ color: 'primary.main', fontSize: 24 }} />} title="Reference Solutions">
                        <Grid container spacing={2}>
                            {referenceSolutions.map((solution) => {
                                const language = languages.find(lang => lang.id === solution.languageId);
                                return (
                                    <Grid item xs={12} md={6} key={solution.languageId}>
                                        <SolutionCard
                                            language={language?.name || ''}
                                            version={language?.version || ''}
                                            verdict={solution.verdict}
                                            memoryUsage={solution.memory_usage}
                                            executionTime={solution.execution_time}
                                        />
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </SectionCard>

                    {/* Publish Section */}
                    <Card elevation={0} sx={{ 
                        background: (theme) => theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(0, 0, 0, 0.02)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        willChange: 'transform, box-shadow',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: (theme) => theme.palette.mode === 'dark'
                                ? '0 8px 24px rgba(0, 0, 0, 0.12)'
                                : '0 8px 24px rgba(0, 0, 0, 0.08)',
                        },
                    }}>
                        <CardContent>
                            <Stack spacing={2}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Publish sx={{ color: 'primary.main', fontSize: 24 }} />
                                    <Typography variant="h6" fontWeight="600">
                                        Publish Problem
                                    </Typography>
                                </Stack>

                                <Alert severity="warning" sx={{ 
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                }}>
                                    <Stack spacing={1}>
                                        <Typography variant="subtitle2" fontWeight="500">
                                            Important Notice
                                        </Typography>
                                        <Typography variant="body2">
                                            By publishing this problem, you acknowledge that:
                                        </Typography>
                                        <ul style={{ 
                                            margin: 0, 
                                            paddingLeft: '1.5rem',
                                        }}>
                                            <li style={{ marginBottom: '0.5rem' }}>The problem will be publicly available to all users</li>
                                            <li style={{ marginBottom: '0.5rem' }}>You have verified that there is no sensitive or confidential information</li>
                                            <li style={{ marginBottom: '0.5rem' }}>All test cases and reference solutions are correct</li>
                                            <li style={{ marginBottom: '0.5rem' }}>You cannot delete the problem once published</li>
                                        </ul>
                                    </Stack>
                                </Alert>

                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={consent}
                                            onChange={(e) => setConsent(e.target.checked)}
                                            color="primary"
                                            sx={{
                                                '&.Mui-checked': {
                                                    color: 'primary.main',
                                                },
                                            }}
                                        />
                                    }
                                    label="I understand and agree to publish this problem"
                                />

                                <Box display="flex" flexDirection="column" alignItems="flex-end" gap={2}>
                                    {validationErrors.length > 0 && (
                                        <Alert severity="error" sx={{ width: '100%' }}>
                                            <Stack spacing={1}>
                                                <Typography variant="subtitle2" fontWeight="500">
                                                    Cannot publish because:
                                                </Typography>
                                                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                                    {validationErrors.map((error, index) => (
                                                        <li key={index} style={{ marginBottom: '0.25rem' }}>
                                                            {error}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </Stack>
                                        </Alert>
                                    )}
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="large"
                                        onClick={handlePublish}
                                        disabled={!canPublish || isLoading}
                                        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Publish />}
                                        endIcon={!isLoading && <ArrowForward />}
                                        sx={{
                                            borderRadius: 2,
                                            px: 4,
                                            py: 1.5,
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            transition: 'transform 0.2s',
                                            '&:hover': {
                                                transform: 'translateX(4px)',
                                            },
                                        }}
                                    >
                                        {isLoading ? 'Publishing...' : 'Publish Problem'}
                                    </Button>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Stack>
            </Container>
        </Fade>
    );
};

export default ReviewAndPublish; 