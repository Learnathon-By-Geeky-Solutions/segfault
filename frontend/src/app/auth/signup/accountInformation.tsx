'use client';
import React, {useState} from 'react';
import { FormControl, InputAdornment, Snackbar, TextField} from "@mui/material";
import {NavigateNext, Visibility, VisibilityOff} from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import BlockUi from "@/components/blockUi";

interface AccountInformationProps {
    setActiveStep: (value: number) => void;
    setIsSignupLoading: (value: boolean) => void;
    setUserId: (value: number) => void;
}

const AccountInformation = ({setActiveStep, setIsSignupLoading, setUserId}: AccountInformationProps) => {

    const [firstName, setFirstName] = useState<string>('');
    const [firstNameError, setFirstNameError] = useState<string>('');

    const handleFirstName = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFirstName(event.target.value);
        setFirstNameError('');
    };

    const handleFirstNameBlur = () => {
        if (firstName.length < 3) {
            setFirstNameError('First name must be at least 3 characters');
        }
    }

    const [lastName, setLastName] = useState<string>('');

    const handleLastName = (event: React.ChangeEvent<HTMLInputElement>) => {
        setLastName(event.target.value);
    }

    const [email, setEmail] = useState<string>('');
    const [emailError, setEmailError] = useState<string>('');

    const handleEmail = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(event.target.value);
        setEmailError('');
    }

    const isValidEmail = (email: string): boolean => {
        return String(email)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            ) !== null;
    }

    const handleEmailBlur = () => {
        if (!isValidEmail(email)) {
            setEmailError('Invalid email address');
        }
    }

    const [username, setUsername] = useState<string>('');
    const [usernameError, setUsernameError] = useState<string>('');

    const handleUsername = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(event.target.value);
        setUsernameError('');
    }

    const handleUsernameBlur = () => {
        if (username.length < 3) {
            setUsernameError('Username must be at least 3 characters');
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

    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');

    const handleConfirmPassword = (event: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmPassword(event.target.value);
        setConfirmPasswordError('');
    }

    const handleConfirmPasswordBlur = () => {
        if (confirmPassword !== password) {
            setConfirmPasswordError('Passwords do not match');
        }
    }


    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

    const [isSnackbarOpen, setIsSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');

    const handlePasteOnConfirmPassword = (event: React.ClipboardEvent<HTMLInputElement>) => {
        event.preventDefault();
        setSnackbarMessage('Paste is disabled on this field');
        setIsSnackbarOpen(true);
    }


    const handleSubmit = (event: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
        console.log('submit');
        event.preventDefault();
        if (firstName.length < 3) {
            setFirstNameError('First name must be at least 3 characters');
        }
        if (username.length < 3) {
            setUsernameError('Username must be at least 3 characters');
        }
        if (!isValidEmail(email)) {
            setEmailError('Invalid email address');
        }
        if (password.length < 8) {
            setPasswordError('Password must be at least 8 characters');
        }
        if (confirmPassword !== password) {
            setConfirmPasswordError('Passwords do not match');
        }
        if (firstName.length >= 3 && username.length >= 3 && isValidEmail(email) && password.length >= 8 && confirmPassword === password) {
            setActiveStep(1);
        }
    }

    const [isUiBlocked, setIsUiBlocked] = useState<boolean>(false);

    return (
        <BlockUi open={isUiBlocked} onClose={() => setIsUiBlocked(false)}>
            <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}} component="form" onSubmit={handleSubmit}>
                <FormControl>
                    <TextField
                        value={firstName}
                        onChange={handleFirstName}
                        onBlur={handleFirstNameBlur}
                        id="first-name"
                        label="First Name"
                        placeholder="Enter your first name"
                        aria-describedby="first-name-helper-text"
                        variant="outlined"
                        helperText={firstNameError}
                        error={firstNameError.length > 0}
                    />
                </FormControl>
                <FormControl>
                    <TextField
                        value={lastName}
                        onChange={handleLastName}
                        id="last-name"
                        label="Last Name"
                        placeholder="Enter your last name"
                        aria-describedby="last-name-helper-text"
                        variant="outlined"
                    />
                </FormControl>

                <FormControl>
                    <TextField
                        value={username}
                        onChange={handleUsername}
                        onBlur={handleUsernameBlur}
                        id="username"
                        label="Username"
                        placeholder="Enter your username"
                        aria-describedby="username-helper-text"
                        variant="outlined"
                        helperText={usernameError}
                        error={usernameError.length > 0}
                    />
                </FormControl>

            <FormControl>
                <TextField
                    value={email}
                    onChange={handleEmail}
                    onBlur={handleEmailBlur}
                    id="email"
                    label="Email"
                    placeholder="Enter your email"
                    aria-describedby="email-helper-text"
                    variant="outlined"
                    type="email"
                    helperText={emailError}
                    error={emailError.length > 0}
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
            <FormControl>
                <TextField
                    value={confirmPassword}
                    onChange={handleConfirmPassword}
                    onBlur={handleConfirmPasswordBlur}
                    onPaste={handlePasteOnConfirmPassword}
                    id="confirm-password"
                    label="Confirm Password"
                    placeholder="Re-enter your password"
                    aria-describedby="confirm-password-helper-text"
                    variant="outlined"
                    type={showConfirmPassword ? 'text' : 'password'}
                    slotProps={{
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        {showConfirmPassword ? <VisibilityOff/> : <Visibility/>}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }
                    }}
                    helperText={confirmPasswordError}
                    error={confirmPasswordError.length > 0}
                />
            </FormControl>
            <Button
                type="submit"
                variant="contained"
                color="primary"
                endIcon={<NavigateNext/>}
                onClick={handleSubmit}
            >
                Next
            </Button>
            <Snackbar
                open={isSnackbarOpen}
                autoHideDuration={3000}
                onClose={() => setIsSnackbarOpen(false)}
                message={snackbarMessage}
            />
        </Box>
    );
};

export default AccountInformation;
