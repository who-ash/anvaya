'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Settings2, Clock, BarChart3, Calendar, PieChart } from 'lucide-react';
import { TimeSummaryCards } from '@/components/app/dashboard/time-tracking/time-summary-cards';
import { TaskTimeList } from '@/components/app/dashboard/time-tracking/task-time-list';
import { ProjectTimeChart } from '@/components/app/dashboard/time-tracking/project-time-chart';
import { WeeklyHoursChart } from '@/components/app/dashboard/time-tracking/weekly-hours-chart';
import { CalendarSettings } from '@/components/app/dashboard/time-tracking/calendar-settings';
import { trpc } from '@/providers/trpc-provider';
import { Badge } from '@/components/ui/badge';
import { PlayCircle } from 'lucide-react';

export default function TimeTrackingPage() {
    const [activeTab, setActiveTab] = useState('tasks');

    const { data: activeTasks } =
        trpc.timeTracking.getActiveTasksWithTimers.useQuery();

    const hasActiveTasks = activeTasks && activeTasks.length > 0;

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Time Tracking
                    </h1>
                    <p className="text-muted-foreground">
                        Automatic time tracking from your task activity
                    </p>
                </div>
                {hasActiveTasks && (
                    <Badge
                        variant="outline"
                        className="border-green-500 text-green-500"
                    >
                        <PlayCircle className="mr-1 h-3 w-3 animate-pulse" />
                        {activeTasks.length} active timer
                        {activeTasks.length > 1 ? 's' : ''}
                    </Badge>
                )}
            </div>

            {/* Summary Cards */}
            <TimeSummaryCards />

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4 flex h-auto w-fit min-w-full justify-start gap-6 rounded-none border-b bg-transparent p-0 sm:min-w-0">
                    <TabsTrigger
                        value="tasks"
                        className="data-[state=active]:border-primary flex gap-2 rounded-none border-x-0 border-t-0 border-b-2 border-transparent bg-transparent px-2 py-3 text-sm font-medium shadow-none transition-all data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        <Clock className="h-4 w-4" />
                        <span className="hidden sm:inline">Tasks</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="projects"
                        className="data-[state=active]:border-primary flex gap-2 rounded-none border-x-0 border-t-0 border-b-2 border-transparent bg-transparent px-2 py-3 text-sm font-medium shadow-none transition-all data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        <PieChart className="h-4 w-4" />
                        <span className="hidden sm:inline">Projects</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="analytics"
                        className="data-[state=active]:border-primary flex gap-2 rounded-none border-x-0 border-t-0 border-b-2 border-transparent bg-transparent px-2 py-3 text-sm font-medium shadow-none transition-all data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        <BarChart3 className="h-4 w-4" />
                        <span className="hidden sm:inline">Analytics</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="calendar"
                        className="data-[state=active]:border-primary flex gap-2 rounded-none border-x-0 border-t-0 border-b-2 border-transparent bg-transparent px-2 py-3 text-sm font-medium shadow-none transition-all data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        <Calendar className="h-4 w-4" />
                        <span className="hidden sm:inline">Calendar</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="tasks">
                    <TaskTimeList />
                </TabsContent>

                <TabsContent value="projects" className="mt-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Time by Project</CardTitle>
                            <CardDescription>
                                See how your time is distributed across projects
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ProjectTimeChart />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analytics">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Weekly Hours</CardTitle>
                                <CardDescription>
                                    Hours tracked each day this week
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <WeeklyHoursChart />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Project Distribution</CardTitle>
                                <CardDescription>
                                    Time breakdown by project
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ProjectTimeChart />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Coming soon features */}
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings2 className="h-5 w-5" />
                                Coming Soon
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {[
                                    'Productivity Score',
                                    'Peak Hours Heatmap',
                                    'Time Estimates vs Actual',
                                    'Focus Insights',
                                    'Weekly Reports',
                                    'Team Analytics',
                                ].map((feature) => (
                                    <div
                                        key={feature}
                                        className="bg-muted/50 flex items-center gap-2 rounded-lg p-3"
                                    >
                                        <div className="bg-primary/10 h-2 w-2 rounded-full" />
                                        <span className="text-muted-foreground text-sm">
                                            {feature}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="calendar">
                    <CalendarSettings />
                </TabsContent>
            </Tabs>
        </div>
    );
}
