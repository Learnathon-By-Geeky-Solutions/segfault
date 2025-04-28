"use client"
import React, {useEffect, useRef, useState} from 'react';
import Grid from "@mui/material/Grid2";
import {
    CircularProgress,
    FormControl,
    TextField,
    Card,
    CardContent,
    Stack,
    Typography,
    Paper,
    Box,
    Button,
} from "@mui/material";
import {ArrowForward, Description} from "@mui/icons-material";
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
import MarkdownToolbar from "@/components/markdown-toolbar";
import { useNotification } from '@/contexts/NotificationContext';

interface StatementAndConstraintsProps {
    problemId: number,
    statement: string;
}

const StatementAndConstraints = ({problemId, statement: _statement}: StatementAndConstraintsProps) => {
    const dispatch = useAppDispatch();
    const { showNotification } = useNotification();
    const textFieldRef = useRef<HTMLTextAreaElement>(null);
    const [selectedText, setSelectedText] = useState('');
    const [rows, setRows] = useState(10); // Default value

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

    const handleSelectionChange = () => {
        if (!textFieldRef.current) return;
        const textarea = textFieldRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newSelectedText = statement.substring(start, end);
        setSelectedText(newSelectedText);
    };

    const handleInsertMarkdown = (text: string) => {
        if (!textFieldRef.current) return;
        
        const textarea = textFieldRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        // Simply insert the provided text at the cursor position
        const newText = statement.substring(0, start) + text + statement.substring(end);
        
        setStatement(newText);
        dispatch(setProblemDescription(newText));
        
        // Set cursor position after inserted text
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + text.length, start + text.length);
        }, 0);
    };

    const [updateProblem, {isLoading: isUpdating}] = useUpdateProblemMutation();

    const router = useRouter();

    const handleSubmit = async (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        console.log("submitting");
        if (statement.length === 0) {
            setStatementError("Statement can't be empty");
            showNotification("Statement can't be empty", "error", "Statement Error");
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
                showNotification("Statement updated successfully", "success");
                dispatch(addCompletedStep(1));
                router.push(`/problems/create/${problemId}/step/3`);
            }
        } catch (err) {
            console.error(err);
            if (isFetchBaseQueryError(err)) {
                const apiError = err.data as APIError;
                if (apiError.status === 400 && apiError.errors) {
                    setStatementError(apiError.errors[0].message);
                    showNotification(apiError.errors[0].message, "error", "Statement Error");
                }
            }
        }
    }

    useEffect(() => {
        dispatch(setCodesiriusLoading(false));
    }, []);

    useEffect(() => {
        const calculateRows = () => {
            if (typeof window !== 'undefined') {
                const height = window.innerHeight;
                const calculatedRows = Math.floor((height - 300) / 40);
                setRows(calculatedRows);
            }
        };

        calculateRows();
        window.addEventListener('resize', calculateRows);
        return () => window.removeEventListener('resize', calculateRows);
    }, []);

    return (
        <Card elevation={0} sx={{ 
            borderRadius: 2,
            background: 'transparent',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
        }}>
            <CardContent sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                    width: '8px',
                    height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '4px',
                    '&:hover': {
                        background: 'rgba(0, 0, 0, 0.3)',
                    },
                },
            }}>
                <Stack spacing={3} sx={{ minHeight: 'min-content' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Description sx={{ color: 'primary.main' }} />
                        <Typography variant="h5" fontWeight="600">
                            Problem Statement
                        </Typography>
                    </Stack>

                    <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
                        <Typography variant="body1" fontWeight={500} color="text.secondary">
                            Write a clear and concise problem statement
                        </Typography>
                        
                        <Box sx={{ 
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1.5,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            flex: 1,
                            minHeight: 0,
                            '& .MuiInputLabel-root': {
                                position: 'absolute',
                                top: -8,
                                left: 12,
                                backgroundColor: 'background.paper',
                                padding: '0 4px',
                                fontSize: '0.75rem',
                                color: 'text.secondary',
                                '&.Mui-focused': {
                                    color: 'primary.main',
                                },
                            },
                            '& .MuiFormHelperText-root': {
                                margin: '4px 12px 0',
                                fontSize: '0.75rem',
                            },
                        }}>
                            <MarkdownToolbar 
                                onInsert={handleInsertMarkdown} 
                                selectedText={selectedText}
                            />
                            
                            <TextField
                                inputRef={textFieldRef}
                                value={statement}
                                fullWidth
                                multiline
                                rows={rows}
                                variant="outlined"
                                onChange={handleStatementChange}
                                onBlur={handleStatementBlur}
                                onSelect={handleSelectionChange}
                                error={statementError.length > 0}
                                helperText={statementError || "Use markdown for formatting"}
                                sx={{
                                    flex: 1,
                                    '& .MuiOutlinedInput-root': {
                                        height: '100%',
                                        borderRadius: 0,
                                        '& textarea': {
                                            fontFamily: 'monospace',
                                            fontSize: '0.9rem',
                                            lineHeight: 1.5,
                                            padding: 2,
                                            height: '100% !important',
                                        },
                                        '& fieldset': {
                                            borderTop: 'none',
                                            borderBottom: 'none',
                                            borderLeft: 'none',
                                            borderRight: 'none',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: 'transparent',
                                        },
                                    },
                                }}
                            />
                        </Box>
                    </Stack>

                    <Box display="flex" justifyContent="flex-end" sx={{ mt: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            onClick={handleSubmit}
                            endIcon={isUpdating ? <CircularProgress size={20}/> : <ArrowForward />}
                            disabled={isUpdating}
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

export default StatementAndConstraints;
