"use client"

import React, {useEffect, useState} from 'react';
import {Language} from "@/app/problems/create/types";
import CodeEditor from "@/components/code-editor";
import {ButtonGroup, SelectChangeEvent} from "@mui/material";
import Button from "@mui/material/Button";
import {ArrowForward, PublishedWithChangesOutlined} from "@mui/icons-material";
import Box from "@mui/material/Box";
import {OnChange} from "@monaco-editor/react";

interface ReferenceSolutionProps {
    problemId: number;
    languages: Language[];
}

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


    const handleValidate = (e: React.MouseEvent) => {
        e.preventDefault();
        console.log(sourceCode);
        console.log(`Running code for problem ${problemId} in ${activeLanguage.name}`);
    }
    return (
        <>
            <CodeEditor
                languages={languages}
                activeLanguage={activeLanguage}
                onSourceCodeChange={handleSourceCodeChange}
                onLanguageChange={handleLanguageChange}>
                <Box display="flex" justifyContent="flex-end">
                    <ButtonGroup size="small">
                        <Button
                            variant="contained"
                            color="success"
                            onClick={handleValidate}
                            startIcon={<PublishedWithChangesOutlined/>}>
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
            </CodeEditor>
        </>
    );
};

export default ReferenceSolution;