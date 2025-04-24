"use client"
import React, {useCallback, useEffect, useRef} from 'react';
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
    useTheme
} from "@mui/material";
import Button from "@mui/material/Button";
import {useAppDispatch, useAppSelector} from "@/lib/hooks/hooks";
import {setCodesiriusLoading} from "@/lib/features/codesirius/codesiriusSlice";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {useDropzone} from "react-dropzone";
import {Stack} from "@mui/system";
import {SimpleTreeView, TreeItem} from "@mui/x-tree-view";
import AddIcon from "@mui/icons-material/Add";
import {Block, Check, Clear, Delete, Replay} from "@mui/icons-material";
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
import BufferingDots from "@/components/BufferingDots";
import {HiddenTest} from "@/app/problems/create/types";


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
    return (
        <Box sx={{display: 'flex', alignItems: 'center'}}>
            <Box sx={{width: '100%', mr: 1}}>
                <LinearProgress variant="determinate" {...props} />
            </Box>
            <Box sx={{minWidth: 35}}>
                <Typography
                    variant="body2"
                    sx={{color: 'text.secondary'}}
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
        maxSize: 16 * 1024 * 1024
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

    const [processLogs, setProcessLogs] = React.useState<{ status: string, message: string }[]>([]);
    const logDetailsRef = useRef<HTMLDivElement>(null); // Ref to the LogAccordionDetails for auto-scrolling
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
        const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_SSE_URL}/events/${clientId}/hidden-tests/`, {
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
            logDetailsRef.current?.scrollTo(0, logDetailsRef.current.scrollHeight);
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


    return (
        <Box m={2}>
            <Accordion defaultExpanded elevation={1}>
                <AccordionSummary>
                    <Typography component="span">Sample test</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2} mt={1}>
                        {
                            sampleTests.map((testCase, index) => {
                                return (
                                    <React.Fragment key={index}>
                                        <Grid size={5.75}>
                                            <Grow in>
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
                                                />
                                            </Grow>
                                        </Grid>
                                        <Grid size={5.75}>
                                            <Grow in>
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
                                                />
                                            </Grow>
                                        </Grid>
                                        <Grid
                                            size={0.5}
                                            display="flex"
                                            justifyContent="center"
                                            alignItems="center"
                                        >
                                            <IconButton size="small" color="error"
                                                        disabled={(isDeleting && index === deletingIndex) || sampleTests.length === 1}
                                                        onClick={() => handleRemoveTestCase(index)}>
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
                                startIcon={<AddIcon/>}>
                                Add Test Case ({5 - sampleTests.length})
                            </Button>
                            <Snackbar
                                sx={{pr: 3}}
                                open={sampleTests.length >= 5}
                                autoHideDuration={6000}
                                onClose={() => {
                                }}
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
                            >
                                Save
                            </Button>
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
            <Accordion defaultExpanded elevation={1}>
                <AccordionSummary>
                    <Typography component="span">Hidden test</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        {
                            hiddenTestsStatus !== HiddenTestsStatus.PROCESSED &&
                          <>
                            <Grid size={6}>
                              <Typography variant="subtitle1">
                                Instructions:
                              </Typography>
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
                              <Typography variant="body2">
                                Check the format to the right
                              </Typography>
                            </Grid>
                            <Grid size={6}>
                              <SimpleTreeView defaultExpandedItems={["root", "input", "output"]} sx={{
                                  border: `1px solid ${theme.palette.divider}`,
                                  borderRadius: 4,
                                  p: 2,
                              }} disableSelection disabledItemsFocusable>
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
                                        p: 1,
                                        mt: 2,
                                        ":hover": {
                                            borderColor: getHoverBorderCSS(isDragActive),
                                            cursor: "pointer",
                                            backgroundColor: "rgba(0,0,0,0.1)"
                                        }
                                    }}
                                >
                                  <Stack direction="column" spacing={2} alignItems="center">
                                    <input {...getInputProps()} />
                                    <CloudUploadIcon color={isDragActive ? "primary" : "action"} fontSize="large"/>
                                    <Typography>
                                        {isDragActive ?
                                            "Drop the files here" :
                                            "Drag & drop the zip file here or click to upload"
                                        }
                                    </Typography>
                                  </Stack>
                                  <Typography
                                    variant="subtitle2"
                                    fontSize="small"
                                    color="textSecondary"
                                    textAlign="right" mr={4}>
                                    Max file size: 16MB
                                  </Typography>
                                </Box>
                              </>
                            }
                            {
                                uploadAlert && hiddenTestsStatus !== HiddenTestsStatus.PROCESSING &&
                              <Alert severity={uploadAlert.severity} variant="outlined" sx={{mt: 2}}>
                                  {uploadAlert.message}
                              </Alert>
                            }
                            {
                                hiddenTest && hiddenTestsStatus === HiddenTestsStatus.PROCESSED &&
                              <Alert severity="success" variant="outlined" sx={{mt: 2}}>
                                A hidden test case bundle has already been uploaded. <br/>
                                Number of test cases: {hiddenTest?.test_count}
                              </Alert>
                            }
                            {
                                hiddenTestsStatus === HiddenTestsStatus.PROCESSED &&
                              <FormControl
                                fullWidth>
                                <Button
                                  color="error"
                                  size="small"
                                  startIcon={isDeletingHiddenTests ? <CircularProgress size={20} color="error"/> :
                                      <Replay/>}
                                  onClick={handleResetUpload}
                                  sx={{
                                      mt: 1,
                                      letterSpacing: 2
                                  }}>
                                  RESET
                                </Button>
                              </FormControl>
                            }
                        </Grid>
                        <Grid size={12}>
                            <Box
                                sx={{display: hiddenTestsStatus === HiddenTestsStatus.UPLOADING ? "block" : "none"}}>
                                <LinearProgressWithLabel value={uploadProgress}/>
                                <Typography variant="body2" letterSpacing={1} textAlign="center" p={1}>
                                    Uploading hidden test cases
                                </Typography>
                                <Box display="flex" justifyContent="center">
                                    <Button color="error"
                                            size="small"
                                            onClick={handleCancelUpload}
                                            startIcon={<Block/>}
                                            variant="outlined">
                                        Cancel Upload
                                    </Button>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid size={12}>
                            <LiveLogsContainer sx={{display: processLogs.length > 0 ? "block" : "none"}}>
                                <LogAccordion onChange={handleLogsAccordionChange("panel1")}
                                              expanded={isLogsAccordionExpanded === "panel1"}>
                                    <LogAccordionSummary>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            {
                                                isLogsAccordionExpanded ? (hiddenTestsStatus === HiddenTestsStatus.PROCESSING ? "Processing..." : "Logs") : processLogs?.[processLogs.length - 1]?.message
                                            }
                                            {
                                                hiddenTestsStatus === HiddenTestsStatus.PROCESSING && !isLogsAccordionExpanded &&
                                              <CircularProgress size={20} sx={{ml: 2}} thickness={4}/>
                                            }
                                        </Box>
                                    </LogAccordionSummary>
                                    <LogAccordionDetails
                                        ref={logDetailsRef}
                                        sx={{minHeight: 300, maxHeight: 300, overflowY: "auto"}}>
                                        {
                                            processLogs.map((log, index) => {
                                                return (
                                                    <Typography
                                                        key={index}
                                                        component="pre"
                                                        variant="body2"
                                                        color={logStatusToColor(log.status)}
                                                        fontWeight={log.status === "ERROR" ? 500 : 400}
                                                        sx={{
                                                            whiteSpace: "pre-wrap",
                                                            fontFamily: "monospace"
                                                        }}>
                                                        {log.message}
                                                    </Typography>
                                                );
                                            })
                                        }
                                        <div style={{display: 'flex', justifyContent: 'center', padding: '10px'}}>
                                            {
                                                hiddenTestsStatus === HiddenTestsStatus.PROCESSING &&
                                              <BufferingDots size="small"/>
                                            }
                                        </div>
                                    </LogAccordionDetails>
                                </LogAccordion>
                            </LiveLogsContainer>
                        </Grid>
                        {/*<Grid size={6}></Grid>*/}
                        {/*<Grid size={12}>*/}
                        {/*    <Stack direction="row" spacing={2} justifyContent="flex-end">*/}
                        {/*        <Button variant="contained" size="small">*/}
                        {/*            Next*/}
                        {/*        </Button>*/}
                        {/*    </Stack>*/}
                        {/*</Grid>*/}
                    </Grid>
                    <Snackbar
                        sx={{pb: 10, pl: 3}}
                        open={false}
                        autoHideDuration={6000}
                        onClose={() => {
                        }}
                    >
                        <Alert severity="error" variant="filled">
                            <Typography variant="body2">
                                Only zip files are allowed
                            </Typography>
                        </Alert>
                    </Snackbar>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
};

export default TestCases;