'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/providers/trpc-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Clock, PlayCircle } from 'lucide-react';
import Link from 'next/link';

function formatDuration(seconds: number | null): string {
    if (!seconds) return '—';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours === 0) {
        return `${minutes}m`;
    }
    return `${hours}h ${minutes}m`;
}

function formatDate(date: Date): string {
    const now = new Date();
    const inputDate = new Date(date);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (inputDate >= today) {
        return 'Today';
    } else if (inputDate >= yesterday) {
        return 'Yesterday';
    }
    return formatDistanceToNow(inputDate, { addSuffix: true });
}

export function TaskTimeList() {
    const [now, setNow] = useState(new Date());

    const { data: timeEntries, isLoading } =
        trpc.timeTracking.getUserTimeEntries.useQuery({ limit: 20 });

    const { data: activeTasks } =
        trpc.timeTracking.getActiveTasksWithTimers.useQuery();

    // Update "now" every second to show real-time elapsed time for active entries
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Calculate display duration - for active entries, compute elapsed time in real-time
    const getDisplayDuration = (entry: {
        durationSeconds: number | null;
        endedAt: Date | null;
        startedAt: Date;
    }) => {
        if (entry.endedAt) {
            // Completed entry - use stored duration
            return formatDuration(entry.durationSeconds);
        }
        // Active entry - calculate elapsed time in real-time
        const elapsedSeconds = Math.floor(
            (now.getTime() - new Date(entry.startedAt).getTime()) / 1000,
        );
        return formatDuration(elapsedSeconds);
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border p-4"
                    >
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                    </div>
                ))}
            </div>
        );
    }

    if (!timeEntries || timeEntries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
                <Clock className="text-muted-foreground mb-4 h-12 w-12" />
                <h3 className="text-lg font-semibold">No time entries yet</h3>
                <p className="text-muted-foreground text-sm">
                    Start working on tasks to track your time automatically
                </p>
            </div>
        );
    }

    // Create a set of active task IDs
    const activeTaskIds = new Set(activeTasks?.map((t) => t.taskId) || []);

    return (
        <div className="space-y-2">
            <div className="bg-muted/50 grid grid-cols-4 rounded-t-lg border p-4 font-medium">
                <div>Task</div>
                <div>Project</div>
                <div>Date</div>
                <div className="text-right">Duration</div>
            </div>
            <div className="rounded-b-lg border border-t-0">
                {timeEntries.map((entry) => {
                    const isActive = activeTaskIds.has(entry.taskId);
                    return (
                        <div
                            key={entry.id}
                            className="hover:bg-muted/30 grid grid-cols-4 border-b p-4 transition-colors last:border-0"
                        >
                            <div className="flex items-center gap-2">
                                {isActive && (
                                    <PlayCircle className="h-4 w-4 animate-pulse text-green-500" />
                                )}
                                <Link
                                    href={`/dashboard/tasks/${entry.taskId}`}
                                    className="text-sm font-medium hover:underline"
                                >
                                    {entry.taskName || 'Unknown Task'}
                                </Link>
                            </div>
                            <div className="text-muted-foreground text-sm">
                                {entry.projectName || '—'}
                            </div>
                            <div className="text-muted-foreground text-sm">
                                {formatDate(entry.startedAt)}
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                {/* {isActive && (
                                    <Badge
                                        variant="outline"
                                        className="border-green-500 text-green-500"
                                    >
                                        Active
                                    </Badge>
                                )} */}
                                <span className="font-mono text-sm">
                                    {getDisplayDuration(entry)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
