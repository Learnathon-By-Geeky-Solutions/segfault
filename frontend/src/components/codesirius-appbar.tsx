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
import {Avatar, LinearProgress, Menu, MenuItem, Switch, Tooltip} from "@mui/material";
import {styled} from "@mui/system";
import {EmojiEvents, Leaderboard, Logout, Psychology, Settings} from "@mui/icons-material";
import {usePathname} from "next/navigation";
import {useAppDispatch, useAppSelector} from "@/lib/hooks/hooks";
import {AppDispatch} from "@/lib/store";
import {setCodesiriusLoading, setTheme, setThemeAsync} from "@/lib/features/codesirius/codesiriusSlice";
import NextLink from "next/link";
import Link from "@mui/material/Link";


const MaterialUISwitch = styled(Switch)(({theme}) => ({
    width: 62,
    height: 34,
    padding: 7,
    '& .MuiSwitch-switchBase': {
        margin: 1,
        padding: 0,
        transform: 'translateX(6px)',
        '&.Mui-checked': {
            color: '#fff',
            transform: 'translateX(22px)',
            '& .MuiSwitch-thumb:before': {
                backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
                    '#fff',
                )}" d="M4.2 2.5l-.7 1.8-1.8.7 1.8.7.7 1.8.6-1.8L6.7 5l-1.9-.7-.6-1.8zm15 8.3a6.7 6.7 0 11-6.6-6.6 5.8 5.8 0 006.6 6.6z"/></svg>')`,
            },
            '& + .MuiSwitch-track': {
                opacity: 1,
                backgroundColor: '#aab4be',
                ...theme.applyStyles('dark', {
                    backgroundColor: '#8796A5',
                }),
            },
        },
    },
    '& .MuiSwitch-thumb': {
        backgroundColor: '#001e3c',
        width: 32,
        height: 32,
        '&::before': {
            content: "''",
            position: 'absolute',
            width: '100%',
            height: '100%',
            left: 0,
            top: 0,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
                '#fff',
            )}" d="M9.305 1.667V3.75h1.389V1.667h-1.39zm-4.707 1.95l-.982.982L5.09 6.072l.982-.982-1.473-1.473zm10.802 0L13.927 5.09l.982.982 1.473-1.473-.982-.982zM10 5.139a4.872 4.872 0 00-4.862 4.86A4.872 4.872 0 0010 14.862 4.872 4.872 0 0014.86 10 4.872 4.872 0 0010 5.139zm0 1.389A3.462 3.462 0 0113.471 10a3.462 3.462 0 01-3.473 3.472A3.462 3.462 0 016.527 10 3.462 3.462 0 0110 6.528zM1.665 9.305v1.39h2.083v-1.39H1.666zm14.583 0v1.39h2.084v-1.39h-2.084zM5.09 13.928L3.616 15.4l.982.982 1.473-1.473-.982-.982zm9.82 0l-.982.982 1.473 1.473.982-.982-1.473-1.473zM9.305 16.25v2.083h1.389V16.25h-1.39z"/></svg>')`,
        },
        ...theme.applyStyles('dark', {
            backgroundColor: '#003892',
        }),
    },
    '& .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: '#aab4be',
        borderRadius: 20 / 2,
        ...theme.applyStyles('dark', {
            backgroundColor: '#8796A5',
        }),
    },
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
    {
        'name': 'Leaderboard',
        'icon': <Leaderboard/>,
        'link': '/leaderboard'
    },
]


export default function CodesiriusAppBar() {
    const theme = useAppSelector(state => state.codesirius.theme);
    const user = useAppSelector(state => state.codesirius.user);
    const dispatch = useAppDispatch<AppDispatch>();

    const isCodesiriusLoading = useAppSelector(state => state.codesirius.isCodesiriusLoading);

    // const {window} = props;
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
        // const req = await fetch('/api/themes', {
        //     "method": "POST",
        //     "headers": {"Content-Type": "application/json"},
        //     "body": JSON.stringify({"theme": event.target.checked ? 'dark' : 'light'})
        // });
        // const res = await req.json();
        // console.log(res);
    }

    // const container = window !== undefined ? () => window().document.body : undefined;

    const pathName = usePathname();

    const settings = [
        {
            name: 'Profile',
            icon: <Avatar alt="Remy Sharp" src="/static/images/avatar/2.jpg"/>,
            onClick: () => {
            }
        },
        {
            name: 'Settings',
            icon: <Settings/>,
            onClick: () => {
            }
        },
        {
            name: 'Sign out',
            icon: <Logout/>,
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
            <CssBaseline/>
            <AppBar component="nav">
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{mr: 2, display: {md: 'none'}}}
                    >
                        <MenuIcon/>
                    </IconButton>
                    <CodeIcon sx={{display: {xs: 'flex'}, mr: 1}}/>
                    <Link href="/" style={{textDecoration: 'none', color: 'white'}}>
                        <Typography variant="h6" sx={{cursor: 'pointer', display: {xs: 'none', md: 'block'}}}>
                            Codesirius
                        </Typography>
                    </Link>
                    <Box sx={{ml: "1rem", display: {xs: 'none', md: 'block'}}}>
                        {navItems.map((item) => (
                            <NextLink href={item.link} key={item.name}>
                                <Button variant="text" startIcon={item.icon}
                                        sx={{ml: 5, color: "white", my: 2}}>
                                    {item.name}
                                </Button>
                            </NextLink>
                        ))}
                    </Box>
                    <MaterialUISwitch onChange={handleThemeSwitch} checked={theme === 'dark'}/>
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
                      <Box sx={{flexGrow: 0, ml: "auto"}}>
                        <Tooltip title="Open settings">
                          <IconButton onClick={handleOpenUserMenu} sx={{p: 0}}>
                            <Avatar alt="Remy Sharp" src="/static/images/avatar/2.jpg"/>
                          </IconButton>
                        </Tooltip>
                        <Menu
                          sx={{mt: '45px'}}
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
                                // <MenuItem key={name} onClick={handleCloseUserMenu}>
                                //     <Typography sx={{textAlign: 'center'}}>{name}</Typography>
                                // </MenuItem>
                                <MenuItem key={name} onClick={onClick}>
                                    {icon}
                                    <Typography sx={{ml: 1}}>{name}</Typography>
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
                    // container={container}
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
