import {createSlice, PayloadAction} from "@reduxjs/toolkit";


interface AddProblemState {
    title: string; // for live preview
    description: string; // for live preview
    snackbarMessage: string;
    isSnackbarOpen: boolean;
    completedSteps: number[]; // for stepper
    failedSteps: number[]; // for stepper
    progress: number; // for stepper
    unsavedSteps: number[]; // for stepper
    isHiddenTestsUploaded: boolean; // for reference solution
}

const initialState: AddProblemState = {
    title: '',
    description: '',
    snackbarMessage: '',
    isSnackbarOpen: false,
    completedSteps: [],
    failedSteps: [],
    progress: 0,
    unsavedSteps: [],
    isHiddenTestsUploaded: false
}

const addProblemSlice = createSlice({
    name: 'addProblem',
    initialState,
    reducers: {
        setTitle: (state, action: PayloadAction<string>) => {
            state.title = action.payload;
        },
        setDescription: (state, action: PayloadAction<string>) => {
            state.description = action.payload;
        },
        setSnackbarMessage: (state, action: PayloadAction<string>) => {
            state.snackbarMessage = action.payload;
        },
        setIsSnackbarOpen: (state, action: PayloadAction<boolean>) => {
            state.isSnackbarOpen = action.payload;
        },
        addCompletedStep: (state, action: PayloadAction<number>) => {
            state.completedSteps.push(action.payload);
            state.completedSteps = [...new Set(state.completedSteps)];

            state.unsavedSteps = state.unsavedSteps.filter(step => step !== action.payload);
            state.failedSteps = state.failedSteps.filter(step => step !== action.payload);
        },
        addFailedStep: (state, action: PayloadAction<number>) => {
            state.failedSteps.push(action.payload);
            state.failedSteps = [...new Set(state.failedSteps)];
        },
        incrementProgress: (state, action: PayloadAction<number>) => {
            state.progress += action.payload;
        },
        addUnsavedStep: (state, action: PayloadAction<number>) => {
            state.unsavedSteps.push(action.payload);
            state.unsavedSteps = [...new Set(state.unsavedSteps)];
        },
        removeUnsavedStep: (state, action: PayloadAction<number>) => {
            state.unsavedSteps = state.unsavedSteps.filter(step => step !== action.payload);
        },
        setIsHiddenTestsUploaded: (state, action: PayloadAction<boolean>) => {
            state.isHiddenTestsUploaded = action.payload;
        }
    }
});

export const {
    setTitle,
    setDescription,
    setSnackbarMessage,
    setIsSnackbarOpen,
    addCompletedStep,
    addFailedStep,
    incrementProgress,
    addUnsavedStep,
    removeUnsavedStep,
    setIsHiddenTestsUploaded
} = addProblemSlice.actions;

export default addProblemSlice.reducer;