import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Download,
    Share2,
    Filter,
    ChevronRight,
    BarChart3,
    PieChart as PieChartIcon,
    LineChart,
} from 'lucide-react';

const reports = [
    {
        id: 1,
        name: 'Monthly Performance Review',
        type: 'Performance',
        date: 'Jan 1, 2026',
        status: 'Generated',
    },
    {
        id: 2,
        name: 'Q4 Financial Summary',
        type: 'Financial',
        date: 'Dec 31, 2025',
        status: 'Archive',
    },
    {
        id: 3,
        name: 'Team Velocity Report',
        type: 'Sprint',
        date: 'Jan 15, 2026',
        status: 'Scheduled',
    },
    {
        id: 4,
        name: 'User Retention Analysis',
        type: 'Product',
        date: 'Jan 5, 2026',
        status: 'Generated',
    },
];

export default function ReportsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Reports
                    </h1>
                    <p className="text-muted-foreground">
                        Analyze your data and project insights.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" /> Filter
                    </Button>
                    <Button>
                        <Share2 className="mr-2 h-4 w-4" /> Export All
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Daily Active Users
                        </CardTitle>
                        <BarChart3 className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1,284</div>
                        <div className="mt-2 flex h-[60px] w-full items-end gap-1">
                            {[40, 60, 45, 70, 55, 80, 65].map((h, i) => (
                                <div
                                    key={i}
                                    className="bg-primary/20 hover:bg-primary flex-1 cursor-pointer rounded-t-sm transition-colors"
                                    style={{ height: `${h}%` }}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Project Distribution
                        </CardTitle>
                        <PieChartIcon className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">8 Active</div>
                        <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between text-[10px]">
                                <span>Web Development</span>
                                <span>45%</span>
                            </div>
                            <div className="bg-muted h-1 w-full overflow-hidden rounded-full">
                                <div
                                    className="h-full bg-blue-500"
                                    style={{ width: '45%' }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                                <span>Mobile Apps</span>
                                <span>30%</span>
                            </div>
                            <div className="bg-muted h-1 w-full overflow-hidden rounded-full">
                                <div
                                    className="h-full bg-purple-500"
                                    style={{ width: '30%' }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Issue Resolution
                        </CardTitle>
                        <LineChart className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">92.4%</div>
                        <p className="mt-1 flex items-center gap-1 text-xs text-green-500">
                            <TrendingUp className="h-3 w-3" />
                            <span>+4.2% since last month</span>
                        </p>
                        <div className="bg-muted/20 relative mt-4 h-[40px] w-full overflow-hidden rounded">
                            <div className="border-primary/20 absolute inset-0 border-b" />
                            <svg
                                className="absolute inset-0 overflow-visible"
                                viewBox="0 0 100 40"
                            >
                                <path
                                    d="M0,35 Q20,10 40,25 T80,5 T100,20"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="text-primary"
                                />
                            </svg>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Available Reports</h2>
                <div className="grid gap-3">
                    {reports.map((report) => (
                        <div
                            key={report.id}
                            className="hover:bg-muted/50 group flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-muted rounded p-2">
                                    <Download className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">
                                        {report.name}
                                    </p>
                                    <p className="text-muted-foreground text-[10px]">
                                        {report.type} • {report.date}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="bg-muted text-muted-foreground rounded-full border px-2 py-0.5 text-xs">
                                    {report.status}
                                </span>
                                <ChevronRight className="text-muted-foreground h-4 w-4" />
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
