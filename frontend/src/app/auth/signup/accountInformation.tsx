'use client';
import React, {useEffect, useState} from 'react';
import isEmail from 'validator/lib/isEmail';
import {FormControl, InputAdornment, Snackbar, TextField} from "@mui/material";
import {NavigateNext, Visibility, VisibilityOff} from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import {useSignupMutation} from "@/lib/features/api/authApiSlice";
import {isFetchBaseQueryError} from "@/lib/utils/isFetchBaseQueryError";
import {APIError, FieldError, SignupRequest, SignupResponse} from "@/lib/features/api/types";



interface AccountInformationProps {
    setActiveStep: (value: number) => void;
    setIsSignupLoading: (value: boolean) => void;
    setUserId: (value: number) => void;
}

const AccountInformation = ({
                                setActiveStep,
                                setIsSignupLoading,
                                setUserId
                            }: AccountInformationProps) => {

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
        return isEmail(email);
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

    const [signup, {isLoading}] = useSignupMutation();

    const validateInputs = (): boolean => {
        let isValid = true;

        if (firstName.length < 3) {
            setFirstNameError('First name must be at least 3 characters');
            isValid = false;
        }
        if (username.length < 3) {
            setUsernameError('Username must be at least 3 characters');
            isValid = false;
        }
        if (!isValidEmail(email)) {
            setEmailError('Invalid email address');
            isValid = false;
        }
        if (password.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            isValid = false;
        }
        if (confirmPassword !== password) {
            setConfirmPasswordError('Passwords do not match');
            isValid = false;
        }

        return isValid;
    };

    const handleApiErrors = (errors: FieldError[]) => {
        const errorMap: Record<string, React.Dispatch<React.SetStateAction<string>>> = {
            firstName: setFirstNameError,
            lastName: setFirstNameError,
            email: setEmailError,
            username: setUsernameError,
            password1: setPasswordError,
            password2: setConfirmPasswordError
        };

        errors.forEach(({field, message}) => {
            if (errorMap[field]) errorMap[field](message);
        });
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        if (!validateInputs()) {
            setSnackbarMessage('Please correct the errors before proceeding');
            setIsSnackbarOpen(true);
            return;
        }

        const user: SignupRequest = {
            firstName,
            lastName,
            username,
            email,
            password1: password,
            password2: confirmPassword
        };

        try {
            const res: SignupResponse = await signup(user).unwrap();
            if (res.status === 201) {
                setUserId(res.data.userId);
                setActiveStep(1);
                setIsSignupLoading(false);
            }
        } catch (err) {
            if (isFetchBaseQueryError(err)) {
                const apiError = err.data as APIError;
                if (apiError.status === 400 && apiError.errors) {
                    handleApiErrors(apiError.errors);
                }
            }
        }
    };


    // pipe loading state to parent component
    useEffect(() => {
        setIsSignupLoading(isLoading);
    }, [isLoading, setIsSignupLoading]);


    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}} component="form"
             onSubmit={handleSubmit}>
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
                                        {showConfirmPassword ? <VisibilityOff/> :
                                            <Visibility/>}
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
