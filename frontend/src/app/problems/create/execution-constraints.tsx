"use client"
import React, {ChangeEvent, useEffect} from 'react';
import {
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField
} from "@mui/material";
import Typography from "@mui/material/Typography";
import {useAppDispatch} from "@/lib/hooks/hooks";
import {Language} from "@/app/problems/create/types";
import {setCodesiriusLoading} from "@/lib/features/codesirius/codesiriusSlice";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import {useUpsertExecutionConstraintsMutation} from "@/lib/features/api/problemsApiSlice";
import {APIError, ExecutionConstraint, FieldError, UpsertExecutionConstraintRequest} from "@/lib/features/api/types";
import {addCompletedStep, setIsSnackbarOpen, setSnackbarMessage} from "@/lib/features/codesirius/addProblemSlice";
import {useRouter} from "next/navigation";
import {NavigateNext} from "@mui/icons-material";
import {isFetchBaseQueryError} from "@/lib/utils/isFetchBaseQueryError";

interface ExecutionConstraintsProps {
    problemId: number;
    selectedLanguages: Language[];
    executionConstraints: ExecutionConstraint[];
}

interface ExecutionConstraintError {
    timeLimit: string;
    memoryLimit: string;
}

const ExecutionConstraints = ({
                                  problemId,
                                  selectedLanguages,
                                  executionConstraints: _executionConstraints,
                              }: ExecutionConstraintsProps) => {

    const selectedLanguagesMap = new Map<number, Language>(selectedLanguages.map((language) => [language.id, language]));
    const executionConstraintsMap = new Map<number, ExecutionConstraint>(_executionConstraints.map((executionConstraint) => [executionConstraint.languageId, executionConstraint]));
    const initialExecutionConstraints = selectedLanguages.map((language) => executionConstraintsMap.get(language.id) ?? {
        languageId: language.id,
        timeLimit: "",
        memoryLimit: "",
    } as ExecutionConstraint);
    const [executionConstraints, setExecutionConstraints] = React.useState<ExecutionConstraint[]>(initialExecutionConstraints);
    const [executionConstraintsError, setExecutionConstraintsError] = React.useState<ExecutionConstraintError[]>(selectedLanguages.map(() => ({
        timeLimit: "",
        memoryLimit: "",
    })));

    const handleTimeLimitChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => {
        const newExecutionConstraints = structuredClone(executionConstraints);
        newExecutionConstraints[index].timeLimit = e.target.value;
        if (executionConstraintsError[index].timeLimit.length > 0) {
            setExecutionConstraintsError((prev) => {
                const newErrors = [...prev];
                newErrors[index] = {
                    timeLimit: "",
                    memoryLimit: newErrors[index].memoryLimit,
                }
                return newErrors;
            });
        }
        setExecutionConstraints(newExecutionConstraints);
    }

    const handleMemoryLimitChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => {
        const newExecutionConstraints = [...executionConstraints];
        newExecutionConstraints[index].memoryLimit = e.target.value;
        if (executionConstraintsError[index].memoryLimit.length > 0) {
            setExecutionConstraintsError((prev) => {
                const newErrors = [...prev];
                newErrors[index] = {
                    timeLimit: newErrors[index].timeLimit,
                    memoryLimit: "",
                }
                return newErrors;
            });
        }
        setExecutionConstraints(newExecutionConstraints);
    }

    const [upsertExecutionConstraints, {isLoading: isUpdating}] = useUpsertExecutionConstraintsMutation();

    const router = useRouter();

    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        // validate
        executionConstraints
            .map((constraint, index) => {
                if (constraint.timeLimit === "" || constraint.memoryLimit === "") {
                    setExecutionConstraintsError((prev) => {
                        const newErrors = [...prev];
                        newErrors[index] = {
                            timeLimit: constraint.timeLimit === "" ? "Time limit can't be empty" : "",
                            memoryLimit: constraint.memoryLimit === "" ? "Memory limit can't be empty" : "",
                        }
                        return newErrors;
                    });
                }
            });
        if (executionConstraints.some((constraint) => constraint.timeLimit === "" || constraint.memoryLimit === "")) {
            return;
        }

        console.log("submitting");
        let req: UpsertExecutionConstraintRequest;
        try {
            req = {
                problemId: problemId,
                executionConstraints: executionConstraints
            }
            console.log(req);
            const res = await upsertExecutionConstraints(req).unwrap();
            if (res.status === 207) {
                console.log("Problem updated successfully");

                console.log(res.data);
                console.log("Previous execution constraints:");
                executionConstraints.map((constraint) => console.log(constraint));
                // update executionConstraints
                setExecutionConstraints(structuredClone(res.data));
                console.log("Updated execution constraints:");
                executionConstraints.map((constraint) => console.log(constraint));

                dispatch(setCodesiriusLoading(true));
                dispatch(setSnackbarMessage("Execution constraints updated successfully"));
                dispatch(setIsSnackbarOpen(true));
                dispatch(addCompletedStep(2));
                router.push(`/problems/create/${problemId}/step/4`);
            }
        } catch (err) {
            if (isFetchBaseQueryError(err)) {
                const apiError = err.data as APIError;
                if (apiError.status === 400 && apiError.errors) {
                    apiError.errors.forEach((error: FieldError, index) => {
                      if (error.field === "executionConstraints") {
                          if (error?.message?.memoryLimit) {
                                setExecutionConstraintsError((prev) => {
                                    const newErrors = [...prev];
                                    newErrors[index] = {
                                        timeLimit: "",
                                        memoryLimit: error.message.memoryLimit,
                                    }
                                    return newErrors;
                                });
                          }
                          if (error?.message?.timeLimit) {
                                setExecutionConstraintsError((prev) => {
                                    const newErrors = [...prev];
                                    newErrors[index] = {
                                        timeLimit: error.message.timeLimit,
                                        memoryLimit: "",
                                    }
                                    return newErrors;
                                });
                          }
                      }
                    })
                }
            }
        }
    }


    const dispatch = useAppDispatch();
    useEffect(() => {
        console.log("ExecutionConstraint mounted");
        dispatch(setCodesiriusLoading(false));
        console.log(_executionConstraints);
        console.log(initialExecutionConstraints)
        console.log(selectedLanguages);
    }, [initialExecutionConstraints]);

    return (
        <Box component="form" p={2}>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Language</TableCell>
                            <TableCell>Time Limit/Test</TableCell>
                            <TableCell>Memory Limit/Test</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {executionConstraints.map((constraint, index) => (
                            <TableRow
                                key={`${selectedLanguagesMap.get(constraint.languageId)?.id}`}>
                                <TableCell>
                                    <Typography variant="body2">
                                        {selectedLanguagesMap.get(constraint.languageId)?.name}
                                        {" "}
                                        {selectedLanguagesMap.get(constraint.languageId)?.version}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        value={constraint.timeLimit}
                                        onChange={(e) => handleTimeLimitChange(e, index)}
                                        type="number"
                                        fullWidth
                                        id="time-limit"
                                        label="Time Limit"
                                        variant="outlined"
                                        placeholder="Time Limit"
                                        error={executionConstraintsError[index].timeLimit.length > 0}
                                        helperText={executionConstraintsError[index].timeLimit || " "}
                                    />
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        value={constraint.memoryLimit}
                                        onChange={(e) => handleMemoryLimitChange(e, index)}
                                        type="number"
                                        fullWidth
                                        id="memory-limit"
                                        label="Memory Limit"
                                        variant="outlined"
                                        placeholder="Memory Limit"
                                        error={executionConstraintsError[index].memoryLimit.length > 0}
                                        helperText={executionConstraintsError[index].memoryLimit || " "}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box display="flex" justifyContent="flex-end" p={2}>
                <Button
                    onClick={handleSubmit}
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isUpdating}
                    endIcon={isUpdating ? <CircularProgress size={20}/> : <NavigateNext/>}
                >
                    Next
                </Button>
            </Box>
        </Box>
    );
};

export default ExecutionConstraints;
