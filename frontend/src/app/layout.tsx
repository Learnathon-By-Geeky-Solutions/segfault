import {AppRouterCacheProvider} from '@mui/material-nextjs/v15-appRouter';
import {Roboto} from 'next/font/google';
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar"
import * as React from "react";
import {cookies} from "next/headers";
import {themeType} from "@/types";
import {CodesiriusStateProvider} from "@/contexts/codesiriusStateContext";

const roboto = Roboto({
    weight: ['300', '400', '500', '700'],
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-roboto',
});


export default async function RootLayout({children}: Readonly<{ children: React.ReactNode }>) {
    // const [darkMode, setDarkMode] = React.useState<boolean>(false);
    //
    // useEffect(() => {
    //     setDarkMode(localStorage.getItem('darkMode') === 'true');
    // }, [])

    const cookieStore = await cookies();
    const theme = cookieStore.get('theme')?.value as themeType || 'light';

    return (
        <html lang="en">
        <body className={roboto.variable}>
        <AppRouterCacheProvider options={{key: 'css'}}>
            <CodesiriusStateProvider theme={theme}>
                <Box component="main" sx={{p: 3}}>
                    <Toolbar/>
                    {children}
                </Box>
            </CodesiriusStateProvider>
        </AppRouterCacheProvider>

        </body>
        </html>
    );
}
