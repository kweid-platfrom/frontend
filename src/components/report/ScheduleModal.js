// components/report/ScheduleModal.jsx
'use client';

import React, { useState } from 'react';
import { useReports } from '@/hooks/useReports';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Clock, Trash2, Calendar, Info } from 'lucide-react';

const ScheduleModal = ({ open, onOpenChange, schedules, reportTypes }) => {
    const { saveSchedule, deleteSchedule } = useReports();
    const [isCreating, setIsCreating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newSchedule, setNewSchedule] = useState({
        type: 'Weekly QA Summary',
        frequency: 'weekly',
        active: true
    });

    const handleCreateSchedule = async () => {
        setIsSaving(true);
        try {
            await saveSchedule(newSchedule);
            setNewSchedule({
                type: 'Weekly QA Summary',
                frequency: 'weekly',
                active: true
            });
            setIsCreating(false);
        } catch (err) {
            console.error('Error creating schedule:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleSchedule = async (schedule) => {
        setIsSaving(true);
        try {
            await saveSchedule({
                ...schedule,
                active: !schedule.active
            });
        } catch (err) {
            console.error('Error toggling schedule:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteSchedule = async (scheduleId) => {
        if (!confirm('Are you sure you want to delete this schedule?')) return;
        
        setIsSaving(true);
        try {
            await deleteSchedule(scheduleId);
        } catch (err) {
            console.error('Error deleting schedule:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const getNextRunText = (schedule) => {
        if (!schedule.nextRun) return 'Not scheduled';
        const nextRun = schedule.nextRun.toDate ? schedule.nextRun.toDate() : new Date(schedule.nextRun);
        const now = new Date();
        const diffMs = nextRun - now;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        
        if (diffMs < 0) return 'Overdue - will run on next visit';
        if (diffDays === 0) {
            if (diffHours === 0) return 'In less than an hour';
            return `In ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
        }
        return `In ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    };

    const getFrequencyLabel = (frequency) => {
        const labels = {
            daily: 'Daily',
            weekly: 'Weekly',
            monthly: 'Monthly'
        };
        return labels[frequency] || frequency;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader className="pb-4">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Clock className="h-5 w-5" />
                        Report Schedules
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        Manage automatic report generation schedules
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-1 -mx-1">
                    <div className="space-y-8 py-2">
                        {/* Active Schedules Section */}
                        {!isCreating && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        Schedules
                                    </h3>
                                    <span className="text-xs text-muted-foreground">
                                        {schedules.length} {schedules.length === 1 ? 'schedule' : 'schedules'}
                                    </span>
                                </div>
                                
                                {schedules.length === 0 ? (
                                    <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed border-border">
                                        <Calendar className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
                                        <p className="text-sm font-medium text-foreground mb-1">No schedules yet</p>
                                        <p className="text-xs text-muted-foreground">
                                            Create your first schedule to automate report generation
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {schedules.map((schedule) => (
                                            <div
                                                key={schedule.id}
                                                className="group p-4 border border-border rounded-lg hover:border-primary/40 hover:shadow-sm transition-all bg-card"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-foreground mb-2">
                                                            {schedule.type}
                                                        </h4>
                                                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                                            <span className="font-medium">
                                                                {getFrequencyLabel(schedule.frequency)}
                                                            </span>
                                                            <span className="text-muted-foreground/60">•</span>
                                                            <span>
                                                                {getNextRunText(schedule)}
                                                            </span>
                                                        </div>
                                                        {schedule.lastRun && (
                                                            <p className="text-xs text-muted-foreground/80 mt-2">
                                                                Last run: {new Date(schedule.lastRun.toDate()).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-3 flex-shrink-0">
                                                        <div className="flex items-center gap-2">
                                                            <Switch
                                                                checked={schedule.active}
                                                                onCheckedChange={() => handleToggleSchedule(schedule)}
                                                                disabled={isSaving}
                                                            />
                                                            <span className={`text-xs font-medium ${schedule.active ? 'text-green-600' : 'text-muted-foreground'}`}>
                                                                {schedule.active ? 'Active' : 'Paused'}
                                                            </span>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteSchedule(schedule.id)}
                                                            disabled={isSaving}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Create New Schedule Form */}
                        {isCreating && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                                        New Schedule
                                    </h3>
                                    
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="schedule-type" className="text-sm font-medium">
                                                Report Type
                                            </Label>
                                            <Select
                                                value={newSchedule.type}
                                                onValueChange={(value) => 
                                                    setNewSchedule({ ...newSchedule, type: value })
                                                }
                                            >
                                                <SelectTrigger id="schedule-type" className="h-11">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {reportTypes
                                                        .filter(type => 
                                                            type.includes('Summary') || 
                                                            type.includes('Weekly') || 
                                                            type.includes('Monthly')
                                                        )
                                                        .map((type) => (
                                                            <SelectItem key={type} value={type}>
                                                                {type}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="schedule-frequency" className="text-sm font-medium">
                                                Frequency
                                            </Label>
                                            <Select
                                                value={newSchedule.frequency}
                                                onValueChange={(value) => 
                                                    setNewSchedule({ ...newSchedule, frequency: value })
                                                }
                                            >
                                                <SelectTrigger id="schedule-frequency" className="h-11">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="daily">Daily</SelectItem>
                                                    <SelectItem value="weekly">Weekly</SelectItem>
                                                    <SelectItem value="monthly">Monthly</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm font-medium">Start Active</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Schedule will begin running immediately
                                                </p>
                                            </div>
                                            <Switch
                                                checked={newSchedule.active}
                                                onCheckedChange={(checked) => 
                                                    setNewSchedule({ ...newSchedule, active: checked })
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Info Box */}
                        {!isCreating && (
                            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
                                <div className="flex gap-3">
                                    <Info className="h-5 w-5 text-primary dark:text-primary/40 flex-shrink-0 mt-0.5" />
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-primary/90 dark:text-blue-100">
                                            How Scheduling Works
                                        </h4>
                                        <ul className="text-sm space-y-1.5">
                                            <li>Reports generate automatically when you visit the Reports page</li>
                                            <li>Schedules check if the next run time has passed</li>
                                            <li>After generation, the next run time updates automatically</li>
                                            <li>Pause schedules anytime using the toggle switch</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-border mt-4">
                    {isCreating ? (
                        <>
                            <Button 
                                onClick={() => setIsCreating(false)} 
                                variant="outline"
                                disabled={isSaving}
                                className="min-w-24"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateSchedule}
                                disabled={isSaving}
                                className="min-w-32"
                            >
                                {isSaving ? 'Creating...' : 'Create Schedule'}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button 
                                onClick={() => onOpenChange(false)} 
                                variant="outline"
                                className="min-w-24"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => setIsCreating(true)}
                                className="min-w-40"
                            >
                                Create Schedule
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ScheduleModal;