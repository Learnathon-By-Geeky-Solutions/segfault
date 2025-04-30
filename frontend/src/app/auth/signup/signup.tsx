'use client';
import React, {useEffect, useState} from 'react';
import {LinearProgress, Paper, Step, StepLabel, Stepper, Skeleton} from "@mui/material";
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
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';
import { Code, Terminal, BugReport, Security } from '@mui/icons-material';

const AuthContainer = styled(Grid)(({ theme }) => ({
    minHeight: '100vh',
    padding: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
        padding: theme.spacing(4),
    },
    background: theme.palette.mode === 'dark' 
        ? 'linear-gradient(135deg, rgba(18, 18, 18, 0.95), rgba(30, 30, 30, 0.95))' 
        : 'linear-gradient(135deg, rgba(248, 249, 250, 0.95), rgba(255, 255, 255, 0.95))',
    '&::before': {
        content: '""',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: theme.palette.mode === 'dark' 
            ? 'radial-gradient(circle at 50% 50%, rgba(124, 77, 255, 0.15), transparent 70%)' 
            : 'radial-gradient(circle at 50% 50%, rgba(94, 53, 177, 0.15), transparent 70%)',
        zIndex: -1,
    },
    '&::after': {
        content: '""',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(45deg, rgba(18, 18, 18, 0.5), transparent)' 
            : 'linear-gradient(45deg, rgba(248, 249, 250, 0.5), transparent)',
        zIndex: -1,
    }
}));

const AuthPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
        padding: theme.spacing(4),
    },
    display: "flex",
    flexDirection: "column",
    width: "100%",
    gap: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
        gap: theme.spacing(3),
    },
    borderRadius: '24px',
    background: theme.palette.mode === 'dark' 
        ? 'rgba(30, 30, 30, 0.8)' 
        : 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(20px)',
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: `0 8px 32px ${theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'}`,
    maxHeight: 'calc(100vh - 32px)',
    overflowY: 'auto',
    '&::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
    },
    '&::-webkit-scrollbar-track': {
        background: theme.palette.background.default,
        borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
        background: theme.palette.divider,
        borderRadius: '4px',
        '&:hover': {
            background: theme.palette.action.hover,
        }
    }
}));

const AuthTitle = styled(Typography)(({ theme }) => ({
    fontWeight: 700,
    letterSpacing: '-0.5px',
    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textAlign: 'center',
    marginBottom: theme.spacing(1),
}));

const AuthStepper = styled(Stepper)(({ theme }) => ({
    '& .MuiStepLabel-root .Mui-completed': {
        color: theme.palette.primary.main,
    },
    '& .MuiStepLabel-root .Mui-active': {
        color: theme.palette.primary.main,
    },
    '& .MuiStepLabel-root .MuiStepIcon-text': {
        fill: theme.palette.primary.contrastText,
    },
    marginBottom: theme.spacing(2),
    '& .MuiStepLabel-label': {
        fontSize: '0.875rem',
        fontWeight: 500,
    }
}));

const FormContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    minHeight: '300px',
    position: 'relative',
}));

const FeatureGrid = styled(Grid)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    padding: theme.spacing(3),
    background: theme.palette.mode === 'dark' 
        ? 'rgba(30, 30, 30, 0.4)' 
        : 'rgba(255, 255, 255, 0.4)',
    borderRadius: '16px',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${theme.palette.divider}`,
}));

const FeatureItem = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(1.5),
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    '&:hover': {
        background: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.02)',
        transform: 'translateX(4px)',
    }
}));

const LoadingSkeleton = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
    padding: theme.spacing(4),
    borderRadius: '24px',
    background: theme.palette.mode === 'dark' 
        ? 'rgba(30, 30, 30, 0.8)' 
        : 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(20px)',
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: `0 8px 32px ${theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'}`,
}));

const SkeletonStep = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(2),
    borderRadius: '12px',
    background: theme.palette.mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.05)' 
        : 'rgba(0, 0, 0, 0.02)',
}));

