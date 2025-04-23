"use client";
import React, {useCallback, useState} from "react";
import {Box, Paper} from "@mui/material";

interface SplitPaneProps {
    leftWidth?: number;
    leftChildren: React.ReactNode;
    rightChildren: React.ReactNode;
}

const SplitPane = ({ leftWidth = 50, leftChildren, rightChildren }: SplitPaneProps) => {
    const [width, setWidth] = useState<number>(leftWidth); // Initial width of left panel (percentage)
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [startX, setStartX] = useState<number>(0); // Track initial cursor position
    const [startWidth, setStartWidth] = useState<number>(0); // Track initial panel width

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsResizing(true);
        setStartX(e.clientX); // Store the initial mouse X position
        setStartWidth(width); // Store the initial width of the left panel
        document.body.style.userSelect = "none";
    };

    // const handleMouseMove = (e: MouseEvent) => {
    //     if (!isResizing) return;
    //
    //     const deltaX = e.clientX - startX; // Difference from the initial click position
    //     const newWidth = startWidth + (deltaX / window.innerWidth) * 100; // Adjust width in percentage
    //
    //     if (newWidth > 20 && newWidth < 80) {
    //         setWidth(newWidth);
    //     }
    // };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing) return;

        const deltaX = e.clientX - startX; // Difference from the initial click position
        const newWidth = startWidth + (deltaX / window.innerWidth) * 100; // Adjust width in percentage

        if (newWidth > 20 && newWidth < 80) {
            setWidth(newWidth);
        }
    }, [isResizing, startX, startWidth]);

    // const handleMouseUp = () => {
    //     document.body.style.userSelect = "auto";
    //     setIsResizing(false);
    // };

    const handleMouseUp = useCallback(() => {
        document.body.style.userSelect = "auto";
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
    }, [isResizing,, handleMouseUp, handleMouseMove]);

    return (
        <Box display="flex">
            {/* Left Pane */}
            <Paper
                // p={2}
                sx={{
                    width: `${width}%`,
                    height: "80vh",
                    overflow: "auto",
                    transition: isResizing ? "none" : "width 0.2s ease",
                }}
            >
                {leftChildren}
            </Paper>

            {/* Resizable Divider */}
            <Box
                sx={{
                    width: "8px",
                    cursor: "col-resize",
                    // backgroundColor: "#ddd",
                    position: "relative",
                    transition: "background-color 0.2s ease",
                    // "&:hover": { backgroundColor: "#bbb" },
                    "&::before": {
                        content: '""',
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: "4px",
                        height: "30px",
                        backgroundColor: "#999",
                        transform: "translate(-50%, -50%)",
                        borderRadius: "2px",
                    },
                }}
                onMouseDown={handleMouseDown}
            />

            {/* Right Pane */}
            <Box
                component={Paper}
                // p={2}
                sx={{
                    width: `${100 - width}%`,
                    height: "80vh",
                    flexGrow: 1,
                    overflow: "auto",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    transition: isResizing ? "none" : "width 0.2s ease",
                }}
            >
                {rightChildren}
            </Box>
        </Box>
    );
};

export default SplitPane;
