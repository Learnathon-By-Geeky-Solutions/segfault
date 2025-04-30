import {Roboto} from 'next/font/google';
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar"
import * as React from "react";
import {cookies, headers} from "next/headers";
import {themeType} from "@/types";
import StoreProvider from "@/app/store-provider";
import CodesiriusApp from "@/app/codesirius-app";
import {User} from "@/lib/features/api/types";

const roboto = Roboto({
    weight: ['300', '400', '500', '700'],
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-roboto',
});

export default async function RootLayout({children}: Readonly<{ children: React.ReactNode }>) {
    const cookieStore = await cookies();
    const theme = cookieStore.get('theme')?.value as themeType || 'light';

    const headersList = await headers();
    let user: User | null = null;
    if (headersList.has('x-user')) {
        const _user = headersList.get('x-user');
        if (typeof _user === 'string') {
            user = JSON.parse(_user);
        }
    }

    return (
        <html lang="en">
        <body className={roboto.variable} style={{ margin: 0, padding: 0 }}>
        <StoreProvider initialTheme={theme}>
            <CodesiriusApp user={user}>
                <Box component="main" sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'auto'
                }}>
                    <Toolbar/>
                    {children}
                </Box>
            </CodesiriusApp>
        </StoreProvider>
        </body>
        </html>
    );
}
