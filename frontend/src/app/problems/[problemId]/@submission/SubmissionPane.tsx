"use client";

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Language} from "@/app/problems/create/types";
import CodeEditor from "@/components/code-editor";
import {ButtonGroup, Dialog, DialogContent, IconButton, SelectChangeEvent, Tooltip} from "@mui/material";
import Button from "@mui/material/Button";
import {Check, ContentCopy, FiberManualRecord, Info, Login} from "@mui/icons-material";
import Box from "@mui/material/Box";
import {OnChange} from "@monaco-editor/react";
import Typography from "@mui/material/Typography";
import {APIError, CreateSubmissionRequest, Submission as SubmissionType,} from "@/lib/features/api/types";
import {RotatingPublishedIcon} from "@/components/rotating-published-icon";
import {isFetchBaseQueryError} from "@/lib/utils/isFetchBaseQueryError";
import {Stack} from "@mui/system";
import {alpha, Theme} from "@mui/material/styles";
import {Change, diffChars} from 'diff';
import {Log, Logs} from "@/components/Logs";
import ReactConfetti from 'react-confetti';
import {useAppDispatch} from "@/lib/hooks/hooks";
import {setCodesiriusLoading} from "@/lib/features/codesirius/codesiriusSlice";
import {useNotification} from '@/contexts/NotificationContext';
import {useCreateSubmissionMutation} from "@/lib/features/api/submissionApiSlice";
import {useRouter} from 'next/navigation';
import AnimatedSubmitIcon from "@/components/animated-submit-icon";

interface SubmissionState {
    languageId: number;
    code: string;
    status: 'idle' | 'loading' | 'success' | 'error';
    error?: string;
}

interface SubmissionPaneProps {
    problemId: number;
    languages: Language[];
    isAuthenticated: boolean;
    problemStatus: 'DRAFT' | 'PUBLISHED';
}

interface VerdictDetails {
    stats: {
        memory_peak: number;
        cpu_stat: {
            usage_usec: number;
        };
    };
    expected_output: string;
    actual_output: string;
    verdict: string;
    verdict_label: string;
    verdict_details: string;
}

interface ValidationLog {
    status: 'SUCCESS' | 'ERROR' | 'WARN' | 'INFO' | 'FAILURE';
    message: string;
    details?: VerdictDetails | SubmissionType;
}

