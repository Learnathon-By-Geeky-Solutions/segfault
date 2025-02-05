'use client'

import {ReactNode} from 'react'
import {ThemeProvider} from "@mui/material/styles";
import {Grid} from "@mui/system";
import CodesiriusAppBar from "@/components/codesirius-appbar";
import {createCodeSiriusTheme} from "@/lib/create-theme";
import {useAppDispatch, useAppSelector} from "@/lib/store/hooks";
import {AppRouterCacheProvider} from "@mui/material-nextjs/v13-appRouter";
import {AppDispatch} from "@/lib/store/store";
import {setUser} from "@/lib/store/codesiriusSlice";
import {User} from "@/types";

interface CodesiriusThemeProviderProps {
    children: ReactNode;
    user: User | null;
}

const CodesiriusApp = ({children, user}: CodesiriusThemeProviderProps) => {
    const theme = useAppSelector(state => state.codesirius.theme);
    const dispatch = useAppDispatch<AppDispatch>();
    const _user = useAppSelector(state => state.codesirius.user);
    if (user && _user  === null) {
        // only set user if it is not already set
        dispatch(setUser(user));
    }
    return (
        <AppRouterCacheProvider>
            <ThemeProvider theme={createCodeSiriusTheme(theme)}>
                <Grid size={12}>
                    <CodesiriusAppBar />
                </Grid>
                {children}
            </ThemeProvider>
        </AppRouterCacheProvider>
    );
};

export default CodesiriusApp;
