"use client"
import React, {useCallback, useEffect, useRef, useState} from 'react';
import Grid from "@mui/material/Grid2";
import {
    Alert,
    CircularProgress,
    FormControl,
    Grow,
    LinearProgress,
    LinearProgressProps,
    Snackbar,
    TextField,
    Theme,
    useTheme
} from "@mui/material";
import Button from "@mui/material/Button";
import {useAppDispatch} from "@/lib/hooks/hooks";
import {setCodesiriusLoading} from "@/lib/features/codesirius/codesiriusSlice";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {useDropzone} from "react-dropzone";
import {Stack} from "@mui/system";
import {SimpleTreeView, TreeItem} from "@mui/x-tree-view";
import AddIcon from "@mui/icons-material/Add";
import {Block, Check, Delete, Replay} from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import {
    APIError,
    DeleteHiddenTestsRequest,
    ProcessHiddenTestsRequest,
    SampleTest,
    UpsertSampleTestsRequest
} from "@/lib/features/api/types";
import {
    useDeleteHiddenTestsMutation,
    useDeleteSampleTestMutation,
    useProcessHiddenTestsMutation,
    useUpsertSampleTestsMutation
} from "@/lib/features/api/problemsApiSlice";
import {
    addCompletedStep,
    setIsHiddenTestsUploaded,
    setIsSnackbarOpen,
    setSnackbarMessage
} from "@/lib/features/codesirius/addProblemSlice";
import {isFetchBaseQueryError} from "@/lib/utils/isFetchBaseQueryError";
import axios from "axios";
import {LiveLogsContainer, LogAccordion, LogAccordionDetails, LogAccordionSummary} from "@/components/Logs";
import {Accordion, AccordionDetails, AccordionSummary} from "@/components/Accordion";
import {HiddenTest} from "@/app/problems/create/types";
import {alpha} from "@mui/material/styles";
import {Logs, Log} from "@/components/Logs";


interface TestCaseProps {
    problemId: number,
    sampleTests: SampleTest[];
    presignedUrl: { url: string, fields: { [key: string]: string } };
    hiddenTest: HiddenTest | null;
}

interface SampleTestError {
    input: string;
    output: string;
}

function LinearProgressWithLabel(props: LinearProgressProps & { value: number }) {
    const [buffer, setBuffer] = React.useState(10);

    React.useEffect(() => {
        const timer = setInterval(() => {
            setBuffer((oldBuffer) => {
                const diff = Math.random() * 10;
                return Math.min(oldBuffer + diff, 100);
            });
        }, 500);

        return () => {
            clearInterval(timer);
        };
    }, []);

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: '100%', mr: 1, position: 'relative' }}>
                <LinearProgress 
                    variant="buffer" 
                    value={props.value} 
                    valueBuffer={buffer}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.12),
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        },
                        '& .MuiLinearProgress-bar2Buffer': {
                            borderRadius: 4,
                            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        }
                    }}
                />
            </Box>
            <Box sx={{ minWidth: 35 }}>
                <Typography
                    variant="body2"
                    sx={{
                        color: 'text.secondary',
                        fontWeight: 500,
                        fontSize: '0.875rem'
                    }}
                >{`${Math.round(props.value)}%`}</Typography>
            </Box>
        </Box>
    );
}


