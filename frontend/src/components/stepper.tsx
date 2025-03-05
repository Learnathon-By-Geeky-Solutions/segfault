"use client";

import React from 'react';
import {Alert, Snackbar, Step, StepLabel, Stepper} from "@mui/material";
import Box from "@mui/material/Box";
import NextLink from "next/link";
import Link from "@mui/material/Link";
import {useAppDispatch, useAppSelector} from "@/lib/hooks/hooks";
import {setCodesiriusLoading} from "@/lib/features/codesirius/codesiriusSlice";
import {setIsSnackbarOpen} from "@/lib/features/codesirius/addProblemSlice";
import Divider from "@mui/material/Divider";

interface CreateProblemStepperProps {
    problemId?: number;
    step?: number;
}

const ProblemCreateStepper = ({problemId, step = 0}: CreateProblemStepperProps) => {
    const dispatch = useAppDispatch();
    const isSnackbarOpen = useAppSelector(state => state.addProblem.isSnackbarOpen);
    const snackbarMessage = useAppSelector(state => state.addProblem.snackbarMessage);
    const completedSteps = useAppSelector(state => state.addProblem.completedSteps);
    const steps = [
        "Problem Meta Data",  // 0
        "Problem Statement & Constraints",  // 1
        "Execution Constraints",  // 2
        "Reference Solution & Test Cases",  // 3
        "Review & Publish",  // 4
    ]
    const handleStepClick = (next: number) => {
        if (next != step) {
            dispatch(setCodesiriusLoading(true));
        }
    }
    return (
        <>
            <Box sx={{width: "100%"}}>
                <Box sx={{width: "100%"}} p={2}>
                    <Stepper nonLinear>
                        {steps.map((label, index) => {
                            return (
                                <Step key={label} active={step == index} completed={completedSteps.includes(index)}>
                                    {
                                        problemId ?
                                            <Link component={NextLink}
                                                  href={`/problems/create/${problemId}/step/${index + 1}`} passHref
                                                  underline="none" onClick={() => handleStepClick(index)}>
                                                <StepLabel>
                                                    {label}
                                                </StepLabel>
                                            </Link> :
                                            <StepLabel sx={{cursor: index === 0 ? "pointer" : "not-allowed"}}>
                                                {label}
                                            </StepLabel>
                                    }
                                </Step>
                            );
                        })}
                    </Stepper>
                </Box>
                <Divider sx={{mb: 1, borderBottomWidth: 3}}/>
                <Snackbar
                    sx={{pb: 10, pl: 3}}
                    open={isSnackbarOpen}
                    autoHideDuration={6000}
                    onClose={() => dispatch(setIsSnackbarOpen(false))}
                >
                    <Alert
                        severity="success"
                        variant="filled">
                        {snackbarMessage}
                    </Alert>
                </Snackbar>
            </Box>
        </>
    )
};

export default ProblemCreateStepper;