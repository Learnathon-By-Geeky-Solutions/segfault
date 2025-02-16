import React, {ReactNode, useEffect} from 'react';
import Box from "@mui/material/Box";
import {
    Autocomplete,
    ButtonGroup,
    Checkbox,
    Chip,
    CircularProgress,
    Dialog,
    DialogTitle,
    FormControl,
    FormControlLabel,
    ListItemText,
    MenuItem,
    TextField,
    Tooltip
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import {Cancel, Create, Edit, HelpOutline, NavigateNext} from "@mui/icons-material";
import {Language, Tag} from "@/app/problems/add/types";
import AddIcon from '@mui/icons-material/Add';
import Link from "@mui/material/Link";
import {Stack} from "@mui/system";
import {
    APIError,
    CreateUpdateRequest,
    CreateUpdateResponse,
    FieldError
} from "@/lib/features/api/types";
import {isFetchBaseQueryError} from "@/lib/utils/isFetchBaseQueryError";
import {
    useCreateProblemMutation,
    useUpdateProblemMutation
} from "@/lib/features/api/problemsApiSlice";


interface ProblemMetaDataProps {
    readonly title: string;
    setTitle: (title: string) => void;
    readonly languages: Language[]; // list of supported languages
    readonly selectedLanguages: number[]; // list of selected languages
    setSelectedLanguages: (selectedLanguages: number[]) => void;
    readonly tags: Tag[]; // list of tags already created
    readonly selectedTags: number[]; // list of selected tags
    setSelectedTags: (selectedTags: number[]) => void;
    readonly problemId: number | undefined;
    setProblemId: (problemId: number) => void;
    setActiveStep: (step: number) => void;
    setIsSnackbarOpen: (open: boolean) => void;
    setSnackbarMessage: (message: string) => void;
}

function getNewResourceLink(resource: string, onClick?: () => void): ReactNode {
    return (
        <Box display="flex" justifyContent="flex-end" mr={2} mt={1}>
            <Link href="#" underline="hover" variant="body2" onClick={onClick}>
                <Stack direction="row" spacing={1}>
                    <AddIcon fontSize="small"/>
                    <Typography variant="body2">Create a new {resource}</Typography>
                </Stack>
            </Link>
        </Box>
    );
}

function getNoOptionsText(resource: string): ReactNode {
    return (
        <Grid container>
            <Grid size={6}>
                <Box display="flex" ml={2} mt={1}>
                    <Typography variant="body2" color="textSecondary" textAlign="left">
                        No {resource}s found
                    </Typography>
                </Box>
            </Grid>
            <Grid size={6}>
                {getNewResourceLink(resource)}
            </Grid>
        </Grid>
    )
}

function getFooterOption(resource: string, allowCreate: boolean = false, onClick?: () => void): ReactNode {
    return (
        <div key={-1}>
            <Divider/>
            <Grid container>
                <Grid size={6}>
                    <Box display="flex" ml={2} mt={1}>
                        <Typography variant="body2" color="textSecondary"
                                    textAlign="left">
                            Press ESC to cancel
                        </Typography>
                    </Box>
                </Grid>
                <Grid size={6}>
                    {
                        allowCreate &&
                        getNewResourceLink(resource, onClick)
                    }
                </Grid>
            </Grid>
        </div>
    )
}

const ProblemMetaData = ({
                             title,
                             setTitle,
                             languages,
                             selectedLanguages,
                             setSelectedLanguages,
                             tags,
                             selectedTags,
                             setSelectedTags,
                             problemId,
                             setProblemId,
                             setActiveStep,
                             setIsSnackbarOpen,
                             setSnackbarMessage
                         }: ProblemMetaDataProps) => {

    const [titleError, setTitleError] = React.useState<string>("");
    const [languageError, setLanguageError] = React.useState<string>("");
    const [tagError, setTagError] = React.useState<string>("");

    const fieldValidator = {
        title: () => {
            if (title.length === 0) {
                setTitleError("Title is required");
            }
        },
        languages: () => {
            if (selectedLanguages.length === 0) {
                setLanguageError("At least one language is required");
            }
        },
        tags: () => {
            if (selectedTags.length === 0) {
                setTagError("At least one tag is required");
            }
        }
    }

    const handleTitleBlur = () => {
        fieldValidator.title();
    }

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (titleError.length > 0) {
            setTitleError("");
        }
        setTitle(e.target.value);
    }

    const handleLanguageBlur = () => {
        fieldValidator.languages();
    }

    const handleLanguageChange = (event: React.ChangeEvent<object>, newValue: Language[]) => {
        if (languageError.length > 0) {
            setLanguageError("");
        }
        setSelectedLanguages(newValue.map(l => l.id));
    }

    const handleTagBlur = () => {
        fieldValidator.tags();
    }

    const handleTagChange = (event: React.SyntheticEvent<Element, Event>, newValue: Tag[]) => {

        if (tagError.length > 0) {
            setTagError("");
        }
        setSelectedTags(newValue.map(t => t.id).filter(id => id !== -1));
    }

    const [createProblem, {isLoading}] = useCreateProblemMutation();
    const [updateProblem, {isLoading: isUpdating}] = useUpdateProblemMutation();

    useEffect(() => {
        console.log("isLoading: ", isLoading);
    }, [isLoading]);

    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        for (const field in fieldValidator) {
            fieldValidator[field as keyof typeof fieldValidator]();
        }
        if (titleError.length === 0 && languageError.length === 0 && tagError.length === 0) {
            let problem: CreateUpdateRequest;

            try {
                let res: CreateUpdateResponse;
                if (problemId === undefined) {
                    // Create a new problem
                    problem = {
                        title: title,
                        languages: selectedLanguages,
                        tags: selectedTags
                    }
                    res = await createProblem(problem).unwrap();
                    if (res.status === 201) {
                        setSnackbarMessage("Problem metadata saved successfully");
                        setIsSnackbarOpen(true);
                        setProblemId(res.data.id);
                        setActiveStep(1);
                    }
                } else {
                    // Update an existing problem
                    problem = {
                        id: problemId,  // will be used in request url
                        title: title,
                        languages: selectedLanguages,
                        tags: selectedTags
                    }
                    res = await updateProblem(problem).unwrap();
                    if (res.status === 200) {
                        console.log("Problem updated successfully");
                        setSnackbarMessage("Problem updated successfully");
                        setIsSnackbarOpen(true);
                    }
                }
                console.log(res);

            } catch (err) {
                if (isFetchBaseQueryError(err)) {
                    const apiError = err.data as APIError;
                    if (apiError.status === 400 && apiError.errors) {
                        const errors: FieldError[] = apiError.errors;
                        errors.forEach(error => {
                            if (error.field === "title") {
                                setTitleError(error.message);
                            }
                            if (error.field === "languages") {
                                setLanguageError(error.message);
                            }
                            if (error.field === "tags") {
                                setTagError(error.message);
                            }
                        })
                    }
                }
            }
        }
    }

    const [isTagCreationDialogOpen, setTagCreationDialogOpen] = React.useState<boolean>(false);

    const savedTagName = typeof window !== 'undefined' ? localStorage.getItem("tag_name") : "";
    const savedTagDescription = typeof window !== 'undefined' ? localStorage.getItem("tag_description") : "";

    const [tagName, setTagName] = React.useState<string>(savedTagName || "");
    const [tagDescription, setTagDescription] = React.useState<string>(savedTagDescription || "");

    const [tagTitleError, setTagTitleError] = React.useState<string>("");
    const [tagDescriptionError, setTagDescriptionError] = React.useState<string>("");

    const handleTagTitleBlur = () => {
        if (tagName.length === 0) {
            setTagTitleError("Tag name is required");
        }
    }

    const handleTagTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (tagTitleError.length > 0) {
            setTagTitleError("");
        }
        // force tag name to be in lowercase and replace spaces with hyphen
        // merge successive hyphens into one
        setTagName(
            e.target.value
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
        );
        // persist in local storage
        localStorage.setItem("tag_name", e.target.value.toLowerCase());
    }

    const handleTagDescriptionBlur = () => {
        if (tagDescription.length === 0) {
            setTagDescriptionError("Tag description is required");
        }
    }

    const handleTagDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (tagDescriptionError.length > 0) {
            setTagDescriptionError("");
        }
        setTagDescription(e.target.value);
        // persist in local storage
        localStorage.setItem("tag_description", e.target.value);
    }

    const handleTagCreationSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (tagName.length === 0) {
            setTagTitleError("Tag name is required");
        }
        if (tagDescription.length === 0) {
            setTagDescriptionError("Tag description is required");
        }
        if (tagTitleError.length === 0 && tagDescriptionError.length === 0) {
            // Create a new tag
            console.log("Create a new tag");
        }
    }

    return (
        <>
            <Grid component="form" container spacing={2} m={4}>
                <Grid size={12}>
                    <Typography variant="h6">Problem Meta Data</Typography>
                    <Divider/>
                </Grid>
                <Grid size={12}>
                    <Typography variant="body1" fontWeight={500} color="textSecondary">
                        What is the title of your problem?
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
                            onChange={handleTitleChange}
                            error={titleError.length > 0}
                            helperText={titleError}
                            onBlur={handleTitleBlur}
                        />
                    </FormControl>
                </Grid>
                <Grid size={12}>
                    <Typography variant="body1" fontWeight={500} color="textSecondary">
                        Language and Tags
                    </Typography>
                </Grid>
                <Grid size={12}>
                    <FormControl fullWidth>
                        <Autocomplete
                            multiple
                            id="languages"
                            options={[
                                ...languages.sort((a, b) => -b.name.localeCompare(a.name)),
                                {
                                    id: -1,
                                    name: "Escape",
                                    version: ""
                                }]}
                            getOptionLabel={(option) => `${option.name} ${option.version}`}
                            defaultValue={[]}
                            filterSelectedOptions
                            autoHighlight
                            disableCloseOnSelect
                            value={languages.filter(l => selectedLanguages.includes(l.id))}
                            groupBy={(option) => option.id === -1 ? "" : option.name}
                            // renderGroup={(params) => (
                            //     <li key={params.key}>
                            //         <GroupHeader>{params.group}</GroupHeader>
                            //         <GroupItems>{params.children}</GroupItems>
                            //     </li>
                            // )}
                            onChange={handleLanguageChange}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="outlined"
                                    label="Languages"
                                    placeholder="Languages"
                                    error={languageError.length > 0}
                                    helperText={languageError}
                                    onBlur={handleLanguageBlur}
                                />
                            )}
                            noOptionsText={getNoOptionsText("language")}
                            renderOption={(props, option) => {
                                if (option.id === -1) {
                                    return getFooterOption("language");
                                }
                                return (
                                    <MenuItem {...props} key={props.key}>
                                        <ListItemText
                                            primary={`${option.name} ${option.version}`}/>
                                    </MenuItem>
                                )
                            }}
                        />
                    </FormControl>
                </Grid>

                <Grid size={12}>
                    <FormControl fullWidth>
                        <Autocomplete
                            multiple
                            id="tags"
                            options={[
                                ...tags.sort((a, b) => -b.name.localeCompare(a.name)),
                                {
                                    id: -1,
                                    name: "New Tag",
                                    description: ""
                                }]}
                            groupBy={(option) => option.id === -1 ? "" : option.name[0]}
                            getOptionLabel={(option) => option.name}
                            defaultValue={[]}
                            filterSelectedOptions
                            autoHighlight
                            disableCloseOnSelect
                            value={tags.filter(t => selectedTags.includes(t.id))}
                            onChange={handleTagChange}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="outlined"
                                    label="Tags"
                                    placeholder="Tags"
                                    error={tagError.length > 0}
                                    helperText={tagError}
                                    onBlur={handleTagBlur}
                                />
                            )}
                            renderTags={(value: Tag[], getTagProps) => {
                                return value.map((option, index) => (
                                    <Tooltip arrow placement="top"
                                             title={option.description} key={index}>
                                        <Chip
                                            label={option.name} {...getTagProps({index})}
                                            key={undefined}/>
                                    </Tooltip>
                                ))
                            }}
                            noOptionsText={getNoOptionsText("tag")}
                            renderOption={(props, option) => {
                                if (option.id === -1) {
                                    return getFooterOption("tag", true, () => setTagCreationDialogOpen(true));
                                }
                                return (
                                    <MenuItem {...props} key={props.key}>
                                        <ListItemText primary={option.name}/>
                                    </MenuItem>
                                )
                            }}
                        />
                    </FormControl>
                </Grid>

                <Grid size={12}>
                    <FormControlLabel disabled control={<Checkbox defaultChecked/>}
                                      label="Private Problem"/>
                </Grid>
                <Grid size={12}>
                    <Box display="flex" justifyContent="flex-end">
                        <FormControl>
                            {problemId === undefined ?
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSubmit}
                                    endIcon={isLoading ? <CircularProgress size={20}/> :
                                        <NavigateNext/>}
                                    disabled={isLoading}
                                >
                                    Next
                                </Button>
                                :
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSubmit}
                                    startIcon={isUpdating ?
                                        <CircularProgress size={20}/> : <Edit/>}
                                    disabled={isUpdating}
                                >
                                    Update
                                </Button>

                            }
                        </FormControl>
                    </Box>
                </Grid>
            </Grid>
            <Dialog
                open={isTagCreationDialogOpen}
                onClose={() => setTagCreationDialogOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>Create a Tag</DialogTitle>
                <Divider/>
                <Grid container p={2} gap={2}>
                    <Grid size={12}>
                        <FormControl>
                            <TextField
                                value={tagName}
                                onChange={handleTagTitleChange}
                                onBlur={handleTagTitleBlur}
                                error={tagTitleError.length > 0}
                                helperText={tagTitleError || "Keep it short and sweet."}
                                size="small"
                                fullWidth
                                id="tagName"
                                label="Tag Name"
                                variant="outlined"
                                placeholder="Tag Name"
                            />
                        </FormControl>
                        <Tooltip
                            arrow
                            placement="right"
                            title={
                                <>
                                    <Typography variant="body2">
                                        Tag name should be unique and descriptive. <br/>
                                        For example:
                                    </Typography>
                                    <ul style={{margin: 0, paddingLeft: "20px"}}>
                                        <li><code>dynamic-programming</code></li>
                                        <li>binary-search</li>
                                        <li>graph-theory</li>
                                        <li>greedy</li>
                                    </ul>
                                </>
                            }>
                            <HelpOutline fontSize="small" cursor="pointer" style={{marginLeft: "8px", marginTop: 10}}/>
                        </Tooltip>

                    </Grid>
                    <Grid size={12}>
                        <FormControl fullWidth>
                            <TextField
                                value={tagDescription}
                                onChange={handleTagDescriptionChange}
                                onBlur={handleTagDescriptionBlur}
                                error={tagDescriptionError.length > 0}
                                helperText={tagDescriptionError || "This will appear as a tooltip on the tag"}
                                size="small"
                                fullWidth
                                multiline
                                minRows={3}
                                id="tagDescription"
                                label="Tag Description"
                                variant="outlined"
                                placeholder="Tag Description"
                            />
                        </FormControl>
                    </Grid>
                    <Grid size={12}>
                        <Box display="flex" justifyContent="flex-end" m={2}>
                            <ButtonGroup size="small">
                                <Button variant="contained" color="primary"
                                        startIcon={<Create/>}
                                        onClick={handleTagCreationSubmit}>Create</Button>
                                <Button variant="contained" color="error"
                                        startIcon={<Cancel/>}
                                        onClick={() => setTagCreationDialogOpen(false)}>Cancel</Button>
                            </ButtonGroup>
                        </Box>
                        <Typography variant="body2" color="textSecondary"
                                    textAlign="right" mr={2}>
                            Press ESC to cancel
                        </Typography>
                    </Grid>
                </Grid>
            </Dialog>
        </>
    );
};

export default ProblemMetaData;
