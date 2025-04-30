"use client";
import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import MenuIcon from '@mui/icons-material/Menu'
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CodeIcon from '@mui/icons-material/Code';
import {Avatar, LinearProgress, Menu, MenuItem, Tooltip} from "@mui/material";
import {styled} from "@mui/system";
import {EmojiEvents, Leaderboard, Logout, Psychology, Settings, LightMode, DarkMode} from "@mui/icons-material";
import {usePathname} from "next/navigation";
import {useAppDispatch, useAppSelector} from "@/lib/hooks/hooks";
import {AppDispatch} from "@/lib/store";
import {setCodesiriusLoading, setTheme, setThemeAsync} from "@/lib/features/codesirius/codesiriusSlice";
import NextLink from "next/link";
import Link from "@mui/material/Link";
import { useTheme } from '@mui/material/styles';

const AnimatedCodeIcon = styled(CodeIcon)(({ theme }) => ({
    '@keyframes pulse': {
        '0%': {
            transform: 'scale(1)',
        },
        '50%': {
            transform: 'scale(1.1)',
        },
        '100%': {
            transform: 'scale(1)',
        },
    },
    animation: 'pulse 1.5s ease-in-out infinite',
    color: theme.palette.primary.main,
}));

const NavButton = styled(Button)(({ theme }) => ({
    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.92)' : 'white',
    textTransform: 'none',
    fontWeight: 500,
    fontSize: '0.95rem',
    padding: '8px 16px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    '&:hover': {
        backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(123, 126, 242, 0.12)' 
            : 'rgba(255, 255, 255, 0.1)',
        transform: 'translateY(-1px)',
    },
    '&.active': {
        backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(123, 126, 242, 0.2)' 
            : 'rgba(255, 255, 255, 0.15)',
        fontWeight: 600,
        color: 'white',
        '& .MuiSvgIcon-root': {
            color: 'white',
        }
    },
    '& .MuiSvgIcon-root': {
        color: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.92)' 
            : 'white',
        transition: 'color 0.2s ease',
    }
}));

const ThemeSwitcherButton = styled(IconButton)(({ theme }) => ({
    color: theme.palette.mode === 'dark' ? theme.palette.primary.light : '#fff',
    transition: 'all 0.3s ease',
    backgroundColor: theme.palette.mode === 'dark' 
        ? 'rgba(123, 126, 242, 0.12)'
        : 'rgba(94, 53, 177, 0.8)',
    '&:hover': {
        transform: 'scale(1.1)',
        backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(123, 126, 242, 0.2)'
            : 'rgba(94, 53, 177, 0.9)',
    },
    '& .MuiSvgIcon-root': {
        transition: 'transform 0.3s ease',
    },
    '&:hover .MuiSvgIcon-root': {
        transform: 'rotate(180deg)',
    }
}));

const drawerWidth = 240;
const navItems = [
    {
        'name': 'Problem',
        'icon': <Psychology/>,
        'link': '/problems'
    },
    {
        'name': 'Contest',
        'icon': <EmojiEvents/>,
        'link': '/contests'
    },
]


