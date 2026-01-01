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

import { ProjectReminderSettingsDialog } from './project-reminder-settings-dialog';

export function CalendarSettings() {
    const utils = trpc.useUtils();
    const [isConnecting, setIsConnecting] = useState(false);

    const { data: settings, isLoading } =
        trpc.timeTracking.getCalendarSettings.useQuery();

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
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
