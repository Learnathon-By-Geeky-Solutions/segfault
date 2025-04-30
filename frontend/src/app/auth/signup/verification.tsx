import React, {useEffect} from 'react';
import {FormControl, Grow, InputAdornment, Snackbar, TextField} from "@mui/material";
import {Key, NavigateNext, Redo} from "@mui/icons-material";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {useCheckVerificationMutation} from "@/lib/features/api/authApiSlice";
import {setCodesiriusLoading} from "@/lib/features/codesirius/codesiriusSlice";
import {isFetchBaseQueryError} from "@/lib/utils/isFetchBaseQueryError";
import {APIError, VerificationRequest} from "@/lib/features/api/types";

interface VerificationProps {
    setActiveStep: (value: number) => void;
    userId: number | null;
    setIsSignupLoading: (value: boolean) => void;
}

const Verification = ({setActiveStep, userId, setIsSignupLoading}: VerificationProps) => {
    const [confirmationCode, setConfirmationCode] = React.useState<string>('');
    const [confirmationCodeError, setConfirmationCodeError] = React.useState<string>('');

    const handleConfirmationCode = (event: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmationCode(event.target.value);
        setConfirmationCodeError('');
    }

    const handleConfirmationCodeBlur = () => {
        if (confirmationCode.length < 6) {
            setConfirmationCodeError('Confirmation code must be 6 characters');
        }
    }

    const [checkVerification, {isLoading}] = useCheckVerificationMutation();
    const [isSnackbarOpen, setIsSnackbarOpen] = React.useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = React.useState<string>('');

    const handleSubmit = async () => {
        if (userId === null) {
            return;
        }
        if (confirmationCode.length < 6) {
            setConfirmationCodeError('Confirmation code must be 6 characters');
        }
        if (confirmationCodeError.length === 0) {
            const verificationRequest: VerificationRequest = {
                userId,
                code: confirmationCode
            }
            try {
                const res = await checkVerification(verificationRequest).unwrap();
                if (res.status === 200) {
                    setCodesiriusLoading(false);
                    setActiveStep(3);
                    window.location.href = '/';
                }
            } catch (err) {
                if (isFetchBaseQueryError(err)) {
                    const error = err.data as APIError;
                    setConfirmationCodeError(error.errors![0].message);
                } else {
                    setSnackbarMessage("An error occurred. Please try again later");
                    setIsSnackbarOpen(true);
                }
            }
        } else {
            setSnackbarMessage("Please fix the errors before submitting");
            setIsSnackbarOpen(true);
        }
    }

    // pipe isLoading to setCodesiriusLoading
    useEffect(() => {
        setIsSignupLoading(isLoading);
    }, [isLoading, setIsSignupLoading]);

    return (
        <>
            <Grow in={true}>
                <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}} component="form"
                     onSubmit={(e) => e.preventDefault()}>
                    <ul>
                        <li>
                            <Typography variant="body1">
                                We have sent a confirmation code to your email address.
                            </Typography>
                        </li>
                        <li>
                            <Typography variant="body1">
                                It may take a few minutes for the email to arrive.
                            </Typography>
                        </li>
                        <li>
                            <Typography variant="body1">
                                Some email providers may send the email to
                                your <strong>Spam</strong> or <strong>Junk</strong> folder.
                            </Typography>
                        </li>
                    </ul>
                    <FormControl>
                        <TextField
                            value={confirmationCode}
                            onChange={handleConfirmationCode}
                            onBlur={handleConfirmationCodeBlur}
                            id="confirmation-code"
                            label="Confirmation Code"
                            placeholder="Enter your confirmation code"
                            aria-describedby="confirmation-code-helper-text"
                            variant="outlined"
                            type="text"
                            autoComplete="off"
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Key/>
                                        </InputAdornment>
                                    )
                                }
                            }}
                            helperText={confirmationCodeError}
                            error={confirmationCodeError.length > 0}
                        />
                    </FormControl>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        endIcon={<NavigateNext/>}
                        onClick={handleSubmit}
                    >
                        Verify
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        endIcon={<Redo/>}
                    >
                        Resend Code
                    </Button>
                </Box>
            </Grow>
            <Snackbar
                open={isSnackbarOpen}
                autoHideDuration={3000}
                onClose={() => setIsSnackbarOpen(false)}
                message={snackbarMessage}
            />
        </>
    );
};

export default Verification;
