'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { trpc } from '@/providers/trpc-provider';
import { useOrganization } from '@/providers/organization-provider';
import { Settings, Loader2, FolderKanban, Bell } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const REMINDER_LABELS: Record<string, string> = {
    '30_min': '30 minutes before',
    '1_hour': '1 hour before',
    '2_hours': '2 hours before',
    '1_day': '1 day before',
    '2_days': '2 days before',
    '1_week': '1 week before',
};

interface ProjectSettingsCardProps {
    projectId: number;
    projectName: string | null;
    settings: {
        id: number;
        reminderIntervals: string[] | null;
        syncEnabled: boolean;
    } | null;
}

function ProjectSettingsCard({
    projectId,
    projectName,
    settings,
}: ProjectSettingsCardProps) {
    const utils = trpc.useUtils();

    const updateMutation =
        trpc.timeTracking.updateProjectCalendarSettings.useMutation({
            onSuccess: () => {
                utils.timeTracking.getUserProjectCalendarSettings.invalidate();
            },
        });

    const handleToggleSync = (enabled: boolean) => {
        updateMutation.mutate({ projectId, syncEnabled: enabled });
    };

    const handleReminderToggle = (interval: string, enabled: boolean) => {
        const currentIntervals = settings?.reminderIntervals || [];
        const newIntervals = enabled
            ? [...currentIntervals, interval]
            : currentIntervals.filter((i) => i !== interval);

        updateMutation.mutate({ projectId, reminderIntervals: newIntervals });
    };

    return (
        <div className="rounded-lg border p-4">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FolderKanban className="text-muted-foreground h-5 w-5" />
                    <span className="font-medium">{projectName}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Label htmlFor={`sync-${projectId}`} className="text-sm">
                        Sync enabled
                    </Label>
                    <Switch
                        id={`sync-${projectId}`}
                        checked={settings?.syncEnabled ?? true}
                        onCheckedChange={handleToggleSync}
                        disabled={updateMutation.isPending}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">
                    Default reminders for tasks in this project
                </Label>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(REMINDER_LABELS).map(([key, label]) => {
                        const isEnabled =
                            settings?.reminderIntervals?.includes(key) || false;
                        return (
                            <Badge
                                key={key}
                                variant={isEnabled ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() =>
                                    handleReminderToggle(key, !isEnabled)
                                }
                            >
                                {updateMutation.isPending ? (
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : null}
                                {label}
                            </Badge>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export function ProjectReminderSettingsDialog() {
    const [open, setOpen] = useState(false);
    const { activeOrgId } = useOrganization();

    const { data: projectSettings, isLoading } =
        trpc.timeTracking.getUserProjectCalendarSettings.useQuery(
            { organizationId: activeOrgId! },
            { enabled: !!activeOrgId && open },
        );

    const hasAdminProjects = projectSettings && projectSettings.length > 0;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Project Reminders
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Project Reminder Settings
                    </DialogTitle>
                    <DialogDescription>
                        Configure default calendar reminders for each project.
                        Only available for projects where you are an admin.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-4">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-32 w-full" />
                            ))}
                        </div>
                    ) : !hasAdminProjects ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <FolderKanban className="text-muted-foreground mb-4 h-12 w-12" />
                            <p className="text-muted-foreground text-center text-sm">
                                You don&apos;t have admin access to any
                                projects.
                                <br />
                                Only project or organization admins can
                                configure reminder settings.
                            </p>
                        </div>
                    ) : (
                        projectSettings?.map((project) => (
                            <ProjectSettingsCard
                                key={project.projectId}
                                projectId={project.projectId}
                                projectName={project.projectName}
                                settings={project.settings}
                            />
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
