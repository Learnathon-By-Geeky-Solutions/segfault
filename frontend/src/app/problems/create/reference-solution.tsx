"use client"

import React, {useEffect, useState} from 'react';
import {Language} from "@/app/problems/create/types";
import CodeEditor from "@/components/code-editor";
import {
    ButtonGroup,
    Dialog,
    DialogContent,
    DialogContentText,
    DialogTitle,
    SelectChangeEvent,
    SvgIcon
} from "@mui/material";
import Button from "@mui/material/Button";
import {ArrowForward, FiberManualRecord} from "@mui/icons-material";
import Box from "@mui/material/Box";
import {OnChange} from "@monaco-editor/react";
import Typography from "@mui/material/Typography";
import {LiveLogsContainer, LogAccordion, LogAccordionDetails, LogAccordionSummary} from "@/components/Logs";

interface ReferenceSolutionProps {
    problemId: number;
    languages: Language[];
}

interface RotatingPublishedIconProps {
    isLoading: boolean;

}

const RotatingPublishedIcon = ({isLoading}: RotatingPublishedIconProps) => {
    return (
        <SvgIcon viewBox="0 0 24 24">
            <g>
                <animateTransform
                    attributeType="XML"
                    attributeName="transform"
                    type="rotate"
                    from="0 12 12"
                    to="360 12 12"
                    dur="1s"
                    repeatCount="indefinite"
                    begin={isLoading ? "0s" : "indefinite"}
                />
                <path
                    d="M4 12c0-2.33 1.02-4.42 2.62-5.88L9 8.5v-6H3l2.2 2.2C3.24 6.52 2 9.11 2 12c0 5.19 3.95 9.45 9 9.95v-2.02c-3.94-.49-7-3.86-7-7.93zm18 0c0-5.19-3.95-9.45-9-9.95v2.02c3.94.49 7 3.86 7 7.93 0 2.33-1.02 4.42-2.62 5.88L15 15.5v6h6l-2.2-2.2c1.96-1.82 3.2-4.41 3.2-7.3z"/>
            </g>

            <path d="M17.66 9.53l-7.07 7.07-4.24-4.24 1.41-1.41 2.83 2.83 5.66-5.66 1.41 1.41z"/>
        </SvgIcon>
    );
};

const ReferenceSolution = ({problemId, languages}: ReferenceSolutionProps) => {
    const [sourceCode, setSourceCode] = React.useState<string>("");
    const [activeLanguage, setActiveLanguage] = useState<Language>(languages[0]);
    const handleSourceCodeChange: OnChange = (value: string | undefined) => {
        if (value) {
            setSourceCode(value);
        }
    }

    const handleLanguageChange = (e: SelectChangeEvent) => {
        const lang = languages.find((lang) => lang.id === parseInt(e.target.value));
        if (lang) {
            setActiveLanguage(lang);
        }
    }

    useEffect(() => {
        console.log(activeLanguage);
    }, [activeLanguage]);

    const [isValidationLoading, setIsValidationLoading] = useState<boolean>(false);

    const handleValidate = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsValidationLoading(true);
        console.log(sourceCode);
        console.log(`Running code for problem ${problemId} in ${activeLanguage.name}`);
    }

    const [isValidationLogDialogOpen, setIsValidationLogDialogOpen] = useState<boolean>(false);

    const handleValidationLogDialogClose = () => {
        setIsValidationLogDialogOpen(false);
    }

    const [validaionLogs, setValidationLogs] = useState<string[]>([
        "Preparing environment",
        "Running on test case 1",
        "Running on test case 2",
    ]);

    return (
        <>
            <CodeEditor
                languages={languages}
                activeLanguage={activeLanguage}
                onSourceCodeChange={handleSourceCodeChange}
                onLanguageChange={handleLanguageChange}>
                <Box>
                    <Box display="flex" justifyContent="flex-end">
                        {
                            isValidationLoading &&
                          <Box display="flex" alignItems="center">
                            <FiberManualRecord color="success" fontSize="small"/>
                            <Typography mr={1}
                                        fontSize="small"
                                        sx={{
                                            ":hover": {
                                                cursor: "pointer"
                                            }
                                        }}
                                        onClick={() => setIsValidationLogDialogOpen(true)}>
                              Running...
                            </Typography>
                          </Box>
                        }
                        <ButtonGroup size="small">
                            <Button
                                variant="contained"
                                color="success"
                                onClick={handleValidate}
                                disabled={isValidationLoading}
                                startIcon={<RotatingPublishedIcon isLoading={isValidationLoading}/>}>
                                Validate
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                endIcon={<ArrowForward/>}>
                                Next
                            </Button>
                        </ButtonGroup>
                    </Box>
                </Box>
                <Dialog open={isValidationLogDialogOpen} onClose={handleValidationLogDialogClose} disablePortal>
                    <DialogContent sx={{minWidth: "30vw"}}>
                        <DialogContentText>
                            {
                                validaionLogs.map((log, index) => (
                                    <Typography key={index} variant="body1">
                                       ✅ {log}
                                    </Typography>
                                ))
                            }
                        </DialogContentText>
                    </DialogContent>
                </Dialog>
            </CodeEditor>
        </>
    );
};

export default ReferenceSolution;