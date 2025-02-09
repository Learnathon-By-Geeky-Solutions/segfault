import React from 'react';
import Box from "@mui/material/Box";
import {
    Checkbox,
    Chip,
    FormControl,
    FormControlLabel,
    InputLabel,
    ListItemText,
    MenuItem,
    OutlinedInput,
    Select,
    SelectChangeEvent,
    TextField,
    Theme,
    useTheme
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import {NavigateNext} from "@mui/icons-material";

interface Language {
    label: string;
    value: string;
}

interface ProblemMetaDataProps {
    title: string;
    setTitle: (title: string) => void;
    supportedLanguages: Language[];
    selectedLanguages: string[];
    setSelectedLanguages: (languages: string[]) => void;
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

function getStyles(language: string, selectedLanguages: readonly string[], theme: Theme) {
    return {
        fontWeight: selectedLanguages.includes(language)
            ? theme.typography.fontWeightMedium
            : theme.typography.fontWeightRegular,
    };
}

const ProblemMetaData = ({
                             title,
                             setTitle,
                             supportedLanguages,
                             selectedLanguages,
                             setSelectedLanguages
                         }: ProblemMetaDataProps) => {

    const theme = useTheme();
    const handleChange = (event: SelectChangeEvent<typeof selectedLanguages>) => {
        const {
            target: {value},
        } = event;
        setSelectedLanguages(
            // On autofill we get a stringified value.
            typeof value === 'string' ? value.split(',') : value,
        );
    };
    const [isOpened, setIsOpened] = React.useState(false);
    return (
        <Grid component="form" container spacing={2} m={4}>
            <Grid size={12}>
                <Typography variant="h6">Problem Meta Data</Typography>
                <Divider />
            </Grid>
            <Grid size={12}>
                <Typography variant="body1" fontWeight={500} color="textSecondary">
                    Basic Information about the problem
                </Typography>
            </Grid>
            <Grid size={12}>
                <FormControl fullWidth>
                    <TextField
                        value={title}
                        fullWidth
                        id="title"
                        label="Title"
                        variant="outlined"
                        placeholder="Problem Title"
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </FormControl>
            </Grid>
            <Grid size={12}>
                <Typography variant="body1" fontWeight={500} color="textSecondary">
                    Other Information
                </Typography>
            </Grid>
            <Grid size={12}>
                {/*<Autocomplete*/}
                {/*    multiple*/}
                {/*    fullWidth*/}
                {/*    options={supportedLanguages}*/}
                {/*    getOptionLabel={(option) => option.label}*/}
                {/*    onChange={(e, value) => setSelectedLanguages(value.map((v) => v.value))}*/}
                {/*    renderInput={(params) => <TextField {...params} label="Supported Languages"*/}
                {/*                                        variant="outlined"/>}*/}
                {/*/>*/}
                <FormControl fullWidth>
                    <InputLabel id="language">Language</InputLabel>
                    <Select
                        displayEmpty={isOpened}
                        onOpen={() => setIsOpened(true)}
                        onClose={() => setIsOpened(false)}
                        fullWidth
                        multiple
                        value={selectedLanguages}
                        onChange={handleChange}
                        input={<OutlinedInput label="Languages"/>}
                        renderValue={(selected) => (
                            <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
                                {isOpened && selected.length === 0 &&
                                    <Typography color="textSecondary">None selected</Typography>
                                }
                                {selected.map((value) => (
                                    <Chip key={value} label={value} color="primary"/>
                                ))}
                            </Box>
                        )}
                        MenuProps={MenuProps}
                    >
                        {supportedLanguages.map(({label}) => (
                            <MenuItem
                                key={label}
                                value={label}
                                style={getStyles(label, selectedLanguages, theme)}
                            >
                                <Checkbox checked={selectedLanguages.includes(label)}/>
                                <ListItemText primary={label}/>
                            </MenuItem>
                        ))}
                    </Select>

                </FormControl>
            </Grid>
            <Grid size={12}>
                {/*<Autocomplete*/}
                {/*    multiple*/}
                {/*    fullWidth*/}
                {/*    options={supportedLanguages}*/}
                {/*    getOptionLabel={(option) => option.label}*/}
                {/*    onChange={(e, value) => setSelectedLanguages(value.map((v) => v.value))}*/}
                {/*    renderInput={(params) => <TextField {...params} label="Supported Languages"*/}
                {/*                                        variant="outlined"/>}*/}
                {/*/>*/}
                <FormControl fullWidth>
                    <InputLabel id="language">Tags</InputLabel>
                    <Select
                        displayEmpty={isOpened}
                        onOpen={() => setIsOpened(true)}
                        fullWidth
                        multiple
                        value={selectedLanguages}
                        onChange={handleChange}
                        input={<OutlinedInput label="Languages"/>}
                        renderValue={(selected) => (
                            <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
                                {selected.length === 0 &&
                                  <Typography color="textSecondary">None selected</Typography>
                                }
                                {selected.map((value) => (
                                    <Chip key={value} label={value} color="primary"/>
                                ))}
                            </Box>
                        )}
                        MenuProps={MenuProps}
                    >
                        {supportedLanguages.map(({label}) => (
                            <MenuItem
                                key={label}
                                value={label}
                                style={getStyles(label, selectedLanguages, theme)}
                            >
                                <Checkbox checked={selectedLanguages.includes(label)}/>
                                <ListItemText primary={label}/>
                            </MenuItem>
                        ))}
                    </Select>

                </FormControl>
            </Grid>
            <Grid size={12}>
                <FormControlLabel control={<Checkbox defaultChecked/>} label="Private Problem"/>
            </Grid>
            <Grid size={12}>
                <Box display="flex" justifyContent="flex-end">
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => console.log("Save Problem Meta Data")}
                        endIcon={<NavigateNext />}
                    >
                        Next
                    </Button>
                </Box>
            </Grid>

        </Grid>
    );
};

export default ProblemMetaData;