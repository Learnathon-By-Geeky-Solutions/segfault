"use client"

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Language} from "@/app/problems/create/types";
import CodeEditor from "@/components/code-editor";
import {ButtonGroup, Dialog, DialogContent, IconButton, SelectChangeEvent, Tooltip} from "@mui/material";
import Button from "@mui/material/Button";
import {ArrowForward, Check, ContentCopy, FiberManualRecord, Info, Close} from "@mui/icons-material";
import Box from "@mui/material/Box";
import {OnChange} from "@monaco-editor/react";
import Typography from "@mui/material/Typography";
import {
    useCreateReferenceSolutionMutation,
    useUpdateReferenceSolutionMutation
} from "@/lib/features/api/problemsApiSlice";
import {
    APIError,
    CreateUpdateReferenceSolutionRequest,
    CreateUpdateReferenceSolutionResponse,
    ReferenceSolution as ReferenceSolutionType,
} from "@/lib/features/api/types";
import {RotatingPublishedIcon} from "@/components/rotating-published-icon";
import {isFetchBaseQueryError} from "@/lib/utils/isFetchBaseQueryError";
import {Stack} from "@mui/system";
import {alpha, Theme} from "@mui/material/styles";
import {Change, diffChars} from 'diff';
import {Logs, Log} from "@/components/Logs";
import {CircularProgress} from "@mui/material";
import ReactConfetti from 'react-confetti';
import {useRouter} from "next/navigation";
import {useAppDispatch} from "@/lib/hooks/hooks";
import {
    addCompletedStep,
    setIsSnackbarOpen,
    setSnackbarMessage
} from "@/lib/features/codesirius/addProblemSlice";
import {setCodesiriusLoading} from "@/lib/features/codesirius/codesiriusSlice";
import { useNotification } from '@/contexts/NotificationContext';

interface ReferenceSolutionState {
    languageId: number;
    code: string;
    status: 'idle' | 'loading' | 'success' | 'error';
    error?: string;
}

interface ReferenceSolutionProps {
    problemId: number;
    languages: Language[];
    referenceSolutions: ReferenceSolutionType[];
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
    details?: VerdictDetails | ReferenceSolutionType;
}

