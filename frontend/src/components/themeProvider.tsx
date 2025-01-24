'use client'

import {useState} from 'react'
import {createTheme, ThemeProvider} from "@mui/material/styles";
import {Grid} from "@mui/system";
import ResponsiveAppBar from "@/components/appbar";
import * as React from "react";
import {themeType} from "@/types";

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

export default function CodesiriusThemeProvider({
                                                    children,
                                                    theme
                                                }: {
    children: React.ReactNode,
    theme: themeType
}) {
    const [currentTheme, setCurrentTheme] = useState<themeType>(theme);

    return (
        <ThemeProvider theme={createCodeSiriusTheme(currentTheme)}>
            <Grid size={12}>
                <ResponsiveAppBar theme={currentTheme} setTheme={setCurrentTheme}/>
            </Grid>
            {children}
        </ThemeProvider>
    );
}
