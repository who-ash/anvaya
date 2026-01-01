'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import {
    CheckCircle2,
    Circle,
    Clock,
    PauseCircle,
    XCircle,
    Eye,
    TrendingUp,
    Target,
    Award,
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
    Legend,
} from 'recharts';

interface MemberPerformance {
    id: string;
    name: string;
    email: string;
    image: string | null;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    onHoldTasks: number;
    inReviewTasks: number;
    rejectedTasks: number;
    tasks: any[];
}

interface TeamPerformanceProps {
    tasks: any[];
    showDetailedView?: boolean;
}

const COLORS = {
    done: '#22c55e',
    'in-progress': '#3b82f6',
    todo: '#94a3b8',
    'on-hold': '#f59e0b',
    'in-review': '#6366f1',
    rejected: '#ef4444',
};

export function TeamPerformance({
    tasks,
    showDetailedView = true,
}: TeamPerformanceProps) {
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
        null,
    );
    const detailsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selectedMemberId && detailsRef.current) {
            detailsRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    }, [selectedMemberId]);

    // Calculate member performance
    const memberPerformance = useMemo(() => {
        const memberMap: Record<string, MemberPerformance> = {};

        for (const task of tasks) {
            for (const member of task.members || []) {
                if (!memberMap[member.id]) {
                    memberMap[member.id] = {
                        id: member.id,
                        name: member.name,
                        email: member.email,
                        image: member.image,
                        totalTasks: 0,
                        completedTasks: 0,
                        inProgressTasks: 0,
                        todoTasks: 0,
                        onHoldTasks: 0,
                        inReviewTasks: 0,
                        rejectedTasks: 0,
                        tasks: [],
                    };
                }

                memberMap[member.id].totalTasks++;
                memberMap[member.id].tasks.push(task);

                switch (task.status) {
                    case 'done':
                        memberMap[member.id].completedTasks++;
                        break;
                    case 'in-progress':
                        memberMap[member.id].inProgressTasks++;
                        break;
                    case 'todo':
                        memberMap[member.id].todoTasks++;
                        break;
                    case 'on-hold':
                        memberMap[member.id].onHoldTasks++;
                        break;
                    case 'in-review':
                        memberMap[member.id].inReviewTasks++;
                        break;
                    case 'rejected':
                        memberMap[member.id].rejectedTasks++;
                        break;
                }
            }
        }

        return Object.values(memberMap).sort(
            (a, b) => b.completedTasks - a.completedTasks,
        );
    }, [tasks]);

    const selectedMember = selectedMemberId
        ? memberPerformance.find((m) => m.id === selectedMemberId)
        : null;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'done':
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'in-progress':
                return <Clock className="h-4 w-4 text-blue-500" />;
            case 'todo':
                return <Circle className="text-muted-foreground h-4 w-4" />;
            case 'on-hold':
                return <PauseCircle className="h-4 w-4 text-amber-500" />;
            case 'in-review':
                return <Eye className="h-4 w-4 text-indigo-500" />;
            case 'rejected':
                return <XCircle className="text-destructive h-4 w-4" />;
            default:
                return <Circle className="text-muted-foreground h-4 w-4" />;
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Get pie chart data for selected member
    const getPieChartData = (member: MemberPerformance) =>
        [
            { name: 'Done', value: member.completedTasks, color: COLORS.done },
            {
                name: 'In Progress',
                value: member.inProgressTasks,
                color: COLORS['in-progress'],
            },
            { name: 'Todo', value: member.todoTasks, color: COLORS.todo },
            {
                name: 'On Hold',
                value: member.onHoldTasks,
                color: COLORS['on-hold'],
            },
            {
                name: 'In Review',
                value: member.inReviewTasks,
                color: COLORS['in-review'],
            },
            {
                name: 'Rejected',
                value: member.rejectedTasks,
                color: COLORS.rejected,
            },
        ].filter((d) => d.value > 0);

    // Get bar chart data for all members comparison
    const getBarChartData = () =>
        memberPerformance.slice(0, 8).map((m) => ({
            name: m.name.split(' ')[0],
            Done: m.completedTasks,
            'In Progress': m.inProgressTasks,
            Todo: m.todoTasks,
        }));

    if (memberPerformance.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-muted mb-4 rounded-full p-4">
                    <Target className="text-muted-foreground h-8 w-8" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                    No Team Members Assigned
                </h3>
                <p className="text-muted-foreground max-w-sm">
                    Tasks in this sprint don't have any team members assigned
                    yet. Assign members to tasks to see performance metrics.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Team Overview Bar Chart */}
            {memberPerformance.length > 1 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <TrendingUp className="h-4 w-4" />
                            Team Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={getBarChartData()}>
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <RechartsTooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="Done"
                                        fill={COLORS.done}
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="In Progress"
                                        fill={COLORS['in-progress']}
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="Todo"
                                        fill={COLORS.todo}
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Member Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {memberPerformance.map((member, index) => {
                    const completionRate =
                        member.totalTasks > 0
                            ? Math.round(
                                  (member.completedTasks / member.totalTasks) *
                                      100,
                              )
                            : 0;
                    const isSelected = selectedMemberId === member.id;
                    const isTopPerformer =
                        index === 0 && member.completedTasks > 0;

                    return (
                        <Card
                            key={member.id}
                            className={`cursor-pointer transition-all hover:shadow-md ${
                                isSelected ? 'ring-primary ring-2' : ''
                            }`}
                            onClick={() =>
                                setSelectedMemberId(
                                    isSelected ? null : member.id,
                                )
                            }
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className="relative">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage
                                                src={member.image || ''}
                                                alt={member.name}
                                            />
                                            <AvatarFallback>
                                                {getInitials(member.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        {isTopPerformer && (
                                            <div className="absolute -top-1 -right-1 rounded-full bg-amber-500 p-1">
                                                <Award className="h-3 w-3 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate font-semibold">
                                                {member.name}
                                            </p>
                                            {isTopPerformer && (
                                                <Badge
                                                    variant="outline"
                                                    className="border-amber-300 text-xs text-amber-600"
                                                >
                                                    Top Performer
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-muted-foreground truncate text-sm">
                                            {member.email}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold">
                                            {completionRate}%
                                        </p>
                                        <p className="text-muted-foreground text-xs">
                                            complete
                                        </p>
                                    </div>
                                </div>

                                <Progress
                                    value={completionRate}
                                    className="mt-4 h-2"
                                />

                                <div className="mt-4 grid grid-cols-4 gap-2 text-center text-sm">
                                    <div className="bg-muted/50 rounded p-2">
                                        <p className="font-semibold">
                                            {member.totalTasks}
                                        </p>
                                        <p className="text-muted-foreground text-xs">
                                            Total
                                        </p>
                                    </div>
                                    <div className="rounded bg-green-500/10 p-2">
                                        <p className="font-semibold text-green-600">
                                            {member.completedTasks}
                                        </p>
                                        <p className="text-muted-foreground text-xs">
                                            Done
                                        </p>
                                    </div>
                                    <div className="rounded bg-blue-500/10 p-2">
                                        <p className="font-semibold text-blue-600">
                                            {member.inProgressTasks}
                                        </p>
                                        <p className="text-muted-foreground text-xs">
                                            Active
                                        </p>
                                    </div>
                                    <div className="bg-muted/50 rounded p-2">
                                        <p className="font-semibold">
                                            {member.todoTasks}
                                        </p>
                                        <p className="text-muted-foreground text-xs">
                                            Todo
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Selected Member Detail View */}
            {selectedMember && showDetailedView && (
                <div ref={detailsRef} className="scroll-mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage
                                        src={selectedMember.image || ''}
                                        alt={selectedMember.name}
                                    />
                                    <AvatarFallback>
                                        {getInitials(selectedMember.name)}
                                    </AvatarFallback>
                                </Avatar>
                                {selectedMember.name}'s Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Pie Chart */}
                                <div className="h-64">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <PieChart>
                                            <Pie
                                                data={getPieChartData(
                                                    selectedMember,
                                                )}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                paddingAngle={3}
                                                dataKey="value"
                                                label={({ name, percent }) =>
                                                    `${name} ${((percent || 0) * 100).toFixed(0)}%`
                                                }
                                            >
                                                {getPieChartData(
                                                    selectedMember,
                                                ).map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.color}
                                                    />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip
                                                contentStyle={{
                                                    backgroundColor:
                                                        'hsl(var(--card))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius: '8px',
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Task List */}
                                <div className="max-h-64 space-y-2 overflow-y-auto">
                                    <h4 className="mb-3 font-medium">
                                        Assigned Tasks
                                    </h4>
                                    {selectedMember.tasks.map((task: any) => (
                                        <Link
                                            key={task.id}
                                            href={`/dashboard/tasks/${task.id}`}
                                            className="hover:bg-accent flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
                                        >
                                            {getStatusIcon(task.status)}
                                            <span className="flex-1 truncate">
                                                {task.name}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="shrink-0 text-xs"
                                            >
                                                {task.status.replace('-', ' ')}
                                            </Badge>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
