import {styled} from "@mui/system";
import MuiAccordion, {AccordionProps} from "@mui/material/Accordion";
import React, {useEffect, useRef, useState} from "react";
import MuiAccordionSummary, {accordionSummaryClasses, AccordionSummaryProps} from "@mui/material/AccordionSummary";
import ArrowForwardIosSharpIcon from "@mui/icons-material/ArrowForwardIosSharp";
import MuiAccordionDetails from "@mui/material/AccordionDetails";
import {Box, CircularProgress, Typography, Theme} from "@mui/material";
import {alpha} from "@mui/material/styles";

interface Log {
    status: 'SUCCESS' | 'ERROR' | 'WARN' | 'INFO' | 'FAILURE';
    message: string;
    details?: any;
}

interface LogsProps {
    logs: Log[];
    isLoading?: boolean;
    title?: string;
    defaultExpanded?: boolean;
    onLogClick?: (log: Log) => void;
    renderLog?: (log: Log) => React.ReactNode;
    disableContainer?: boolean;
}

const useAutoScroll = (
    containerRef: React.RefObject<HTMLDivElement>,
    deps: any[],
    options = { threshold: 100, behavior: 'smooth' as ScrollBehavior }
) => {
    const [shouldAutoScroll, setShouldAutoScroll] = React.useState<boolean>(() => true);
    const [isUserScrolling, setIsUserScrolling] = React.useState<boolean>(() => false);
    const scrollTimeout = React.useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (scrollTimeout.current) {
                clearTimeout(scrollTimeout.current);
            }

            setIsUserScrolling(true);

            // Check if we're near the bottom
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < options.threshold;
            setShouldAutoScroll(isNearBottom);

            scrollTimeout.current = setTimeout(() => {
                setIsUserScrolling(false);
            }, 150); // Debounce user scroll detection
        };

        container.addEventListener('scroll', handleScroll);
        return () => {
            container.removeEventListener('scroll', handleScroll);
            if (scrollTimeout.current) {
                clearTimeout(scrollTimeout.current);
            }
        };
    }, [options.threshold]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || isUserScrolling || !shouldAutoScroll) return;

        const scrollToBottom = () => {
            requestAnimationFrame(() => {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: options.behavior
                });
            });
        };

        scrollToBottom();
    }, [...deps, shouldAutoScroll, isUserScrolling]);

    return { shouldAutoScroll, isUserScrolling };
};

const LogAccordion = styled((props: AccordionProps) => (
    <MuiAccordion disableGutters elevation={0} square {...props} />
))(({theme}) => ({
    border: 'none',
    borderRadius: theme.shape.borderRadius,
    '&:not(:last-child)': {
        borderBottom: 0,
    },
    '&::before': {
        display: 'none',
    },
    transition: 'all 0.3s ease',
}));

const LogAccordionSummary = styled((props: AccordionSummaryProps) => (
    <MuiAccordionSummary
        expandIcon={<ArrowForwardIosSharpIcon sx={{fontSize: '0.9rem'}} />}
        {...props}
    />
))(({theme}) => ({
    backgroundColor: 'rgba(0, 0, 0, .03)',
    flexDirection: 'row-reverse',
    [`& .${accordionSummaryClasses.expandIconWrapper}.${accordionSummaryClasses.expanded}`]: {
        transform: 'rotate(90deg)',
    },
    [`& .${accordionSummaryClasses.content}`]: {
        marginLeft: theme.spacing(1),
        fontWeight: 600,
    },
    ...theme.applyStyles('dark', {
        backgroundColor: 'rgba(255, 255, 255, .05)',
    }),
}));

const LogAccordionDetails = styled(MuiAccordionDetails)(({theme}) => ({
    padding: 0,
    borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    color: theme.palette.text.primary,
    fontFamily: 'monospace',
    fontSize: '0.875rem',
    maxHeight: 400,
    overflowY: 'auto',
    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.4) : alpha(theme.palette.background.paper, 0.6),
    backdropFilter: 'blur(10px)',
    scrollBehavior: 'smooth',
    overflowAnchor: 'none',
    '& pre': {
        margin: 0,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
    },
    '&::-webkit-scrollbar': {
        width: '10px',
        background: 'transparent',
    },
    '&::-webkit-scrollbar-track': {
        background: 'transparent',
        margin: theme.spacing(1),
    },
    '&::-webkit-scrollbar-thumb': {
        background: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.2),
        border: '2px solid transparent',
        backgroundClip: 'content-box',
        borderRadius: '8px',
        minHeight: '40px',
        transition: 'all 0.2s ease',
        '&:hover': {
            background: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.5 : 0.4),
            border: '2px solid transparent',
            backgroundClip: 'content-box',
        }
    },
    '&::-webkit-scrollbar-corner': {
        background: 'transparent',
    }
}));