const TestCases = ({problemId, sampleTests: _sampleTests, presignedUrl, hiddenTest: _hiddenTest}: TestCaseProps) => {
    if (_sampleTests.length === 0) {
        _sampleTests = Array(1).fill({input: "", output: ""});
    }
    const dispatch = useAppDispatch();
    const [sampleTests, setSampleTests] = React.useState<SampleTest[]>(_sampleTests);
    const [sampleTestErrors, setSampleTestErrors] = React.useState<SampleTestError[]>(_sampleTests.map(() => {
        return {input: "", output: ""};
    }));


    const handleAddTestCase = () => {
        setSampleTests([...sampleTests, {input: "", output: ""}]);
        setSampleTestErrors([...sampleTestErrors, {input: "", output: ""}]);
    }

    const [deleteSampleTest, {isLoading: isDeleting}] = useDeleteSampleTestMutation();

    const _updateSampleTests = (index: number) => {
        const newTestCases = sampleTests.filter((_, i) => i !== index);
        setSampleTests(newTestCases);
    }

    const [deletingIndex, setDeletingIndex] = React.useState<number | null>(null);
    const handleRemoveTestCase = async (index: number) => {
        // check if the test case is already in the database, ie, has an id
        if (sampleTests[index].id) {
            try {
                setDeletingIndex(index);
                await deleteSampleTest({problemId: problemId, testId: sampleTests[index].id});
                console.log("Deleted successfully");
                _updateSampleTests(index);

                dispatch(setSnackbarMessage("Sample test deleted successfully"));
                dispatch(setIsSnackbarOpen(true));
            } catch (e) {
                console.error(e);
            }
        } else {
            _updateSampleTests(index);
        }
    }

    const handleSampleInput = (index: number, value: string) => {
        const newSampleTests = structuredClone(sampleTests);
        newSampleTests[index].input = value;
        // unset error if input is not empty
        if (sampleTestErrors[index].input.length > 0) {
            setSampleTestErrors([...sampleTestErrors, {...sampleTestErrors[index], input: ""}]);
        }
        setSampleTests(newSampleTests);
    }

    const handleSampleOutput = (index: number, value: string) => {
        const newSampleTests = structuredClone(sampleTests);
        newSampleTests[index].output = value;
        if (sampleTestErrors[index].output.length > 0) {
            setSampleTestErrors([...sampleTestErrors, {...sampleTestErrors[index], output: ""}]);
        }
        setSampleTests(newSampleTests);
    }
    type UploadAlert = {
        message: string | React.ReactNode,
        severity: "success" | "error"
    }
    const [uploadAlert, setUploadAlert] = React.useState<UploadAlert | null>(null);

    // const [isUploading, setIsUploading] = React.useState<boolean>(false);
    enum HiddenTestsStatus {
        NOT_UPLOADED = "NOT_UPLOADED",
        UPLOADING = "UPLOADING",
        UPLOADED = "UPLOADED",
        UPLOAD_FAILED = "UPLOAD_FAILED",
        PROCESSING = "PROCESSING",
        PROCESSED = "PROCESSED",
        PROCESS_FAILED = "PROCESS_FAILED"
    }

    const [hiddenTest, setHiddenTest] = React.useState<HiddenTest | null>(_hiddenTest);

    const [hiddenTestsStatus, setHiddenTestsStatus] = React.useState<HiddenTestsStatus>(_hiddenTest ? HiddenTestsStatus.PROCESSED : HiddenTestsStatus.NOT_UPLOADED);
    const [uploadProgress, setUploadProgress] = React.useState<number>(0);
    const axiosControllerRef = useRef<AbortController | null>(null);


    const handleOnDropAccepted = useCallback(async (acceptedFiles: File[]) => {
        if (axiosControllerRef.current) {
            axiosControllerRef.current.abort();
        }
        axiosControllerRef.current = new AbortController();

        console.log(acceptedFiles);
        const files = acceptedFiles.map((file) => {
            return new File([file], `hidden-tests-${problemId}.zip`, {type: file.type});
        });
        console.log(files);

        // setIsUploading(true);
        setHiddenTestsStatus(HiddenTestsStatus.UPLOADING);
        // upload to s3
        try {
            const formData = new FormData();
            // Append required S3 fields from pre-signed URL response
            Object.entries(presignedUrl.fields).forEach(([key, value]) => {
                formData.append(key, value);
            });
            formData.append("file", files[0]);
            const response = await axios.post(presignedUrl.url, formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                },
                onUploadProgress: (progressEvent) => {
                    const total = progressEvent.total || files[0].size;
                    const progress = Math.round((progressEvent.loaded * 100) / total);
                    console.log(`Upload Progress: ${progress}%`);
                    setUploadProgress(progress);
                },
                signal: axiosControllerRef.current?.signal
            });
            console.log(response);
            setHiddenTestsStatus(HiddenTestsStatus.UPLOADED);
            setUploadProgress(0);
            setUploadAlert({
                message: (
                    <>
                        Hidden test cases uploaded successfully. <br/>
                        Processing will begin shortly.
                    </>
                ),
                severity: "success"
            });
            dispatch(setIsHiddenTestsUploaded(true)); // global state
        } catch (e) {
            console.error(e);
            if (axios.isCancel(e)) {
                console.log("Request cancelled");
                setHiddenTestsStatus(HiddenTestsStatus.NOT_UPLOADED);
                setUploadProgress(0);
                setUploadAlert({message: "Upload cancelled", severity: "error"});
                return;
            }
            setHiddenTestsStatus(HiddenTestsStatus.UPLOAD_FAILED);
            setUploadProgress(0);
            setUploadAlert({message: "Error uploading hidden test cases", severity: "error"});
        }

    }, []);

    const [clientId, setClientId] = React.useState<string>("");
    const [processHiddenTests, {isLoading: isProcessing}] = useProcessHiddenTestsMutation();

    const handleProcessHiddenTests = async (clientId: string) => {
        console.log("Processing hidden test cases");
        try {
            const req: ProcessHiddenTestsRequest = {
                problemId: problemId,
                clientId: clientId
            }
            const res = await processHiddenTests(req).unwrap();
            console.log(res);
            setHiddenTestsStatus(HiddenTestsStatus.PROCESSING);
            setProcessLogs((prev) => [...prev, {status: "INFO", message: "✅ Queued for processing"}]);
        } catch (e) {
            console.error(e);
            setHiddenTestsStatus(HiddenTestsStatus.PROCESS_FAILED);
            dispatch(setIsHiddenTestsUploaded(false));
            setUploadAlert({message: "Error processing hidden test cases", severity: "error"});
        }
    }

    useEffect(() => {
        (async (clientId: string) => {
            if (hiddenTestsStatus === HiddenTestsStatus.UPLOADED && clientId.length > 0) {
                await handleProcessHiddenTests(clientId);
            }
        })(clientId);
    }, [hiddenTestsStatus, clientId]);

    const handleCancelUpload = () => {
        console.log("Cancelling upload");
        if (axiosControllerRef.current) {
            axiosControllerRef.current.abort();
        }
        // setIsUploading(false);
        setHiddenTestsStatus(HiddenTestsStatus.NOT_UPLOADED);
        setUploadProgress(0);
    }

    const [deleteHiddenTests, {isLoading: isDeletingHiddenTests}] = useDeleteHiddenTestsMutation();

    const handleResetUpload = async () => {

        try {
            const req: DeleteHiddenTestsRequest = {
                problemId: problemId
            }
            await deleteHiddenTests(req);
            dispatch(setIsHiddenTestsUploaded(false));
            setUploadAlert(null);
            setHiddenTestsStatus(HiddenTestsStatus.NOT_UPLOADED);
            setHiddenTest(null);
            setProcessLogs([]);
        } catch (e) {
            console.error(e);
        }
    }

    const {getRootProps, getInputProps, isDragActive} = useDropzone({
        onDragEnter: () => {
            setUploadAlert(null);
        },
        onFileDialogOpen: () => {
            setUploadAlert(null);
        },
        onDropRejected: (fileRejections) => {
            let msg = "";
            fileRejections.map((fileRejection) => {
                if (fileRejection.errors[0].code === "file-invalid-type") {
                    msg += `${fileRejection.file.name} - Invalid file type\n`;
                }
                if (fileRejection.errors[0].code === "file-too-large") {
                    msg += `${fileRejection.file.name} - Max file size exceeded\n`;
                }
            })
            setUploadAlert({message: msg, severity: "error"});
        },
        onDropAccepted: handleOnDropAccepted,
        multiple: false,
        accept: {
            "application/zip": [".zip"]
        },
        maxSize: 64 * 1024 * 1024
    })

    const theme = useTheme();

    const getBorderCSS = (isDragActive: boolean) => {
        if (isDragActive) {
            if (theme.palette.mode === "light") {
                return "2px dashed rgba(0,0,0,0.5)";
            }
            return "2px dashed rgba(255,255,255,0.5)";
        } else {
            if (theme.palette.mode === "light") {
                return "2px dashed rgba(0,0,0,0.2)";
            }
            return "2px dashed rgba(255,255,255,0.2)";
        }
    }

    const getHoverBorderCSS = (isDragActive: boolean) => {
        if (isDragActive) {
            if (theme.palette.mode === "light") {
                return "2px dashed rgba(0,0,0,0.5)";
            }
            return "2px dashed rgba(255,255,255,0.5)";
        } else {
            if (theme.palette.mode === "light") {
                return "2px dashed rgba(0,0,0,0.2)";
            }
            return "2px dashed rgba(255,255,255,0.2)";
        }
    }

    const [upsertSampleTests, {isLoading: isUpserting}] = useUpsertSampleTestsMutation();

    const handleSampleTestSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        console.table(sampleTests);
        console.table(sampleTestErrors);
        const newErrors = sampleTests.map((testCase) => {
            return {
                input: testCase.input.length === 0 ? "Input cannot be empty" : "",
                output: testCase.output.length === 0 ? "Output cannot be empty" : ""
            }
        })
        setSampleTestErrors(newErrors);

        if (sampleTests.some((testCase) => testCase.input.length === 0 || testCase.output.length === 0)) {
            return;
        }
        let req: UpsertSampleTestsRequest;
        try {
            req = {
                problemId: problemId,
                sampleTests: sampleTests
            }
            const res = await upsertSampleTests(req).unwrap();
            console.log(res);
            if (res.status === 207) {
                console.log("Upserted successfully");
                setSampleTests(structuredClone(res.data));

                // dispatch(setCodesiriusLoading(true));
                dispatch(setSnackbarMessage("Sample tests added successfully"));
                dispatch(setIsSnackbarOpen(true));
                dispatch(addCompletedStep(3));
                // router.push(`/problems/create/${problemId}/step/5`);
            }
        } catch (err) {
            console.error(err);
            if (isFetchBaseQueryError(err)) {
                const apiError = err.data as APIError;
                if (apiError.status === 400 && apiError.errors) {
                    const newErrors = structuredClone(sampleTestErrors);
                    apiError.errors.forEach((error) => {
                        if (error.index !== undefined && error.field === "input") {
                            newErrors[error.index].input = error.message;
                        }
                        if (error.index !== undefined && error.field === "output") {
                            newErrors[error.index].output = error.message;
                        }
                    });
                    console.log(newErrors);
                    setSampleTestErrors(newErrors);
                }
            }
        }
    }

    const obtainSSEClientID = async () => {
        console.log("Obtaining client ID");
        const response = await fetch(`${process.env.NEXT_PUBLIC_SSE_URL}/register/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include"
        });
        const data = await response.json();
        console.log(data);
        return data.clientId;
    }

    const [isLogsAccordionExpanded, setIsLogsAccordionExpanded] = React.useState<string | false>(false);

    const handleLogsAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
        setIsLogsAccordionExpanded(isExpanded ? panel : false);
    }

    const [processLogs, setProcessLogs] = React.useState<{ status: 'SUCCESS' | 'ERROR' | 'WARN' | 'INFO' | 'FAILURE', message: string }[]>([]);
    const logDetailsRef = useRef<HTMLDivElement>(null);
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const smoothScrollToBottom = useCallback(() => {
        if (!logDetailsRef.current) return;
        
        const { scrollHeight, clientHeight, scrollTop } = logDetailsRef.current;
        const targetScrollTop = scrollHeight - clientHeight;
        
        // If we're already at the bottom, don't scroll
        if (Math.abs(scrollHeight - clientHeight - scrollTop) < 10) return;
        
        // If we're already scrolling, don't start a new scroll
        if (isScrolling) return;
        
        setIsScrolling(true);
        
        const startTime = performance.now();
        const duration = 300; // 300ms for smooth scrolling
        
        const animateScroll = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth acceleration and deceleration
            const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            const easedProgress = easeInOutCubic(progress);
            
            if (logDetailsRef.current) {
                logDetailsRef.current.scrollTop = scrollTop + (targetScrollTop - scrollTop) * easedProgress;
            }
            
            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            } else {
                setIsScrolling(false);
            }
        };
        
        requestAnimationFrame(animateScroll);
    }, [isScrolling]);

    // Clear timeout on unmount
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    const logStatusToColor = (status: string) => {
        switch (status) {
            case "ERROR":
                return "error";
            case "SUCCESS":
                return "success";
            default:
                return "text.primary";
        }
    }

    const handleSSERequest = async (clientId: string) => {
        const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_SSE_URL}/events/${clientId}/`, {
            withCredentials: true
        });
        eventSource.onopen = (e) => {
            console.log(`Connection opened: ${e}`);
        }
        eventSource.onmessage = (e) => {
            const jsonData = JSON.parse(e.data);
            console.log(jsonData);
            if (jsonData.message === "FINISHED_SUCCESS") {
                setHiddenTestsStatus(HiddenTestsStatus.PROCESSED);
                setUploadAlert({message: "Hidden test cases processed successfully", severity: "success"});
                return;
            }
            if (jsonData.message === "FINISHED_ERROR") {
                console.log("Error processing hidden test cases");
                setHiddenTestsStatus(HiddenTestsStatus.PROCESS_FAILED);
                setUploadAlert({message: "Error processing hidden test cases", severity: "error"});
                return;
            }
            setHiddenTestsStatus(HiddenTestsStatus.PROCESSING);
            setProcessLogs((prev) => [...prev, jsonData]);
            
            // Use a small timeout to ensure the DOM has updated
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
            scrollTimeoutRef.current = setTimeout(() => {
                smoothScrollToBottom();
            }, 50);
        }
        eventSource.onerror = (e) => {
            console.error(e);
            // close the connection
            eventSource.close();
        }
    }

    const hasMounted = useRef(false);

    useEffect(() => {
        console.log(process.env.NEXT_PUBLIC_SSE_URL);
        if (hasMounted.current) return;
        hasMounted.current = true;
        (async () => {
            const clientId = await obtainSSEClientID();
            setClientId(clientId);
            await handleSSERequest(clientId);
            dispatch(setCodesiriusLoading(false));
        })()
    }, []);

    const renderLog = (log: Log) => {
        return (
            <Typography
                component="pre"
                variant="body2"
                color={logStatusToColor(log.status)}
                fontWeight={log.status === "ERROR" ? 500 : 400}
                sx={{
                    whiteSpace: "pre-wrap",
                    fontFamily: "monospace",
                    m: 0,
                    flex: 1,
                    transition: 'all 0.2s ease',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                }}
            >
                {log.message}
            </Typography>
        );
    };

    return (
        <Box m={2}>
            <Accordion 
                defaultExpanded 
                elevation={1}
                sx={{
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        boxShadow: (theme) => `0 4px 20px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
                    }
                }}
            >
                <AccordionSummary>
                    <Typography component="span" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Sample test</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={3} mt={1}>
                        {
                            sampleTests.map((testCase, index) => {
                                return (
                                    <React.Fragment key={index}>
                                        <Grid size={5.75}>
                                            <Grow in timeout={300}>
                                                <TextField
                                                    value={sampleTests[index].input}
                                                    onChange={(e) => handleSampleInput(index, e.target.value)}
                                                    fullWidth
                                                    label={`Sample Input ${index + 1}`}
                                                    placeholder="Enter sample input"
                                                    multiline
                                                    rows={4}
                                                    error={sampleTestErrors[index]?.input.length > 0}
                                                    helperText={sampleTestErrors[index]?.input}
                                                    variant="outlined"
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            transition: 'all 0.3s ease',
                                                            '&:hover': {
                                                                '& .MuiOutlinedInput-notchedOutline': {
                                                                    borderColor: 'primary.main',
                                                                }
                                                            }
                                                        }
                                                    }}
                                                />
                                            </Grow>
                                        </Grid>
                                        <Grid size={5.75}>
                                            <Grow in timeout={300}>
                                                <TextField
                                                    value={sampleTests[index].output}
                                                    onChange={(e) => handleSampleOutput(index, e.target.value)}
                                                    fullWidth
                                                    label={`Sample Output ${index + 1}`}
                                                    placeholder="Enter sample output"
                                                    multiline
                                                    rows={4}
                                                    error={sampleTestErrors[index]?.output.length > 0}
                                                    helperText={sampleTestErrors[index]?.output}
                                                    variant="outlined"
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            transition: 'all 0.3s ease',
                                                            '&:hover': {
                                                                '& .MuiOutlinedInput-notchedOutline': {
                                                                    borderColor: 'primary.main',
                                                                }
                                                            }
                                                        }
                                                    }}
                                                />
                                            </Grow>
                                        </Grid>
                                        <Grid
                                            size={0.5}
                                            display="flex"
                                            justifyContent="center"
                                            alignItems="center"
                                        >
                                            <IconButton 
                                                size="small" 
                                                color="error"
                                                disabled={(isDeleting && index === deletingIndex) || sampleTests.length === 1}
                                                onClick={() => handleRemoveTestCase(index)}
                                                sx={{
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        transform: 'scale(1.1)',
                                                        backgroundColor: 'error.light',
                                                        color: 'white'
                                                    }
                                                }}
                                            >
                                                {
                                                    isDeleting && index === deletingIndex ?
                                                        <CircularProgress size={20}/> :
                                                        <Delete fontSize="small"/>
                                                }
                                            </IconButton>
                                        </Grid>
                                    </React.Fragment>
                                );
                            })
                        }
                        <Grid size={6} display="flex" justifyContent="flex-start">
                            <Button
                                disabled={sampleTests.length >= 5}
                                size="small"
                                variant="outlined"
                                color="secondary"
                                onClick={handleAddTestCase}
                                startIcon={<AddIcon/>}
                                sx={{
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: 2
                                    }
                                }}
                            >
                                Add Test Case ({5 - sampleTests.length})
                            </Button>
                            <Snackbar
                                sx={{pr: 3}}
                                open={sampleTests.length >= 5}
                                autoHideDuration={6000}
                                onClose={() => {}}
                                anchorOrigin={{vertical: "bottom", horizontal: "right"}}
                                message="Maximum sample test cases reached"
                            />
                        </Grid>
                        <Grid size={6} display="flex" justifyContent="flex-end" pr={3}>
                            <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                onClick={handleSampleTestSubmit}
                                disabled={isUpserting}
                                startIcon={isUpserting ? <CircularProgress size={20}/> : <Check/>}
                                sx={{
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: 3
                                    }
                                }}
                            >
                                Save
                            </Button>
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
            <Accordion 
                defaultExpanded 
                elevation={1}
                sx={{
                    mt: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        boxShadow: (theme) => `0 4px 20px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
                    }
                }}
            >
                <AccordionSummary>
                    <Typography component="span" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Hidden test</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={3}>
                        {
                            hiddenTestsStatus !== HiddenTestsStatus.PROCESSED &&
                            <>
                                <Grid size={6}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                        Instructions:
                                    </Typography>
                                    <Box sx={{ 
                                        pl: 2,
                                        '& li': {
                                            mb: 1,
                                            '& code': {
                                                backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                                padding: '2px 6px',
                                                borderRadius: 1,
                                                fontFamily: 'monospace'
                                            }
                                        }
                                    }}>
                                        <ol>
                                            <li>
                                                <Typography variant="body2">
                                                    The zip file should contain two folders
                                                    named <code>input</code> and <code>output</code>.
                                                </Typography>
                                            </li>
                                            <li>
                                                <Typography variant="body2">
                                                    The <code>input</code> folder should contain the input
                                                    files <code>input1.txt</code>, <code>input2.txt</code> etc.
                                                </Typography>
                                            </li>
                                            <li>
                                                <Typography variant="body2">
                                                    The <code>output</code> folder should contain the output
                                                    files <code>output1.txt</code>, <code>output2.txt</code> etc.
                                                </Typography>
                                            </li>
                                        </ol>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                        Check the format to the right
                                    </Typography>
                                </Grid>
                                <Grid size={6}>
                                    <SimpleTreeView 
                                        defaultExpandedItems={["root", "input", "output"]} 
                                        sx={{
                                            border: `1px solid ${theme.palette.divider}`,
                                            borderRadius: 4,
                                            p: 2,
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                borderColor: 'primary.main',
                                                boxShadow: 1
                                            }
                                        }} 
                                        disableSelection 
                                        disabledItemsFocusable
                                    >
                                        <TreeItem itemId="root" label="your-zip-file.zip">
                                            <TreeItem itemId="input" label="input">
                                                <TreeItem itemId="input1" label="input1.txt"/>
                                                <TreeItem itemId="input2" label="input2.txt"/>
                                                <TreeItem itemId="rest-inputs" label="..." disabled/>
                                            </TreeItem>
                                            <TreeItem itemId="output" label="output">
                                                <TreeItem itemId="output1" label="output1.txt"/>
                                                <TreeItem itemId="output2" label="output2.txt"/>
                                                <TreeItem itemId="rest-outputs" label="..." disabled/>
                                            </TreeItem>
                                        </TreeItem>
                                        <Typography align="right" variant="subtitle2" fontWeight={500} color="text.secondary">
                                            Sample directory structure
                                        </Typography>
                                    </SimpleTreeView>
                                </Grid>
                            </>
                        }
                        <Grid size={12}>
                            {
                                (hiddenTestsStatus === HiddenTestsStatus.NOT_UPLOADED ||
                                    hiddenTestsStatus === HiddenTestsStatus.PROCESS_FAILED ||
                                    hiddenTestsStatus === HiddenTestsStatus.UPLOAD_FAILED) &&
                                <>
                                    <Box
                                        {...getRootProps()}
                                        sx={{
                                            border: getBorderCSS(isDragActive),
                                            borderRadius: 4,
                                            p: 4,
                                            mt: 2,
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            background: (theme) => isDragActive 
                                                ? theme.palette.mode === 'dark' 
                                                    ? alpha(theme.palette.primary.main, 0.1)
                                                    : alpha(theme.palette.primary.main, 0.05)
                                                : 'transparent',
                                            ":hover": {
                                                borderColor: getHoverBorderCSS(isDragActive),
                                                cursor: "pointer",
                                                backgroundColor: (theme) => theme.palette.mode === 'dark' 
                                                    ? alpha(theme.palette.background.paper, 0.8)
                                                    : alpha(theme.palette.background.paper, 0.9),
                                                transform: 'translateY(-2px)',
                                                boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.common.black, 0.12)}`,
                                            },
                                            '&::before': {
                                                content: '""',
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                background: (theme) => `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.1)})`,
                                                opacity: isDragActive ? 1 : 0,
                                                transition: 'opacity 0.3s ease',
                                            }
                                        }}
                                    >
                                        <Stack 
                                            direction="column" 
                                            spacing={2} 
                                            alignItems="center"
                                            sx={{
                                                position: 'relative',
                                                zIndex: 1
                                            }}
                                        >
                                            <input {...getInputProps()} />
                                            <Box
                                                sx={{
                                                    width: 80,
                                                    height: 80,
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    backgroundColor: (theme) => isDragActive 
                                                        ? alpha(theme.palette.primary.main, 0.1)
                                                        : alpha(theme.palette.primary.main, 0.05),
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    transform: isDragActive ? 'scale(1.1)' : 'scale(1)',
                                                }}
                                            >
                                                <CloudUploadIcon 
                                                    color={isDragActive ? "primary" : "action"} 
                                                    sx={{
                                                        fontSize: 40,
                                                        transition: 'all 0.3s ease',
                                                    }}
                                                />
                                            </Box>
                                            <Typography 
                                                variant="h6" 
                                                color={isDragActive ? "primary" : "text.primary"}
                                                sx={{
                                                    fontWeight: 600,
                                                    textAlign: 'center',
                                                    transition: 'all 0.3s ease',
                                                }}
                                            >
                                                {isDragActive ?
                                                    "Drop your zip file here" :
                                                    "Drag & drop your zip file here"
                                                }
                                            </Typography>
                                            <Typography 
                                                variant="body2" 
                                                color="text.secondary"
                                                sx={{
                                                    textAlign: 'center',
                                                    maxWidth: '80%',
                                                }}
                                            >
                                                or click to browse files
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    mt: 1,
                                                    backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.8),
                                                    padding: '4px 12px',
                                                    borderRadius: 2,
                                                    border: (theme) => `1px solid ${theme.palette.divider}`,
                                                }}
                                            >
                                                <span>Max file size:</span>
                                                <strong>16MB</strong>
                                            </Typography>
                                        </Stack>
                                    </Box>
                                </>
                            }
                            {
                                uploadAlert && hiddenTestsStatus !== HiddenTestsStatus.PROCESSING &&
                                <Alert 
                                    severity={uploadAlert.severity} 
                                    variant="outlined" 
                                    sx={{
                                        mt: 2,
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: 1
                                        }
                                    }}
                                >
                                    {uploadAlert.message}
                                </Alert>
                            }
                            {
                                hiddenTest && hiddenTestsStatus === HiddenTestsStatus.PROCESSED &&
                                <Alert 
                                    severity="success" 
                                    variant="outlined" 
                                    sx={{
                                        mt: 2,
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: 1
                                        }
                                    }}
                                >
                                    A hidden test case bundle has already been uploaded. <br/>
                                    Number of test cases: {hiddenTest?.test_count}
                                </Alert>
                            }
                            {
                                hiddenTestsStatus === HiddenTestsStatus.PROCESSED &&
                                <FormControl fullWidth>
                                    <Button
                                        color="error"
                                        size="small"
                                        startIcon={isDeletingHiddenTests ? <CircularProgress size={20} color="error"/> : <Replay/>}
                                        onClick={handleResetUpload}
                                        sx={{
                                            mt: 1,
                                            letterSpacing: 2,
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: 2
                                            }
                                        }}
                                    >
                                        RESET
                                    </Button>
                                </FormControl>
                            }
                        </Grid>
                        <Grid size={12}>
                            <Box
                                sx={{
                                    display: hiddenTestsStatus === HiddenTestsStatus.UPLOADING ? "block" : "none",
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <LinearProgressWithLabel value={uploadProgress}/>
                                <Typography variant="body2" letterSpacing={1} textAlign="center" p={1}>
                                    Uploading hidden test cases
                                </Typography>
                                <Box display="flex" justifyContent="center">
                                    <Button 
                                        color="error"
                                        size="small"
                                        onClick={handleCancelUpload}
                                        startIcon={<Block/>}
                                        variant="outlined"
                                        sx={{
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: 1
                                            }
                                        }}
                                    >
                                        Cancel Upload
                                    </Button>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid size={12}>
                            {processLogs.length > 0 && (
                                <Logs 
                                    logs={processLogs}
                                    isLoading={hiddenTestsStatus === HiddenTestsStatus.PROCESSING}
                                    title="Processing Logs"
                                    defaultExpanded={true}
                                    renderLog={renderLog}
                                />
                            )}
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
};

export default TestCases;