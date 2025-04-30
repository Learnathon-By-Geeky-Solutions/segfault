"use client";
import React, { useState } from 'react';
import { 
    Box, 
    Paper, 
    Typography, 
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    useTheme,
    Tooltip,
    IconButton,
    Fade,
    alpha,
    Modal,
    Button,
    Stack
} from '@mui/material';
import { 
    CheckCircle, 
    Cancel, 
    Timer, 
    Memory, 
    Code, 
    AccessTime,
    Error,
    Visibility,
    ContentCopy,
    Check,
    Close
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { formatDistanceToNow } from 'date-fns';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

interface Submission {
    id: number;
    problemId: number;
    code: string;
    languageId: number;
    verdict: 'PENDING' | 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILATION_ERROR';
    memoryUsage: number | null;
    executionTime: number | null;
    createdAt: string;
}

interface SubmissionsListProps {
    submissions: Submission[];
}

type VerdictColor = 'success' | 'error' | 'warning';

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: alpha(theme.palette.primary.main, 0.02),
    },
    '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.05),
    },
    transition: 'background-color 0.2s ease',
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    padding: theme.spacing(2),
    '&:first-of-type': {
        paddingLeft: theme.spacing(3),
    },
    '&:last-of-type': {
        paddingRight: theme.spacing(3),
    },
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    '& th': {
        fontWeight: 600,
        color: theme.palette.text.primary,
        padding: theme.spacing(2),
        '&:first-of-type': {
            paddingLeft: theme.spacing(3),
        },
        '&:last-of-type': {
            paddingRight: theme.spacing(3),
        },
    },
}));

const VerdictChip = styled(Chip, {
    shouldForwardProp: (prop) => prop !== 'verdictColor',
})<{ verdictColor: VerdictColor }>(({ theme, verdictColor }) => ({
    backgroundColor: theme.palette[verdictColor].main,
    color: theme.palette[verdictColor].contrastText,
    fontWeight: 500,
    minWidth: '120px',
    '& .MuiChip-icon': {
        color: theme.palette[verdictColor].contrastText,
    },
    '&:hover': {
        backgroundColor: theme.palette[verdictColor].dark,
    }
}));

const getVerdictColor = (verdict: Submission['verdict']): VerdictColor => {
    switch (verdict) {
        case 'ACCEPTED':
            return 'success';
        case 'WRONG_ANSWER':
        case 'RUNTIME_ERROR':
        case 'COMPILATION_ERROR':
            return 'error';
        case 'TIME_LIMIT_EXCEEDED':
        case 'MEMORY_LIMIT_EXCEEDED':
            return 'warning';
        default:
            return 'warning';
    }
};

const getVerdictIcon = (verdict: Submission['verdict']) => {
    switch (verdict) {
        case 'ACCEPTED':
            return <CheckCircle />;
        case 'WRONG_ANSWER':
            return <Cancel />;
        case 'TIME_LIMIT_EXCEEDED':
            return <Timer />;
        case 'MEMORY_LIMIT_EXCEEDED':
            return <Memory />;
        case 'RUNTIME_ERROR':
        case 'COMPILATION_ERROR':
            return <Error />;
        default:
            return <Code />;
    }
};

const CodeModal = styled(Modal)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(2),
}));

const CodeModalContent = styled(Paper)(({ theme }) => ({
    position: 'relative',
    width: '90%',
    maxWidth: '800px',
    maxHeight: '90vh',
    padding: theme.spacing(3),
    borderRadius: theme.shape.borderRadius * 2,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[24],
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
}));

const CodeHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
}));

const CodeContent = styled(Box)(({ theme }) => ({
    flex: 1,
    overflow: 'auto',
    borderRadius: theme.shape.borderRadius,
    position: 'relative',
    '& pre': {
        margin: 0,
        borderRadius: theme.shape.borderRadius,
    }
}));

