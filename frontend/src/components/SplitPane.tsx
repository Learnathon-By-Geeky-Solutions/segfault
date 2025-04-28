"use client";
import React, {useCallback, useState, useEffect} from "react";
import {Box, Paper, useTheme} from "@mui/material";
import {DragIndicator} from "@mui/icons-material";

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
                transition: 'box-shadow 0.2s ease',
                '&:hover': {
                    boxShadow: theme.shadows[2],
                }
            }}
        >
            {/* Left Pane */}
            <Paper
                elevation={0}
                sx={{
                    width: `${width}%`,
                    height: "100%",
                    overflow: "auto",
                    transition: isResizing ? "none" : "width 0.2s ease",
                    borderRadius: 0,
                    background: theme.palette.background.paper,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
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
            </Paper>

            {/* Resizable Divider */}
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

            {/* Right Pane */}
            <Box
                component={Paper}
                elevation={0}
                sx={{
                    width: `${100 - width}%`,
                    height: "100%",
                    flexGrow: 1,
                    overflow: "auto",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    transition: isResizing ? "none" : "width 0.2s ease",
                    borderRadius: 0,
                    background: theme.palette.background.paper,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
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
            </Box>
        </Box>
    );
};

export default SplitPane;