export default function CodesiriusAppBar() {
    const theme = useTheme();
    const codesiriusTheme = useAppSelector(state => state.codesirius.theme);
    const user = useAppSelector(state => state.codesirius.user);
    const dispatch = useAppDispatch<AppDispatch>();

    const isCodesiriusLoading = useAppSelector(state => state.codesirius.isCodesiriusLoading);

    const [mobileOpen, setMobileOpen] = React.useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen((prevState) => !prevState);
    };

    // this is for smaller screens
    const drawer = (
        <Box onClick={handleDrawerToggle} sx={{textAlign: 'center'}}>
            <CodeIcon sx={{display: {xs: 'none', md: 'flex'}, mr: 1}}/>
            <Typography variant="h6" sx={{my: 2}}>
                Codesirius
            </Typography>
            <Divider/>
            <List>
                {navItems.map(({name, icon}) => (
                    <ListItem key={name} disablePadding>
                        <Button variant="text" startIcon={icon}>
                            {name}
                        </Button>
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    const handleThemeSwitch = async (event: React.ChangeEvent<HTMLInputElement>) => {
        // instant theme switch
        dispatch(setTheme(event.target.checked ? 'dark' : 'light'));
        // persist
        dispatch(setThemeAsync(event.target.checked ? 'dark' : 'light'));
    }


    const pathName = usePathname();

    const settings = [
        {
            name: 'Profile',
            icon: <Avatar 
                    sx={{ 
                        width: 24, 
                        height: 24, 
                        fontSize: '0.875rem',
                        bgcolor: theme.palette.primary.main,
                        color: 'white'
                    }}
                  >
                    {user?.firstName[0]}{user?.lastName[0]}
                  </Avatar>,
            onClick: () => {
            }
        },
        {
            name: 'Settings',
            icon: <Settings sx={{ fontSize: 20 }} />,
            onClick: () => {
            }
        },
        {
            name: 'Sign out',
            icon: <Logout sx={{ fontSize: 20 }} />,
            onClick: () => {
                window.location.href = '/api/auth/signout';
            }
        }
    ]

    const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElUser(event.currentTarget);
    };


    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    return (
        <Box sx={{display: 'flex'}}>
            <CssBaseline />
            <AppBar 
                component="nav" 
                sx={{
                    borderRadius: 0,
                    backgroundColor: theme.palette.mode === 'dark' ? '#0B0D17' : '#5E35B1',
                    boxShadow: theme.palette.mode === 'dark'
                        ? '0 1px 3px 0 rgba(0, 0, 0, 0.4)'
                        : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'inherit',
                        zIndex: -1,
                    }
                }}
            >
                <Toolbar sx={{ borderRadius: 0 }}>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{mr: 2, display: {md: 'none'}}}
                    >
                        <MenuIcon/>
                    </IconButton>
                    {isCodesiriusLoading ? (
                        <AnimatedCodeIcon sx={{display: {xs: 'flex'}, mr: 1}}/>
                    ) : (
                        <CodeIcon sx={{display: {xs: 'flex'}, mr: 1}}/>
                    )}
                    <Link href="/" style={{textDecoration: 'none', color: 'white'}}>
                        <Typography 
                            variant="h6" 
                            sx={{
                                cursor: 'pointer', 
                                display: {xs: 'none', md: 'block'},
                                fontWeight: 600,
                                letterSpacing: '0.5px',
                                color: 'white',
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    opacity: 0.8,
                                },
                                position: 'relative',
                            }}
                        >
                            Codesirius
                        </Typography>
                    </Link>
                    <Box sx={{ml: "1rem", display: {xs: 'none', md: 'block'}}}>
                        {navItems.map((item) => (
                            <NextLink href={item.link} key={item.name}>
                                <NavButton 
                                    variant="text" 
                                    startIcon={item.icon} 
                                    size="small"
                                    className={pathName === item.link ? 'active' : ''}
                                >
                                    {item.name}
                                </NavButton>
                            </NextLink>
                        ))}
                    </Box>
                    {
                        user || pathName === '/auth/signin' || pathName === '/auth/signup' ? null : (
                            <Link href="/auth/signin" style={{marginLeft: "auto"}}>
                                <Button sx={{ml: 'auto', color: '#fff'}}
                                        onClick={() => dispatch(setCodesiriusLoading(true))}>
                                    Sign in
                                </Button>
                            </Link>
                        )
                    }
                    {
                        user &&
                      <Box sx={{flexGrow: 0, ml: "auto", display: 'flex', alignItems: 'center', gap: 1}}>
                        <Tooltip title={`Switch to ${codesiriusTheme === 'dark' ? 'Light' : 'Dark'} Mode`}>
                            <ThemeSwitcherButton onClick={() => handleThemeSwitch({ target: { checked: codesiriusTheme !== 'dark' } } as any)}>
                                {codesiriusTheme === 'dark' ? <LightMode /> : <DarkMode />}
                            </ThemeSwitcherButton>
                        </Tooltip>
                        <Tooltip title="Open settings">
                          <IconButton onClick={handleOpenUserMenu} sx={{p: 0}}>
                            <Avatar 
                              alt={`${user.firstName} ${user.lastName}`}
                              sx={{ 
                                bgcolor: theme.palette.primary.main,
                                color: 'white'
                              }}
                            >
                              {user.firstName[0]}{user.lastName[0]}
                            </Avatar>
                          </IconButton>
                        </Tooltip>
                        <Menu
                          sx={{ 
                            mt: '45px',
                            '& .MuiPaper-root': {
                                minWidth: 200,
                                borderRadius: 2,
                                boxShadow: theme.palette.mode === 'dark' 
                                    ? '0 4px 20px rgba(0, 0, 0, 0.5)'
                                    : '0 4px 20px rgba(0, 0, 0, 0.1)',
                                '& .MuiMenuItem-root': {
                                    py: 1.5,
                                    px: 2,
                                    gap: 1.5,
                                    '&:hover': {
                                        backgroundColor: theme.palette.mode === 'dark'
                                            ? 'rgba(255, 255, 255, 0.08)'
                                            : 'rgba(0, 0, 0, 0.04)',
                                    }
                                }
                            }
                          }}
                          id="menu-appbar"
                          anchorEl={anchorElUser}
                          anchorOrigin={{
                              vertical: 'top',
                              horizontal: 'right',
                          }}
                          keepMounted
                          transformOrigin={{
                              vertical: 'top',
                              horizontal: 'right',
                          }}
                          open={Boolean(anchorElUser)}
                          onClose={handleCloseUserMenu}
                        >
                            {settings.map(({name, icon, onClick}) => (
                                <MenuItem 
                                    key={name} 
                                    onClick={() => {
                                        onClick();
                                        handleCloseUserMenu();
                                    }}
                                >
                                    {icon}
                                    <Typography 
                                        variant="body2" 
                                        sx={{ 
                                            fontWeight: 500,
                                            color: theme.palette.text.primary
                                        }}
                                    >
                                        {name}
                                    </Typography>
                                </MenuItem>
                            ))}
                        </Menu>
                      </Box>
                    }
                </Toolbar>
                {isCodesiriusLoading && <LinearProgress sx={{height: 2}}/>}
            </AppBar>
            <nav>
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile.
                    }}
                    sx={{
                        display: {xs: 'block', md: 'none'},
                        '& .MuiDrawer-paper': {boxSizing: 'border-box', width: drawerWidth},
                    }}
                >
                    {drawer}
                </Drawer>
            </nav>
        </Box>
    );
}
