import {styled} from "@mui/system";
import MuiAccordion, {AccordionProps} from "@mui/material/Accordion";
import React from "react";
import MuiAccordionSummary, {accordionSummaryClasses, AccordionSummaryProps} from "@mui/material/AccordionSummary";
import ArrowForwardIosSharpIcon from "@mui/icons-material/ArrowForwardIosSharp";
import MuiAccordionDetails from "@mui/material/AccordionDetails";

const LogAccordion = styled((props: AccordionProps) => (
    <MuiAccordion disableGutters elevation={0} square {...props} />
))(({theme}) => ({
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    '&:not(:last-child)': {
        borderBottom: 0,
    },
    '&::before': {
        display: 'none',
    },
    transition: 'border 0.3s ease',
    '&:hover': {
        borderColor: theme.palette.primary.main,
    },
}));

const LogAccordionSummary = styled((props: AccordionSummaryProps) => (
    <MuiAccordionSummary
        expandIcon={<ArrowForwardIosSharpIcon sx={{fontSize: '0.9rem'}} />}
        {...props}
    />
))(({theme}) => ({
    backgroundColor: 'rgba(0, 0, 0, .03)',
    flexDirection: 'row-reverse',
    [`& .${accordionSummaryClasses.expandIconWrapper}.${accordionSummaryClasses.expanded}`]: {
        transform: 'rotate(90deg)',
    },
    [`& .${accordionSummaryClasses.content}`]: {
        marginLeft: theme.spacing(1),
        fontWeight: 600,
    },
    ...theme.applyStyles('dark', {
        backgroundColor: 'rgba(255, 255, 255, .05)',
    }),
}));

const LogAccordionDetails = styled(MuiAccordionDetails)(({theme}) => ({
    padding: theme.spacing(2),
    borderTop: '1px solid rgba(0, 0, 0, .125)',
    color: theme.palette.text.primary,
    fontFamily: 'monospace',
    fontSize: '0.875rem',
    maxHeight: 300,
    overflowY: 'auto',
    '& pre': {
        margin: 0,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
    },
}));

const LiveLogsContainer = styled('div')(({theme}) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    margin: theme.spacing(2, 0),
    maxHeight: '80vh',
    overflowY: 'auto',
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
}));


export {LogAccordion, LogAccordionSummary, LogAccordionDetails, LiveLogsContainer};

