'use client';
import React, {useEffect, useState} from 'react';
import {LinearProgress, Paper, Step, StepLabel, Stepper} from "@mui/material";
import {Grid} from "@mui/system";
import Divider from "@mui/material/Divider";
import AccountInformation from "@/app/auth/signup/accountInformation";
import Verification from "@/app/auth/signup/verification";
import Complete from "@/app/auth/signup/complete";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import Link from '@mui/material/Link';
import Box from "@mui/material/Box";
import {useAppDispatch} from "@/lib/hooks/hooks";
import {setCodesiriusLoading} from "@/lib/features/codesirius/codesiriusSlice";


const Signup = () => {
    const dispatch = useAppDispatch();
    const steps = ['Account Information', 'Verification', 'Complete'];
    const [activeStep, setActiveStep] = useState<number>(0);

    const [isSignupLoading, setIsSignupLoading] = useState<boolean>(false);

    const [userId, setUserId] = useState<number | null>(null);

    useEffect(() => {
        dispatch(setCodesiriusLoading(false));
    }, []);
    return (
        <div>
            <Grid container spacing={2} direction="column" alignItems="center" justifyContent="center">
                <Grid size={{xs: 12, md: 5, lg: 4, xl: 3}}>
                    <Box sx={{width: '100%', visibility: isSignupLoading ? 'block' : 'hidden'}}>
                        <LinearProgress/>
                    </Box>
                    <Paper elevation={4}
                           sx={{padding: 2, display: "flex", flexDirection: "column", width: "100%", gap: 2}}>
                        <Stepper activeStep={activeStep} alternativeLabel>
                            {steps.map((label) => (
                                <Step key={label}>
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                        <Divider/>
                        {
                            activeStep === 0 &&
                          <AccountInformation setActiveStep={setActiveStep} setIsSignupLoading={setIsSignupLoading}
                                              setUserId={setUserId}/>
                        }
                        {
                            activeStep === 1 && <Verification setActiveStep={setActiveStep} userId={userId}
                                                              setIsSignupLoading={setIsSignupLoading}/>
                        }
                        {
                            activeStep === 3 && <Complete/>
                        }

                        {
                            activeStep === 0 &&
                          <>
                            <Divider/>
                            <Typography variant="body2" sx={{textAlign: 'center'}}>
                              Already have an account?
                              <br/>
                                {/*<Link href="/auth/signin" style={{textDecoration: 'none'}}>*/}
                                {/*  <Button variant="text" color="primary" fullWidth>*/}
                                {/*    Sign In*/}
                                {/*  </Button>*/}
                                {/*</Link>*/}
                              <Link component={NextLink} href="/auth/signin" variant="body2"
                                    sx={{textDecoration: 'none'}}>
                                Sign In
                              </Link>
                            </Typography>
                          </>
                        }

                    </Paper>
                </Grid>
            </Grid>
        </div>
    );
};

export default Signup;
