import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Search,
    Plus,
    Filter,
    AlertCircle,
    Clock,
    CheckCircle2,
} from 'lucide-react';

const issues = [
    {
        id: 'ANV-101',
        title: 'Setup page routing for dashboard',
        status: 'In Progress',
        priority: 'High',
        assignedTo: 'Ash',
        createdAt: '2 hours ago',
    },
    {
        id: 'ANV-102',
        title: 'Fix sidebar organization fetching',
        status: 'Done',
        priority: 'Medium',
        assignedTo: 'Dev',
        createdAt: '5 hours ago',
    },
    {
        id: 'ANV-103',
        title: 'Add mock data to all pages',
        status: 'Backlog',
        priority: 'High',
        assignedTo: 'Ash',
        createdAt: '1 day ago',
    },
    {
        id: 'ANV-104',
        title: 'Implement auth layout restricted routes',
        status: 'In Progress',
        priority: 'Critical',
        assignedTo: 'Lead',
        createdAt: '3 hours ago',
    },
    {
        id: 'ANV-105',
        title: 'Update README with setup instructions',
        status: 'Backlog',
        priority: 'Low',
        assignedTo: 'Dev',
        createdAt: '2 days ago',
    },
];

export default function IssuesPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Issues
                    </h1>
                    <p className="text-muted-foreground">
                        Track bugs, tasks, and feature requests.
                    </p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> New Issue
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative max-w-sm flex-1">
                    <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                    <Input className="pl-8" placeholder="Search issues..." />
                </div>
                <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
                <div className="ml-auto flex items-center gap-4">
                    <div className="text-muted-foreground flex items-center gap-1 text-sm">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <span>2 Critical</span>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-1 text-sm">
                        <div className="h-2 w-2 rounded-full bg-orange-500" />
                        <span>5 High</span>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-md border">
                <div className="bg-muted/50 grid grid-cols-[80px_1fr_120px_100px_120px] border-b p-4 text-sm font-medium">
                    <div>ID</div>
                    <div>Title</div>
                    <div>Status</div>
                    <div>Priority</div>
                    <div>Assignee</div>
                </div>
                {issues.map((issue) => (
                    <div
                        key={issue.id}
                        className="hover:bg-muted/30 group grid cursor-pointer grid-cols-[80px_1fr_120px_100px_120px] border-b p-4 transition-colors last:border-0"
                    >
                        <div className="text-muted-foreground font-mono text-xs">
                            {issue.id}
                        </div>
                        <div className="flex flex-col">
                            <span className="group-hover:text-primary text-sm font-medium transition-colors">
                                {issue.title}
                            </span>
                            <span className="text-muted-foreground mt-0.5 text-[10px]">
                                Created {issue.createdAt}
                            </span>
                        </div>
                        <div>
                            <Badge
                                variant={
                                    issue.status === 'Done'
                                        ? 'default'
                                        : issue.status === 'In Progress'
                                          ? 'secondary'
                                          : 'outline'
                                }
                                className="text-[10px]"
                            >
                                {issue.status}
                            </Badge>
                        </div>
                        <div>
                            <span
                                className={`flex items-center gap-1 text-[10px] font-semibold ${
                                    issue.priority === 'Critical'
                                        ? 'text-red-500'
                                        : issue.priority === 'High'
                                          ? 'text-orange-500'
                                          : issue.priority === 'Medium'
                                            ? 'text-yellow-600'
                                            : 'text-blue-500'
                                }`}
                            >
                                {issue.priority === 'Critical' && (
                                    <AlertCircle className="h-3 w-3" />
                                )}
                                {issue.priority}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="bg-muted flex h-6 w-6 items-center justify-center rounded-full text-[8px] font-bold">
                                {issue.assignedTo[0]}
                            </div>
                            <span className="text-xs">{issue.assignedTo}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
