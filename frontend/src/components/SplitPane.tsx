"use client";
import React, {useCallback, useState, useEffect} from "react";
import {Box, Paper, useTheme, IconButton, Tooltip, Fade} from "@mui/material";
import {DragIndicator, Fullscreen, FullscreenExit} from "@mui/icons-material";

interface SplitPaneProps {
    leftWidth?: number;
    leftChildren: React.ReactNode;
    rightChildren: React.ReactNode;
}

const SplitPane = ({ leftWidth = 50, leftChildren, rightChildren }: SplitPaneProps) => {
    const theme = useTheme();
    const [width, setWidth] = useState<number>(leftWidth);
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [startX, setStartX] = useState<number>(0);
    const [startWidth, setStartWidth] = useState<number>(0);
    const [isHovering, setIsHovering] = useState<boolean>(false);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [activePane, setActivePane] = useState<'left' | 'right' | null>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsResizing(true);
        setStartX(e.clientX);
        setStartWidth(width);
        document.body.style.userSelect = "none";
        document.body.style.cursor = "col-resize";
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing) return;

        const deltaX = e.clientX - startX;
        const newWidth = startWidth + (deltaX / window.innerWidth) * 100;

        if (newWidth > 20 && newWidth < 80) {
            setWidth(newWidth);
        }
    }, [isResizing, startX, startWidth]);

    const handleMouseUp = useCallback(() => {
        document.body.style.userSelect = "auto";
        document.body.style.cursor = "default";
        setIsResizing(false);
    }, []);

    const handleFullscreen = (pane: 'left' | 'right') => {
        if (isFullscreen && activePane === pane) {
            setIsFullscreen(false);
            setActivePane(null);
        } else {
            setIsFullscreen(true);
            setActivePane(pane);
        }
    };

    React.useEffect(() => {
        if (isResizing) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        } else {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizing, handleMouseUp, handleMouseMove]);

    return (
        <Box 
            display="flex" 
            sx={{
                flex: 1,
                position: "relative",
                overflow: 'hidden',
                borderRadius: 2,
                boxShadow: theme.shadows[1],
                transition: 'all 0.3s ease',
                '&:hover': {
                    boxShadow: theme.shadows[2],
                }
            }}
        >
            {/* Left Pane */}
            <Paper
                elevation={0}
                sx={{
                    width: isFullscreen && activePane === 'left' ? '100%' : `${width}%`,
                    height: "100%",
                    overflow: "auto",
                    transition: isResizing ? "none" : "all 0.3s ease",
                    borderRadius: 0,
                    background: theme.palette.background.paper,
                    display: 'flex',
                    flexDirection: 'column',
                    position: isFullscreen && activePane === 'left' ? 'fixed' : 'relative',
                    top: isFullscreen && activePane === 'left' ? '64px' : 'auto',
                    left: isFullscreen && activePane === 'left' ? 0 : 'auto',
                    right: isFullscreen && activePane === 'left' ? 0 : 'auto',
                    bottom: isFullscreen && activePane === 'left' ? 0 : 'auto',
                    zIndex: isFullscreen && activePane === 'left' ? 1000 : 'auto',
                    opacity: isFullscreen && activePane === 'right' ? 0 : 1,
                    transform: isFullscreen && activePane === 'right' ? 'translateX(-100%)' : 'translateX(0)',
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        pointerEvents: 'none',
                        outline: isResizing ? `2px solid ${theme.palette.primary.main}` : 'none',
                        transition: 'outline 0.2s ease',
                    },
                    '&::-webkit-scrollbar': {
                        width: '8px',
                        height: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: theme.palette.background.default,
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: theme.palette.divider,
                        borderRadius: '4px',
                        '&:hover': {
                            background: theme.palette.action.hover,
                        },
                    },
                }}
            >
                {leftChildren}
                <Fade in={!isFullscreen || activePane === 'left'}>
                    <Tooltip title={isFullscreen && activePane === 'left' ? "Exit Fullscreen" : "Fullscreen"}>
                        <IconButton
                            onClick={() => handleFullscreen('left')}
                            sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                backgroundColor: theme.palette.mode === 'dark' 
                                    ? 'rgba(255, 255, 255, 0.1)' 
                                    : 'rgba(0, 0, 0, 0.04)',
                                '&:hover': {
                                    backgroundColor: theme.palette.mode === 'dark' 
                                        ? 'rgba(255, 255, 255, 0.2)' 
                                        : 'rgba(0, 0, 0, 0.08)',
                                },
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {isFullscreen && activePane === 'left' ? <FullscreenExit /> : <Fullscreen />}
                        </IconButton>
                    </Tooltip>
                </Fade>
            </Paper>

            {/* Resizable Divider */}
            {!isFullscreen && (
                <Box
                    sx={{
                        width: "12px",
                        cursor: "col-resize",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: 'transparent',
                        transition: "all 0.2s ease",
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '2px',
                            height: '100%',
                            backgroundColor: isResizing 
                                ? theme.palette.primary.main 
                                : theme.palette.divider,
                            transition: 'background-color 0.2s ease',
                        },
                        '&:hover::before': {
                            backgroundColor: theme.palette.primary.main,
                        }
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                >
                    <DragIndicator 
                        sx={{ 
                            fontSize: 16,
                            color: isResizing || isHovering
                                ? theme.palette.primary.main 
                                : theme.palette.text.secondary,
                            opacity: isResizing || isHovering ? 1 : 0.5,
                            transition: "all 0.2s ease",
                            transform: isResizing ? 'scale(1.2)' : 'scale(1)',
                        }} 
                    />
                </Box>
            )}

            {/* Right Pane */}
            <Box
                component={Paper}
                elevation={0}
                sx={{
                    width: isFullscreen && activePane === 'right' ? '100%' : `${100 - width}%`,
                    height: "100%",
                    flexGrow: 1,
                    overflow: "auto",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    transition: isResizing ? "none" : "all 0.3s ease",
                    borderRadius: 0,
                    background: theme.palette.background.paper,
                    display: 'flex',
                    flexDirection: 'column',
                    position: isFullscreen && activePane === 'right' ? 'fixed' : 'relative',
                    top: isFullscreen && activePane === 'right' ? '64px' : 'auto',
                    left: isFullscreen && activePane === 'right' ? 0 : 'auto',
                    right: isFullscreen && activePane === 'right' ? 0 : 'auto',
                    bottom: isFullscreen && activePane === 'right' ? 0 : 'auto',
                    zIndex: isFullscreen && activePane === 'right' ? 1000 : 'auto',
                    opacity: isFullscreen && activePane === 'left' ? 0 : 1,
                    transform: isFullscreen && activePane === 'left' ? 'translateX(100%)' : 'translateX(0)',
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        pointerEvents: 'none',
                        outline: isResizing ? `2px solid ${theme.palette.primary.main}` : 'none',
                        transition: 'outline 0.2s ease',
                    },
                    '&::-webkit-scrollbar': {
                        width: '8px',
                        height: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: theme.palette.background.default,
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: theme.palette.divider,
                        borderRadius: '4px',
                        '&:hover': {
                            background: theme.palette.action.hover,
                        },
                    },
                }}
            >
                {rightChildren}
                <Fade in={!isFullscreen || activePane === 'right'}>
                    <Tooltip title={isFullscreen && activePane === 'right' ? "Exit Fullscreen" : "Fullscreen"}>
                        <IconButton
                            onClick={() => handleFullscreen('right')}
                            sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                backgroundColor: theme.palette.mode === 'dark' 
                                    ? 'rgba(255, 255, 255, 0.1)' 
                                    : 'rgba(0, 0, 0, 0.04)',
                                '&:hover': {
                                    backgroundColor: theme.palette.mode === 'dark' 
                                        ? 'rgba(255, 255, 255, 0.2)' 
                                        : 'rgba(0, 0, 0, 0.08)',
                                },
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {isFullscreen && activePane === 'right' ? <FullscreenExit /> : <Fullscreen />}
                        </IconButton>
                    </Tooltip>
                </Fade>
            </Box>
        </Box>
    );
};

export default SplitPane;
