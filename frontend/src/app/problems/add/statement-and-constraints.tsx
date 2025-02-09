import React from 'react';
import Grid from "@mui/material/Grid2";
import {TextField} from "@mui/material";

interface StatementAndConstraintsProps {
    description: string;
    setDescription: (description: string) => void;
}

const StatementAndConstraints = ({
                                     description,
                                     setDescription,
                                 }: StatementAndConstraintsProps) => {
    return (
        <div>
            <Grid container component="form" spacing={2} m={2}>
                <Grid size={12}>
                    <TextField
                        value={description}
                        fullWidth
                        multiline
                        rows={Math.floor(window.innerHeight / 35)}
                        label="Problem Statement"
                        variant="outlined"
                        placeholder="Problem Statement"
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </Grid>
                <Grid size={12}>

                </Grid>

            </Grid>
        </div>
    );
};

export default StatementAndConstraints;