"use client";
import {createContext, ReactNode, useContext, useState} from "react";
import {codesiriusStateType, themeType} from "@/types";
import {createTheme, ThemeProvider} from "@mui/material/styles";
import {Grid} from "@mui/system";
import ResponsiveAppBar from "@/components/appbar";

const CodesiriusStateContext = createContext<codesiriusStateType>({
    currentTheme: 'light',
    setCurrentTheme: () => {},
    isCodesiriusLoading: false,
    setCodesiriusLoading: () => {}
});

const createCodeSiriusTheme = (theme: themeType) => {
    return createTheme({
        typography: {
            fontFamily: 'var(--font-roboto)',
        },
        palette: {
            mode: theme
        }
    })
}

export const CodesiriusStateProvider = ({
                                            children,
                                            theme
                                        }: {
    children: ReactNode,
    theme: themeType
}) => {
    const [isCodesiriusLoading, setCodesiriusLoading] = useState<boolean>(true);
    const [currentTheme, setCurrentTheme] = useState<themeType>(theme);
    return (
        <CodesiriusStateContext.Provider value={{currentTheme, setCurrentTheme, isCodesiriusLoading, setCodesiriusLoading}}>
            <ThemeProvider theme={createCodeSiriusTheme(currentTheme)}>
                <Grid size={12}>
                    <ResponsiveAppBar />
                </Grid>
                {children}
            </ThemeProvider>
        </CodesiriusStateContext.Provider>
    );
};

export const useCodesiriusState = () => {
    const context = useContext(CodesiriusStateContext);
    if (context === undefined) {
        throw new Error('useCodesiriusState must be used within a CodesiriusStateProvider');
    }
    return context;
}

