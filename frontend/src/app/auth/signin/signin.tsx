"use client";
import React, {useState} from 'react';
import {Grid} from "@mui/system";
import {FormControl, InputAdornment, Paper, TextField} from "@mui/material";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import {AccountCircle, NavigateNext, Password, Visibility, VisibilityOff} from "@mui/icons-material";
import Button from "@mui/material/Button";
import Link from "next/link";

const Signin = () => {
    const {setCodesiriusLoading} = useCodesiriusState();

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


    // this runs only once when the component is mounted
    useEffect(() => {
        setCodesiriusLoading(false);
    }, [])


    return (
        <>
            <Grid container spacing={2} direction="column" alignItems="center" justifyContent="center">
                <Grid size={{xs: 12, md: 5, lg: 4, xl: 3}}>
                    <Paper elevation={4} component="form"
                           sx={{padding: 2, display: "flex", flexDirection: "column", width: "100%", gap: 2}} noValidate
                           autoComplete="off">
                        <Typography variant="h5" component="h1">
                            Sign In
                        </Typography>
                        <Divider/>
                        <FormControl>
                            <TextField
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
                                                <IconButton onClick={() => setShowPassword(!showPassword)}>
                                                    {showPassword ? <VisibilityOff/> : <Visibility/>}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }
                                }}
                                helperText={passwordError}
                                error={passwordError.length > 0}
                            />
                        </FormControl>
                        <Button
                            variant="contained"
                            color="primary"
                            endIcon={<NavigateNext/>}
                        >
                            Sign in
                        </Button>
                        <Divider/>
                        <Typography variant="body2" sx={{textAlign: 'center'}}>
                            Don&#39;t have an account?
                            <br/>
                            <Link component={NextLink} href="/auth/signup" variant="body2"
                                  sx={{textDecoration: 'none'}} onClick={() => setCodesiriusLoading(true)}>
                                Sign up
                            </Link>
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </>
    );
};

export default Signin;
