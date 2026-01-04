import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: number;
    icon: LucideIcon;
    period?: string;
    iconColor?: string;
    onClick?: () => void;
}

export function StatsCard({
    title,
    value,
    icon: Icon,
    period,
    iconColor = 'text-primary',
    onClick,
}: StatsCardProps) {
    return (
        <Card
            className={
                onClick
                    ? 'hover:bg-muted/50 cursor-pointer transition-colors'
                    : ''
            }
            onClick={onClick}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div
                    className={`bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full`}
                >
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {value.toLocaleString()}
                </div>
                {period && (
                    <p className="text-muted-foreground mt-1 text-xs">
                        {period}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
