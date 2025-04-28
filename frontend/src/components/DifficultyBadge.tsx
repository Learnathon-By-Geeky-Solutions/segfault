import { Chip } from '@mui/material';

interface DifficultyBadgeProps {
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
        case 'EASY':
            return '#4CAF50'; // Green
        case 'MEDIUM':
            return '#FF9800'; // Orange
        case 'HARD':
            return '#F44336'; // Red
        default:
            return '#9E9E9E'; // Grey
    }
};

const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
        case 'EASY':
            return 'Easy';
        case 'MEDIUM':
            return 'Medium';
        case 'HARD':
            return 'Hard';
        default:
            return difficulty;
    }
};

export const DifficultyBadge = ({ difficulty }: DifficultyBadgeProps) => {
    return (
        <Chip
            label={getDifficultyLabel(difficulty)}
            size="small"
            sx={{
                fontWeight: 600,
                minWidth: '80px',
                backgroundColor: getDifficultyColor(difficulty),
                color: 'white',
                '&:hover': {
                    backgroundColor: getDifficultyColor(difficulty),
                    opacity: 0.9,
                }
            }}
        />
    );
}; 