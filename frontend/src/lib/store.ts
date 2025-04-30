import {configureStore} from '@reduxjs/toolkit'
import codesiriusReducer from './features/codesirius/codesiriusSlice'
import {authApiSlice} from "@/lib/features/api/authApiSlice";
import {problemsApiSlice} from "@/lib/features/api/problemsApiSlice";
import {submissionApiSlice} from "@/lib/features/api/submissionApiSlice";
import addProblemSlice from "@/lib/features/codesirius/addProblemSlice";

export const makeStore = () => {
    return configureStore({
        reducer: {
            codesirius: codesiriusReducer,
            addProblem: addProblemSlice,
            [authApiSlice.reducerPath]: authApiSlice.reducer,
            [problemsApiSlice.reducerPath]: problemsApiSlice.reducer,
            [submissionApiSlice.reducerPath]: submissionApiSlice.reducer
        },
        middleware: (getDefaultMiddleware) => {
            return getDefaultMiddleware({serializableCheck: false})
                .concat(
                    authApiSlice.middleware,
                    problemsApiSlice.middleware,
                    submissionApiSlice.middleware)
        }
    })
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
