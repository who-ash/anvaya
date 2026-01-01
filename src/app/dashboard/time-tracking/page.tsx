import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Square, Clock, Calendar, CheckCircle2 } from 'lucide-react';

const timeLogs = [
    {
        id: 1,
        task: 'Dashboard UI Design',
        project: 'Anvaya Core',
        duration: '2h 15m',
        date: 'Today',
    },
    {
        id: 2,
        task: 'API Integration',
        project: 'E-commerce Platform',
        duration: '4h 30m',
        date: 'Today',
    },
    {
        id: 3,
        task: 'Bug Fixing',
        project: 'Mobile Banking App',
        duration: '1h 45m',
        date: 'Yesterday',
    },
    {
        id: 4,
        task: 'Meeting with Client',
        project: 'E-commerce Platform',
        duration: '1h 00m',
        date: 'Yesterday',
    },
];

export default function TimeTrackingPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Time Tracking
                    </h1>
                    <p className="text-muted-foreground">
                        Keep track of your billable hours and productivity.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Calendar className="mr-2 h-4 w-4" /> Calendar View
                    </Button>
                    <Button>Report Log</Button>
                </div>
            </div>

            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                        <div className="flex items-center gap-4">
                            <div className="bg-primary text-primary-foreground rounded-full p-3">
                                <Play className="h-6 w-6 fill-current" />
                            </div>
                            <div>
                                <p className="text-primary text-sm font-medium">
                                    Currently Working On
                                </p>
                                <h2 className="text-2xl font-bold">
                                    Creating Mock Data for Pages
                                </h2>
                                <p className="text-muted-foreground text-xs">
                                    Project: Anvaya Infrastructure
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-8">
                            <div className="text-center">
                                <p className="text-muted-foreground text-sm">
                                    Time Elapsed
                                </p>
                                <p className="font-mono text-3xl font-bold">
                                    00:45:12
                                </p>
                            </div>
                            <Button variant="destructive" size="lg">
                                <Square className="mr-2 h-4 w-4 fill-current" />{' '}
                                Stop
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Today
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">6h 45m</div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-green-500">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>On track for goal (8h)</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            This Week
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">32h 15m</div>
                        <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                            <Clock className="h-3 w-3" />
                            <span>7h remaining to 40h</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Billable Amount
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$2,450.00</div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-green-500">
                            <TrendingUp className="h-3 w-3" />
                            <span>+15% from last week</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Recent Logs</h2>
                <div className="rounded-md border">
                    <div className="bg-muted/50 grid grid-cols-4 border-b p-4 font-medium">
                        <div>Task</div>
                        <div>Project</div>
                        <div>Date</div>
                        <div className="text-right">Duration</div>
                    </div>
                    {timeLogs.map((log) => (
                        <div
                            key={log.id}
                            className="hover:bg-muted/30 grid grid-cols-4 border-b p-4 transition-colors last:border-0"
                        >
                            <div className="text-sm font-medium">
                                {log.task}
                            </div>
                            <div className="text-muted-foreground text-sm">
                                {log.project}
                            </div>
                            <div className="text-muted-foreground text-sm">
                                {log.date}
                            </div>
                            <div className="text-right font-mono text-sm">
                                {log.duration}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function TrendingUp(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
        </svg>
    );
}
