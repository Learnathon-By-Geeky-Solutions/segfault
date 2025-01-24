import React from 'react';
import {FormControl, Grow, InputAdornment, TextField} from "@mui/material";
import {Key, NavigateNext, Redo} from "@mui/icons-material";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

const Verification = ({setActiveStep}: Readonly<{ setActiveStep: (value: number) => void }>) => {

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

    return (
        <Grow in={true}>
            <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
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
                        onPaste={(event) => event.preventDefault()}
                        id="confirmation-code"
                        label="Confirmation Code"
                        placeholder="Enter your confirmation code"
                        aria-describedby="confirmation-code-helper-text"
                        variant="outlined"
                        type="text"
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
                    variant="contained"
                    color="primary"
                    endIcon={<NavigateNext/>}
                    onClick={() => setActiveStep(3)}
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
    );
};

export default Verification;
