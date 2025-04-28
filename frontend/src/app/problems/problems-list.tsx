"use client";

import React, {useEffect, useState} from 'react';
import {useAppDispatch, useAppSelector} from "@/lib/hooks/hooks";
import {AppDispatch} from "@/lib/store";
import {setCodesiriusLoading} from "@/lib/features/codesirius/codesiriusSlice";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import {useGetProblemsQuery, useGetTagsQuery} from "@/lib/features/api/problemsApiSlice";
import {ProblemsResponse} from "@/lib/features/api/types";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import Pagination from "@mui/material/Pagination";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import CreateProblemButton from "@/app/problems/create-problem-button";
import Container from "@mui/material/Container";
import CancelIcon from "@mui/icons-material/Cancel";
import CircularProgress from "@mui/material/CircularProgress";
import Skeleton from "@mui/material/Skeleton";
import Button from "@mui/material/Button";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import {useRouter} from "next/navigation";
import { DifficultyBadge } from '@/components/DifficultyBadge';

interface ProblemsListProps {
    initialData: ProblemsResponse;
}

const ProblemsList: React.FC<ProblemsListProps> = ({initialData}) => {
    const dispatch = useAppDispatch<AppDispatch>();
    const user = useAppSelector(state => state.codesirius.user);
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [title, setTitle] = useState('');
    const [debouncedTitle, setDebouncedTitle] = useState('');
    const [selectedTags, setSelectedTags] = useState<number[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const {data: tagsData} = useGetTagsQuery();
    const {data, isLoading, isFetching} = useGetProblemsQuery(
        {
            page,
            ...(debouncedTitle && {title: debouncedTitle}),
            ...(selectedTags.length > 0 && {tags: selectedTags})
        },
        {skip: !initialData}
    );

    useEffect(() => {
        dispatch(setCodesiriusLoading(false));
    }, [dispatch]);

    useEffect(() => {
        setIsSearching(true);
        const timer = setTimeout(() => {
            setDebouncedTitle(title);
            setIsSearching(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [title]);

    const handleTagToggle = (tagId: number) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    };

    const handleResetFilters = () => {
        setTitle('');
        setDebouncedTitle('');
        setSelectedTags([]);
        setPage(1);
    };

    const hasActiveFilters = title || selectedTags.length > 0;

    const problemsData = data || initialData;
    const tags = tagsData?.data || [];

    const handleProblemClick = (problemId: number) => {
        dispatch(setCodesiriusLoading(true));
        router.push(`/problems/${problemId}`);
    };

    const renderLoadingSkeletons = () => (
        <Stack spacing={2}>
            {[1, 2, 3].map((i) => (
                <Card key={i}>
                    <CardContent>
                        <Skeleton variant="text" width="60%" height={40}/>
                        <Skeleton variant="text" width="100%" height={60}/>
                        <Box sx={{mt: 1}}>
                            <Stack direction="row" spacing={1}>
                                {[1, 2, 3].map((j) => (
                                    <Skeleton key={j} variant="rounded" width={60} height={24}/>
                                ))}
                            </Stack>
                        </Box>
                        <Box sx={{mt: 1}}>
                            <Stack direction="row" spacing={1}>
                                {[1, 2].map((j) => (
                                    <Skeleton key={j} variant="rounded" width={80} height={24}/>
                                ))}
                            </Stack>
                        </Box>
                    </CardContent>
                </Card>
            ))}
        </Stack>
    );

    const renderProblemCard = (problem: any) => (
        <Card
            key={problem.id}
            onClick={() => handleProblemClick(problem.id)}
            sx={{
                transition: 'all 0.2s ease-in-out',
                border: '1px solid',
                borderColor: 'divider',
                cursor: 'pointer',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: (theme) => theme.shadows[2],
                    borderColor: 'text.secondary',
                }
            }}
        >
            <CardContent sx={{p: 2}}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Box>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontWeight: 500,
                                color: 'text.primary',
                                mb: 0.5,
                                '&:hover': {
                                    color: 'text.secondary',
                                }
                            }}
                        >
                            {problem.title}
                        </Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                lineHeight: 1.3
                            }}
                        >
                            {problem.description}
                        </Typography>
                    </Box>
                    <DifficultyBadge difficulty={problem.difficulty} />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                        {problem.tags.map((tag: any) => (
                            <Chip
                                key={tag.id}
                                label={tag.name}
                                size="small"
                                sx={{
                                    backgroundColor: 'background.paper',
                                    color: 'text.secondary',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    height: 24,
                                    '& .MuiChip-label': {
                                        px: 1,
                                        fontSize: '0.75rem'
                                    },
                                    '&:hover': {
                                        backgroundColor: 'action.hover',
                                        color: 'text.primary'
                                    }
                                }}
                            />
                        ))}
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                        {problem.languages.map((lang: any) => (
                            <Chip
                                key={lang.id}
                                label={`${lang.name} ${lang.version}`}
                                size="small"
                                variant="outlined"
                                sx={{
                                    borderColor: 'divider',
                                    color: 'text.secondary',
                                    height: 24,
                                    '& .MuiChip-label': {
                                        px: 1,
                                        fontSize: '0.75rem'
                                    },
                                    '&:hover': {
                                        backgroundColor: 'action.hover',
                                        color: 'text.primary'
                                    }
                                }}
                            />
                        ))}
                    </Stack>
                </Box>
            </CardContent>
        </Card>
    );

    return (
        <Container maxWidth="lg">
            <Box sx={{padding: 2}}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" sx={{fontWeight: 500}}>All Problems</Typography>
                    {user && <CreateProblemButton/>}
                </Box>
                <Divider/>

                <Box sx={{my: 2}}>
                    <Box display="flex" gap={2} alignItems="center">
                        <TextField
                            fullWidth
                            placeholder="Search problems by title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action"/>
                                    </InputAdornment>
                                ),
                                endAdornment: isSearching && (
                                    <InputAdornment position="end">
                                        <CircularProgress size={20}/>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            variant="outlined"
                            startIcon={<RestartAltIcon/>}
                            onClick={handleResetFilters}
                            disabled={!hasActiveFilters}
                            sx={{
                                whiteSpace: 'nowrap',
                                borderColor: 'divider',
                                color: 'text.secondary',
                                '&:hover': {
                                    borderColor: 'text.secondary',
                                    backgroundColor: 'action.hover'
                                }
                            }}
                        >
                            Reset Filters
                        </Button>
                    </Box>
                </Box>

                <Box sx={{my: 2}}>
                    <Typography variant="subtitle1" gutterBottom sx={{fontWeight: 500}}>
                        Filter by Tags
                    </Typography>
                    <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1}}>
                        {tags.map(tag => (
                            <Chip
                                key={tag.id}
                                label={tag.name}
                                onClick={() => handleTagToggle(tag.id)}
                                onDelete={selectedTags.includes(tag.id) ? () => handleTagToggle(tag.id) : undefined}
                                deleteIcon={<CancelIcon/>}
                                color={selectedTags.includes(tag.id) ? "default" : "default"}
                                variant={selectedTags.includes(tag.id) ? "filled" : "outlined"}
                                sx={{
                                    backgroundColor: selectedTags.includes(tag.id) ? 'action.selected' : 'transparent',
                                    color: selectedTags.includes(tag.id) ? 'text.primary' : 'text.secondary',
                                    borderColor: 'divider',
                                    '&:hover': {
                                        backgroundColor: 'action.hover',
                                        color: 'text.primary'
                                    }
                                }}
                            />
                        ))}
                    </Box>
                </Box>

                {isFetching ? (
                    renderLoadingSkeletons()
                ) : (
                    <Stack spacing={1.5}>
                        {problemsData.data.results.map(renderProblemCard)}
                    </Stack>
                )}

                <Box display="flex" justifyContent="center" mt={4}>
                    <Pagination
                        count={problemsData.data.pagination.total_pages}
                        page={page}
                        onChange={(_, value) => setPage(value)}
                        color="standard"
                        sx={{
                            '& .MuiPaginationItem-root': {
                                '&.Mui-selected': {
                                    backgroundColor: 'action.selected',
                                    color: 'text.primary',
                                    '&:hover': {
                                        backgroundColor: 'action.hover'
                                    }
                                },
                                '&:hover': {
                                    backgroundColor: 'action.hover',
                                    color: 'text.primary'
                                }
                            }
                        }}
                    />
                </Box>
            </Box>
        </Container>
    );
};

export default ProblemsList;
