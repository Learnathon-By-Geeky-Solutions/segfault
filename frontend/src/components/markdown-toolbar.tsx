"use client";

import React, { useState } from 'react';
import {
    Box,
    IconButton,
    Tooltip,
    Divider,
    ButtonGroup,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Menu,
    MenuItem,
    Typography,
    InputAdornment,
    Checkbox,
} from "@mui/material";
import {
    FormatBold,
    FormatItalic,
    FormatListBulleted,
    FormatListNumbered,
    Code,
    Link as LinkIcon,
    Image as ImageIcon,
    TableChart,
    Functions,
    FormatQuote,
    Title,
    Subscript,
    Superscript,
    Calculate,
    ViewModule,
    Palette,
    SpaceBar,
} from "@mui/icons-material";
import { useTheme } from '@mui/material/styles';

interface MarkdownToolbarProps {
    onInsert: (text: string) => void;
    selectedText: string;
}

const MarkdownToolbar = ({ onInsert, selectedText }: MarkdownToolbarProps) => {
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [mathMenuAnchor, setMathMenuAnchor] = useState<null | HTMLElement>(null);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageAlt, setImageAlt] = useState('');
    const [imageWidth, setImageWidth] = useState('');
    const [imageHeight, setImageHeight] = useState('');
    const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
    const [colorDialogOpen, setColorDialogOpen] = useState(false);
    const [colorValue, setColorValue] = useState('#ff0000');
    const [fontSpacingDialogOpen, setFontSpacingDialogOpen] = useState(false);
    const [fontSpacingValue, setFontSpacingValue] = useState(1);
    const theme = useTheme();

    const handleFormat = (prefix: string, suffix: string) => {
        if (selectedText) {
            onInsert(prefix + selectedText + suffix);
        } else {
            onInsert(prefix + suffix);
        }
    };

    const handleLink = () => {
        setLinkText(selectedText);
        setLinkDialogOpen(true);
    };

    const handleImage = () => {
        setImageDialogOpen(true);
    };

    const handleMathMenu = (event: React.MouseEvent<HTMLElement>) => {
        setMathMenuAnchor(event.currentTarget);
    };

    const handleMathMenuClose = () => {
        setMathMenuAnchor(null);
    };

    const handleLinkSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!linkUrl) return;
        
        const linkMarkdown = `[${linkText || 'link text'}](${linkUrl})`;
        onInsert(linkMarkdown);
        
        setLinkDialogOpen(false);
        setLinkUrl('');
        setLinkText('');
    };

    const handleImageSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!imageUrl) return;
        
        let imageMarkdown = `![${imageAlt || 'image'}](${imageUrl})`;
        
        // Add size parameters if provided
        if (imageWidth || imageHeight) {
            try {
                const width = imageWidth ? parseInt(imageWidth) : undefined;
                const height = imageHeight ? parseInt(imageHeight) : undefined;
                
                if ((width !== undefined && !isNaN(width)) || (height !== undefined && !isNaN(height))) {
                    // Convert to HTML img tag with size attributes
                    imageMarkdown = `<img src="${imageUrl}" alt="${imageAlt || 'image'}"`;
                    if (width !== undefined && !isNaN(width)) {
                        imageMarkdown += ` width="${width}"`;
                    }
                    if (height !== undefined && !isNaN(height)) {
                        imageMarkdown += ` height="${height}"`;
                    }
                    imageMarkdown += ' />';
                }
            } catch (error) {
                // If there's any error in parsing numbers, fall back to basic markdown
                imageMarkdown = `![${imageAlt || 'image'}](${imageUrl})`;
            }
        }
        
        onInsert(imageMarkdown);
        
        setImageDialogOpen(false);
        setImageUrl('');
        setImageAlt('');
        setImageWidth('');
        setImageHeight('');
        setMaintainAspectRatio(true);
    };

    const handleImageWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newWidth = e.target.value;
        setImageWidth(newWidth);
        
        if (maintainAspectRatio && newWidth && imageHeight) {
            try {
                const width = parseInt(newWidth);
                const height = parseInt(imageHeight);
                if (!isNaN(width) && !isNaN(height)) {
                    const ratio = height / width;
                    setImageHeight(Math.round(width * ratio).toString());
                }
            } catch (error) {
                // Ignore invalid numbers
            }
        }
    };

    const handleImageHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newHeight = e.target.value;
        setImageHeight(newHeight);
        
        if (maintainAspectRatio && newHeight && imageWidth) {
            try {
                const height = parseInt(newHeight);
                const width = parseInt(imageWidth);
                if (!isNaN(height) && !isNaN(width)) {
                    const ratio = width / height;
                    setImageWidth(Math.round(height * ratio).toString());
                }
            } catch (error) {
                // Ignore invalid numbers
            }
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent, type: 'link' | 'image') => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (type === 'link') {
                handleLinkSubmit();
            } else {
                handleImageSubmit();
            }
        }
    };

    const mathSymbols = [
        { symbol: '∑', name: 'Sum', code: '\\sum' },
        { symbol: '∏', name: 'Product', code: '\\prod' },
        { symbol: '∫', name: 'Integral', code: '\\int' },
        { symbol: '√', name: 'Square Root', code: '\\sqrt' },
        { symbol: 'π', name: 'Pi', code: '\\pi' },
        { symbol: '∞', name: 'Infinity', code: '\\infty' },
        { symbol: 'x²', name: 'Square', code: '^2' },
        { symbol: 'x³', name: 'Cube', code: '^3' },
        { symbol: 'xₙ', name: 'Subscript', code: '_n' },
        { symbol: 'xⁿ', name: 'Superscript', code: '^n' },
        { symbol: '≠', name: 'Not Equal', code: '\\neq' },
        { symbol: '≤', name: 'Less Equal', code: '\\leq' },
        { symbol: '≥', name: 'Greater Equal', code: '\\geq' },
        { symbol: '±', name: 'Plus Minus', code: '\\pm' },
        { symbol: '×', name: 'Times', code: '\\times' },
        { symbol: '÷', name: 'Divide', code: '\\div' },
    ];

    const handleColor = () => {
        setColorDialogOpen(true);
    };

    const handleColorSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const text = selectedText || 'colored text';
        onInsert(`<span style="color: ${colorValue}">${text}</span>`);
        setColorDialogOpen(false);
        setColorValue('#ff0000');
    };

    const handleFontSpacing = () => {
        setFontSpacingDialogOpen(true);
    };

    const handleFontSpacingSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const text = selectedText || 'spaced text';
        onInsert(`<span style="letter-spacing: ${fontSpacingValue}px">${text}</span>`);
        setFontSpacingDialogOpen(false);
        setFontSpacingValue(1);
    };

    return (
        <>
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                p: 1,
                borderBottom: 1,
                borderColor: 'divider',
                backgroundColor: 'background.paper',
                '& .MuiButtonGroup-root': {
                    '& .MuiIconButton-root': {
                        borderRadius: 1,
                        '&:hover': {
                            backgroundColor: 'action.hover',
                        },
                    },
                },
                '& .MuiDivider-root': {
                    margin: '0 4px',
                },
            }}>
                <ButtonGroup size="small" variant="text">
                    <Tooltip title="Bold">
                        <IconButton onClick={() => handleFormat('**', '**')}>
                            <FormatBold fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Italic">
                        <IconButton onClick={() => handleFormat('*', '*')}>
                            <FormatItalic fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Code">
                        <IconButton onClick={() => handleFormat('`', '`')}>
                            <Code fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </ButtonGroup>

                <Divider orientation="vertical" flexItem />

                <ButtonGroup size="small" variant="text">
                    <Tooltip title="Bullet List">
                        <IconButton onClick={() => handleFormat('- ', '')}>
                            <FormatListBulleted fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Numbered List">
                        <IconButton onClick={() => handleFormat('1. ', '')}>
                            <FormatListNumbered fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </ButtonGroup>

                <Divider orientation="vertical" flexItem />

                <ButtonGroup size="small" variant="text">
                    <Tooltip title="Link">
                        <IconButton onClick={handleLink}>
                            <LinkIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Image">
                        <IconButton onClick={handleImage}>
                            <ImageIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Table">
                        <IconButton onClick={() => handleFormat('| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |', '')}>
                            <TableChart fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </ButtonGroup>

                <Divider orientation="vertical" flexItem />

                <ButtonGroup size="small" variant="text">
                    <Tooltip title="Inline Math">
                        <IconButton onClick={() => handleFormat('$', '$')}>
                            <Functions fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Math Symbols">
                        <IconButton onClick={handleMathMenu}>
                            <Calculate fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Block Math">
                        <IconButton onClick={() => handleFormat('$$\n', '\n$$')}>
                            <ViewModule fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Quote">
                        <IconButton onClick={() => handleFormat('> ', '')}>
                            <FormatQuote fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </ButtonGroup>

                <Divider orientation="vertical" flexItem />

                <ButtonGroup size="small" variant="text">
                    <Tooltip title="Text Color">
                        <IconButton onClick={handleColor}>
                            <Palette fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Font Spacing">
                        <IconButton onClick={handleFontSpacing}>
                            <SpaceBar fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </ButtonGroup>
            </Box>

            {/* Link Dialog */}
            <Dialog 
                open={linkDialogOpen} 
                onClose={() => setLinkDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <form onSubmit={handleLinkSubmit}>
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinkIcon color="primary" />
                        {selectedText ? `Insert link for "${selectedText}"` : 'Insert Link'}
                    </DialogTitle>
                    <DialogContent>
                        {!selectedText && (
                            <TextField
                                margin="dense"
                                label="Link Text"
                                fullWidth
                                value={linkText}
                                onChange={(e) => setLinkText(e.target.value)}
                                onKeyPress={(e) => handleKeyPress(e, 'link')}
                                placeholder="Text to display"
                                helperText="Enter the text to display for the link"
                            />
                        )}
                        <TextField
                            autoFocus
                            margin="dense"
                            label="URL"
                            type="url"
                            fullWidth
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            onKeyPress={(e) => handleKeyPress(e, 'link')}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LinkIcon fontSize="small" color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            placeholder="https://example.com"
                            helperText="Enter the URL for your link"
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
                        <Button 
                            type="submit" 
                            variant="contained" 
                            disabled={!linkUrl || (!selectedText && !linkText)}
                        >
                            Insert Link
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Image Dialog */}
            <Dialog 
                open={imageDialogOpen} 
                onClose={() => setImageDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <form onSubmit={handleImageSubmit}>
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ImageIcon color="primary" />
                        Insert Image
                    </DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Image URL"
                            type="url"
                            fullWidth
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            onKeyPress={(e) => handleKeyPress(e, 'image')}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <ImageIcon fontSize="small" color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            placeholder="https://example.com/image.jpg"
                            helperText="Enter the URL of your image"
                        />
                        <TextField
                            margin="dense"
                            label="Alt Text"
                            fullWidth
                            value={imageAlt}
                            onChange={(e) => setImageAlt(e.target.value)}
                            onKeyPress={(e) => handleKeyPress(e, 'image')}
                            placeholder="Description of the image"
                            helperText="Enter a description of the image for accessibility"
                        />
                        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                            <TextField
                                margin="dense"
                                label="Width"
                                type="number"
                                value={imageWidth}
                                onChange={handleImageWidthChange}
                                onKeyPress={(e) => handleKeyPress(e, 'image')}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">px</InputAdornment>,
                                }}
                                sx={{ flex: 1 }}
                            />
                            <TextField
                                margin="dense"
                                label="Height"
                                type="number"
                                value={imageHeight}
                                onChange={handleImageHeightChange}
                                onKeyPress={(e) => handleKeyPress(e, 'image')}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">px</InputAdornment>,
                                }}
                                sx={{ flex: 1 }}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <Checkbox
                                checked={maintainAspectRatio}
                                onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                                size="small"
                            />
                            <Typography variant="body2" color="text.secondary">
                                Maintain aspect ratio
                            </Typography>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setImageDialogOpen(false)}>Cancel</Button>
                        <Button 
                            type="submit" 
                            variant="contained" 
                            disabled={!imageUrl}
                        >
                            Insert Image
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Math Symbols Menu */}
            <Menu
                anchorEl={mathMenuAnchor}
                open={Boolean(mathMenuAnchor)}
                onClose={handleMathMenuClose}
                PaperProps={{
                    sx: {
                        maxHeight: 300,
                        width: 200,
                    },
                }}
            >
                {mathSymbols.map((symbol) => (
                    <MenuItem
                        key={symbol.code}
                        onClick={() => {
                            onInsert(symbol.code);
                            handleMathMenuClose();
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography>{symbol.symbol}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {symbol.name}
                            </Typography>
                        </Box>
                    </MenuItem>
                ))}
            </Menu>

            {/* Color Picker Dialog */}
            <Dialog 
                open={colorDialogOpen} 
                onClose={() => setColorDialogOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <form onSubmit={handleColorSubmit}>
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Palette color="primary" />
                        Choose Text Color
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                            <input
                                type="color"
                                value={colorValue}
                                onChange={e => setColorValue(e.target.value)}
                                style={{ width: 40, height: 40, border: 'none', background: 'none', cursor: 'pointer' }}
                            />
                            <TextField
                                label="Hex Code"
                                value={colorValue}
                                onChange={e => setColorValue(e.target.value)}
                                size="small"
                                sx={{ width: 120 }}
                            />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            This will wrap the selected text in a <span style={{ color: '#ff0000' }}>colored</span> span.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setColorDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained">Apply</Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Font Spacing Dialog */}
            <Dialog 
                open={fontSpacingDialogOpen} 
                onClose={() => setFontSpacingDialogOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <form onSubmit={handleFontSpacingSubmit}>
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SpaceBar color="primary" />
                        Set Font Spacing
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                            <input
                                type="range"
                                min={0}
                                max={10}
                                step={0.1}
                                value={fontSpacingValue}
                                onChange={e => setFontSpacingValue(Number(e.target.value))}
                                style={{ width: 120 }}
                            />
                            <TextField
                                label="Spacing (px)"
                                type="number"
                                value={fontSpacingValue}
                                onChange={e => setFontSpacingValue(Number(e.target.value))}
                                size="small"
                                sx={{ width: 100 }}
                                inputProps={{ min: 0, max: 10, step: 0.1 }}
                            />
                        </Box>
                        <Box sx={{ mt: 2, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, background: 'background.paper' }}>
                            <span style={{ letterSpacing: `${fontSpacingValue}px` }}>
                                This is a preview of spaced text.
                            </span>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            This will wrap the selected text in a <span style={{ letterSpacing: '2px' }}>spaced</span> span.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setFontSpacingDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained">Apply</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </>
    );
};

export default MarkdownToolbar; 