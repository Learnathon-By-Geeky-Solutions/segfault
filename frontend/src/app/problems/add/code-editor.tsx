import React, {useRef, useState} from "react";
import Editor, {OnMount} from "@monaco-editor/react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import {ButtonGroup, FormControl, InputLabel, MenuItem, Select} from "@mui/material";
import * as monaco from "monaco-editor";
import {useAppSelector} from "@/lib/hooks/hooks";
import Grid from "@mui/material/Grid2";
import {ArrowForward, PlayArrow} from "@mui/icons-material";


const CodeEditor = () => {
    const theme = useAppSelector(state => state.codesirius.theme);
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const [language, setLanguage] = useState<string | undefined>("javascript");


    const handleEditorMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;

        // Listen for language changes
        monaco.editor.onDidChangeModelLanguage(() => {
            if (!editorRef.current) return;
            const newLang = editorRef.current.getModel()?.getLanguageId();
            setLanguage(newLang);
        });
    };


    const formatCode = () => {
        if (editorRef.current) {
            editorRef.current.getAction("editor.action.formatDocument")?.run();
        }
    };

    return (
        <Grid container>
            <Grid size={12}>
                <Box display="flex" flexDirection="column" height="72vh" m={1} borderBottom={1}>
                    <Editor
                        height="72vh"
                        defaultLanguage="javascript"
                        defaultValue="// Write your code here"
                        onMount={handleEditorMount}
                        options={{automaticLayout: true}}
                        theme={theme === "dark" ? "vs-dark" : "vs-light"}
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
                        value="JavaScript"
                        label="Language"
                        size="small"
                        // onChange={handleChange}
                    >
                        <MenuItem value={10}>Ten</MenuItem>
                        <MenuItem value={20}>Twenty</MenuItem>
                        <MenuItem value={30}>Thirty</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid size={9} mt={1.5}>
                <Box display="flex" justifyContent="flex-end">
                    <ButtonGroup size="small">
                        <Button variant="contained" color="success" startIcon={<PlayArrow/>}>
                            Run
                        </Button>
                        <Button variant="contained" color="primary" endIcon={<ArrowForward/>}>Next</Button>
                    </ButtonGroup>
                </Box>
            </Grid>
        </Grid>
    );
};

export default CodeEditor;
