"use client";
import React from 'react';
import {
    Paper,
    Box,
    Typography,
    Card,
    CardContent,
    Stack,
    Divider,
    IconButton,
    Tooltip,
    useTheme,
} from "@mui/material";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import {Preview, Code, Download} from "@mui/icons-material";
import {useAppSelector} from "@/lib/hooks/hooks";
import 'katex/dist/katex.min.css';

interface LivePreviewProps {
    title?: string;
    description?: string;
    hideHeader?: boolean;
    hideTitle?: boolean;
}

const LivePreview = ({ title: propTitle, description: propDescription, hideHeader = false, hideTitle = false }: LivePreviewProps) => {
    const theme = useTheme();
    const reduxTitle = useAppSelector(state => state.addProblem.title);
    const reduxDescription = useAppSelector(state => state.addProblem.description);

    // Use props if provided, otherwise use Redux state
    const title = propTitle || reduxTitle;
    const description = propDescription || reduxDescription;

    const handleDownloadPDF = async () => {
        const element = document.getElementById('preview-content');
        if (!element) return;

        // Create a clone of the element for PDF generation
        const clone = element.cloneNode(true) as HTMLElement;
        
        // Apply current theme styles to the clone
        clone.style.backgroundColor = theme.palette.background.paper;
        clone.style.color = theme.palette.text.primary;
        
        // Find all elements that need theme-specific colors
        const elements = clone.querySelectorAll('*');
        elements.forEach(el => {
            const element = el as HTMLElement;
            // Apply current theme colors
            if (element.tagName === 'CODE') {
                element.style.backgroundColor = theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                element.style.color = theme.palette.text.primary;
            }
            if (element.tagName === 'TH') {
                element.style.backgroundColor = theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                element.style.color = theme.palette.text.primary;
            }
            if (element.tagName === 'BLOCKQUOTE') {
                element.style.backgroundColor = theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
                element.style.borderColor = theme.palette.primary.main;
                element.style.color = theme.palette.text.secondary;
            }
            if (element.tagName === 'P' && element.parentElement?.tagName === 'BLOCKQUOTE') {
                element.style.color = theme.palette.text.secondary;
                element.style.fontStyle = 'italic';
                element.style.margin = '0';
            }
            if (element.tagName === 'A') {
                element.style.color = theme.palette.primary.main;
                element.style.textDecoration = 'none';
            }
            if (element.tagName.match(/^H[1-6]$/)) {
                element.style.color = theme.palette.text.primary;
            }
            if (element.tagName === 'TD') {
                element.style.borderColor = theme.palette.divider;
                element.style.color = theme.palette.text.primary;
            }
            if (element.tagName === 'LI') {
                element.style.color = theme.palette.text.primary;
            }
            if (element.tagName === 'HR') {
                element.style.borderColor = theme.palette.divider;
            }
        });

        const opt = {
            margin: 1,
            filename: `${title || 'problem'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                backgroundColor: theme.palette.background.paper
            },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // Create a temporary container for the clone
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        container.style.backgroundColor = theme.palette.background.paper;
        container.style.padding = '20px';
        container.appendChild(clone);
        document.body.appendChild(container);

        try {
            const html2pdf = (await import('html2pdf.js')).default;
            await html2pdf().set(opt).from(clone).save();
        } finally {
            // Clean up the temporary container
            document.body.removeChild(container);
        }
    };

    const renderContent = () => {
        if (!title && !description) {
            return (
                <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
                    <Preview />
                    <Typography>
                        Live Preview will appear here
                    </Typography>
                </Stack>
            );
        }

        return (
            <Box id="preview-content" sx={{
                wordBreak: "break-word",
                overflowWrap: "break-word",
                whiteSpace: "pre-wrap",
            }}>
                {!hideTitle && title && (
                    <>
                        <Box textAlign="center" mb={1.5}>
                            <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 0.5 }}>
                                {title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
                                <strong>Input:</strong> Standard Input
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Output:</strong> Standard Output
                            </Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                    </>
                )}
                <Markdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex, rehypeRaw]}
                    components={{
                        // Enhanced heading styles with better spacing and visual hierarchy
                        h1: ({node, ...props}) => <Typography variant="h4" component="h1" sx={{ mt: 1.25, mb: 0.15, fontWeight: 600, color: 'primary.main' }} {...props} />,
                        h2: ({node, ...props}) => <Typography variant="h5" component="h2" sx={{ mt: 1, mb: 0.15, fontWeight: 600 }} {...props} />,
                        h3: ({node, ...props}) => <Typography variant="h6" component="h3" sx={{ mt: 0.75, mb: 0.15, fontWeight: 600 }} {...props} />,
                        h4: ({node, ...props}) => <Typography variant="subtitle1" component="h4" sx={{ mt: 0.75, mb: 0.15, fontWeight: 600 }} {...props} />,
                        h5: ({node, ...props}) => <Typography variant="subtitle2" component="h5" sx={{ mt: 0.5, mb: 0.15, fontWeight: 600 }} {...props} />,
                        h6: ({node, ...props}) => <Typography variant="body1" component="h6" sx={{ mt: 0.5, mb: 0.15, fontWeight: 600 }} {...props} />,

                        // Enhanced paragraph styles with better line height and spacing
                        p: ({node, ...props}) => <Typography variant="body1" sx={{ mb: 0.75, mt: 0, lineHeight: 1.5 }} {...props} />,

                        // Enhanced code styles with better contrast and spacing
                        code: ({node, className, children, ...props}) => {
                            const match = /language-(\w+)/.exec(className || '');
                            const isInline = !match;
                            return (
                                <Typography
                                    component="code"
                                    sx={{
                                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                                        padding: isInline ? '0.2em 0.4em' : '0.8em',
                                        borderRadius: 1,
                                        fontSize: '0.9em',
                                        fontFamily: 'monospace',
                                        display: isInline ? 'inline-block' : 'block',
                                        lineHeight: 1.5,
                                        ...(isInline ? {} : {
                                            overflow: 'auto',
                                            whiteSpace: 'pre',
                                            my: 1,
                                            border: `1px solid ${theme.palette.divider}`,
                                        }),
                                    }}
                                    {...props}
                                >
                                    {children}
                                </Typography>
                            );
                        },

                        // Enhanced blockquote styles with better visual appeal
                        blockquote: ({node, children, ...props}) => (
                            <Box
                                component="blockquote"
                                sx={{
                                    borderLeft: '4px solid',
                                    borderColor: 'primary.main',
                                    padding: 1.5,
                                    margin: '1em 0',
                                    backgroundColor: (theme) =>
                                        theme.palette.mode === 'dark'
                                            ? 'rgba(255, 255, 255, 0.05)'
                                            : 'rgba(0, 0, 0, 0.03)',
                                    borderRadius: '0 8px 8px 0',
                                    '& p': {
                                        margin: 0,
                                        color: 'text.secondary',
                                        fontStyle: 'italic',
                                        lineHeight: 1.7,
                                    },
                                    '& p:not(:last-child)': {
                                        marginBottom: 0.75,
                                    },
                                }}
                                {...props}
                            >
                                {children}
                            </Box>
                        ),

                        // Enhanced table styles with better spacing and borders
                        table: ({node, children, ...props}) => (
                            <Box
                                sx={{
                                    overflowX: 'auto',
                                    my: 2,
                                    maxWidth: '100%',
                                    display: 'block',
                                    borderRadius: 1,
                                    border: `1px solid ${theme.palette.divider}`,
                                }}
                            >
                                <Box
                                    component="table"
                                    sx={{
                                        borderCollapse: 'collapse',
                                        width: 'auto',
                                        minWidth: '50%',
                                        maxWidth: '100%',
                                        fontSize: '0.9rem',
                                        '& th, & td': {
                                            border: `1px solid ${theme.palette.divider}`,
                                            padding: 1,
                                            fontSize: 'inherit',
                                            lineHeight: 1.5,
                                        },
                                        '& th': {
                                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                                            fontWeight: 600,
                                        },
                                        '& tr:nth-of-type(even)': {
                                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                                        },
                                        '& tr:hover': {
                                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                                        },
                                    }}
                                    {...props}
                                >
                                    {children}
                                </Box>
                            </Box>
                        ),

                        // Enhanced list styles with better spacing and bullets
                        ul: ({node, children, ...props}) => (
                            <Box 
                                component="ul" 
                                sx={{ 
                                    pl: 1.5, 
                                    my: 0.15, 
                                    '& li': { 
                                        fontSize: '0.95rem',
                                        lineHeight: 1.5,
                                        mb: 0.15,
                                        '&::marker': {
                                            color: 'primary.main'
                                        }
                                    } 
                                }} 
                                {...props}
                            >
                                {children}
                            </Box>
                        ),
                        ol: ({node, children, ...props}) => (
                            <Box 
                                component="ol" 
                                sx={{ 
                                    pl: 1.5, 
                                    my: 0.15, 
                                    '& li': { 
                                        fontSize: '0.95rem',
                                        lineHeight: 1.5,
                                        mb: 0.15,
                                        '&::marker': {
                                            color: 'primary.main'
                                        }
                                    } 
                                }} 
                                {...props}
                            >
                                {children}
                            </Box>
                        ),

                        // Enhanced link styles with better hover effects
                        a: ({node, children, ...props}) => (
                            <Typography
                                component="a"
                                variant="body1"
                                sx={{
                                    color: 'primary.main',
                                    textDecoration: 'none',
                                    borderBottom: '1px solid transparent',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        borderBottom: '1px solid',
                                        borderColor: 'primary.main',
                                    },
                                }}
                                {...props}
                            >
                                {children}
                            </Typography>
                        ),

                        // Enhanced image styles with better borders and hover effects
                        img: ({node, ...props}) => (
                            <Box
                                component="img"
                                sx={{
                                    maxWidth: '100%',
                                    height: 'auto',
                                    borderRadius: 2,
                                    my: 2,
                                    boxShadow: 1,
                                    transition: 'transform 0.2s ease',
                                    '&:hover': {
                                        transform: 'scale(1.01)',
                                    },
                                }}
                                {...props}
                            />
                        ),
                        // Custom span renderer for colored text
                        span: ({node, children, ...props}) => (
                            <span {...props}>{children}</span>
                        ),
                    }}
                >
                    {description || 'No Description yet'}
                </Markdown>
            </Box>
        );
    };

    if (hideHeader) {
        return (
            <Box sx={{ height: '100%' }}>
                {renderContent()}
            </Box>
        );
    }

    return (
        <Card elevation={0} sx={{
            borderRadius: 2,
            background: 'transparent',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
        }}>
            <CardContent sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                p: 1.5,
                '&:last-child': { pb: 1.5 },
            }}>
                <Stack spacing={1} sx={{ height: '100%', flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 0.5 }}>
                        <Code sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
                        <Typography variant="h6" fontWeight="600">
                            Preview
                        </Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <Tooltip title="Download PDF">
                            <IconButton 
                                onClick={handleDownloadPDF}
                                size="small"
                                sx={{ 
                                    color: 'primary.main',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                    }
                                }}
                            >
                                <Download />
                            </IconButton>
                        </Tooltip>
                    </Stack>

                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(10px)',
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'auto',
                            height: '100%',
                            '&::-webkit-scrollbar': {
                                width: '6px',
                                height: '6px',
                            },
                            '&::-webkit-scrollbar-track': {
                                background: 'transparent',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                background: 'rgba(0, 0, 0, 0.2)',
                                borderRadius: '3px',
                                '&:hover': {
                                    background: 'rgba(0, 0, 0, 0.3)',
                                },
                            },
                        }}
                    >
                        {renderContent()}
                    </Paper>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default LivePreview;