const Signup = () => {
    const dispatch = useAppDispatch();
    const steps = ['Account Information', 'Verification', 'Complete'];
    const [activeStep, setActiveStep] = useState<number>(0);
    const [isSignupLoading, setIsSignupLoading] = useState<boolean>(false);
    const [userId, setUserId] = useState<number | null>(null);

    useEffect(() => {
        dispatch(setCodesiriusLoading(false));
    }, [dispatch]);

    if (isSignupLoading) {
        return (
            <AuthContainer container spacing={4} direction="row" alignItems="center" justifyContent="center">
                <Grid size={{xs: 12, md: 5, lg: 4}}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <LoadingSkeleton>
                            <Box sx={{ mb: 2 }}>
                                <Skeleton 
                                    variant="text" 
                                    width="60%" 
                                    height={40} 
                                    sx={{ 
                                        mx: 'auto',
                                        bgcolor: theme => theme.palette.mode === 'dark' 
                                            ? 'rgba(255, 255, 255, 0.1)' 
                                            : 'rgba(0, 0, 0, 0.1)'
                                    }} 
                                />
                                <Skeleton 
                                    variant="text" 
                                    width="80%" 
                                    height={24} 
                                    sx={{ 
                                        mx: 'auto',
                                        mt: 1,
                                        bgcolor: theme => theme.palette.mode === 'dark' 
                                            ? 'rgba(255, 255, 255, 0.1)' 
                                            : 'rgba(0, 0, 0, 0.1)'
                                    }} 
                                />
                            </Box>
                            
                            <Box sx={{ mb: 3 }}>
                                <Stepper activeStep={activeStep} alternativeLabel>
                                    {steps.map((label) => (
                                        <Step key={label}>
                                            <StepLabel>
                                                <Skeleton 
                                                    variant="text" 
                                                    width={100} 
                                                    height={20}
                                                    sx={{ 
                                                        bgcolor: theme => theme.palette.mode === 'dark' 
                                                            ? 'rgba(255, 255, 255, 0.1)' 
                                                            : 'rgba(0, 0, 0, 0.1)'
                                                    }} 
                                                />
                                            </StepLabel>
                                        </Step>
                                    ))}
                                </Stepper>
                            </Box>

                            <Divider />

                            <Box sx={{ mt: 2 }}>
                                {[1, 2, 3].map((index) => (
                                    <SkeletonStep key={index}>
                                        <Skeleton 
                                            variant="circular" 
                                            width={40} 
                                            height={40}
                                            sx={{ 
                                                bgcolor: theme => theme.palette.mode === 'dark' 
                                                    ? 'rgba(255, 255, 255, 0.1)' 
                                                    : 'rgba(0, 0, 0, 0.1)'
                                            }} 
                                        />
                                        <Box sx={{ flex: 1 }}>
                                            <Skeleton 
                                                variant="text" 
                                                width="60%" 
                                                height={24}
                                                sx={{ 
                                                    bgcolor: theme => theme.palette.mode === 'dark' 
                                                        ? 'rgba(255, 255, 255, 0.1)' 
                                                        : 'rgba(0, 0, 0, 0.1)'
                                                }} 
                                            />
                                            <Skeleton 
                                                variant="text" 
                                                width="80%" 
                                                height={20}
                                                sx={{ 
                                                    mt: 1,
                                                    bgcolor: theme => theme.palette.mode === 'dark' 
                                                        ? 'rgba(255, 255, 255, 0.1)' 
                                                        : 'rgba(0, 0, 0, 0.1)'
                                                }} 
                                            />
                                        </Box>
                                    </SkeletonStep>
                                ))}
                            </Box>

                            <Box sx={{ mt: 'auto' }}>
                                <Divider />
                                <Box sx={{ mt: 2, textAlign: 'center' }}>
                                    <Skeleton 
                                        variant="text" 
                                        width="40%" 
                                        height={20}
                                        sx={{ 
                                            mx: 'auto',
                                            bgcolor: theme => theme.palette.mode === 'dark' 
                                                ? 'rgba(255, 255, 255, 0.1)' 
                                                : 'rgba(0, 0, 0, 0.1)'
                                        }} 
                                    />
                                </Box>
                            </Box>
                        </LoadingSkeleton>
                    </motion.div>
                </Grid>
                <Grid size={{xs: 12, md: 5, lg: 4}} sx={{ display: { xs: 'none', md: 'block' } }}>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <FeatureGrid>
                            <Skeleton 
                                variant="text" 
                                width="50%" 
                                height={32}
                                sx={{ 
                                    mb: 3,
                                    bgcolor: theme => theme.palette.mode === 'dark' 
                                        ? 'rgba(255, 255, 255, 0.1)' 
                                        : 'rgba(0, 0, 0, 0.1)'
                                }} 
                            />
                            {[1, 2, 3, 4].map((index) => (
                                <SkeletonStep key={index}>
                                    <Skeleton 
                                        variant="circular" 
                                        width={28} 
                                        height={28}
                                        sx={{ 
                                            bgcolor: theme => theme.palette.mode === 'dark' 
                                                ? 'rgba(255, 255, 255, 0.1)' 
                                                : 'rgba(0, 0, 0, 0.1)'
                                        }} 
                                    />
                                    <Box sx={{ flex: 1 }}>
                                        <Skeleton 
                                            variant="text" 
                                            width="40%" 
                                            height={24}
                                            sx={{ 
                                                bgcolor: theme => theme.palette.mode === 'dark' 
                                                    ? 'rgba(255, 255, 255, 0.1)' 
                                                    : 'rgba(0, 0, 0, 0.1)'
                                            }} 
                                        />
                                        <Skeleton 
                                            variant="text" 
                                            width="70%" 
                                            height={20}
                                            sx={{ 
                                                mt: 1,
                                                bgcolor: theme => theme.palette.mode === 'dark' 
                                                    ? 'rgba(255, 255, 255, 0.1)' 
                                                    : 'rgba(0, 0, 0, 0.1)'
                                            }} 
                                        />
                                    </Box>
                                </SkeletonStep>
                            ))}
                        </FeatureGrid>
                    </motion.div>
                </Grid>
            </AuthContainer>
        );
    }

    return (
        <AuthContainer container spacing={4} direction="row" alignItems="center" justifyContent="center">
            <Grid size={{xs: 12, md: 5, lg: 4}}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Box sx={{
                        width: '100%',
                        visibility: isSignupLoading ? 'block' : 'hidden',
                        mb: 2
                    }}>
                        <LinearProgress sx={{ borderRadius: '6px' }} />
                    </Box>
                    <AuthPaper elevation={4}>
                        <Box sx={{ position: 'sticky', top: 0, background: 'inherit', zIndex: 1, pb: 2 }}>
                            <AuthTitle variant="h4">
                                Create Your Account
                            </AuthTitle>
                            <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 2 }}>
                                Join Codesirius and start your coding journey
                            </Typography>
                            <AuthStepper activeStep={activeStep} alternativeLabel>
                                {steps.map((label) => (
                                    <Step key={label}>
                                        <StepLabel>{label}</StepLabel>
                                    </Step>
                                ))}
                            </AuthStepper>
                            <Divider />
                        </Box>
                        <FormContainer>
                            {activeStep === 0 && (
                                <AccountInformation 
                                    setActiveStep={setActiveStep} 
                                    setIsSignupLoading={setIsSignupLoading}
                                    setUserId={setUserId}
                                />
                            )}
                            {activeStep === 1 && (
                                <Verification 
                                    setActiveStep={setActiveStep} 
                                    userId={userId}
                                    setIsSignupLoading={setIsSignupLoading}
                                />
                            )}
                            {activeStep === 3 && <Complete />}
                        </FormContainer>
                        {activeStep === 0 && (
                            <>
                                <Divider sx={{ mt: 'auto' }} />
                                <Typography variant="body2" sx={{ textAlign: 'center' }}>
                                    Already have an account?
                                    <br />
                                    <Link component={NextLink} href="/auth/signin" variant="body2"
                                          sx={{ 
                                              textDecoration: 'none',
                                              color: 'primary.main',
                                              fontWeight: 500,
                                              '&:hover': {
                                                  textDecoration: 'underline'
                                              }
                                          }}>
                                        Sign In
                                    </Link>
                                </Typography>
                            </>
                        )}
                    </AuthPaper>
                </motion.div>
            </Grid>
            <Grid size={{xs: 12, md: 5, lg: 4}} sx={{ display: { xs: 'none', md: 'block' } }}>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <FeatureGrid>
                        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                            Why Join Codesirius?
                        </Typography>
                        <FeatureItem>
                            <Code sx={{ color: 'primary.main', fontSize: 28 }} />
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                    Practice Coding
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Solve real-world problems and improve your skills
                                </Typography>
                            </Box>
                        </FeatureItem>
                        <FeatureItem>
                            <Terminal sx={{ color: 'primary.main', fontSize: 28 }} />
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                    Code Editor
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Built-in editor with syntax highlighting
                                </Typography>
                            </Box>
                        </FeatureItem>
                        <FeatureItem>
                            <BugReport sx={{ color: 'primary.main', fontSize: 28 }} />
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                    Debugging Tools
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Advanced debugging features to help you learn
                                </Typography>
                            </Box>
                        </FeatureItem>
                        <FeatureItem>
                            <Security sx={{ color: 'primary.main', fontSize: 28 }} />
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                    Secure Platform
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Your code and data are always protected
                                </Typography>
                            </Box>
                        </FeatureItem>
                    </FeatureGrid>
                </motion.div>
            </Grid>
        </AuthContainer>
    );
};

export default Signup;
