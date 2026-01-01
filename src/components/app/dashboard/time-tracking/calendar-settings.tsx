'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { trpc } from '@/providers/trpc-provider';
import {
    ExternalLink,
    Calendar,
    Loader2,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ProjectReminderSettingsDialog } from './project-reminder-settings-dialog';

const REMINDER_LABELS: Record<string, string> = {
    '30_min': '30 minutes before',
    '1_hour': '1 hour before',
    '2_hours': '2 hours before',
    '1_day': '1 day before',
    '2_days': '2 days before',
    '1_week': '1 week before',
};

export function CalendarSettings() {
    const utils = trpc.useUtils();
    const [isConnecting, setIsConnecting] = useState(false);

    const { data: settings, isLoading } =
        trpc.timeTracking.getCalendarSettings.useQuery();

    const { data: calendars } = trpc.timeTracking.getCalendars.useQuery(
        undefined,
        {
            enabled: !!settings?.googleRefreshToken,
        },
    );

    const { data: authUrlData } =
        trpc.timeTracking.getCalendarAuthUrl.useQuery();

    const updateSettingsMutation =
        trpc.timeTracking.updateCalendarSettings.useMutation({
            onSuccess: () => {
                utils.timeTracking.getCalendarSettings.invalidate();
            },
        });

    const disconnectMutation = trpc.timeTracking.disconnectCalendar.useMutation(
        {
            onSuccess: () => {
                utils.timeTracking.getCalendarSettings.invalidate();
                utils.timeTracking.getCalendars.invalidate();
            },
        },
    );

    const handleConnect = () => {
        if (authUrlData?.url) {
            setIsConnecting(true);
            window.location.href = authUrlData.url;
        }
    };

    const handleDisconnect = () => {
        disconnectMutation.mutate();
    };

    const handleToggleSync = (enabled: boolean) => {
        updateSettingsMutation.mutate({ syncEnabled: enabled });
    };

    const handleCalendarChange = (calendarId: string) => {
        updateSettingsMutation.mutate({ defaultCalendarId: calendarId });
    };

    const handleReminderToggle = (interval: string, enabled: boolean) => {
        const currentIntervals = settings?.reminderIntervals || [];
        const newIntervals = enabled
            ? [...currentIntervals, interval]
            : currentIntervals.filter((i) => i !== interval);

        updateSettingsMutation.mutate({ reminderIntervals: newIntervals });
    };

    const isConnected = !!settings?.googleRefreshToken;

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Google Calendar Integration
                            </CardTitle>
                            <CardDescription>
                                Sync your task due dates to Google Calendar with
                                automatic reminders
                            </CardDescription>
                        </div>
                        <ProjectReminderSettingsDialog />
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Connection Status */}
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                            {isConnected ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                                <XCircle className="h-5 w-5 text-gray-400" />
                            )}
                            <div>
                                <p className="font-medium">
                                    {isConnected
                                        ? 'Connected'
                                        : 'Not Connected'}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                    {isConnected
                                        ? 'Your calendar is synced'
                                        : 'Connect to sync task reminders'}
                                </p>
                            </div>
                        </div>
                        {isConnected ? (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDisconnect}
                                disabled={disconnectMutation.isPending}
                            >
                                {disconnectMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Disconnect
                            </Button>
                        ) : (
                            <Button
                                onClick={handleConnect}
                                disabled={isConnecting}
                            >
                                {isConnecting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                )}
                                Connect Google Calendar
                            </Button>
                        )}
                    </div>

                    {isConnected && (
                        <>
                            {/* Sync Toggle */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="sync-toggle">
                                        Auto-sync tasks
                                    </Label>
                                    <p className="text-muted-foreground text-sm">
                                        Automatically create calendar events for
                                        tasks with due dates
                                    </p>
                                </div>
                                <Switch
                                    id="sync-toggle"
                                    checked={settings?.syncEnabled || false}
                                    onCheckedChange={handleToggleSync}
                                    disabled={updateSettingsMutation.isPending}
                                />
                            </div>

                            {/* Calendar Selection */}
                            {calendars && calendars.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Default Calendar</Label>
                                    <Select
                                        value={
                                            settings?.defaultCalendarId ||
                                            'primary'
                                        }
                                        onValueChange={handleCalendarChange}
                                        disabled={
                                            updateSettingsMutation.isPending
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a calendar" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {calendars.map((cal) => (
                                                <SelectItem
                                                    key={cal.id || 'primary'}
                                                    value={cal.id || 'primary'}
                                                >
                                                    {cal.summary}
                                                    {cal.primary && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="ml-2"
                                                        >
                                                            Primary
                                                        </Badge>
                                                    )}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Reminder Settings */}
                            <div className="space-y-3">
                                <Label>Reminders</Label>
                                <p className="text-muted-foreground text-sm">
                                    Get notified before task due dates
                                </p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {Object.entries(REMINDER_LABELS).map(
                                        ([key, label]) => {
                                            const isEnabled =
                                                settings?.reminderIntervals?.includes(
                                                    key,
                                                ) || false;
                                            return (
                                                <div
                                                    key={key}
                                                    className="flex items-center justify-between rounded-lg border p-3"
                                                >
                                                    <Label
                                                        htmlFor={`reminder-${key}`}
                                                        className="cursor-pointer"
                                                    >
                                                        {label}
                                                    </Label>
                                                    <Switch
                                                        id={`reminder-${key}`}
                                                        checked={isEnabled}
                                                        onCheckedChange={(
                                                            enabled,
                                                        ) =>
                                                            handleReminderToggle(
                                                                key,
                                                                enabled,
                                                            )
                                                        }
                                                        disabled={
                                                            updateSettingsMutation.isPending
                                                        }
                                                    />
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
