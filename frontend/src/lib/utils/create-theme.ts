import { createTheme, ThemeOptions } from '@mui/material/styles';

const baseTheme: ThemeOptions = {
    typography: {
        fontFamily: [
            'Inter',
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
        ].join(','),
        h1: {
            fontWeight: 700,
            letterSpacing: '-0.5px',
        },
        h2: {
            fontWeight: 700,
            letterSpacing: '-0.5px',
        },
        h3: {
            fontWeight: 600,
            letterSpacing: '-0.5px',
        },
        h4: {
            fontWeight: 600,
            letterSpacing: '-0.5px',
        },
        h5: {
            fontWeight: 600,
        },
        h6: {
            fontWeight: 600,
        },
        button: {
            textTransform: 'none',
            fontWeight: 500,
        },
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
    },
};

export const createCodeSiriusTheme = (mode: 'light' | 'dark') => {
    const isDark = mode === 'dark';

    return createTheme({
        ...baseTheme,
        palette: {
            mode,
            primary: {
                main: isDark ? '#7C4DFF' : '#5E35B1',
                light: isDark ? '#B388FF' : '#9162E4',
                dark: isDark ? '#651FFF' : '#4527A0',
                contrastText: '#FFFFFF',
            },
            secondary: {
                main: isDark ? '#00BCD4' : '#00838F',
                light: isDark ? '#4DD0E1' : '#4FB3BF',
                dark: isDark ? '#0097A7' : '#005662',
                contrastText: '#FFFFFF',
            },
            background: {
                default: isDark ? '#121212' : '#F8F9FA',
                paper: isDark ? '#1E1E1E' : '#FFFFFF',
            },
            text: {
                primary: isDark ? '#FFFFFF' : '#1A1A1A',
                secondary: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
            },
            divider: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
            action: {
                active: isDark ? '#FFFFFF' : 'rgba(0, 0, 0, 0.54)',
                hover: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                selected: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
                disabled: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.26)',
                disabledBackground: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
            },
        },
        components: {
            ...baseTheme.components,
            MuiMenu: {
                styleOverrides: {
                    paper: {
                        backgroundColor: isDark ? '#12141F' : '#FFFFFF',
                        border: isDark ? '1px solid rgba(123, 126, 242, 0.12)' : 'none',
                    },
                },
            },
            MuiMenuItem: {
                styleOverrides: {
                    root: {
                        '&:hover': {
                            backgroundColor: isDark ? 'rgba(123, 126, 242, 0.12)' : 'rgba(99, 102, 241, 0.08)',
                        },
                        '&.Mui-selected': {
                            backgroundColor: isDark ? 'rgba(123, 126, 242, 0.2)' : 'rgba(99, 102, 241, 0.16)',
                            '&:hover': {
                                backgroundColor: isDark ? 'rgba(123, 126, 242, 0.25)' : 'rgba(99, 102, 241, 0.24)',
                            },
                        },
                    },
                },
            },
            MuiSwitch: {
                styleOverrides: {
                    switchBase: {
                        '&.Mui-checked': {
                            color: isDark ? '#7C4DFF' : '#5E35B1',
                            '& + .MuiSwitch-track': {
                                backgroundColor: isDark ? '#5D5DE6' : '#4F46E5',
                            },
                        },
                    },
                    track: {
                        backgroundColor: isDark ? 'rgba(148, 163, 184, 0.3)' : 'rgba(71, 85, 105, 0.4)',
                    },
                },
            },
            MuiTableCell: {
                styleOverrides: {
                    root: {
                        borderBottom: isDark
                            ? '1px solid rgba(123, 126, 242, 0.12)'
                            : '1px solid rgba(226, 232, 240, 1)',
                    },
                    head: {
                        fontWeight: 600,
                        color: isDark ? 'rgba(255, 255, 255, 0.92)' : 'rgba(15, 23, 42, 0.95)',
                    },
                },
            },
            MuiLinearProgress: {
                styleOverrides: {
                    root: {
                        borderRadius: 4,
                        height: 6,
                        backgroundColor: isDark ? 'rgba(30, 34, 53, 0.9)' : 'rgba(240, 242, 250, 1)',
                    },
                },
            },
            MuiDivider: {
                styleOverrides: {
                    root: {
                        margin: '16px 0',
                        borderColor: isDark ? 'rgba(123, 126, 242, 0.15)' : 'rgba(226, 232, 240, 1)',
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundColor: isDark ? '#090B14' : '#ffffff',
                        boxShadow: isDark
                            ? '0 1px 3px 0 rgba(0, 0, 0, 0.4)'
                            : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    },
                    colorPrimary: {
                        backgroundColor: isDark ? '#0B0D17' : '#5E35B1',
                    },
                },
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        backgroundColor: isDark ? '#090B14' : '#ffffff',
                        borderRight: isDark
                            ? '1px solid rgba(123, 126, 242, 0.12)'
                            : '1px solid rgba(226, 232, 240, 1)',
                    },
                },
            },
            MuiListItemButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                        margin: '4px 8px',
                        '&:hover': {
                            backgroundColor: isDark ? 'rgba(123, 126, 242, 0.08)' : 'rgba(99, 102, 241, 0.05)',
                        },
                        '&.Mui-selected': {
                            backgroundColor: isDark ? 'rgba(123, 126, 242, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                            '&:hover': {
                                backgroundColor: isDark ? 'rgba(123, 126, 242, 0.2)' : 'rgba(99, 102, 241, 0.15)',
                            },
                        },
                    },
                },
            },
        },
    });
};
