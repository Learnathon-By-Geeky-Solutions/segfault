import { Card, CardContent, Typography, Box } from '@mui/material';
import { Problem } from '../lib/features/api/types';
import { DifficultyBadge } from './DifficultyBadge';

interface ProblemCardProps {
    problem: Problem;
}

export const ProblemCard = ({ problem }: ProblemCardProps) => {
    // Get the first execution constraint (assuming there's at least one)
    const executionConstraint = problem.executionConstraints[0];

    return (
        <Card sx={{ minWidth: 275, mb: 2 }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" component="div">
                        {problem.title}
                    </Typography>
                    <DifficultyBadge difficulty={problem.difficulty} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                    {problem.description}
                </Typography>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                        Time Limit: {executionConstraint.timeLimit}ms
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
}; 