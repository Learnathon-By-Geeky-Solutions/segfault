import React from 'react';
import {Grow, Paper} from "@mui/material";
import Box from "@mui/material/Box";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {Preview} from "@mui/icons-material";
import Typography from "@mui/material/Typography";

interface LivePreviewProps {
    title: string;
    description: string;
    timeLimit: number | undefined;
    memoryLimit: number | undefined;
}

const createHeader = (title: string, timeLimit: number | undefined, memoryLimit: number | undefined) => {
    let res: string = '';

    if (title) {
        res += `## ${title}\n\n`;
    }
    if (timeLimit) {
        res += `**Time Limit:** ${timeLimit} seconds \\\n`;
    }
    if (memoryLimit) {
        res += `**Memory Limit:** ${memoryLimit} MB \\\n`;
    }

    res += '**Input:** Standard Input \\\n';
    res += '**Output:** Standard Output';

    res += '\n\n---\n\n';

    return res;
}

const LivePreview = ({title, description, timeLimit, memoryLimit}: LivePreviewProps) => {
    return (
        <>
            {
                title.length > 0 ?
                    <Grow in>
                        <Box component={Paper} p={2} sx={{height: '75vh', overflow: 'auto'}} elevation={5}>
                            {title &&
                              <Box textAlign="center">
                                <Markdown>
                                    {createHeader(title, timeLimit, memoryLimit)}
                                </Markdown>
                              </Box>
                            }
                            {/*<Divider/>*/}
                            <Markdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {description || 'No Description yet'}
                            </Markdown>
                        </Box>
                    </Grow> :
                    <Grow in>
                        <Box display="flex" justifyContent="center" alignItems="center"
                             sx={{height: '75vh', border: '1px dashed #ccc'}}>
                            <Preview color="disabled"/>
                            <Typography color="textDisabled">
                                Live Preview will appear here
                            </Typography>
                        </Box>
                    </Grow>
            }
        </>
    );
};

export default LivePreview;