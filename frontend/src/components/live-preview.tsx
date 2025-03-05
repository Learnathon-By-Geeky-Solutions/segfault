"use client";
import React from 'react';
import {Paper} from "@mui/material";
import Box from "@mui/material/Box";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {Preview} from "@mui/icons-material";
import Typography from "@mui/material/Typography";
import {useAppSelector} from "@/lib/hooks/hooks";

const createHeader = (title: string) => {
    let res: string = '';

    if (title) {
        res += `## ${title}\n\n`;
    }
    // if (timeLimit) {
    //     res += `**Time Limit:** ${timeLimit} seconds \\\n`;
    // }
    // if (memoryLimit) {
    //     res += `**Memory Limit:** ${memoryLimit} MB \\\n`;
    // }

    res += '**Input:** Standard Input \\\n';
    res += '**Output:** Standard Output';

    res += '\n\n---\n\n';

    return res;
}


const LivePreview = () => {
    const title = useAppSelector(state => state.addProblem.title);
    const description = useAppSelector(state => state.addProblem.description);

    return (
        <>
            {
                title ?
                    <Box component={Paper} p={2} sx={{
                        overflow: 'auto',
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        minHeight: "100%",
                        maxWidth: "100%",
                        whiteSpace: "pre-wrap"
                    }} elevation={5}>
                        {title &&
                          <Box textAlign="center">
                            <Markdown>
                                {createHeader(title)}
                            </Markdown>
                          </Box>
                        }
                        {/*<Divider/>*/}
                        <Markdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {description || 'No Description yet'}
                        </Markdown>
                    </Box>
                    :
                    <Box display="flex" justifyContent="center" alignItems="center"
                         sx={{border: '1px dashed #ccc', minHeight: "100%"}}>
                        <Preview color="disabled"/>
                        <Typography color="textDisabled">
                            Live Preview will appear here
                        </Typography>
                    </Box>
            }
        </>
    );
};

export default LivePreview;
