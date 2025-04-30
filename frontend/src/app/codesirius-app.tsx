'use client'

import {ReactNode, useEffect, useState} from 'react'
import {ThemeProvider} from "@mui/material/styles";
import CodesiriusAppBar from "@/components/codesirius-appbar";
import {AppRouterCacheProvider} from "@mui/material-nextjs/v13-appRouter";
import {useAppDispatch, useAppSelector} from "@/lib/hooks/hooks";
import {AppDispatch} from "@/lib/store";
import {setUser} from "@/lib/features/codesirius/codesiriusSlice";
import {createCodeSiriusTheme} from "@/lib/utils/create-theme";
import {User} from "@/lib/features/api/types";
import { NotificationProvider } from '@/contexts/NotificationContext';
import SplashScreen from '@/components/SplashScreen';

interface CodesiriusThemeProviderProps {
    children: ReactNode;
    user: User | null;
}

const CodesiriusApp = ({children, user}: CodesiriusThemeProviderProps) => {
    const theme = useAppSelector(state => state.codesirius.theme);
    const dispatch = useAppDispatch<AppDispatch>();
    const _user = useAppSelector(state => state.codesirius.user);
    const [isFirstRender, setIsFirstRender] = useState(true);

    useEffect(() => {
        if (isFirstRender) {
            setIsFirstRender(false);
        }
    }, [isFirstRender]);

    if (user && _user === null) {
        // only set user if it is not already set
        dispatch(setUser(user));
    }

    return (
        <AppRouterCacheProvider>
            <ThemeProvider theme={createCodeSiriusTheme(theme)}>
                <NotificationProvider>
                    {isFirstRender && <SplashScreen />}
                    <CodesiriusAppBar/>
                    {children}
                </NotificationProvider>
            </ThemeProvider>
        </AppRouterCacheProvider>
    );
};

export default CodesiriusApp;
