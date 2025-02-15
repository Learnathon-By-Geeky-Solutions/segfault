import { configureStore } from '@reduxjs/toolkit'
import codesiriusReducer from './features/codesirius/codesiriusSlice'
import {authApiSlice} from "@/lib/features/api/authApiSlice";
import {problemsApiSlice} from "@/lib/features/api/problemsApiSlice";

export const makeStore = () => {
    return configureStore({
        reducer: {
            codesirius: codesiriusReducer,
            [authApiSlice.reducerPath]: authApiSlice.reducer,
            [problemsApiSlice.reducerPath]: problemsApiSlice.reducer
        },
        middleware: (getDefaultMiddleware) => {
            return getDefaultMiddleware().concat(
                authApiSlice.middleware,
                problemsApiSlice.middleware)
        }
    })
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']