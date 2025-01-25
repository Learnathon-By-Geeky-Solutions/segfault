import React from 'react';
import {Alert, Grow} from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';

const Complete = () => {
    return (
        <Grow in>
            <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
                Great! You have successfully signed up.
                You will be redirected in a few seconds.
            </Alert>
        </Grow>
    );
};

export default Complete;
