import {themeType} from "@/types";
import {createTheme} from "@mui/material/styles";

export const createCodeSiriusTheme = (theme: themeType) => {
    return createTheme({
        typography: {
            fontFamily: 'var(--font-roboto)',
        },
        palette: {
            mode: theme,
            // primary: {
            //     main: '#8017f5',
            // },
            // secondary: {
            //     main: '#f50057',
            // },
        },
    })
}