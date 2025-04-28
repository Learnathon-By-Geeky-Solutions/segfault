"use client";
import React, {useEffect, useState} from 'react';
import Grid from "@mui/material/Grid2";
import {
    FormControl,
    InputAdornment,
    LinearProgress,
    Paper,
    Snackbar,
    TextField
} from "@mui/material";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import {
    AccountCircle,
    NavigateNext,
    Password,
    Visibility,
    VisibilityOff
} from "@mui/icons-material";
import Button from "@mui/material/Button";
import NextLink from "next/link";
import Link from "@mui/material/Link";
import Box from "@mui/material/Box";
import {useAppDispatch} from "@/lib/hooks/hooks";
import {AppDispatch} from "@/lib/store";
import {useSigninMutation} from "@/lib/features/api/authApiSlice";
import {isFetchBaseQueryError} from "@/lib/utils/isFetchBaseQueryError";
import {setCodesiriusLoading} from "@/lib/features/codesirius/codesiriusSlice";
import {APIError, SigninRequest} from "@/lib/features/api/types";
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

const AuthContainer = styled(Grid)(({ theme }) => ({
    minHeight: '100vh',
    padding: theme.spacing(4),
    background: theme.palette.mode === 'dark' 
        ? 'linear-gradient(45deg, rgba(18, 18, 18, 0.9), rgba(30, 30, 30, 0.9))' 
        : 'linear-gradient(45deg, rgba(248, 249, 250, 0.9), rgba(255, 255, 255, 0.9))',
    '&::before': {
        content: '""',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: theme.palette.mode === 'dark' 
            ? 'radial-gradient(circle at 50% 50%, rgba(124, 77, 255, 0.1), transparent 50%)' 
            : 'radial-gradient(circle at 50% 50%, rgba(94, 53, 177, 0.1), transparent 50%)',
        zIndex: -1,
    }
}));

const AuthButton = styled(Button)(({ theme }) => ({
    padding: theme.spacing(1.5),
    borderRadius: '12px',
    textTransform: 'none',
    fontWeight: 500,
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows[4],
    }
}));

const AuthTextField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: '12px',
        transition: 'all 0.3s ease',
        '&:hover': {
            '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main,
            }
        },
        '&.Mui-focused': {
            '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main,
                borderWidth: 2,
            }
        }
    }
}));

