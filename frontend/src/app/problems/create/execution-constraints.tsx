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
    TextField,
    Paper,
    Card,
    CardContent,
    Stack,
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
import {Timer, Memory, Code, Speed} from "@mui/icons-material";
import {isFetchBaseQueryError} from "@/lib/utils/isFetchBaseQueryError";
import { useNotification } from '@/contexts/NotificationContext';

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
    const dispatch = useAppDispatch();
    const { showNotification } = useNotification();

    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        let hasError = false;
        executionConstraints.forEach((constraint) => {
            if (constraint.timeLimit <= 0) {
                setExecutionConstraintsError((prev) => {
                    const newErrors = [...prev];
                    newErrors[selectedLanguages.findIndex((l) => l.id === constraint.languageId)] = {
                        timeLimit: "Time limit must be greater than 0",
                        memoryLimit: newErrors[selectedLanguages.findIndex((l) => l.id === constraint.languageId)].memoryLimit,
                    }
                    return newErrors;
                });
                showNotification("Time limit must be greater than 0", "error", "Time Limit Error");
                hasError = true;
            }
            if (constraint.memoryLimit <= 0) {
                setExecutionConstraintsError((prev) => {
                    const newErrors = [...prev];
                    newErrors[selectedLanguages.findIndex((l) => l.id === constraint.languageId)] = {
                        timeLimit: newErrors[selectedLanguages.findIndex((l) => l.id === constraint.languageId)].timeLimit,
                        memoryLimit: "Memory limit must be greater than 0",
                    }
                    return newErrors;
                });
                showNotification("Memory limit must be greater than 0", "error", "Memory Limit Error");
                hasError = true;
            }
        });

        if (hasError) {
            return;
        }

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
                showNotification("Execution constraints updated successfully", "success");
                dispatch(addCompletedStep(2));
                router.push(`/problems/create/${problemId}/step/4`);
            }
        } catch (err) {
            console.error(err);
            if (isFetchBaseQueryError(err)) {
                const apiError = err.data as APIError;
                if (apiError.status === 400 && apiError.errors) {
                    apiError.errors.forEach((error) => {
                        showNotification(error.message, "error", "Execution Constraints Error");
                    });
                }
            }
        }
    }

    useEffect(() => {
        console.log("ExecutionConstraint mounted");
        dispatch(setCodesiriusLoading(false));
        console.log(_executionConstraints);
        console.log(initialExecutionConstraints)
        console.log(selectedLanguages);
    }, [initialExecutionConstraints]);

    return (
        <Card elevation={0} sx={{ 
            borderRadius: 2,
            background: 'transparent',
            '& .MuiTableCell-root': {
                borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            }
        }}>
            <CardContent>
                <Stack spacing={3}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Code sx={{ color: 'primary.main' }} />
                        <Typography variant="h5" fontWeight="600" gutterBottom>
                            Execution Constraints
                        </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Set time and memory limits for each programming language
                    </Typography>
                    
                    <TableContainer component={Paper} elevation={0} sx={{ 
                        borderRadius: 2,
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                    }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Code fontSize="small" />
                                            <span>Language</span>
                                        </Stack>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Timer fontSize="small" />
                                            <span>Time Limit/Test</span>
                                        </Stack>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Memory fontSize="small" />
                                            <span>Memory Limit/Test</span>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {executionConstraints.map((constraint, index) => (
                                    <TableRow
                                        key={`${selectedLanguagesMap.get(constraint.languageId)?.id}`}
                                        sx={{ '&:hover': { background: 'rgba(255, 255, 255, 0.05)' } }}
                                    >
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500}>
                                                {selectedLanguagesMap.get(constraint.languageId)?.name}
                                                {" "}
                                                <Typography component="span" color="text.secondary">
                                                    {selectedLanguagesMap.get(constraint.languageId)?.version}
                                                </Typography>
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
                                                size="small"
                                                InputProps={{
                                                    startAdornment: <Timer fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                                                }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 1.5,
                                                    }
                                                }}
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
                                                size="small"
                                                InputProps={{
                                                    startAdornment: <Memory fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                                                }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 1.5,
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box display="flex" justifyContent="flex-end" pt={2}>
                        <Button
                            onClick={handleSubmit}
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={isUpdating}
                            endIcon={isUpdating ? <CircularProgress size={20}/> : <Speed />}
                            sx={{
                                borderRadius: 2,
                                px: 4,
                                py: 1,
                                textTransform: 'none',
                                fontWeight: 600,
                            }}
                        >
                            Next
                        </Button>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default ExecutionConstraints;