const CopyButton = styled(IconButton)(({ theme }) => ({
    position: 'absolute',
    top: theme.spacing(1),
    right: theme.spacing(1),
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    backdropFilter: 'blur(4px)',
    zIndex: 1,
    '&:hover': {
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
    }
}));

const SubmissionsList = ({ submissions }: SubmissionsListProps) => {
    const theme = useTheme();
    const [selectedCode, setSelectedCode] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const handleViewCode = (code: string) => {
        setSelectedCode(code);
    };

    const handleCloseModal = () => {
        setSelectedCode(null);
    };

    const handleCopyCode = async () => {
        if (selectedCode) {
            await navigator.clipboard.writeText(selectedCode);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    if (submissions.length === 0) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    No submissions yet
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer 
                component={Paper} 
                elevation={0} 
                sx={{ 
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper,
                    '& .MuiTable-root': {
                        borderCollapse: 'separate',
                        borderSpacing: 0,
                    }
                }}
            >
                <Table sx={{ minWidth: 650 }} aria-label="submissions table">
                    <StyledTableHead>
                        <TableRow>
                            <StyledTableCell>Status</StyledTableCell>
                            <StyledTableCell>Time</StyledTableCell>
                            <StyledTableCell>Memory</StyledTableCell>
                            <StyledTableCell>Submitted</StyledTableCell>
                            <StyledTableCell>Actions</StyledTableCell>
                        </TableRow>
                    </StyledTableHead>
                    <TableBody>
                        {submissions.map((submission) => (
                            <Fade key={submission.id} in={true}>
                                <StyledTableRow>
                                    <StyledTableCell>
                                        <VerdictChip
                                            verdictColor={getVerdictColor(submission.verdict)}
                                            icon={getVerdictIcon(submission.verdict)}
                                            label={submission.verdict.replace(/_/g, ' ')}
                                        />
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                                            <Typography variant="body2">
                                                {submission.executionTime ? `${submission.executionTime}ms` : '-'}
                                            </Typography>
                                        </Box>
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Memory sx={{ fontSize: 16, color: 'text.secondary' }} />
                                            <Typography variant="body2">
                                                {submission.memoryUsage ? `${submission.memoryUsage}MB` : '-'}
                                            </Typography>
                                        </Box>
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}
                                        </Typography>
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        <Stack direction="row" spacing={1}>
                                            <Tooltip title="View Source">
                                                <IconButton 
                                                    size="small"
                                                    onClick={() => handleViewCode(submission.code)}
                                                    sx={{ 
                                                        color: 'primary.main',
                                                        '&:hover': {
                                                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                        },
                                                    }}
                                                >
                                                    <Visibility />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </StyledTableCell>
                                </StyledTableRow>
                            </Fade>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <CodeModal
                open={!!selectedCode}
                onClose={handleCloseModal}
                aria-labelledby="code-modal"
            >
                <CodeModalContent>
                    <CodeHeader>
                        <Typography variant="h6" component="h2">
                            Source Code
                        </Typography>
                        <Tooltip title="Close">
                            <IconButton 
                                onClick={handleCloseModal}
                                size="small"
                                sx={{ 
                                    color: 'error.main',
                                    '&:hover': {
                                        backgroundColor: alpha(theme.palette.error.main, 0.1),
                                    },
                                }}
                            >
                                <Close />
                            </IconButton>
                        </Tooltip>
                    </CodeHeader>
                    <CodeContent>
                        {selectedCode && (
                            <>
                                <CopyButton
                                    onClick={handleCopyCode}
                                    size="small"
                                    color="primary"
                                >
                                    {isCopied ? <Check /> : <ContentCopy />}
                                </CopyButton>
                                <SyntaxHighlighter
                                    language="javascript"
                                    style={atomOneDark}
                                    customStyle={{
                                        margin: 0,
                                        borderRadius: theme.shape.borderRadius,
                                    }}
                                >
                                    {selectedCode}
                                </SyntaxHighlighter>
                            </>
                        )}
                    </CodeContent>
                </CodeModalContent>
            </CodeModal>
        </Box>
    );
};

export default SubmissionsList; 