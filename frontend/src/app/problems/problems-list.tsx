"use client";

import React, {useEffect} from 'react';
import {useAppDispatch} from "@/lib/hooks/hooks";
import {AppDispatch} from "@/lib/store";
import {setCodesiriusLoading} from "@/lib/features/codesirius/codesiriusSlice";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

const ProblemsPage = () => {
    const dispatch = useAppDispatch<AppDispatch>();

    useEffect(() => {
        dispatch(setCodesiriusLoading(false));
    }, []);

    return (
        <>
            <Box sx={{padding: 2}} display="flex" justifyContent="center">
                <Typography variant="h6">All Problems</Typography>
            </Box>
            <Divider/>
        </>
    );
};

export default ProblemsPage;