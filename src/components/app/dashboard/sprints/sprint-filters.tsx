'use client';

import * as React from 'react';
import { Check, ChevronLeft, Filter, Folder, ListTodo, X } from 'lucide-react';
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

interface SprintFiltersProps {
    projects: Project[];
    selectedProjectIds: number[];
    setSelectedProjectIds: (ids: number[]) => void;
    selectedStatuses: string[];
    setSelectedStatuses: (statuses: string[]) => void;
    hideProjectFilter?: boolean;
}

const STATUS_OPTIONS = [
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' },
    { label: 'Planned (Inactive)', value: 'inactive' }, // based on backend schema
];

export function SprintFilters({
    projects,
    selectedProjectIds,
    setSelectedProjectIds,
    selectedStatuses,
    setSelectedStatuses,
    hideProjectFilter = false,
}: SprintFiltersProps) {
    const [open, setOpen] = React.useState(false);
    const [view, setView] = React.useState<'main' | 'projects' | 'status'>(
        'main',
    );

    const toggleProject = (id: number) => {
        if (selectedProjectIds.includes(id)) {
            setSelectedProjectIds(
                selectedProjectIds.filter((pid) => pid !== id),
            );
        } else {
            setSelectedProjectIds([...selectedProjectIds, id]);
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
        setSelectedStatuses([]);
        setOpen(false);
        setView('main');
    };

    const activeFilterCount =
        (hideProjectFilter ? 0 : selectedProjectIds.length) +
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
                                className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 py-0"
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
                <div className="ml-2 flex flex-wrap items-center gap-1.5">
                    <Separator orientation="vertical" className="mx-1 h-4" />
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
                                    <X
                                        className="hover:text-destructive h-3 w-3 cursor-pointer transition-colors"
                                        onClick={() => toggleProject(id)}
                                    />
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
                                <X
                                    className="hover:text-destructive h-3 w-3 cursor-pointer transition-colors"
                                    onClick={() => toggleStatus(status)}
                                />
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
