import React from 'react';
import {Grid, Stack} from "@mui/system";
import {FormControl, Paper, TextField} from "@mui/material";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import {ChevronRight, MeetingRoom} from "@mui/icons-material";
import Button from "@mui/material/Button";


const SessionCreator = () => {
    return (
        <Grid>
            <Grid container spacing={2} direction="column" alignItems="center" justifyContent="center"
                  sx={{height: "100vh"}}>
                <Grid sx={{width: "30%"}}>
                    <Paper elevation={3} sx={{p: 2, borderRadius: 2}}>
                        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                            <MeetingRoom/>
                            <Typography variant="h5" color="textPrimary" sx={{mb: 2, fontWeight: 600}}>
                                Create a Session
                            </Typography>
                        </Stack>
                        <Divider/>
                        <Box component="form" mt={3}
                             sx={{display: "flex", flexDirection: "column", gap: 2, width: "100%"}}>
                            <FormControl>
                                <TextField
                                    id="session-name"
                                    label="Session Name"
                                    placeholder="Enter a session name"
                                    variant="standard"
                                    type="text"
                                />
                                <Button endIcon={<ChevronRight/>} variant="contained" color="primary" sx={{mt: 2}}>
                                    Create
                                </Button>
                            </FormControl>
                        </Box>
                        <Divider/>

                    </Paper>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default SessionCreator;