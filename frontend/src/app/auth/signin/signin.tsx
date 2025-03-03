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

const Signin = () => {
    const dispatch = useAppDispatch<AppDispatch>();

    const [usernameOrEmail, setUsernameOrEmail] = useState<string>('');
    const [usernameOrEmailError, setUsernameOrEmailError] = useState<string>('');

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


    // this runs only once when the component is mounted
    useEffect(() => {
        dispatch(setCodesiriusLoading(false));
    }, [dispatch]);


    return (
        <>
            <Grid container spacing={2} direction="column" alignItems="center"
                  justifyContent="center">
                <Grid size={{xs: 12, md: 5, lg: 4, xl: 3}}>
                    <Box sx={{
                        width: '100%',
                        visibility: isLoading ? 'block' : 'hidden'
                    }}>
                        <LinearProgress/>
                    </Box>
                    <Paper elevation={4} component="form"
                           onSubmit={(e) => e.preventDefault()}
                           sx={{
                               padding: 2,
                               display: "flex",
                               flexDirection: "column",
                               width: "100%",
                               gap: 2
                           }} noValidate
                           autoComplete="off">
                        <Typography variant="h5" component="h1">
                            Sign In
                        </Typography>
                        <Divider/>
                        <FormControl>
                            <TextField
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
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <AccountCircle/>
                                            </InputAdornment>
                                        )
                                    }
                                }}
                                helperText={usernameOrEmailError}
                                error={usernameOrEmailError.length > 0}
                            />
                        </FormControl>

                        <FormControl>
                            <TextField
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
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Password/>
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}>
                                                    {showPassword ? <VisibilityOff/> :
                                                        <Visibility/>}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }
                                }}
                                helperText={passwordError}
                                error={passwordError.length > 0}
                            />
                            <Typography variant="body2"
                                        sx={{textAlign: 'right', mt: 1}}>
                                <Link href="#" variant="body2"
                                      sx={{textDecoration: "none"}}>
                                    Forgot password?
                                </Link>
                            </Typography>
                        </FormControl>
                        <FormControl>
                            <Button
                                disabled={isLoading}
                                type="submit"
                                variant="contained"
                                color="primary"
                                onClick={handleSubmit}
                                endIcon={<NavigateNext/>}>
                                {isLoading ? 'Signing in...' : 'Sign In'}
                            </Button>
                        </FormControl>
                        <Divider/>
                        <Typography variant="body2" sx={{textAlign: 'center'}}>
                            Don&#39;t have an account?
                            <br/>
                            <Link component={NextLink} href="/auth/signup"
                                  variant="body2"
                                  sx={{textDecoration: 'none'}}
                                  onClick={() => dispatch(setCodesiriusLoading(true))}>
                                Sign up
                            </Link>
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
            <Snackbar
                open={isSnackbarOpen}
                autoHideDuration={3000}
                message="An error occurred. Please try again later."
                onClose={() => setIsSnackbarOpen(false)}
            />
        </>
    );
};

export default Signin;
