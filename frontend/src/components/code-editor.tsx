"use client"
import React, {useEffect, useRef, useState} from "react";
import Editor, {OnChange, OnMount} from "@monaco-editor/react";
import Box from "@mui/material/Box";
import {FormControl, InputLabel, MenuItem, Select, SelectChangeEvent} from "@mui/material";
import * as monaco from "monaco-editor";
import {useAppDispatch, useAppSelector} from "@/lib/hooks/hooks";
import Grid from "@mui/material/Grid2";
import {Language} from "@/app/problems/create/types";
import {setCodesiriusLoading} from "@/lib/features/codesirius/codesiriusSlice";

interface CodeEditorProps {
    languages: Language[];
    activeLanguage: Language;
    onSourceCodeChange: OnChange;
    onLanguageChange?: (event: SelectChangeEvent) => void;
    children?: React.ReactNode;
}

const CodeEditor = ({
                        languages,
                        activeLanguage,
                        onSourceCodeChange,
                        onLanguageChange,
                        children
                    }: CodeEditorProps) => {
    const theme = useAppSelector(state => state.codesirius.theme);
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const fontSizes: number[] = [12, 14, 16, 18, 20, 22, 24, 26, 28, 30];
    const [fontSize, setFontSize] = useState<number>(14);

    const handleEditorMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;

        // Listen for language changes
        monaco.editor.onDidChangeModelLanguage(() => {
            if (!editorRef.current) return;
            // const newLang = editorRef.current.getModel()?.getLanguageId();
            // setLanguage(newLang);
        });
    };


    const formatCode = () => {
        if (editorRef.current) {
            editorRef.current.getAction("editor.action.formatDocument")?.run();
        }
    };


    const getMonacoLanguage = (lang: Language) => {
        switch (lang.name) {
            case "Python":
                return "python";
            case "Java":
                return "java";
            case "C++":
                return "cpp";
            default:
                return "plaintext";
        }
    }

    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(setCodesiriusLoading(false));
    }, []);

    return (
        <Grid container>
            <Grid size={12}>
                <Box display="flex" flexDirection="column" height="72vh" m={1} borderBottom={1}>
                    <Editor
                        height="72vh"
                        defaultLanguage={languages[0].name.toLowerCase()}
                        language={getMonacoLanguage(activeLanguage)}
                        defaultValue="// Write your code here"
                        onMount={handleEditorMount}
                        options={{automaticLayout: true, fontSize: fontSize}}
                        theme={theme === "dark" ? "vs-dark" : "vs-light"}
                        onChange={onSourceCodeChange}
                    />

                    {/* Format Button (Top-Right) */}
                    <button
                        onClick={formatCode}
                        style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                            background: "#007bff",
                            color: "white",
                            border: "none",
                            padding: "8px 12px",
                            cursor: "pointer",
                            borderRadius: "5px",
                            boxShadow: "0px 2px 5px rgba(0,0,0,0.2)",
                        }}
                    >
                        Format Code
                    </button>
                </Box>
            </Grid>
            <Grid size={2} ml={1} mt={1} mb={1}>
                <FormControl fullWidth>
                    <InputLabel id="demo-simple-select-label">Language</InputLabel>
                    <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        value={`${activeLanguage.id}`}
                        label="Language"
                        size="small"
                        onChange={onLanguageChange}
                    >
                        {
                            languages.map((lang) => (
                                <MenuItem key={lang.id} value={lang.id}>{lang.name} {lang.version}</MenuItem>
                            ))
                        }
                    </Select>
                </FormControl>
            </Grid>
            <Grid size={2} ml={1} mt={1}>
                <FormControl fullWidth>
                    <InputLabel>Font size</InputLabel>
                    <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        defaultValue={14}
                        value={fontSize}
                        label="Language"
                        size="small"
                        onChange={(e) => setFontSize(e.target.value as number)}
                    >
                        {
                            fontSizes.map((size) => (
                                <MenuItem key={size} value={size}>{size}</MenuItem>
                            ))
                        }
                    </Select>
                </FormControl>
            </Grid>
            <Grid size={7} mt={1.5}>
                {children}
                {/*<Box display="flex" justifyContent="flex-end">*/}
                {/*    <ButtonGroup size="small">*/}
                {/*        <Button*/}
                {/*            variant="contained"*/}
                {/*            color="primary"*/}

                {/*            endIcon={<ArrowForward/>}>*/}
                {/*            Next</Button>*/}
                {/*    </ButtonGroup>*/}
                {/*</Box>*/}
            </Grid>
        </Grid>
    );
};

export default CodeEditor;
