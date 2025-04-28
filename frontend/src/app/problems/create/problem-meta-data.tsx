"use client"
import React, {ReactNode, useEffect, useState} from 'react';
import Box from "@mui/material/Box";
import {
    Autocomplete,
    ButtonGroup,
    Card,
    CardContent,
    Checkbox,
    Chip,
    CircularProgress,
    FormControl,
    FormControlLabel,
    ListItemText,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Tooltip,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import {Edit, NavigateNext} from "@mui/icons-material";
import {Language, Tag} from "@/app/problems/create/types";
import AddIcon from '@mui/icons-material/Add';
import Link from "@mui/material/Link";
import {APIError, CreateUpdateRequest, CreateUpdateResponse, FieldError} from "@/lib/features/api/types";
import {isFetchBaseQueryError} from "@/lib/utils/isFetchBaseQueryError";
import {useCreateProblemMutation, useUpdateProblemMutation} from "@/lib/features/api/problemsApiSlice";
import {useAppDispatch} from "@/lib/hooks/hooks";
import {
    addCompletedStep,
    addFailedStep,
    incrementProgress,
    setTitle as setProblemTitle
} from "@/lib/features/codesirius/addProblemSlice";
import {setCodesiriusLoading} from "@/lib/features/codesirius/codesiriusSlice";
import {useRouter} from "next/navigation";
import {SiCoder, SiCplusplus, SiPython} from 'react-icons/si';
import {DiJava} from 'react-icons/di';
import CodeIcon from '@mui/icons-material/Code';
import {alpha} from '@mui/material/styles';
import {useNotification} from '@/contexts/NotificationContext';


interface ProblemMetaDataProps {
    problemId?: number,
    availableLanguages: Language[]; // PREDEFINED list of languages
    availableTags: Tag[]; // PREDEFINED list of tags
    title?: string;
    selectedLanguages?: number[];
    selectedTags?: number[];
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
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

const getLanguageIcon = (lang: Language) => {
    switch (lang.name) {
        case "Python":
            return <SiPython size={16} />;
        case "Java":
            return <DiJava size={16} />;
        case "C++":
            return <SiCplusplus size={16} />;
        default:
            return <SiCoder size={16} />;
    }
};

const getDifficultyColor = (difficulty: 'EASY' | 'MEDIUM' | 'HARD') => {
    switch (difficulty) {
        case 'EASY':
            return '#4CAF50'; // Green
        case 'MEDIUM':
            return '#FF9800'; // Orange
        case 'HARD':
            return '#F44336'; // Red
        default:
            return '#9E9E9E'; // Grey
    }
};

const ProblemMetaData = ({
                             problemId,
                             availableLanguages,
                             availableTags,
                             title: _title,
                             selectedLanguages: _selectedLanguages,
                             selectedTags: _selectedTags,
                             difficulty: _difficulty
                         }: ProblemMetaDataProps) => {
    const dispatch = useAppDispatch();
    const { showNotification } = useNotification();

    // global state
    const [title, setTitle] = useState<string>(_title || "");
    const [selectedLanguages, setSelectedLanguages] = useState<number[]>(_selectedLanguages || []);
    const [selectedTags, setSelectedTags] = useState<number[]>(_selectedTags || []);
    const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD' | undefined>(_difficulty);


    // // local state
    // const [_title, _setTitle] = React.useState<string>("");
    // const [_selectedLanguages, _setSelectedLanguages] = React.useState<number[]>([]);
    // const [_selectedTags, _setSelectedTags] = React.useState<number[]>([]);

    const [titleError, setTitleError] = React.useState<string>("");
    const [languageError, setLanguageError] = React.useState<string>("");
    const [tagError, setTagError] = React.useState<string>("");
    const [difficultyError, setDifficultyError] = React.useState<string>("");

    const fieldValidator = {
        title: () => {
            if (title.length === 0) {
                setTitleError("Title is required");
            }
        },
        languages: () => {
            if (selectedLanguages?.length === 0) {
                setLanguageError("At least one language is required");
            }
        },
        tags: () => {
            if (selectedTags?.length === 0) {
                setTagError("At least one tag is required");
            }
        },
        difficulty: () => {
            if (!difficulty) {
                setDifficultyError("Difficulty level is required");
            }
        }
    }

    const handleTitleBlur = () => {
        fieldValidator.title();
    }

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (titleError.length > 0) {
            setTitleError("");
            // removeFailedStep(0);
        }
        setTitle(e.target.value);
        dispatch(setProblemTitle(e.target.value));
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
        dispatch(setCodesiriusLoading(false));
    }, []);


    const router = useRouter();

    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        for (const field in fieldValidator) {
            fieldValidator[field as keyof typeof fieldValidator]();
        }
        if (title && title.length > 0 && 
            selectedLanguages && selectedLanguages.length > 0 && 
            selectedTags && selectedTags.length > 0 &&
            difficulty) {
            let problem: CreateUpdateRequest;

            try {
                let res: CreateUpdateResponse;
                if (problemId === undefined) {
                    // Create a new problem
                    problem = {
                        title: title,
                        languageIds: selectedLanguages,
                        tagIds: selectedTags,
                        difficulty: difficulty
                    }
                    res = await createProblem(problem).unwrap();
                    if (res.status === 201) {
                        console.log("Problem created successfully");
                        dispatch(setCodesiriusLoading(true));
                        showNotification("Problem metadata saved successfully", "success");
                        dispatch(addCompletedStep(0));
                        dispatch(incrementProgress(20));
                        router.push(`/problems/create/${res.data.id}/step/2`);
                    }
                } else {
                    // Update an existing problem
                    problem = {
                        id: problemId,  // will be used in request url
                        title: title,
                        languageIds: selectedLanguages,
                        tagIds: selectedTags,
                        difficulty: difficulty
                    }
                    res = await updateProblem(problem).unwrap();
                    if (res.status === 200) {
                        console.log("Problem updated successfully")
                        dispatch(setCodesiriusLoading(true));
                        showNotification("Problem metadata updated successfully", "success");
                        dispatch(addCompletedStep(0));
                        router.push(`/problems/create/${res.data.id}/step/2`);
                    }
                }
                console.log(res)
            } catch (err) {
                if (isFetchBaseQueryError(err)) {
                    const apiError = err.data as APIError;
                    if (apiError.status === 400 && apiError.errors) {
                        if (problemId === undefined) {
                            // only set failed step if creating a new problem
                            dispatch(addFailedStep(0));
                        }
                        const errors: FieldError[] = apiError.errors;
                        errors.forEach(error => {
                            if (error.field === "title") {
                                setTitleError(error.message);
                                showNotification(error.message, "error", "Title Error");
                            }
                            if (error.field === "languages") {
                                setLanguageError(error.message);
                                showNotification(error.message, "error", "Language Error");
                            }
                            if (error.field === "tags") {
                                setTagError(error.message);
                                showNotification(error.message, "error", "Tag Error");
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
        <Card elevation={0} sx={{ 
            borderRadius: 2,
            background: 'transparent',
            '& .MuiTableCell-root': {
                borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            }
        }}>
            <CardContent>
                <Stack spacing={3}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <CodeIcon sx={{ color: 'primary.main' }} />
                        <Typography variant="h5" fontWeight="600">
                            Problem Meta Data
                        </Typography>
                    </Stack>

                    <Paper elevation={0} sx={{ 
                        p: 3,
                        borderRadius: 2,
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                    }}>
                        <Stack spacing={3}>
                            <Stack spacing={1}>
                                <Typography variant="body1" fontWeight={500} color="text.secondary">
                                    What is the title of your problem?
                                </Typography>
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
                                        helperText={titleError || "Keep it short and sweet"}
                                        onBlur={handleTitleBlur}
                                        size="small"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 1.5,
                                            }
                                        }}
                                    />
                                </FormControl>
                            </Stack>

                            <Stack spacing={1}>
                                <Typography variant="body1" fontWeight={500} color="text.secondary">
                                    Language and Tags
                                </Typography>
                                <FormControl fullWidth>
                                    <Autocomplete
                                        multiple
                                        id="languages"
                                        options={[
                                            ...availableLanguages.toSorted((a, b) => -b.name.localeCompare(a.name)),
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
                                        value={availableLanguages.filter(l => selectedLanguages?.includes(l.id))}
                                        groupBy={(option) => option.id === -1 ? "" : option.name}
                                        onChange={handleLanguageChange}
                                        sx={{
                                            '& .MuiAutocomplete-listbox': {
                                                bgcolor: (theme) => theme.palette.mode === 'dark' 
                                                    ? alpha(theme.palette.background.paper, 0.95)
                                                    : alpha(theme.palette.background.paper, 0.98),
                                                border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                                borderRadius: 1,
                                                boxShadow: (theme) => `0 4px 20px ${alpha(theme.palette.common.black, 0.15)}`,
                                                '& .MuiAutocomplete-option': {
                                                    py: 1,
                                                    px: 2,
                                                    bgcolor: (theme) => theme.palette.mode === 'dark'
                                                        ? alpha(theme.palette.background.paper, 0.7)
                                                        : alpha(theme.palette.background.paper, 0.8),
                                                    '&:hover': {
                                                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08)
                                                    },
                                                    '&[aria-selected="true"]': {
                                                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12)
                                                    }
                                                },
                                                '& .MuiAutocomplete-groupLabel': {
                                                    py: 1,
                                                    px: 2,
                                                    bgcolor: (theme) => theme.palette.mode === 'dark'
                                                        ? alpha(theme.palette.background.paper, 0.8)
                                                        : alpha(theme.palette.background.paper, 0.9),
                                                    fontWeight: 600,
                                                    fontSize: '0.875rem',
                                                    color: 'text.secondary',
                                                    borderBottom: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`
                                                }
                                            }
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                variant="outlined"
                                                label="Languages"
                                                placeholder="Languages"
                                                error={languageError.length > 0}
                                                helperText={languageError || "Select the languages you want to support"}
                                                onBlur={handleLanguageBlur}
                                                size="small"
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 1.5,
                                                    }
                                                }}
                                            />
                                        )}
                                        renderTags={(value: Language[], getTagProps) => {
                                            return value.map((option, index) => {
                                                const { key, ...chipProps } = getTagProps({ index });
                                                return (
                                                    <Chip
                                                        key={key}
                                                        label={
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                {getLanguageIcon(option)}
                                                                <span>{option.name} {option.version}</span>
                                                            </Box>
                                                        }
                                                        {...chipProps}
                                                        sx={{
                                                            '& .MuiChip-label': {
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 0.5,
                                                                px: 0.5,
                                                                pr: 1
                                                            },
                                                            '& .MuiChip-deleteIcon': {
                                                                margin: '0 2px 0 -6px'
                                                            }
                                                        }}
                                                    />
                                                );
                                            });
                                        }}
                                        noOptionsText={getNoOptionsText("language")}
                                        renderOption={(props: React.HTMLAttributes<HTMLLIElement> & { key?: string }, option: Language) => {
                                            if (option.id === -1) {
                                                return getFooterOption("language");
                                            }
                                            const { key, ...otherProps } = props;
                                            return (
                                                <MenuItem key={key} {...otherProps}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        {getLanguageIcon(option)}
                                                        <ListItemText primary={`${option.name} ${option.version}`}/>
                                                    </Box>
                                                </MenuItem>
                                            )
                                        }}
                                    />
                                </FormControl>
                            </Stack>

                            <Stack spacing={1}>
                                <FormControl fullWidth>
                                    <Autocomplete
                                        multiple
                                        id="tags"
                                        options={[
                                            ...availableTags.sort((a, b) => -b.name.localeCompare(a.name)),
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
                                        value={availableTags.filter(t => selectedTags?.includes(t.id))}
                                        onChange={handleTagChange}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                variant="outlined"
                                                label="Tags"
                                                placeholder="Tags"
                                                error={tagError.length > 0}
                                                helperText={tagError || "Select the tags that best describe the problem"}
                                                onBlur={handleTagBlur}
                                                size="small"
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 1.5,
                                                    }
                                                }}
                                            />
                                        )}
                                        renderTags={(value: Tag[], getTagProps) => {
                                            return value.map((option, index) => (
                                                <Tooltip arrow placement="top"
                                                         title={option.description} key={index}>
                                                    <Chip
                                                        label={option.name} {...getTagProps({index})}
                                                        key={undefined}
                                                        sx={{
                                                            '& .MuiChip-label': {
                                                                px: 1,
                                                            }
                                                        }}
                                                    />
                                                </Tooltip>
                                            ))
                                        }}
                                        noOptionsText={getNoOptionsText("tag")}
                                        renderOption={(props: React.HTMLAttributes<HTMLLIElement> & { key?: string }, option) => {
                                            if (option.id === -1) {
                                                return getFooterOption("tag", true, () => setTagCreationDialogOpen(true));
                                            }
                                            const { key, ...otherProps } = props;
                                            return (
                                                <MenuItem key={key} {...otherProps}>
                                                    <ListItemText primary={option.name}/>
                                                </MenuItem>
                                            )
                                        }}
                                    />
                                </FormControl>
                            </Stack>

                            <Stack spacing={1}>
                                <Typography variant="body1" fontWeight={500} color="text.secondary">
                                    Difficulty Level
                                </Typography>
                                <ButtonGroup fullWidth>
                                    {(['EASY', 'MEDIUM', 'HARD'] as const).map((level) => (
                                        <Button
                                            key={level}
                                            variant={difficulty === level ? 'contained' : 'outlined'}
                                            onClick={() => {
                                                setDifficulty(level);
                                                if (difficultyError) setDifficultyError("");
                                            }}
                                            sx={{
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                backgroundColor: difficulty === level ? getDifficultyColor(level) : 'transparent',
                                                color: difficulty === level ? 'white' : 'text.primary',
                                                borderColor: difficultyError ? 'error.main' : getDifficultyColor(level),
                                                '&:hover': {
                                                    backgroundColor: difficulty === level ? getDifficultyColor(level) : alpha(getDifficultyColor(level), 0.1),
                                                    borderColor: getDifficultyColor(level),
                                                }
                                            }}
                                        >
                                            {level.charAt(0) + level.slice(1).toLowerCase()}
                                        </Button>
                                    ))}
                                </ButtonGroup>
                                {difficultyError && (
                                    <Typography variant="caption" color="error">
                                        {difficultyError}
                                    </Typography>
                                )}
                            </Stack>

                            <FormControlLabel 
                                control={
                                    <Checkbox 
                                        defaultChecked
                                        sx={{
                                            '& .MuiSvgIcon-root': {
                                                fontSize: 20,
                                            }
                                        }}
                                    />
                                }
                                label={
                                    <Typography variant="body2" color="text.secondary">
                                        Private Problem
                                    </Typography>
                                }
                            />
                        </Stack>
                    </Paper>

                    <Box display="flex" justifyContent="flex-end">
                        <FormControl>
                            {problemId === undefined ?
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSubmit}
                                    endIcon={isLoading ? <CircularProgress size={20}/> : <NavigateNext/>}
                                    disabled={isLoading}
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
                                :
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSubmit}
                                    startIcon={isUpdating ? <CircularProgress size={20}/> : <Edit/>}
                                    disabled={isUpdating}
                                    sx={{
                                        borderRadius: 2,
                                        px: 4,
                                        py: 1,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                    }}
                                >
                                    Update
                                </Button>
                            }
                        </FormControl>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default ProblemMetaData;
