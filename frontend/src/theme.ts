'use client';
import {createTheme} from '@mui/material/styles';


const createCodeSiriusTheme = (dark: boolean) => {
    return createTheme({
        colorSchemes: {
            dark
        }
    })
}

export default createCodeSiriusTheme;
