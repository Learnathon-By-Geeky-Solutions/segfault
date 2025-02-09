"use client"
import React, {useEffect, useState} from 'react';
import {useAppDispatch} from "@/lib/hooks/hooks";
import {AppDispatch} from "@/lib/store";
import {setCodesiriusLoading} from "@/lib/features/codesirius/codesiriusSlice";
import Box from "@mui/material/Box";
import {LinearProgress, Step, StepButton, Stepper} from "@mui/material";
import 'katex/dist/katex.min.css';
import Divider from "@mui/material/Divider";
import LivePreview from "@/app/problems/add/live-preview";
import SplitPane from "@/app/problems/add/SplitPane";
import ProblemMetaData from "@/app/problems/add/problem-meta-data";
import StatementAndConstraints from "@/app/problems/add/statement-and-constraints";
import CodeEditor from "@/app/problems/add/code-editor";
import ExecutionConstraints from "@/app/problems/add/execution-constraints";


const AddProblem = () => {
    const dispatch = useAppDispatch<AppDispatch>();
    const [title, setTitle] = useState<string>('');
    const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined);
    const [memoryLimit, setMemoryLimit] = useState<number | undefined>(undefined);
    const [description, setDescription] = useState<string>('');

    const supportedLanguages = [
        {label: 'C++', value: 'cpp'},
        {label: 'Java', value: 'java'},
        {label: 'Python', value: 'python'},
        {label: 'Python3', value: 'python3'},
        {label: 'C', value: 'c'},
        {label: 'C#', value: 'csharp'},
        {label: 'Ruby', value: 'ruby'},
        {label: 'Swift', value: 'swift'},
    ]

    const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['cpp', 'java']);


    useEffect(() => {
        dispatch(setCodesiriusLoading(false));
    }, []);


    const steps = [
        "Problem Meta Data",
        "Problem Statement & Constraints",
        "Execution Constraints",
        "Reference Solution",
        "Test Cases",
        "Hints & Explanation (Optional)",
        "Review & Publish"
    ]

    const [activeStep, setActiveStep] = useState(0);
    const [progress, setProgress] = useState(0);

    const handleStepButtonClick = (index: number) => {
        setActiveStep(index);
        setProgress((index + 1) * 10);
    }

    const renderLeft = (step: number) => {
        if (step === 0) {
            return (
                <ProblemMetaData title={title} setTitle={setTitle}
                                 supportedLanguages={supportedLanguages}
                                 selectedLanguages={selectedLanguages} setSelectedLanguages={setSelectedLanguages}/>
            )
        } else if (step === 1) {
            return <StatementAndConstraints
                description={description}
                setDescription={setDescription}
            />
        } else if (step == 2) {
            return (
                <div>
                    <ExecutionConstraints selectedLanguages={selectedLanguages} timeLimit={timeLimit}
                                          setTimeLimit={setTimeLimit} memoryLimit={memoryLimit}
                                          setMemoryLimit={setMemoryLimit}/>
                </div>
            )
        } else if (step === 3) {
            return (
                <div>
                    <CodeEditor />
                </div>
            )
        }
    }

    const renderRight = (step: number) => {
        if (step === 0 || step === 1 || step === 2 || step == 3) {
            return <LivePreview
                title={title}
                description={description}
                timeLimit={timeLimit}
                memoryLimit={memoryLimit}
            />
        } else if (step === 4) {
            return (
                <div>
                    Test Cases
                </div>
            )
        }
    }

    return (
        <Box sx={{width: "100%"}}>
            {/*<Box sx={{padding: 2}} display="flex">*/}
            {/*    <Typography variant="h6">*/}
            {/*        Create a New Problem*/}
            {/*    </Typography>*/}
            {/*</Box>*/}
            {/*<Divider>*/}
            {/*    <Typography variant="h6" align="center" color="primary">Create a Problem</Typography>*/}
            {/*</Divider>*/}
            <Box sx={{width: "100%"}} p={2}>
                <Stepper nonLinear activeStep={activeStep} alternativeLabel>
                    {steps.map((label, index) => {
                        return (
                            <Step key={label} completed={activeStep > index}>
                                <StepButton onClick={() => handleStepButtonClick(index)}>
                                    {label}
                                </StepButton>
                            </Step>
                        );
                    })}
                </Stepper>
            </Box>
            <Divider/>
            <Box sx={{display: progress ? 'block' : 'hidden'}} mb={1}>
                <LinearProgress variant="determinate" value={progress}/>
            </Box>
            <SplitPane leftChildren={renderLeft(activeStep)} rightChildren={renderRight(activeStep)}/>
        </Box>
    );
};

export default AddProblem;