import type {PayloadAction} from "@reduxjs/toolkit";
import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import {themeType} from "@/types";
import {CodesiriusState} from "@/lib/features/codesirius/types";
import {User} from "@/lib/features/api/types";
const NEXT_PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_NEXTJS_BACKEND_URL || "http://localhost:3000";



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
        setUser(state, action: PayloadAction<User | null>) {
            state.user = action.payload
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(setThemeAsync.rejected, (state) => {
                state.isCodesiriusLoading = false
            })
            .addCase(setThemeAsync.pending, (state) => {
                state.isCodesiriusLoading = true
            })
            .addCase(setThemeAsync.fulfilled, (state) => {
                state.isCodesiriusLoading = false
            })
    }
});


export const setThemeAsync = createAsyncThunk(
    "codesirius/setThemeAsync",
    async (theme: themeType) => {
        const req = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/api/themes`, {
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
