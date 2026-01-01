'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DatePickerProps {
    date?: Date | null;
    onDateChange: (date: Date | undefined) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    showTime?: boolean;
}

export function DatePicker({
    date,
    onDateChange,
    placeholder = 'Pick a date',
    className,
    disabled = false,
    showTime = false,
}: DatePickerProps) {
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
        date ?? undefined,
    );
    const [timeValue, setTimeValue] = React.useState<string>(
        date ? format(date, 'HH:mm') : '12:00',
    );

    React.useEffect(() => {
        if (date) {
            setSelectedDate(date);
            setTimeValue(format(date, 'HH:mm'));
        }
    }, [date]);

    const handleDateSelect = (newDate: Date | undefined) => {
        if (newDate) {
            const [hours, minutes] = timeValue.split(':').map(Number);
            newDate.setHours(hours || 0, minutes || 0, 0, 0);
            setSelectedDate(newDate);
            onDateChange(newDate);
        } else {
            setSelectedDate(undefined);
            onDateChange(undefined);
        }
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = e.target.value;
        setTimeValue(newTime);

        if (selectedDate) {
            const [hours, minutes] = newTime.split(':').map(Number);
            const newDate = new Date(selectedDate);
            newDate.setHours(hours || 0, minutes || 0, 0, 0);
            setSelectedDate(newDate);
            onDateChange(newDate);
        }
    };

    const formatDisplay = () => {
        if (!selectedDate) return null;
        if (showTime) {
            return format(selectedDate, 'PPP p');
        }
        return format(selectedDate, 'PPP');
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        'w-full justify-start text-left font-normal',
                        !selectedDate && 'text-muted-foreground',
                        className,
                    )}
                    disabled={disabled}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                        formatDisplay()
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                />
                {showTime && (
                    <div className="border-t p-3">
                        <div className="flex items-center gap-2">
                            <Clock className="text-muted-foreground h-4 w-4" />
                            <Label htmlFor="time-input" className="sr-only">
                                Time
                            </Label>
                            <Input
                                id="time-input"
                                type="time"
                                value={timeValue}
                                onChange={handleTimeChange}
                                className="w-full"
                            />
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
