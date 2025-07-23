// components/LinkedCellPopover.js
'use client';

import React, { useState } from 'react';
import { useTestCases, useBugs } from '../hooks';
import { Popover, Chip, Button, List, ListItem } from '@mui/material';

const LinkedCellPopover = ({ resourceType, resourceId, linkedIds, onLink, onUnlink }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const { testCases } = useTestCases();
    const { bugs } = useBugs();

    const resources = resourceType === 'testCase' ? bugs : testCases;

    const handleOpen = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);
    const handleLink = (id) => {
        onLink(resourceId, [id]);
        handleClose();
    };
    const handleUnlink = (id) => {
        onUnlink(resourceId, id);
        handleClose();
    };

    return (
        <div className="flex items-center gap-2">
            {linkedIds.map(id => (
                <Chip
                    key={id}
                    label={resources.find(r => r.id === id)?.title || id}
                    onDelete={() => handleUnlink(id)}
                    onClick={handleOpen}
                    size="small"
                />
            ))}
            <Button size="small" onClick={handleOpen}>[+]</Button>
            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <List>
                    {resources
                        .filter(r => !linkedIds.includes(r.id))
                        .map(r => (
                            <ListItem
                                key={r.id}
                                onClick={() => handleLink(r.id)}
                                className="cursor-pointer hover:bg-gray-100"
                            >
                                {r.title}
                            </ListItem>
                        ))}
                </List>
            </Popover>
        </div>
    );
};

export default LinkedCellPopover;