const ReferenceSolution = ({problemId, languages, referenceSolutions}: ReferenceSolutionProps) => {
    // Track original solutions from props (DB state)
    const [originalSolutions, setOriginalSolutions] = useState<ReferenceSolutionType[]>(() =>
        languages.map(lang => {
            const existingSolution = referenceSolutions.find(sol => sol.languageId === lang.id);
            return existingSolution || {
                id: 0, // temporary id for non-DB solutions
                problemId: problemId,
                languageId: lang.id,
                code: "",
                verdict: "",
                memory_usage: 0,
                execution_time: 0
            };
        })
    );

    // Initialize state with all languages
    const [solutions, setSolutions] = useState<ReferenceSolutionState[]>(() =>
        languages.map(lang => ({
            languageId: lang.id,
            code: "",
            status: 'idle' as const
        }))
    );

    // Initialize active language with persistence
    const [activeLanguage, setActiveLanguage] = useState<Language>(languages[0]);

    // Set loading to false when component mounts
    const dispatch = useAppDispatch();
    useEffect(() => {
        dispatch(setCodesiriusLoading(false));
    }, [dispatch]);

    // Load saved state from localStorage after mount
    useEffect(() => {
        // Load solutions from localStorage
        const loadedSolutions = languages.map(lang => {
            const storageKey = `problem_${problemId}_lang_${lang.id}`;
            const savedCode = localStorage.getItem(storageKey);
            return {
                languageId: lang.id,
                code: savedCode || originalSolutions.find(sol => sol.languageId === lang.id)?.code || "",
                status: 'idle' as const
            };
        });
        setSolutions(loadedSolutions);

        // Load active language from localStorage
        const storageKey = `problem_${problemId}_active_language`;
        const savedLanguageId = localStorage.getItem(storageKey);
        const languageId = savedLanguageId ? parseInt(savedLanguageId) : null;
        const validLanguage = languages.find(lang => lang.id === languageId);
        if (validLanguage) {
            setActiveLanguage(validLanguage);
        }
    }, [languages, problemId, originalSolutions]);

    // Update localStorage when active language changes
    useEffect(() => {
        const storageKey = `problem_${problemId}_active_language`;
        localStorage.setItem(storageKey, activeLanguage.id.toString());
    }, [activeLanguage, problemId]);

    const [createReferenceSolution, {isLoading: isCreating}] = useCreateReferenceSolutionMutation();
    const [updateReferenceSolution, {isLoading: isUpdating}] = useUpdateReferenceSolutionMutation();
    const [isValidating, setIsValidating] = useState<boolean>(false);
    const [validationLogs, setValidationLogs] = useState<Log[]>([]);
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
    const { showNotification } = useNotification();

    const smoothScrollToBottom = useCallback(() => {
        if (!logDetailsRef.current) return;
        
        const { scrollHeight, clientHeight, scrollTop } = logDetailsRef.current;
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
                    setValidationLogs(prev => [...prev, {
                        status: parsedMessage.verdict === "AC" ? "SUCCESS" : "ERROR",
                        message: `Test ${parsedMessage.test_case} ${parsedMessage.verdict === "AC" ? "passed" : "failed"} verdict: ${parsedMessage.verdict}`,
                        details: parsedMessage
                    }]);
                } catch {
                    setValidationLogs(prev => [...prev, jsonData]);
                }
            }
            else if (jsonData.status === "FINAL_VERDICT") {
                try {
                    const parsedMessage = JSON.parse(jsonData.message);
                    // Update the verdict in originalSolutions
                    setOriginalSolutions(prev => prev.map(sol => 
                        sol.languageId === activeLanguage.id
                            ? { 
                                ...sol, 
                                verdict: parsedMessage.verdict,
                                memory_usage: parsedMessage.memory_usage,
                                execution_time: parsedMessage.execution_time
                            }
                            : sol
                    ));
                    setValidationLogs(prev => [...prev, {
                        status: parsedMessage.verdict === "AC" ? "SUCCESS" : "ERROR",
                        message: `Final verdict: ${parsedMessage.verdict}\nMemory Usage: ${parsedMessage.memory_usage}MB\nExecution Time: ${parsedMessage.execution_time}s`,
                    }]);
                } catch {
                    setValidationLogs(prev => [...prev, jsonData]);
                }
            }
            // Handle INFO messages
            else if (jsonData.status === "INFO") {
                if (jsonData.message === "FINISHED_SUCCESS") {
                    setValidationLogs(prev => [...prev, {
                        status: "SUCCESS",
                        message: "All tests passed"
                    }]);
                    // Update the verdict in originalSolutions
                    setOriginalSolutions(prev => prev.map(sol => 
                        sol.languageId === activeLanguage.id
                            ? { ...sol, verdict: "ACCEPTED" }
                            : sol
                    ));
                    setIsValidating(false);
                    setShowConfetti(true);
                    setTimeout(() => setShowConfetti(false), 5000);
                } else if (jsonData.message === "FINISHED_ERROR") {
                    // Update the verdict in originalSolutions
                    setOriginalSolutions(prev => prev.map(sol => 
                        sol.languageId === activeLanguage.id
                            ? { ...sol, verdict: "WRONG_ANSWER" }
                            : sol
                    ));
                    setIsValidating(false);
                } else {
                    setValidationLogs(prev => [...prev, jsonData]);
                }
            }
            // Handle other status types
            else {
                setValidationLogs(prev => [...prev, jsonData]);
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

    // Get current solution state
    const currentSolution = solutions.find(sol => sol.languageId === activeLanguage.id);
    const originalSolution = originalSolutions.find(sol => sol.languageId === activeLanguage.id);

    // Check if current solution has unsaved changes compared to DB
    const hasUnsavedChanges = currentSolution && originalSolution && currentSolution.code !== originalSolution.code;

    const handleSourceCodeChange: OnChange = (value: string | undefined) => {
        if (value) {
            const storageKey = `problem_${problemId}_lang_${activeLanguage.id}`;
            localStorage.setItem(storageKey, value);
            setSolutions(prev => prev.map(sol =>
                sol.languageId === activeLanguage.id
                    ? {...sol, code: value, status: 'idle', error: undefined}
                    : sol
            ));
        } else {
            // Handle empty code case
            const storageKey = `problem_${problemId}_lang_${activeLanguage.id}`;
            localStorage.removeItem(storageKey);
            setSolutions(prev => prev.map(sol =>
                sol.languageId === activeLanguage.id
                    ? {...sol, code: "", status: 'idle', error: "Source code is empty"}
                    : sol
            ));
        }
    }

    const handleReset = () => {
        const originalSolution = originalSolutions.find(sol => sol.languageId === activeLanguage.id);
        const storageKey = `problem_${problemId}_lang_${activeLanguage.id}`;
        localStorage.removeItem(storageKey);
        setSolutions(prev => prev.map(sol =>
            sol.languageId === activeLanguage.id
                ? {
                    ...sol,
                    code: originalSolution?.code || "",
                    status: 'idle'
                }
                : sol
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
        if (!currentSolution) return;

        // Check if code is empty or only whitespace
        const isEmptyCode = !currentSolution.code || currentSolution.code.trim().length === 0;

        if (isEmptyCode) {
            setSolutions(prev => prev.map(sol =>
                sol.languageId === activeLanguage.id
                    ? {...sol, status: 'error', error: "Source code is empty"}
                    : sol
            ));
            return;
        }

        try {
            setSolutions(prev => prev.map(sol =>
                sol.languageId === activeLanguage.id
                    ? {...sol, status: 'loading', error: undefined}
                    : sol
            ));

            // Reset validation result and logs when starting validation
            setValidationLogs([]);

            let referenceSolution: CreateUpdateReferenceSolutionRequest;
            let res: CreateUpdateReferenceSolutionResponse;

            if (originalSolution?.id) {
                referenceSolution = {
                    id: originalSolution.id,
                    problemId: problemId,
                    languageId: activeLanguage.id,
                    code: currentSolution.code,
                    clientId: clientId
                }
                // Update existing solution
                res = await updateReferenceSolution(referenceSolution).unwrap();
            } else {
                // Create new solution
                referenceSolution = {
                    problemId: problemId,
                    languageId: activeLanguage.id,
                    code: currentSolution.code,
                    clientId: clientId
                }
                res = await createReferenceSolution(referenceSolution).unwrap();
            }

            if (res.status === 201 || res.status === 200) {
                setIsValidating(true);
                // Update original solutions with the new code
                setOriginalSolutions(prev => {
                    const newSolutions = [...prev];
                    const index = newSolutions.findIndex(sol => sol.languageId === activeLanguage.id);
                    newSolutions[index] = {
                        ...newSolutions[index],
                        id: res.data.id,
                        code: currentSolution.code,
                        verdict: res.data.verdict
                    };
                    return newSolutions;
                });

                // Clear localStorage after successful save
                const storageKey = `problem_${problemId}_lang_${activeLanguage.id}`;
                localStorage.removeItem(storageKey);

                setSolutions(prev => prev.map(sol =>
                    sol.languageId === activeLanguage.id
                        ? {...sol, status: 'success', error: undefined}
                        : sol
                ));
            }
        } catch (err) {
            if (isFetchBaseQueryError(err)) {
                const apiError = err.data as APIError;
                if (apiError.status === 400) {
                    setSolutions(prev => prev.map(sol =>
                        sol.languageId === activeLanguage.id
                            ? {...sol, status: 'error', error: apiError.message || "Invalid source code"}
                            : sol
                    ));
                }
            }
        }
    }

    const [isValidationLogDialogOpen, setIsValidationLogDialogOpen] = useState<boolean>(false);

    const handleValidationLogDialogClose = () => {
        setIsValidationLogDialogOpen(false);
    }

    const CopyButton = ({ text }: { text: string }) => {
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
                {copied ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
            </IconButton>
        );
    };

    const getVerdictTooltip = (data: VerdictDetails | ReferenceSolutionType) => {
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
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
                            <Info sx={{ fontSize: '1rem', color: 'info.main' }} />
                            <Typography variant="body2" color="text.secondary">
                                {memoryMB}MB
                            </Typography>
                        </Box>
                        <Box>
                            <Info sx={{ fontSize: '1rem', color: 'info.main' }} />
                            <Typography variant="body2" color="text.secondary">
                                {timeSec}s
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2" fontWeight={600} color="primary.main">
                                Expected Output:
                            </Typography>
                            <CopyButton text={data.expected_output} />
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2" fontWeight={600} color={data.verdict === "AC" ? "success.main" : "error.main"}>
                                Actual Output:
                            </Typography>
                            <CopyButton text={data.actual_output} />
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
        
        // Handle reference solution data
        return (
            <Box sx={{ p: 1 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Verdict: {data.verdict}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Memory Usage</Typography>
                        <Typography variant="body2">{data.memory_usage?.toFixed(2) ?? '0.00'}MB</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Execution Time</Typography>
                        <Typography variant="body2">{data.execution_time?.toFixed(2) ?? '0.00'}s</Typography>
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

    const getUnvalidatedLanguages = () => {
        return originalSolutions
            .filter(sol => sol.verdict !== "ACCEPTED")
            .map(sol => {
                const lang = languages.find(l => l.id === sol.languageId);
                return lang?.name || `Language ${sol.languageId}`;
            });
    };

    const areAllLanguagesValidated = () => {
        return originalSolutions.every(sol => sol.verdict === "ACCEPTED");
    };

    const handleNext = () => {
        dispatch(setCodesiriusLoading(true));
        showNotification("Reference solutions validated successfully", "success");
        dispatch(addCompletedStep(3));
        router.push(`/problems/create/${problemId}/step/5`);
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
                    style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999 }}
                />
            )}
            <CodeEditor
                code={currentSolution?.code || ""}
                languages={languages}
                activeLanguage={activeLanguage}
                onSourceCodeChange={handleSourceCodeChange}
                onLanguageChange={handleLanguageChange}
                isSaved={!hasUnsavedChanges}
                onReset={handleReset}
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
                <Box sx={{ ml: 2, mr: 2}}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                        <Box onClick={() => setIsValidationLogDialogOpen(true)}>
                            <Stack direction="row" alignItems="center" gap={1}>
                                {
                                    isValidating &&
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
                                            color={validationLogs.length > 0 ? "info.main" : "text.secondary"}
                                            sx={{
                                                cursor: validationLogs.length > 0 ? 'pointer' : 'default',
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    color: validationLogs.length > 0 ? 'info.dark' : 'text.secondary',
                                                }
                                            }}
                                        >
                                            Running...
                                        </Typography>
                                    </>
                                }
                                {originalSolution?.verdict && originalSolution.verdict !== "PENDING" && (
                                    <Tooltip 
                                        title={getVerdictTooltip(originalSolution)}
                                        arrow
                                        placement="top"
                                    >
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                px: 1.5,
                                                py: 0.5,
                                                borderRadius: 1,
                                                bgcolor: (theme) => alpha(
                                                    originalSolution!.verdict === "ACCEPTED" 
                                                        ? theme.palette.success.main 
                                                        : theme.palette.error.main,
                                                    validationLogs.length > 0 ? 0.15 : 0.1
                                                ),
                                                border: (theme) => `1px solid ${alpha(
                                                    originalSolution!.verdict === "ACCEPTED" 
                                                        ? theme.palette.success.main 
                                                        : theme.palette.error.main,
                                                    validationLogs.length > 0 ? 0.3 : 0.2
                                                )}`,
                                                transition: 'all 0.2s ease',
                                                cursor: validationLogs.length > 0 ? 'pointer' : 'default',
                                                '&:hover': {
                                                    bgcolor: (theme) => alpha(
                                                        originalSolution!.verdict === "ACCEPTED" 
                                                            ? theme.palette.success.main 
                                                            : theme.palette.error.main,
                                                        validationLogs.length > 0 ? 0.2 : 0.1
                                                    ),
                                                }
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {originalSolution!.verdict === "ACCEPTED" ? (
                                                    <Check sx={{ color: 'success.main', fontSize: '1rem' }} />
                                                ) : (
                                                    <Close sx={{ color: 'error.main', fontSize: '1rem' }} />
                                                )}
                                                <Typography 
                                                    fontSize="small" 
                                                    color={originalSolution!.verdict === "ACCEPTED" ? "success.main" : "error.main"}
                                                    fontWeight={500}
                                                    sx={{
                                                        transition: 'all 0.2s ease',
                                                        opacity: validationLogs.length > 0 ? 1 : 0.8
                                                    }}
                                                >
                                                    {originalSolution!.verdict === "ACCEPTED" ? "Validation passed" : "Validation failed"}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Tooltip>
                                )}
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
                                color={currentSolution?.status === 'error' ? "error" : "inherit"}>
                                {
                                    currentSolution?.status === 'loading' &&
                                    "Submitting..."
                                }
                                {
                                    currentSolution?.error &&
                                    currentSolution.error
                                }
                                {
                                    hasUnsavedChanges && !currentSolution?.error &&
                                    <Box component="span" sx={{color: 'warning.main'}}>
                                        • Unsaved changes
                                    </Box>
                                }
                            </Typography>
                            <ButtonGroup size="small">
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={handleSubmit}
                                    disabled={isValidating || isCreating || isUpdating}
                                    startIcon={<RotatingPublishedIcon isLoading={isValidating}/>}>
                                    {originalSolution?.id ? "Revalidate" : "Validate"}
                                </Button>
                                <Tooltip 
                                    title={
                                        areAllLanguagesValidated() 
                                            ? "All languages validated successfully" 
                                            : `Languages requiring validation: ${getUnvalidatedLanguages().join(", ")}`
                                    }
                                    arrow
                                >
                                    <span>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            endIcon={<ArrowForward />}
                                            disabled={!areAllLanguagesValidated()}
                                            onClick={handleNext}>
                                            Next
                                        </Button>
                                    </span>
                                </Tooltip>
                            </ButtonGroup>
                        </Box>
                    </Box>
                </Box>
                <Dialog 
                    open={isValidationLogDialogOpen && validationLogs.length > 0} 
                    onClose={handleValidationLogDialogClose} 
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
                                logs={validationLogs}
                                isLoading={isValidating}
                                title="Validation Logs"
                                defaultExpanded={true}
                                renderLog={renderLog}
                                disableContainer={true}
                            />
                        </Box>
                    </DialogContent>
                </Dialog>
            </CodeEditor>
        </>
    );
};

export default ReferenceSolution;