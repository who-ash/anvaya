'use client';

import * as React from 'react';
import {
    Check,
    Filter,
    X,
    Bug,
    Lightbulb,
    MessageSquare,
    HelpCircle,
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

interface RequestFiltersProps {
    selectedTypes: string[];
    setSelectedTypes: (types: string[]) => void;
    selectedStatuses: string[];
    setSelectedStatuses: (statuses: string[]) => void;
    selectedPriorities: string[];
    setSelectedPriorities: (priorities: string[]) => void;
}

const TYPE_OPTIONS = [
    { label: 'Bug Report', value: 'bug', icon: Bug },
    { label: 'Feature Request', value: 'feature_request', icon: Lightbulb },
    { label: 'Feedback', value: 'feedback', icon: MessageSquare },
    { label: 'Query', value: 'query', icon: HelpCircle },
];

const STATUS_OPTIONS = [
    { label: 'Open', value: 'open' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Resolved', value: 'resolved' },
    { label: 'Closed', value: 'closed' },
    { label: 'Rejected', value: 'rejected' },
];

const PRIORITY_OPTIONS = [
    { label: 'Low', value: 'low', color: 'bg-blue-500' },
    { label: 'Medium', value: 'medium', color: 'bg-yellow-500' },
    { label: 'High', value: 'high', color: 'bg-orange-500' },
    { label: 'Critical', value: 'critical', color: 'bg-red-500' },
];

export function RequestFilters({
    selectedTypes,
    setSelectedTypes,
    selectedStatuses,
    setSelectedStatuses,
    selectedPriorities,
    setSelectedPriorities,
}: RequestFiltersProps) {
    const [open, setOpen] = React.useState(false);

    const toggleType = (value: string) => {
        if (selectedTypes.includes(value)) {
            setSelectedTypes(selectedTypes.filter((t) => t !== value));
        } else {
            setSelectedTypes([...selectedTypes, value]);
        }
    };

    const toggleStatus = (value: string) => {
        if (selectedStatuses.includes(value)) {
            setSelectedStatuses(selectedStatuses.filter((s) => s !== value));
        } else {
            setSelectedStatuses([...selectedStatuses, value]);
        }
    };

    const togglePriority = (value: string) => {
        if (selectedPriorities.includes(value)) {
            setSelectedPriorities(
                selectedPriorities.filter((p) => p !== value),
            );
        } else {
            setSelectedPriorities([...selectedPriorities, value]);
        }
    };

    const clearFilters = () => {
        setSelectedTypes([]);
        setSelectedStatuses([]);
        setSelectedPriorities([]);
    };

    const totalFilters =
        selectedTypes.length +
        selectedStatuses.length +
        selectedPriorities.length;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 border-dashed"
                >
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                    {totalFilters > 0 && (
                        <>
                            <Separator
                                orientation="vertical"
                                className="mx-2 h-4"
                            />
                            <Badge
                                variant="secondary"
                                className="rounded-sm px-1 font-normal"
                            >
                                {totalFilters}
                            </Badge>
                        </>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search filters..." />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>

                        {/* Type Filter */}
                        <CommandGroup heading="Type">
                            {TYPE_OPTIONS.map((option) => {
                                const isSelected = selectedTypes.includes(
                                    option.value,
                                );
                                const Icon = option.icon;
                                return (
                                    <CommandItem
                                        key={option.value}
                                        onSelect={() =>
                                            toggleType(option.value)
                                        }
                                    >
                                        <div
                                            className={cn(
                                                'border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                                                isSelected
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'opacity-50 [&_svg]:invisible',
                                            )}
                                        >
                                            <Check className="h-4 w-4" />
                                        </div>
                                        <Icon className="text-muted-foreground mr-2 h-4 w-4" />
                                        <span>{option.label}</span>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>

                        <CommandSeparator />

                        {/* Status Filter */}
                        <CommandGroup heading="Status">
                            {STATUS_OPTIONS.map((option) => {
                                const isSelected = selectedStatuses.includes(
                                    option.value,
                                );
                                return (
                                    <CommandItem
                                        key={option.value}
                                        onSelect={() =>
                                            toggleStatus(option.value)
                                        }
                                    >
                                        <div
                                            className={cn(
                                                'border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                                                isSelected
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'opacity-50 [&_svg]:invisible',
                                            )}
                                        >
                                            <Check className="h-4 w-4" />
                                        </div>
                                        <span>{option.label}</span>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>

                        <CommandSeparator />

                        {/* Priority Filter */}
                        <CommandGroup heading="Priority">
                            {PRIORITY_OPTIONS.map((option) => {
                                const isSelected = selectedPriorities.includes(
                                    option.value,
                                );
                                return (
                                    <CommandItem
                                        key={option.value}
                                        onSelect={() =>
                                            togglePriority(option.value)
                                        }
                                    >
                                        <div
                                            className={cn(
                                                'border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                                                isSelected
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'opacity-50 [&_svg]:invisible',
                                            )}
                                        >
                                            <Check className="h-4 w-4" />
                                        </div>
                                        <div
                                            className={cn(
                                                'mr-2 h-2 w-2 rounded-full',
                                                option.color,
                                            )}
                                        />
                                        <span>{option.label}</span>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>

                    {totalFilters > 0 && (
                        <>
                            <CommandSeparator />
                            <div className="p-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-center"
                                    onClick={clearFilters}
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Clear filters
                                </Button>
                            </div>
                        </>
                    )}
                </Command>
            </PopoverContent>
        </Popover>
    );
}