const SubmissionPane = ({problemId, languages, isAuthenticated, problemStatus}: SubmissionPaneProps) => {
    // Initialize state with all languages
    const [submissionStates, setSubmissionStates] = useState<SubmissionState[]>(() =>
        languages.map(lang => ({
            languageId: lang.id,
            code: "",
            status: 'idle' as const
        }))
    );

    // Initialize active language with persistence
    const [activeLanguage, setActiveLanguage] = useState<Language>(() => {
        // Try to get active language from localStorage
        const storageKey = `problem_${problemId}_active_language`;
        const savedLanguageId = localStorage.getItem(storageKey);
        if (savedLanguageId) {
            const languageId = parseInt(savedLanguageId);
            const savedLanguage = languages.find(lang => lang.id === languageId);
            if (savedLanguage) {
                return savedLanguage;
            }
        }
        // Fallback to first language if no saved language found
        return languages[0];
    });

    // Set loading to false when component mounts
    const dispatch = useAppDispatch();
    useEffect(() => {
        dispatch(setCodesiriusLoading(false));
    }, [dispatch]);

    // Load saved state from localStorage after mount
    useEffect(() => {
        // Load submissions from localStorage
        const loadedSubmissions = languages.map(lang => {
            const storageKey = `problem_${problemId}_lang_${lang.id}`;
            const savedCode = localStorage.getItem(storageKey);
            return {
                languageId: lang.id,
                code: savedCode || "",
                status: 'idle' as const
            };
        });
        setSubmissionStates(loadedSubmissions);

        // Load active language from localStorage
        const storageKey = `problem_${problemId}_active_language`;
        const savedLanguageId = localStorage.getItem(storageKey);
        const languageId = savedLanguageId ? parseInt(savedLanguageId) : null;
        const validLanguage = languages.find(lang => lang.id === languageId);
        if (validLanguage) {
            setActiveLanguage(validLanguage);
        }
    }, [languages, problemId]);

    // Update localStorage when active language changes
    useEffect(() => {
        const storageKey = `problem_${problemId}_active_language`;
        localStorage.setItem(storageKey, activeLanguage.id.toString());
    }, [activeLanguage, problemId]);

    const [createSubmission, {isLoading: isSubmitting}] = useCreateSubmissionMutation();
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [submissionLogs, setSubmissionLogs] = useState<Log[]>([]);
    const logDetailsRef = useRef<HTMLDivElement>(null);
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [clientId, setClientId] = useState<string>("");
    const [showConfetti, setShowConfetti] = useState(false);
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    });
    const router = useRouter();
    const {showNotification} = useNotification();

    // Get current submission state
    const currentSubmission = submissionStates.find(sub => sub.languageId === activeLanguage.id);

    const handleSourceCodeChange: OnChange = (value: string | undefined) => {
        if (value) {
            const storageKey = `problem_${problemId}_lang_${activeLanguage.id}`;
            localStorage.setItem(storageKey, value);
            setSubmissionStates(prev => prev.map(sub =>
                sub.languageId === activeLanguage.id
                    ? {...sub, code: value, status: 'idle', error: undefined}
                    : sub
            ));
        } else {
            // Handle empty code case
            const storageKey = `problem_${problemId}_lang_${activeLanguage.id}`;
            localStorage.removeItem(storageKey);
            setSubmissionStates(prev => prev.map(sub =>
                sub.languageId === activeLanguage.id
                    ? {...sub, code: "", status: 'idle', error: "Source code is empty"}
                    : sub
            ));
        }
    }

    const handleReset = () => {
        const storageKey = `problem_${problemId}_lang_${activeLanguage.id}`;
        localStorage.removeItem(storageKey);
        setSubmissionStates(prev => prev.map(sub =>
            sub.languageId === activeLanguage.id
                ? {
                    ...sub,
                    code: "",
                    status: 'idle'
                }
                : sub
        ));
    }

    const handleLanguageChange = (e: SelectChangeEvent) => {
        const langId = Number(e.target.value);
        const lang = languages.find((lang) => lang.id === langId);
        if (lang) {
            setActiveLanguage(lang);
        }
    }

    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (!currentSubmission) return;

        // Check if code is empty or only whitespace
        const isEmptyCode = !currentSubmission.code || currentSubmission.code.trim().length === 0;

        if (isEmptyCode) {
            setSubmissionStates(prev => prev.map(sub =>
                sub.languageId === activeLanguage.id
                    ? {...sub, status: 'error', error: "Source code is empty"}
                    : sub
            ));
            return;
        }

        try {
            setSubmissionStates(prev => prev.map(sub =>
                sub.languageId === activeLanguage.id
                    ? {...sub, status: 'loading', error: undefined}
                    : sub
            ));

            // Reset submission logs when starting submission
            setSubmissionLogs([]);

            const submission: CreateSubmissionRequest = {
                problemId: problemId,
                languageId: activeLanguage.id,
                code: currentSubmission.code,
                clientId: clientId
            };

            const res = await createSubmission(submission).unwrap();

            if (res.status === 201) {
                setIsRunning(true);
                // Clear localStorage after successful save
                const storageKey = `problem_${problemId}_lang_${activeLanguage.id}`;
                localStorage.removeItem(storageKey);

                setSubmissionStates(prev => prev.map(sub =>
                    sub.languageId === activeLanguage.id
                        ? {...sub, status: 'success', error: undefined}
                        : sub
                ));
            }
        } catch (err) {
            if (isFetchBaseQueryError(err)) {
                const apiError = err.data as APIError;
                if (apiError.status === 400) {
                    setSubmissionStates(prev => prev.map(sub =>
                        sub.languageId === activeLanguage.id
                            ? {...sub, status: 'error', error: apiError.message || "Invalid source code"}
                            : sub
                    ));
                }
            }
        }
    }

    const smoothScrollToBottom = useCallback(() => {
        if (!logDetailsRef.current) return;

        const {scrollHeight, clientHeight, scrollTop} = logDetailsRef.current;
        const targetScrollTop = scrollHeight - clientHeight;

        // If we're already at the bottom, don't scroll
        if (Math.abs(scrollHeight - clientHeight - scrollTop) < 10) return;

        // If we're already scrolling, don't start a new scroll
        if (isScrolling) return;

        setIsScrolling(true);

        const startTime = performance.now();
        const duration = 300; // 300ms for smooth scrolling

        const animateScroll = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth acceleration and deceleration
            const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            const easedProgress = easeInOutCubic(progress);

            if (logDetailsRef.current) {
                logDetailsRef.current.scrollTop = scrollTop + (targetScrollTop - scrollTop) * easedProgress;
            }

            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            } else {
                setIsScrolling(false);
            }
        };

        requestAnimationFrame(animateScroll);
    }, [isScrolling]);

    // Clear timeout on unmount
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    const obtainSSEClientID = async () => {
        console.log("Obtaining client ID");
        const response = await fetch(`${process.env.NEXT_PUBLIC_SSE_URL}/register/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include"
        });
        const data = await response.json();
        console.log(data);
        setClientId(data.clientId);
        return data.clientId;
    }

    const handleSSERequest = async (clientId: string) => {
        const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_SSE_URL}/events/${clientId}/`, {
            withCredentials: true
        });
        eventSource.onopen = (e) => {
            console.log(`Connection opened: ${e}`);
        }
        eventSource.onmessage = (e) => {
            const jsonData = JSON.parse(e.data);
            console.log(jsonData);

            // Handle verdict messages
            if (jsonData.status === "VERDICT") {
                try {
                    const parsedMessage = JSON.parse(jsonData.message);
                    setSubmissionLogs(prev => [...prev, {
                        status: parsedMessage.verdict === "AC" ? "SUCCESS" : "ERROR",
                        message: `Test ${parsedMessage.test_case} ${parsedMessage.verdict === "AC" ? "passed" : "failed"} verdict: ${parsedMessage.verdict}`,
                        details: parsedMessage
                    }]);
                } catch {
                    setSubmissionLogs(prev => [...prev, jsonData]);
                }
            } else if (jsonData.status === "FINAL_VERDICT") {
                try {
                    const parsedMessage = JSON.parse(jsonData.message);
                    // Update the verdict in originalSubmissions
                    setSubmissionLogs(prev => [...prev, {
                        status: parsedMessage.verdict === "AC" ? "SUCCESS" : "ERROR",
                        message: `Final verdict: ${parsedMessage.verdict}\nMemory Usage: ${parsedMessage.memory_usage}MB\nExecution Time: ${parsedMessage.execution_time}s`,
                    }]);

                    // Show notification for final verdict
                    const isSuccess = parsedMessage.verdict === "AC";
                    showNotification(
                        isSuccess ? "All test cases passed! 🎉" : "Some test cases failed 😕"
                    );

                    // Navigate to submissions page after a short delay
                    setTimeout(() => {
                        router.push(`/problems/${problemId}/submissions`);
                    }, 1000);
                } catch {
                    setSubmissionLogs(prev => [...prev, jsonData]);
                }
            }
            // Handle INFO messages
            else if (jsonData.status === "INFO") {
                if (jsonData.message === "FINISHED_SUCCESS") {
                    setSubmissionLogs(prev => [...prev, {
                        status: "SUCCESS",
                        message: "All tests passed"
                    }]);
                    setIsRunning(false);
                    setShowConfetti(true);
                    setTimeout(() => setShowConfetti(false), 5000);
                } else if (jsonData.message === "FINISHED_ERROR") {
                    setIsRunning(false);
                } else {
                    setSubmissionLogs(prev => [...prev, jsonData]);
                }
            }
            // Handle other status types
            else {
                setSubmissionLogs(prev => [...prev, jsonData]);
            }

            // Use a small timeout to ensure the DOM has updated
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
            scrollTimeoutRef.current = setTimeout(() => {
                smoothScrollToBottom();
            }, 50);
        }
        eventSource.onerror = (e) => {
            console.error(e);
            eventSource.close();
        }
    }

    const logStatusToColor = (status: string) => {
        switch (status) {
            case "ERROR":
            case "FAILURE":
                return "error";
            case "SUCCESS":
                return "success";
            case "WARN":
                return "warning";
            case "INFO":
                return "info";
            default:
                return "primary";
        }
    }

    const hasMounted = useRef(false);

    useEffect(() => {
        if (hasMounted.current) return;
        hasMounted.current = true;
        (async () => {
            const clientId = await obtainSSEClientID();
            await handleSSERequest(clientId);
        })()
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [isSubmissionLogDialogOpen, setIsSubmissionLogDialogOpen] = useState<boolean>(false);

    const handleSubmissionLogDialogClose = () => {
        setIsSubmissionLogDialogOpen(false);
    }

    const CopyButton = ({text}: { text: string }) => {
        const [copied, setCopied] = useState(false);

        const handleCopy = () => {
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        };

        return (
            <IconButton
                size="small"
                onClick={handleCopy}
                sx={{
                    color: copied ? 'success.main' : 'text.secondary',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        color: copied ? 'success.main' : 'primary.main',
                        transform: 'scale(1.1)'
                    }
                }}
            >
                {copied ? <Check fontSize="small"/> : <ContentCopy fontSize="small"/>}
            </IconButton>
        );
    };

    const getVerdictTooltip = (data: VerdictDetails | SubmissionType) => {
        if (!data) return null;

        // Handle SSE verdict details
        if ('stats' in data) {
            const memoryMB = Math.round(data.stats.memory_peak / (1024 * 1024));
            const timeSec = (data.stats.cpu_stat.usage_usec / 1000000).toFixed(2);
            const differences = diffChars(data.expected_output, data.actual_output);

            const getVerdictColor = (verdict: string) => {
                switch (verdict) {
                    case "AC":
                        return "success.main";
                    case "WA":
                        return "error.main";
                    case "TLE":
                        return "warning.main";
                    case "MLE":
                        return "warning.main";
                    case "RE":
                        return "error.main";
                    default:
                        return "text.primary";
                }
            };

            return (
                <Box sx={{
                    p: 2,
                    maxWidth: 400,
                    '& > *': {
                        mb: 1
                    }
                }}>
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 2
                    }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                            Verdict:
                        </Typography>
                        <Typography
                            variant="subtitle2"
                            fontWeight={600}
                            color={getVerdictColor(data.verdict)}
                        >
                            {data.verdict_label}
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                        {data.verdict_details}
                    </Typography>
                    <Box sx={{
                        display: 'flex',
                        gap: 2,
                        mb: 2,
                        '& > *': {
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                        }
                    }}>
                        <Box>
                            <Info sx={{fontSize: '1rem', color: 'info.main'}}/>
                            <Typography variant="body2" color="text.secondary">
                                {memoryMB}MB
                            </Typography>
                        </Box>
                        <Box>
                            <Info sx={{fontSize: '1rem', color: 'info.main'}}/>
                            <Typography variant="body2" color="text.secondary">
                                {timeSec}s
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{mb: 2}}>
                        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1}}>
                            <Typography variant="subtitle2" fontWeight={600} color="primary.main">
                                Expected Output:
                            </Typography>
                            <CopyButton text={data.expected_output}/>
                        </Box>
                        <Box
                            component="pre"
                            sx={{
                                p: 1.5,
                                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                                borderRadius: 1,
                                fontSize: '0.85rem',
                                fontFamily: 'monospace',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                m: 0
                            }}
                        >
                            {data.expected_output}
                        </Box>
                    </Box>
                    <Box>
                        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1}}>
                            <Typography variant="subtitle2" fontWeight={600}
                                        color={data.verdict === "AC" ? "success.main" : "error.main"}>
                                Actual Output:
                            </Typography>
                            <CopyButton text={data.actual_output}/>
                        </Box>
                        <Box
                            component="pre"
                            sx={{
                                p: 1.5,
                                bgcolor: (theme) => alpha(data.verdict === "AC" ? theme.palette.success.main : theme.palette.error.main, 0.1),
                                borderRadius: 1,
                                fontSize: '0.85rem',
                                fontFamily: 'monospace',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                m: 0
                            }}
                        >
                            {differences.map((part: Change, index: number) => {
                                if (part.added) {
                                    return (
                                        <span
                                            key={index}
                                            style={{
                                                color: 'rgb(244, 67, 54)',
                                                fontWeight: 500
                                            }}
                                        >
                                            {part.value}
                                        </span>
                                    );
                                } else if (part.removed) {
                                    return null;
                                } else {
                                    return (
                                        <span
                                            key={index}
                                            style={{
                                                color: 'rgb(76, 175, 80)'
                                            }}
                                        >
                                            {part.value}
                                        </span>
                                    );
                                }
                            })}
                        </Box>
                    </Box>
                </Box>
            );
        }

        // Handle submission data
        return (
            <Box sx={{p: 1}}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Verdict: {data.verdict}
                </Typography>
                <Box sx={{display: 'flex', gap: 2, mt: 1}}>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Memory Usage</Typography>
                        <Typography variant="body2">{data.memoryUsage?.toFixed(2) ?? '0.00'}MB</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Execution Time</Typography>
                        <Typography variant="body2">{data.executionTime?.toFixed(2) ?? '0.00'}s</Typography>
                    </Box>
                </Box>
            </Box>
        );
    };

    const renderLog = (log: ValidationLog) => {
        return (
            <Typography
                component="pre"
                variant="body2"
                color={logStatusToColor(log.status)}
                sx={{
                    whiteSpace: "pre-wrap",
                    fontFamily: "monospace",
                    m: 0,
                    flex: 1,
                    transition: 'all 0.2s ease',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}
            >
                {log.details ? (
                    <>
                        <span>{log.message}</span>
                        <Tooltip
                            title={getVerdictTooltip(log.details)}
                            arrow
                            placement="right"
                            slotProps={{
                                tooltip: {
                                    sx: {
                                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                                        color: (theme) => theme.palette.text.primary,
                                        boxShadow: (theme) => `0 4px 20px ${alpha(theme.palette.common.black, theme.palette.mode === 'dark' ? 0.4 : 0.1)}`,
                                        '& .MuiTooltip-arrow': {
                                            color: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)'
                                        }
                                    }
                                }
                            }}
                        >
                            <Info
                                sx={{
                                    fontSize: '1rem',
                                    color: (theme: Theme) => alpha(theme.palette.primary.main, 0.7),
                                    cursor: 'help',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        color: 'primary.main',
                                        transform: 'scale(1.1)'
                                    }
                                }}
                            />
                        </Tooltip>
                    </>
                ) : (
                    log.message
                )}
            </Typography>
        );
    };

    return (
        <>
            {showConfetti && (
                <ReactConfetti
                    width={windowSize.width}
                    height={windowSize.height}
                    recycle={false}
                    numberOfPieces={200}
                    gravity={0.3}
                    style={{position: 'fixed', top: 0, left: 0, zIndex: 9999}}
                />
            )}
            <Box sx={{position: 'relative', height: '100%'}}>
                {(!isAuthenticated || problemStatus === 'DRAFT') && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 2,
                            backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.9),
                            backdropFilter: 'blur(4px)',
                            zIndex: 1,
                        }}
                    >
                        <Typography
                            variant="h6"
                            color="text.secondary"
                            sx={{mb: 1}}
                        >
                            {!isAuthenticated 
                                ? "Sign in to submit your solution"
                                : "This problem is in draft mode and cannot be submitted yet"}
                        </Typography>
                        {!isAuthenticated && (
                            <Button
                                variant="contained"
                                color="primary"
                                size="large"
                                startIcon={<Login/>}
                                onClick={() => router.push('/auth/signin')}
                                sx={{
                                    px: 4,
                                    py: 1.5,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontSize: '1.1rem',
                                    boxShadow: (theme) => `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: (theme) => `0 6px 20px ${alpha(theme.palette.primary.main, 0.6)}`,
                                    },
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                Sign in
                            </Button>
                        )}
                    </Box>
                )}
                <CodeEditor
                    code={currentSubmission?.code}
                    languages={languages}
                    activeLanguage={activeLanguage}
                    onSourceCodeChange={handleSourceCodeChange}
                    onLanguageChange={handleLanguageChange}
                    isSaved={true}
                    onReset={handleReset}
                    height="84vh"
                    storageKey={`submission_${problemId}`}
                    languageSelectProps={{
                        size: "small",
                        sx: (theme: Theme) => ({
                            minWidth: 120,
                            '& .MuiSelect-select': {
                                py: 0.5,
                                px: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                color: 'text.primary',
                                '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.05)
                                }
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: alpha(theme.palette.primary.main, 0.2)
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: alpha(theme.palette.primary.main, 0.5)
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main',
                                borderWidth: 1
                            }
                        })
                    }}
                >
                    <Box sx={{ml: 2, mr: 2}}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                            <Box onClick={() => setIsSubmissionLogDialogOpen(true)}>
                                <Stack direction="row" alignItems="center" gap={1}>
                                    {
                                        isRunning &&
                                      <>
                                        <FiberManualRecord
                                          color="success"
                                          fontSize="small"
                                          sx={{
                                              animation: 'blink 1s infinite',
                                              '@keyframes blink': {
                                                  '0%': {
                                                      opacity: 1
                                                  },
                                                  '50%': {
                                                      opacity: 0.3
                                                  },
                                                  '100%': {
                                                      opacity: 1
                                                  }
                                              }
                                          }}
                                        />
                                        <Typography
                                          fontSize="small"
                                          color={submissionLogs.length > 0 ? "info.main" : "text.secondary"}
                                          sx={{
                                              cursor: submissionLogs.length > 0 ? 'pointer' : 'default',
                                              transition: 'all 0.2s ease',
                                              '&:hover': {
                                                  color: submissionLogs.length > 0 ? 'info.dark' : 'text.secondary',
                                              }
                                          }}
                                        >
                                          Running...
                                        </Typography>
                                      </>
                                    }
                                </Stack>
                            </Box>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Typography
                                    fontSize="small"
                                    sx={{
                                        ":hover": {
                                            cursor: "pointer"
                                        }
                                    }}
                                    variant="body1"
                                    color={currentSubmission?.status === 'error' ? "error" : "inherit"}>
                                    {
                                        currentSubmission?.status === 'loading' &&
                                        "Submitting..."
                                    }
                                    {
                                        currentSubmission?.error &&
                                        currentSubmission.error
                                    }
                                </Typography>
                                <ButtonGroup size="small">
                                    <Button
                                        variant="contained"
                                        color="success"
                                        onClick={handleSubmit}
                                        disabled={isRunning || isSubmitting}
                                        startIcon={<AnimatedSubmitIcon isSubmitting={isSubmitting || isRunning} />}>
                                        Submit
                                    </Button>
                                </ButtonGroup>
                            </Box>
                        </Box>
                    </Box>
                    <Dialog
                        open={isSubmissionLogDialogOpen && submissionLogs.length > 0}
                        onClose={handleSubmissionLogDialogClose}
                        disablePortal
                        maxWidth="md"
                        fullWidth
                        PaperProps={{
                            sx: {
                                borderRadius: 2,
                                boxShadow: (theme) => `0 8px 32px ${alpha(theme.palette.common.black, theme.palette.mode === 'dark' ? 0.4 : 0.1)}`,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                backgroundImage: 'none',
                                backgroundColor: (theme) => theme.palette.mode === 'dark'
                                    ? alpha(theme.palette.background.paper, 0.85)
                                    : alpha(theme.palette.background.paper, 0.95),
                                backdropFilter: 'blur(12px)',
                                border: 'none',
                                overflow: 'hidden',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: (theme) => `0 12px 48px ${alpha(theme.palette.common.black, theme.palette.mode === 'dark' ? 0.5 : 0.15)}`,
                                }
                            }
                        }}
                        BackdropProps={{
                            sx: {
                                backgroundColor: (theme) => alpha(theme.palette.background.default, 0.7),
                                backdropFilter: 'blur(4px)',
                            }
                        }}
                        TransitionProps={{
                            timeout: 300
                        }}
                    >
                        <DialogContent
                            sx={{
                                p: 0,
                                '&.MuiDialogContent-root': {
                                    padding: 0,
                                    '&:first-of-type': {
                                        paddingTop: 0
                                    }
                                }
                            }}
                        >
                            <Box
                                sx={{
                                    position: 'relative',
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: '1px',
                                        background: (theme) => `linear-gradient(to right, 
                                            ${alpha(theme.palette.primary.main, 0)}, 
                                            ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.15 : 0.1)}, 
                                            ${alpha(theme.palette.primary.main, 0)}
                                        )`,
                                    }
                                }}
                            >
                                <Logs
                                    logs={submissionLogs}
                                    isLoading={isRunning}
                                    title="Submission Logs"
                                    defaultExpanded={true}
                                    renderLog={renderLog}
                                    disableContainer={true}
                                />
                            </Box>
                        </DialogContent>
                    </Dialog>
                </CodeEditor>
            </Box>
        </>
    );
};

export default SubmissionPane; 