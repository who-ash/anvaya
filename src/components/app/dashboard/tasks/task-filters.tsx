'use client';

import * as React from 'react';
import {
    Check,
    ChevronLeft,
    Filter,
    Folder,
    ListTodo,
    X,
    Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Project {
    id: number;
    name: string;
}

interface Sprint {
    id: number;
    name: string;
    projectId: number;
}

interface TaskFiltersProps {
    projects: Project[];
    selectedProjectIds: number[];
    setSelectedProjectIds: (ids: number[]) => void;
    sprints: Sprint[];
    selectedSprintIds: number[];
    setSelectedSprintIds: (ids: number[]) => void;
    selectedStatuses: string[];
    setSelectedStatuses: (statuses: string[]) => void;
    hideProjectFilter?: boolean;
}

const STATUS_OPTIONS = [
    { label: 'Todo', value: 'todo' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Done', value: 'done' },
    { label: 'On Hold', value: 'on-hold' },
    { label: 'In Review', value: 'in-review' },
    { label: 'Rejected', value: 'rejected' },
];

export function TaskFilters({
    projects,
    selectedProjectIds,
    setSelectedProjectIds,
    sprints,
    selectedSprintIds,
    setSelectedSprintIds,
    selectedStatuses,
    setSelectedStatuses,
    hideProjectFilter = false,
}: TaskFiltersProps) {
    const [open, setOpen] = React.useState(false);
    const [view, setView] = React.useState<
        'main' | 'projects' | 'sprints' | 'status'
    >('main');

    const toggleProject = (id: number) => {
        if (selectedProjectIds.includes(id)) {
            setSelectedProjectIds(
                selectedProjectIds.filter((pid) => pid !== id),
            );
            // Also remove sprints belonging to this project if they were selected
            const sprintsToRemove = sprints
                .filter((s) => s.projectId === id)
                .map((s) => s.id);
            setSelectedSprintIds(
                selectedSprintIds.filter(
                    (sid) => !sprintsToRemove.includes(sid),
                ),
            );
        } else {
            setSelectedProjectIds([...selectedProjectIds, id]);
        }
    };

    const toggleSprint = (id: number) => {
        if (selectedSprintIds.includes(id)) {
            setSelectedSprintIds(selectedSprintIds.filter((sid) => sid !== id));
        } else {
            setSelectedSprintIds([...selectedSprintIds, id]);
        }
    };

    const toggleStatus = (value: string) => {
        if (selectedStatuses.includes(value)) {
            setSelectedStatuses(selectedStatuses.filter((s) => s !== value));
        } else {
            setSelectedStatuses([...selectedStatuses, value]);
        }
    };

    const clearFilters = () => {
        if (!hideProjectFilter) setSelectedProjectIds([]);
        setSelectedSprintIds([]);
        setSelectedStatuses([]);
        setOpen(false);
        setView('main');
    };

    const activeFilterCount =
        (hideProjectFilter ? 0 : selectedProjectIds.length) +
        selectedSprintIds.length +
        selectedStatuses.length;

    return (
        <div className="flex items-center gap-2">
            <Popover
                open={open}
                onOpenChange={(val) => {
                    setOpen(val);
                    if (!val) setView('main');
                }}
            >
                <PopoverTrigger asChild>
                    <Button variant="outline" className="h-9 gap-2">
                        <Filter className="h-4 w-4" />
                        Filters
                        {activeFilterCount > 0 && (
                            <Badge
                                variant="secondary"
                                className="flex h-5 min-w-5 items-center justify-center rounded-full px-1 py-0"
                            >
                                {activeFilterCount}
                            </Badge>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="start">
                    <Command>
                        <CommandList>
                            {view === 'main' && (
                                <CommandGroup>
                                    {!hideProjectFilter && (
                                        <CommandItem
                                            onSelect={() => setView('projects')}
                                            className="flex cursor-pointer items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Folder className="h-4 w-4" />
                                                <span>Projects</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {selectedProjectIds.length >
                                                    0 && (
                                                    <span className="text-muted-foreground text-xs">
                                                        {
                                                            selectedProjectIds.length
                                                        }
                                                    </span>
                                                )}
                                                <ChevronLeft className="h-4 w-4 rotate-180" />
                                            </div>
                                        </CommandItem>
                                    )}
                                    <CommandItem
                                        onSelect={() => setView('sprints')}
                                        className="flex cursor-pointer items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Zap className="h-4 w-4" />
                                            <span>Sprints</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {selectedSprintIds.length > 0 && (
                                                <span className="text-muted-foreground text-xs">
                                                    {selectedSprintIds.length}
                                                </span>
                                            )}
                                            <ChevronLeft className="h-4 w-4 rotate-180" />
                                        </div>
                                    </CommandItem>
                                    <CommandItem
                                        onSelect={() => setView('status')}
                                        className="flex cursor-pointer items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2">
                                            <ListTodo className="h-4 w-4" />
                                            <span>Status</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {selectedStatuses.length > 0 && (
                                                <span className="text-muted-foreground text-xs">
                                                    {selectedStatuses.length}
                                                </span>
                                            )}
                                            <ChevronLeft className="h-4 w-4 rotate-180" />
                                        </div>
                                    </CommandItem>
                                </CommandGroup>
                            )}

                            {view === 'projects' && (
                                <>
                                    <div className="flex items-center p-2 pt-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setView('main')}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className="ml-2 text-sm font-medium">
                                            Projects
                                        </span>
                                    </div>
                                    <CommandSeparator />
                                    <CommandInput
                                        placeholder="Search projects..."
                                        className="h-9"
                                    />
                                    <CommandEmpty>
                                        No project found.
                                    </CommandEmpty>
                                    <CommandGroup className="max-h-64 overflow-y-auto">
                                        {projects.map((project) => (
                                            <CommandItem
                                                key={project.id}
                                                onSelect={() =>
                                                    toggleProject(project.id)
                                                }
                                                className="cursor-pointer"
                                            >
                                                <div
                                                    className={cn(
                                                        'border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                                                        selectedProjectIds.includes(
                                                            project.id,
                                                        )
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'opacity-50 [&_svg]:invisible',
                                                    )}
                                                >
                                                    <Check className="h-3 w-3" />
                                                </div>
                                                <span>{project.name}</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </>
                            )}

                            {view === 'sprints' && (
                                <>
                                    <div className="flex items-center p-2 pt-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setView('main')}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className="ml-2 text-sm font-medium">
                                            Sprints
                                        </span>
                                    </div>
                                    <CommandSeparator />
                                    <CommandInput
                                        placeholder="Search sprints..."
                                        className="h-9"
                                    />
                                    <CommandEmpty>
                                        No sprint found.
                                    </CommandEmpty>
                                    <CommandGroup className="max-h-64 overflow-y-auto">
                                        {sprints.map((sprint) => (
                                            <CommandItem
                                                key={sprint.id}
                                                onSelect={() =>
                                                    toggleSprint(sprint.id)
                                                }
                                                className="cursor-pointer"
                                            >
                                                <div
                                                    className={cn(
                                                        'border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                                                        selectedSprintIds.includes(
                                                            sprint.id,
                                                        )
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'opacity-50 [&_svg]:invisible',
                                                    )}
                                                >
                                                    <Check className="h-3 w-3" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span>{sprint.name}</span>
                                                    {!selectedProjectIds.length && (
                                                        <span className="text-muted-foreground text-[10px]">
                                                            {
                                                                projects.find(
                                                                    (p) =>
                                                                        p.id ===
                                                                        sprint.projectId,
                                                                )?.name
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </>
                            )}

                            {view === 'status' && (
                                <>
                                    <div className="flex items-center p-2 pt-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setView('main')}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className="ml-2 text-sm font-medium">
                                            Status
                                        </span>
                                    </div>
                                    <CommandSeparator />
                                    <CommandGroup>
                                        {STATUS_OPTIONS.map((status) => (
                                            <CommandItem
                                                key={status.value}
                                                onSelect={() =>
                                                    toggleStatus(status.value)
                                                }
                                                className="cursor-pointer"
                                            >
                                                <div
                                                    className={cn(
                                                        'border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                                                        selectedStatuses.includes(
                                                            status.value,
                                                        )
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'opacity-50 [&_svg]:invisible',
                                                    )}
                                                >
                                                    <Check className="h-3 w-3" />
                                                </div>
                                                <span>{status.label}</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </>
                            )}
                        </CommandList>
                    </Command>
                    {activeFilterCount > 0 && (
                        <div className="border-t p-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-full justify-center text-xs font-medium"
                            >
                                Clear all filters
                            </Button>
                        </div>
                    )}
                </PopoverContent>
            </Popover>

            {activeFilterCount > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                    <Separator orientation="vertical" className="h-4" />
                    {!hideProjectFilter &&
                        selectedProjectIds.map((id) => {
                            const project = projects.find((p) => p.id === id);
                            if (!project) return null;
                            return (
                                <Badge
                                    key={id}
                                    variant="secondary"
                                    className="bg-primary/5 text-primary border-primary/20 gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-normal"
                                >
                                    {project.name}
                                    <span
                                        role="button"
                                        className="hover:text-destructive pointer-events-auto cursor-pointer transition-colors"
                                        onClick={() => toggleProject(id)}
                                    >
                                        <X className="h-3 w-3" />
                                    </span>
                                </Badge>
                            );
                        })}
                    {selectedSprintIds.map((id) => {
                        const sprint = sprints.find((s) => s.id === id);
                        if (!sprint) return null;
                        return (
                            <Badge
                                key={id}
                                variant="secondary"
                                className="gap-1 rounded-sm border-indigo-200 bg-indigo-500/5 px-1.5 py-0.5 text-[11px] font-normal text-indigo-600"
                            >
                                {sprint.name}
                                <span
                                    role="button"
                                    className="hover:text-destructive pointer-events-auto cursor-pointer transition-colors"
                                    onClick={() => toggleSprint(id)}
                                >
                                    <X className="h-3 w-3" />
                                </span>
                            </Badge>
                        );
                    })}
                    {selectedStatuses.map((status) => {
                        const option = STATUS_OPTIONS.find(
                            (o) => o.value === status,
                        );
                        if (!option) return null;
                        return (
                            <Badge
                                key={status}
                                variant="secondary"
                                className="bg-secondary/50 text-secondary-foreground border-secondary gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-normal"
                            >
                                {option.label}
                                <span
                                    role="button"
                                    className="hover:text-destructive pointer-events-auto cursor-pointer transition-colors"
                                    onClick={() => toggleStatus(status)}
                                >
                                    <X className="h-3 w-3" />
                                </span>
                            </Badge>
                        );
                    })}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-muted-foreground hover:text-destructive h-7 px-2 text-[11px] font-medium"
                    >
                        Clear all
                    </Button>
                </div>
            )}
        </div>
    );
}
