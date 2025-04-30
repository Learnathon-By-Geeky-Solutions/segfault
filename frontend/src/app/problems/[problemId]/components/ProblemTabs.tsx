"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Box, Tabs, Tab, useTheme, CircularProgress, Fade } from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';
import { Description, History } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

interface StyledTabProps {
    label: string;
    icon?: React.ReactElement;
    iconPosition?: 'start' | 'end' | 'top' | 'bottom';
}

const StyledTab = styled((props: StyledTabProps) => (
    <Tab
        {...props}
        iconPosition="start"
        sx={{
            textTransform: 'none',
            fontWeight: 500,
            minHeight: 48,
            padding: '12px 16px',
            '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 600,
            },
            '& .MuiTab-iconWrapper': {
                marginRight: 1,
                marginBottom: 0,
            },
        }}
    />
))(({ theme }) => ({
    '&.MuiTab-root': {
        color: theme.palette.text.secondary,
        transition: 'all 0.2s ease',
        '&:hover': {
            color: theme.palette.primary.main,
            backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(0, 0, 0, 0.04)',
        },
    },
}));

const LoadingOverlay = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    backdropFilter: 'blur(4px)',
    zIndex: 2,
}));

const ProblemTabs = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const pathname = usePathname();
    const theme = useTheme();
    const [tabValue, setTabValue] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    // Determine active tab based on URL
    useEffect(() => {
        const isSubmissionsTab = pathname.includes('/submissions');
        setTabValue(isSubmissionsTab ? 1 : 0);
    }, [pathname]);

    const navigateToTab = useCallback(async (newValue: number) => {
        if (isNavigating) return;
        
        setIsNavigating(true);
        setIsLoading(true);
        
        try {
            const basePath = pathname.split('/submissions')[0];
            const targetPath = newValue === 0 ? basePath : `${basePath}/submissions`;
            
            if (pathname !== targetPath) {
                await router.push(targetPath);
            }
        } catch (error) {
            console.error('Navigation error:', error);
            // Revert tab value on error
            setTabValue(tabValue);
        } finally {
            // Add a small delay to ensure smooth transition
            setTimeout(() => {
                setIsLoading(false);
                setIsNavigating(false);
            }, 300);
        }
    }, [pathname, router, tabValue, isNavigating]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        event.preventDefault();
        event.stopPropagation();
        
        if (newValue === tabValue || isLoading) return;
        
        setTabValue(newValue);
        navigateToTab(newValue);
    };

    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <Box 
                sx={{ 
                    borderBottom: 1, 
                    borderColor: 'divider', 
                    position: 'sticky', 
                    top: 0, 
                    zIndex: 1, 
                    backgroundColor: 'background.paper',
                    backdropFilter: 'blur(8px)',
                    boxShadow: theme.shadows[1],
                }}
            >
                <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange} 
                    aria-label="problem tabs"
                    variant="fullWidth"
                    sx={{
                        '& .MuiTabs-indicator': {
                            backgroundColor: 'primary.main',
                            height: 3,
                            borderRadius: '3px 3px 0 0',
                            bottom: 0,
                            marginBottom: '-1px',
                        },
                        '& .MuiTabs-flexContainer': {
                            gap: 1,
                            padding: '0 16px',
                        },
                        '& .MuiTabs-root': {
                            minHeight: 48,
                        },
                        '& .MuiTab-root': {
                            minHeight: 48,
                            padding: '12px 16px',
                            position: 'relative',
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '1px',
                                backgroundColor: 'transparent',
                                transition: 'background-color 0.2s ease',
                            },
                            '&.Mui-selected::after': {
                                backgroundColor: 'primary.main',
                            },
                        },
                    }}
                >
                    <StyledTab 
                        label="Problem" 
                        icon={<Description />}
                    />
                    <StyledTab 
                        label="Submissions" 
                        icon={<History />}
                    />
                </Tabs>
            </Box>
            <Box 
                sx={{ 
                    flex: 1, 
                    overflow: 'auto',
                    backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.02)' 
                        : 'rgba(0, 0, 0, 0.01)',
                    position: 'relative',
                }}
            >
                {children}
                <Fade in={isLoading}>
                    <LoadingOverlay>
                        <CircularProgress 
                            size={40} 
                            thickness={4}
                            sx={{ 
                                color: 'primary.main',
                                '& .MuiCircularProgress-circle': {
                                    strokeLinecap: 'round',
                                },
                            }}
                        />
                    </LoadingOverlay>
                </Fade>
            </Box>
        </Box>
    );
};

export default ProblemTabs; 