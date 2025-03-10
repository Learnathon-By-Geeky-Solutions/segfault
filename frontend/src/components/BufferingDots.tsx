import React from 'react';
import { Box, useTheme } from '@mui/material';

// Type for size prop
type BufferingDotsProps = {
    size?: 'small' | 'medium' | 'large'; // Default size is medium
};

const BufferingDots: React.FC<BufferingDotsProps> = ({ size = 'medium' }) => {
    const theme = useTheme(); // Access the theme

    // Define size mapping
    const sizeMap = {
        small: 6,  // Small dot size
        medium: 10,  // Medium dot size (default)
        large: 14,  // Large dot size
    };

    const dotSize = sizeMap[size];  // Get the dot size based on the size prop

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Box sx={dotStyle(1, theme.palette.primary.main, dotSize)}></Box>
            <Box sx={dotStyle(2, theme.palette.primary.main, dotSize)}></Box>
            <Box sx={dotStyle(3, theme.palette.primary.main, dotSize)}></Box>
        </Box>
    );
};

const dotStyle = (delay: number, color: string, size: number) => ({
    width: size,
    height: size,
    margin: '0 5px',
    borderRadius: '50%',
    backgroundColor: color, // Apply the dynamic color
    animation: `dotAnimation 1.5s infinite ${delay * 0.3}s`,
    '@keyframes dotAnimation': {
        '0%': { opacity: 0 },
        '50%': { opacity: 1 },
        '100%': { opacity: 0 },
    },
});

export default BufferingDots;
