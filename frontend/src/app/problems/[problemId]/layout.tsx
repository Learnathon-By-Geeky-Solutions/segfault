import React from 'react';
import SplitPane from "@/components/SplitPane";
import { Box } from '@mui/material';
import ProblemTabs from './components/ProblemTabs';

const _layout = ({
                    children,
                    problem,
                    submission
                }: {
    children: React.ReactNode;
    problem: React.ReactNode;
    submission: React.ReactNode;
}) => {
    return (
        <Box sx={{ 
            height: 'calc(100vh - 64px)', 
            p: 2,
            display: 'flex',
            flexDirection: 'column',
        }}>
            {children}
            <SplitPane
                leftWidth={50}
                leftChildren={
                    <ProblemTabs>
                        {problem || <div>Loading problem...</div>}
                    </ProblemTabs>
                }
                rightChildren={submission || <div>Loading submission...</div>}
            />
        </Box>
    );
};

export default _layout;