const Signin = () => {
    const dispatch = useAppDispatch<AppDispatch>();

    const [usernameOrEmail, setUsernameOrEmail] = useState<string>('');
    const [usernameOrEmailError, setUsernameOrEmailError] = useState<string>('');

    useEffect(() => {
        dispatch(setCodesiriusLoading(false));
    }, [dispatch]);

    const handleUsernameOrEmail = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUsernameOrEmail(event.target.value);
        setUsernameOrEmailError('');
    }

    const handleUsernameOrEmailBlur = () => {
        if (usernameOrEmail.length < 3) {
            setUsernameOrEmailError('Username or email must be at least 3 characters');
        }
    }

    const [password, setPassword] = useState<string>('');
    const [passwordError, setPasswordError] = useState<string>('');

    const handlePassword = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(event.target.value);
        setPasswordError('');
    }

    const handlePasswordBlur = () => {
        if (password.length < 8) {
            setPasswordError('Password must be at least 8 characters');
        }
    }

    const [showPassword, setShowPassword] = useState<boolean>(false);

    const [signin, {isLoading}] = useSigninMutation();
    const [isSnackbarOpen, setIsSnackbarOpen] = useState<boolean>(false);

    const validateInputs = (): boolean => {
        let isValid = true;

        if (usernameOrEmail.length < 3) {
            setUsernameOrEmailError('Username or email must be at least 3 characters');
            isValid = false;
        }
        if (password.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            isValid = false;
        }

        return isValid;
    };

    const handleSubmit = async () => {
        if (!validateInputs()) return;

        try {
            const signinRequest: SigninRequest = {username: usernameOrEmail, password};
            const res = await signin(signinRequest).unwrap();

            if (res.status === 200) {
                window.location.href = res.data.redirect;
            }
        } catch (err) {
            if (isFetchBaseQueryError(err)) {
                const error = err.data as APIError;
                if (error.status === 401) {
                    setPasswordError(error.message.slice(0, -1));
                } else {
                    setIsSnackbarOpen(true);
                }
            } else {
                // handle other errors
                setIsSnackbarOpen(true);
            }
        }
    };

    return (
        <AuthContainer container spacing={2} direction="column" alignItems="center" justifyContent="center">
            <Grid size={{xs: 12, md: 5, lg: 4, xl: 3}}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Box sx={{
                        width: '100%',
                        visibility: isLoading ? 'block' : 'hidden',
                        mb: 2
                    }}>
                        <LinearProgress sx={{ borderRadius: '6px' }} />
                    </Box>
                    <Box component="form" onSubmit={(e) => e.preventDefault()} noValidate autoComplete="off">
                        <Paper elevation={4} sx={{
                            padding: 4,
                            display: "flex",
                            flexDirection: "column",
                            width: "100%",
                            gap: 3,
                            borderRadius: '16px',
                            background: theme => theme.palette.mode === 'dark' 
                                ? 'rgba(30, 30, 30, 0.8)' 
                                : 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(10px)',
                            border: theme => `1px solid ${theme.palette.divider}`,
                            boxShadow: theme => theme.shadows[8],
                        }}>
                            <Typography variant="h4" align="center" sx={{
                                fontWeight: 600,
                                letterSpacing: '-0.5px',
                                background: theme => `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                Welcome Back
                            </Typography>
                            <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
                                Sign in to continue to Codesirius
                            </Typography>
                            <Divider />
                            <FormControl>
                                <AuthTextField
                                    disabled={isLoading}
                                    value={usernameOrEmail}
                                    onChange={handleUsernameOrEmail}
                                    onBlur={handleUsernameOrEmailBlur}
                                    id="username-or-email"
                                    label="Username or Email"
                                    placeholder="Enter your username or email"
                                    aria-describedby="username-or-email-helper-text"
                                    variant="outlined"
                                    type="text"
                                    fullWidth
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <AccountCircle color="primary" />
                                            </InputAdornment>
                                        )
                                    }}
                                    helperText={usernameOrEmailError}
                                    error={usernameOrEmailError.length > 0}
                                />
                            </FormControl>

                            <FormControl>
                                <AuthTextField
                                    disabled={isLoading}
                                    value={password}
                                    onChange={handlePassword}
                                    onBlur={handlePasswordBlur}
                                    id="password"
                                    label="Password"
                                    placeholder="Enter your password"
                                    aria-describedby="password-helper-text"
                                    variant="outlined"
                                    type={showPassword ? 'text' : 'password'}
                                    fullWidth
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Password color="primary" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                    helperText={passwordError}
                                    error={passwordError.length > 0}
                                />
                                <Typography variant="body2"
                                          sx={{ textAlign: 'right', mt: 1 }}>
                                    <Link href="#" variant="body2"
                                          sx={{ textDecoration: "none", color: 'primary.main' }}>
                                        Forgot password?
                                    </Link>
                                </Typography>
                            </FormControl>
                            <FormControl>
                                <AuthButton
                                    disabled={isLoading}
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSubmit}
                                    endIcon={<NavigateNext />}
                                    fullWidth
                                >
                                    {isLoading ? 'Signing in...' : 'Sign In'}
                                </AuthButton>
                            </FormControl>
                            <Divider />
                            <Typography variant="body2" sx={{ textAlign: 'center' }}>
                                Don&#39;t have an account?
                                <br />
                                <Link component={NextLink} href="/auth/signup"
                                      variant="body2"
                                      sx={{ 
                                          textDecoration: 'none',
                                          color: 'primary.main',
                                          fontWeight: 500,
                                          '&:hover': {
                                              textDecoration: 'underline'
                                          }
                                      }}
                                      onClick={() => dispatch(setCodesiriusLoading(true))}>
                                    Create an account
                                </Link>
                            </Typography>
                        </Paper>
                    </Box>
                </motion.div>
            </Grid>
            <Snackbar
                open={isSnackbarOpen}
                autoHideDuration={3000}
                message="An error occurred. Please try again later."
                onClose={() => setIsSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
        </AuthContainer>
    );
};

export default Signin;
