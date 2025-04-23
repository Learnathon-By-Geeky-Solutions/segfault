"use client"
import React, {useCallback, useEffect, useRef} from 'react';
import Grid from "@mui/material/Grid2";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    CircularProgress, FormControl,
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
import {Block, Check, Clear, Replay} from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import {APIError, SampleTest, UpsertSampleTestsRequest} from "@/lib/features/api/types";
import {useDeleteSampleTestMutation, useUpsertSampleTestsMutation} from "@/lib/features/api/problemsApiSlice";
import {
    addCompletedStep,
    setIsHiddenTestsUpload,
    setIsSnackbarOpen,
    setSnackbarMessage
} from "@/lib/features/codesirius/addProblemSlice";
import {isFetchBaseQueryError} from "@/lib/utils/isFetchBaseQueryError";
import axios from "axios";


interface TestCaseProps {
    problemId: number,
    sampleTests: SampleTest[];
    presignedUrl: { url: string, fields: { [key: string]: string } };
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

const TestCases = ({problemId, sampleTests: _sampleTests, presignedUrl}: TestCaseProps) => {
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
        message: string,
        severity: "success" | "error"
    }
    const [uploadAlert, setUploadAlert] = React.useState<UploadAlert | null>(null);
    const [isUploading, setIsUploading] = React.useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = React.useState<number>(0);
    const axiosControllerRef = useRef<AbortController | null>(null);

    const isHiddenTestsUploaded = useAppSelector((state) => state.addProblem.isHiddenTestsUpload);

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

        setIsUploading(true);
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
            setIsUploading(false);
            setUploadProgress(0);
            setUploadAlert({message: "Hidden test cases uploaded successfully", severity: "success"});
            dispatch(setIsHiddenTestsUpload(true));
        } catch (e) {
            console.error(e);
            setIsUploading(false);
            setUploadProgress(0);
            setUploadAlert({message: "Error uploading hidden test cases", severity: "error"});
        }

    }, [])

    const handleCancelUpload = () => {
        console.log("Cancelling upload");
        if (axiosControllerRef.current) {
            axiosControllerRef.current.abort();
        }
        setIsUploading(false);
        setUploadProgress(0);
    }

    const handleResetUpload = () => {
        dispatch(setIsHiddenTestsUpload(false));
        setUploadAlert(null);
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

    useEffect(() => {
        dispatch(setCodesiriusLoading(false));
    }, []);

    return (
        <Box m={2}>
            <Accordion expanded>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon/>}
                    aria-controls="panel1-content"
                    id="panel1-header"
                    sx={{backgroundColor: theme.palette.divider}}
                >
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
                                                        disabled={isDeleting && index === deletingIndex}
                                                        onClick={() => handleRemoveTestCase(index)}>
                                                {
                                                    isDeleting && index === deletingIndex ?
                                                        <CircularProgress size={20}/> :
                                                        <Clear/>
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
            <Accordion expanded>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon/>}
                    aria-controls="panel1-content"
                    id="panel1-header"
                    sx={{backgroundColor: theme.palette.divider}}
                >
                    <Typography component="span">Hidden test</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}
                          sx={{p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 4}}>
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
                                p: 2
                            }} disableSelection disabledItemsFocusable>
                                <TreeItem itemId="root" label="your-zip-file.zip">
                                    <TreeItem itemId="input" label="input">
                                        <TreeItem itemId="input1" label="input1.txt"/>
                                        <TreeItem itemId="input2" label="input2.txt"/>
                                    </TreeItem>
                                    <TreeItem itemId="output" label="output">
                                        <TreeItem itemId="output1" label="output1.txt"/>
                                        <TreeItem itemId="output2" label="output2.txt"/>
                                    </TreeItem>
                                </TreeItem>
                                <Typography align="right" variant="subtitle2" fontWeight={500} color="text.secondary">
                                    Sample file structure
                                </Typography>
                            </SimpleTreeView>
                        </Grid>
                        <Grid size={12}>
                            {
                                !isUploading && !isHiddenTestsUploaded &&
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
                                uploadAlert &&
                              <Alert severity={uploadAlert.severity} variant="outlined" sx={{mt: 2}}>
                                  {uploadAlert.message}
                              </Alert>
                            }

                            {
                                isHiddenTestsUploaded &&
                              <FormControl
                                fullWidth>
                                <Button
                                  color="error"
                                  size="small"
                                  startIcon={<Replay/>}
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
                                sx={{display: isUploading ? "block" : "none"}}>
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