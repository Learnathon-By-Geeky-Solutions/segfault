"use client"
import React, {useEffect} from 'react';
import Grid from "@mui/material/Grid2";
import {CircularProgress, FormControl, TextField} from "@mui/material";
import {ArrowForward} from "@mui/icons-material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import {useAppDispatch} from "@/lib/hooks/hooks";
import {
    addCompletedStep,
    setDescription as setProblemDescription,
    setIsSnackbarOpen,
    setSnackbarMessage
} from "@/lib/features/codesirius/addProblemSlice";
import {useUpdateProblemMutation} from "@/lib/features/api/problemsApiSlice";
import {setCodesiriusLoading} from "@/lib/features/codesirius/codesiriusSlice";
import {APIError, CreateUpdateRequest, CreateUpdateResponse} from "@/lib/features/api/types";
import {isFetchBaseQueryError} from "@/lib/utils/isFetchBaseQueryError";
import {useRouter} from "next/navigation";

interface StatementAndConstraintsProps {
    problemId: number,
    statement: string;
}

const StatementAndConstraints = ({problemId, statement: _statement}: StatementAndConstraintsProps) => {

    const dispatch = useAppDispatch();

    const [statement, setStatement] = React.useState<string>(_statement || "");
    const [statementError, setStatementError] = React.useState<string>("");

    const handleStatementChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (statementError.length > 0) {
            setStatementError("");
        }
        setStatement(e.target.value);
        dispatch(setProblemDescription(e.target.value)); // for live preview
    }

    const handleStatementBlur = () => {
        if (statement.length === 0) {
            setStatementError("Statement can't be empty");
        }
    }

    const [updateProblem, {isLoading: isUpdating}] = useUpdateProblemMutation();

    const router = useRouter();

    const handleSubmit = async (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        console.log("submitting");
        if (statement.length === 0) {
            setStatementError("Statement can't be empty");
            return;
        }
        const problem: CreateUpdateRequest = {
            id: problemId,
            description: statement
        }

        try {
            const res: CreateUpdateResponse = await updateProblem(problem).unwrap();
            if (res.status === 200) {
                console.log("Problem updated successfully");
                dispatch(setCodesiriusLoading(true));
                dispatch(setSnackbarMessage("Statement updated successfully"));
                dispatch(setIsSnackbarOpen(true));
                dispatch(addCompletedStep(1));
                router.push(`/problems/create/${problemId}/step/3`);
            }
        } catch (err) {
            console.error(err);
            if (isFetchBaseQueryError(err)) {
                const apiError = err.data as APIError;
                if (apiError.status === 400 && apiError.errors) {
                    setStatementError(apiError.errors[0].message);
                }
            }
        }
    }

    useEffect(() => {
        dispatch(setCodesiriusLoading(false));
    }, []);

    return (
        <div>
            <Grid container component="form" spacing={2} m={2} sx={{maxHeight: '70vh'}}>
                <Grid size={12}>
                    <TextField
                        value={statement}
                        fullWidth
                        multiline
                        rows={Math.floor(window.innerHeight / 40)}
                        label="Problem Statement"
                        variant="outlined"
                        placeholder="Problem Statement"
                        onChange={handleStatementChange}
                        onBlur={handleStatementBlur}
                        error={statementError.length > 0}
                        helperText={statementError || " "}
                    />
                </Grid>
                <Grid size={12}>
                    <Box display="flex" justifyContent="flex-end" p={2}>
                        <FormControl>
                            {/*{problemId === undefined ?*/}
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                onClick={handleSubmit}
                                endIcon={isUpdating ?
                                    <CircularProgress size={20}/> : <ArrowForward />}
                                disabled={isUpdating}
                            >
                                Next
                            </Button>
                        </FormControl>
                    </Box>
                </Grid>

            </Grid>
        </div>
    );
};

export default StatementAndConstraints;
