'use client'
import {useRef} from 'react'
import {Provider} from 'react-redux'
import {themeType} from "@/types";
import {AppStore, makeStore} from "@/lib/store";
import {setCodesiriusLoading, setProgress, setTheme} from "@/lib/features/codesirius/codesiriusSlice";

interface StoreProviderProps {
    readonly children: React.ReactNode,
    initialTheme: themeType
}

export default function StoreProvider({children, initialTheme}: StoreProviderProps) {
    const storeRef = useRef<AppStore | null>(null)
    if (!storeRef.current) {
        // Create the store instance the first time this renders
        storeRef.current = makeStore()
        storeRef.current.dispatch(setTheme(initialTheme));
        storeRef.current.dispatch(setCodesiriusLoading(true));
        storeRef.current.dispatch(setProgress(5));
    }


    return (
        <Provider store={storeRef.current}>
            {children}
        </Provider>)
}