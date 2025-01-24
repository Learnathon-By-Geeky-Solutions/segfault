'use client';
import React, {useState} from 'react';
import {Paper, Step, StepLabel, Stepper} from "@mui/material";
import {Grid} from "@mui/system";
import Divider from "@mui/material/Divider";
import AccountInformation from "@/app/auth/signup/accountInformation";
import Verification from "@/app/auth/signup/verification";
import Complete from "@/app/auth/signup/complete";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import Button from "@mui/material/Button";

const Signup = () => {
    const steps = ['Account Information', 'Verification', 'Complete'];
    const [activeStep, setActiveStep] = useState<number>(0);
    return (
        <div>
            <Grid container spacing={2} direction="column" alignItems="center" justifyContent="center">
                <Grid size={{xs: 12, md: 5, lg: 4, xl: 3}}>
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
                            activeStep === 0 && <AccountInformation setActiveStep={setActiveStep}/>
                        }
                        {
                            activeStep === 1 && <Verification setActiveStep={setActiveStep}/>
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
                              &nbsp;
                              <Link href="/auth/signin" style={{textDecoration: 'none'}}>
                                <Button variant="text" color="primary" fullWidth>
                                  Sign In
                                </Button>
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
