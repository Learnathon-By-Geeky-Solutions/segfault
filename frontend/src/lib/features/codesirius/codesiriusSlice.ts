import type {PayloadAction} from "@reduxjs/toolkit";
import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import {themeType} from "@/types";
import {BACKEND_URL} from "@/lib/constants";
import {CodesiriusState} from "@/lib/features/codesirius/types";


const initialState: CodesiriusState = {
    theme: 'light',
    isCodesiriusLoading: false,
    progress: 0,
    user: null
}

const codesiriusSlice = createSlice({
    name: 'codesirius',
    initialState,
    reducers: {
        setTheme(state, action: PayloadAction<themeType>) {
            state.theme = action.payload
        },
        setCodesiriusLoading(state, action: PayloadAction<boolean>) {
            state.isCodesiriusLoading = action.payload
        },
        setProgress(state, action: PayloadAction<number>) {
            state.progress = action.payload
        },
        setUser(state, action: PayloadAction<any>) {
            state.user = action.payload
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(setThemeAsync.rejected, (state, action) => {
                state.isCodesiriusLoading = false
            })
            .addCase(setThemeAsync.pending, (state, action) => {
                state.isCodesiriusLoading = true
            })
            .addCase(setThemeAsync.fulfilled, (state, action) => {
                state.isCodesiriusLoading = false
            })
    }
});


export const setThemeAsync = createAsyncThunk(
    "codesirius/setThemeAsync",
    async (theme: themeType) => {
        const req = await fetch(`${BACKEND_URL}/api/themes`, {
            "method": "POST",
            "headers": {"Content-Type": "application/json"},
            "body": JSON.stringify({"theme": theme})
        });
        return await req.json();
    }
)


export const {
    setTheme, // to switch theme instantly on client
    setCodesiriusLoading, // to show loading spinner
    setProgress,
    setUser
} = codesiriusSlice.actions


export default codesiriusSlice.reducer
