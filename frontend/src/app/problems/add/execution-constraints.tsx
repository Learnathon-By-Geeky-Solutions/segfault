import React from 'react';
import {Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField} from "@mui/material";

interface ExecutionConstraintsProps {
    selectedLanguages: string[];
    timeLimit: number | undefined;
    setTimeLimit: (timeLimit: number) => void;
    memoryLimit: number | undefined;
    setMemoryLimit: (memoryLimit: number) => void;
}

const ExecutionConstraints = ({
                                  selectedLanguages,
                                  timeLimit,
                                  setTimeLimit,
                                  memoryLimit,
                                  setMemoryLimit
                              }: ExecutionConstraintsProps) => {
    return (
        <div>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Language</TableCell>
                            <TableCell>Time Limit</TableCell>
                            <TableCell>Memory Limit</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {selectedLanguages.map((language, index) => (
                            <TableRow key={index}>
                                <TableCell>{language}</TableCell>
                                <TableCell>
                                    <TextField
                                        value={timeLimit}
                                        onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                                        type="number"
                                        fullWidth
                                        id="time-limit"
                                        label="Time Limit"
                                        variant="outlined"
                                        placeholder="Time Limit"
                                    />
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        value={memoryLimit}
                                        onChange={(e) => setMemoryLimit(parseInt(e.target.value))}
                                        type="number"
                                        fullWidth
                                        id="memory-limit"
                                        label="Memory Limit"
                                        variant="outlined"
                                        placeholder="Memory Limit"
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
};

export default ExecutionConstraints;