"use client"
import React from 'react';
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import {Add} from "@mui/icons-material";
import Link from 'next/link'
import {useAppDispatch} from "@/lib/hooks/hooks";
import {AppDispatch} from "@/lib/store";
import {setCodesiriusLoading} from "@/lib/features/codesirius/codesiriusSlice";

const CreateProblemButton = () => {
    const dispatch = useAppDispatch<AppDispatch>();
    return (
        <Box display="flex" justifyContent="flex-end">
            <Link href="/problems/create">
                <Button startIcon={<Add/>} onClick={() => dispatch(setCodesiriusLoading(true))}>
                    Create Problem
                </Button>
            </Link>
        </Box>
    );
};

export default CreateProblemButton;
