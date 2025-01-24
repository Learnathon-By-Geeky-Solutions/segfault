import React from 'react';
import {Backdrop, CircularProgress} from "@mui/material";
import {useTheme} from "@mui/system";


type BlockUiProps = {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const BlockUi = ({open, onClose, children}: BlockUiProps) => {

    const theme = useTheme();


    return (
        <div style={{position: "relative"}}>
            <Backdrop
                sx={{
                    color: theme.palette.common.white,
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    position: "absolute",
                    backgroundColor: "rgba(0, 0, 0, 0.2)"
                }}
                open={open}
                // onClick={() => onClose()}
            >
                <CircularProgress color="inherit"/>
            </Backdrop>
            {children}
        </div>
    );
};

export default BlockUi;