const LiveLogsContainer = styled('div')(({theme}) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    margin: theme.spacing(2, 0),
    maxHeight: '80vh',
    overflowY: 'auto',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.mode === 'dark' 
        ? alpha(theme.palette.background.paper, 0.4) 
        : alpha(theme.palette.background.paper, 0.6),
    backdropFilter: 'blur(8px)',
    boxShadow: `0 4px 24px ${alpha(theme.palette.common.black, theme.palette.mode === 'dark' ? 0.3 : 0.08)}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}));

const Logs = ({logs, isLoading, title = "Logs", defaultExpanded = false, onLogClick, renderLog, disableContainer = false}: LogsProps) => {
    const [expanded, setExpanded] = React.useState<string | false>(defaultExpanded ? "panel1" : false);
    const logContainerRef = React.useRef<HTMLDivElement>(null);
    
    const { shouldAutoScroll } = useAutoScroll(
        logContainerRef as React.RefObject<HTMLDivElement>,
        [logs.length, isLoading],
        { threshold: 100, behavior: 'smooth' }
    );

    const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpanded(isExpanded ? panel : false);
    };

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
    };

    const LogContent = (
        <LogAccordion 
            onChange={handleChange("panel1")}
            expanded={expanded === "panel1"}
            sx={{
                '& .MuiAccordionSummary-root': {
                    minHeight: '48px !important',
                    backgroundColor: (theme: Theme) => alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.4 : 0.6),
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    borderBottom: (theme: Theme) => `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                    '&:hover': {
                        backgroundColor: (theme: Theme) => alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.5 : 0.7),
                    }
                },
                '& .MuiAccordionDetails-root': {
                    padding: 0,
                }
            }}
        >
            <LogAccordionSummary>
                <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                    <Typography 
                        variant="subtitle2" 
                        sx={{ 
                            fontWeight: 600,
                            letterSpacing: '0.02em',
                            color: (theme: Theme) => theme.palette.mode === 'dark' 
                                ? alpha(theme.palette.text.primary, 0.95) 
                                : theme.palette.text.primary,
                            transition: 'color 0.2s ease'
                        }}
                    >
                        {title}
                    </Typography>
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            color: (theme: Theme) => alpha(theme.palette.text.secondary, 0.8),
                            fontWeight: 500,
                            fontSize: '0.75rem'
                        }}
                    >
                        {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
                    </Typography>
                </Box>
            </LogAccordionSummary>
            <LogAccordionDetails ref={logContainerRef}>
                {logs.map((log, index) => (
                    <Box
                        key={index}
                        onClick={() => onLogClick?.(log)}
                        sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1,
                            py: 1,
                            px: 2,
                            position: 'relative',
                            cursor: onLogClick ? 'pointer' : 'default',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            borderBottom: (theme: Theme) => `1px solid ${alpha(theme.palette.divider, 0.04)}`,
                            background: (theme: Theme) => `linear-gradient(to right, ${alpha(theme.palette.background.paper, 0)} 0%, ${alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.3 : 0.2)} 100%)`,
                            willChange: 'transform, background-color',
                            '&:hover': {
                                backgroundColor: (theme: Theme) => theme.palette.mode === 'dark' 
                                    ? alpha(theme.palette.background.paper, 0.4) 
                                    : alpha(theme.palette.background.paper, 0.6),
                                '& pre': {
                                    color: (theme: Theme) => theme.palette.mode === 'dark' 
                                        ? alpha(theme.palette.text.primary, 0.95)
                                        : theme.palette.text.primary,
                                }
                            },
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: '2px',
                                backgroundColor: (theme: Theme) => theme.palette[logStatusToColor(log.status)].main,
                                opacity: (theme: Theme) => theme.palette.mode === 'dark' ? 0.5 : 0.4,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            },
                            '&:hover::before': {
                                opacity: 0.8,
                                width: '3px',
                                boxShadow: (theme: Theme) => `0 0 8px ${alpha(theme.palette[logStatusToColor(log.status)].main, 0.5)}`,
                            },
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                width: '100%',
                                height: '100%',
                                background: (theme: Theme) => `linear-gradient(to right, ${alpha(theme.palette[logStatusToColor(log.status)].main, 0.1)} 0%, transparent 100%)`,
                                opacity: 0,
                                transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                pointerEvents: 'none',
                                willChange: 'opacity',
                            },
                            '&:hover::after': {
                                opacity: 0.1,
                            },
                            '&:last-child': {
                                mb: isLoading ? 0 : 1,
                            },
                        }}
                    >
                        {renderLog ? renderLog(log) : (
                            <Typography
                                component="pre"
                                variant="body2"
                                color={logStatusToColor(log.status)}
                                fontWeight={log.status === "ERROR" ? 500 : 400}
                                sx={{
                                    whiteSpace: "pre-wrap",
                                    fontFamily: "monospace",
                                    m: 0,
                                    flex: 1,
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    fontSize: '0.85rem',
                                    lineHeight: 1.5,
                                    letterSpacing: '0.01em',
                                    textShadow: (theme: Theme) => log.status === "ERROR" 
                                        ? `0 0 8px ${alpha(theme.palette.error.main, 0.3)}`
                                        : 'none',
                                }}
                            >
                                {log.message}
                            </Typography>
                        )}
                    </Box>
                ))}
                {isLoading && (
                    <Box 
                        sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            py: 2,
                            position: 'sticky',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: (theme: Theme) => `linear-gradient(to bottom, 
                                ${alpha(theme.palette.background.paper, 0)}, 
                                ${alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.95 : 0.85)}
                            )`,
                            backdropFilter: 'blur(8px)',
                            borderTop: (theme: Theme) => `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                            zIndex: 1,
                        }}
                    >
                        <CircularProgress 
                            size={16} 
                            thickness={4} 
                            sx={{ 
                                color: (theme: Theme) => alpha(theme.palette.primary.main, 0.7)
                            }}
                        />
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                ml: 1,
                                color: (theme: Theme) => alpha(theme.palette.text.secondary, 0.8),
                                fontWeight: 500
                            }}
                        >
                            Waiting for new log entries...
                        </Typography>
                    </Box>
                )}
            </LogAccordionDetails>
        </LogAccordion>
    );

    if (disableContainer) {
        return LogContent;
    }

    return (
        <LiveLogsContainer>
            {LogContent}
        </LiveLogsContainer>
    );
};

export {LogAccordion, LogAccordionSummary, LogAccordionDetails, LiveLogsContainer, Logs};
export type {Log};

