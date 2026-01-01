import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Mic,
    MicOff,
    Video as VideoIcon,
    VideoOff,
    PhoneOff,
    Settings,
    Users,
    MessageSquare,
    Hand,
    MoreHorizontal,
} from 'lucide-react';

export default function MeetPage() {
    return (
        <div className="flex h-[calc(100vh-120px)] flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Board Room
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Strategic planning & high-level meetings.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="mr-4 flex -space-x-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="border-background bg-muted flex h-8 w-8 items-center justify-center rounded-full border-2 text-[10px] font-bold"
                            >
                                U{i}
                            </div>
                        ))}
                        <div className="border-background bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full border-2 text-[10px] font-bold">
                            +12
                        </div>
                    </div>
                    <Button variant="outline" size="sm">
                        <Settings className="mr-2 h-4 w-4" /> Setup
                    </Button>
                    <Button size="sm">Join Meeting</Button>
                </div>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-4">
                {/* Main video area */}
                <div className="grid grid-cols-2 gap-4 md:col-span-3">
                    <Card className="bg-muted border-primary relative aspect-video overflow-hidden border-2">
                        <CardContent className="flex h-full items-center justify-center p-0">
                            <div className="bg-primary/20 text-primary flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold">
                                YO
                            </div>
                            <div className="bg-background/80 absolute bottom-4 left-4 rounded border px-2 py-1 text-xs font-medium backdrop-blur-sm">
                                You (Host)
                            </div>
                            <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                        </CardContent>
                    </Card>
                    <Card className="bg-muted relative aspect-video overflow-hidden">
                        <CardContent className="flex h-full items-center justify-center p-0">
                            <div className="bg-muted-foreground/20 flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold">
                                JS
                            </div>
                            <div className="bg-background/80 absolute bottom-4 left-4 rounded border px-2 py-1 text-xs font-medium backdrop-blur-sm">
                                Jessica Smith
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-muted relative aspect-video overflow-hidden">
                        <CardContent className="flex h-full items-center justify-center p-0">
                            <div className="bg-muted-foreground/20 flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold">
                                MK
                            </div>
                            <div className="bg-background/80 absolute bottom-4 left-4 rounded border px-2 py-1 text-xs font-medium backdrop-blur-sm">
                                Mark Kim
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-muted relative aspect-video overflow-hidden">
                        <CardContent className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 p-0">
                            <VideoOff className="h-10 w-10 opacity-20" />
                            <span className="text-xs font-medium">
                                Camera Off
                            </span>
                            <div className="bg-background/80 absolute bottom-4 left-4 rounded border px-2 py-1 text-xs font-medium backdrop-blur-sm">
                                Andrew Sy
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar for chat/participants */}
                <div className="bg-muted/10 hidden flex-col gap-4 rounded-xl border p-4 md:flex">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="text-sm font-semibold">Meeting Chat</h3>
                        <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-[10px]">
                            3
                        </span>
                    </div>
                    <div className="flex-1 space-y-4">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold">
                                Jessica Smith{' '}
                                <span className="text-muted-foreground font-normal">
                                    10:45 AM
                                </span>
                            </span>
                            <p className="bg-muted rounded-lg rounded-tl-none p-2 text-xs">
                                Should we start the presentation?
                            </p>
                        </div>
                        <div className="space-y-1 text-right">
                            <span className="text-[10px] font-bold">
                                You{' '}
                                <span className="text-muted-foreground font-normal">
                                    10:46 AM
                                </span>
                            </span>
                            <p className="bg-primary text-primary-foreground rounded-lg rounded-tr-none p-2 text-xs">
                                Yes, go ahead. I'm ready.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 border-t pt-4">
                        <input
                            className="flex-1 border-none bg-transparent text-xs focus:outline-none"
                            placeholder="Message everyone..."
                        />
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-background mx-auto flex w-fit items-center justify-center gap-4 rounded-full border px-6 py-4 shadow-lg">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full"
                >
                    <Mic className="h-5 w-5" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full"
                >
                    <VideoIcon className="h-5 w-5" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full"
                >
                    <Hand className="h-5 w-5" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full"
                >
                    <Users className="h-5 w-5" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full"
                >
                    <MessageSquare className="h-5 w-5" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full"
                >
                    <MoreHorizontal className="h-5 w-5" />
                </Button>
                <Separator orientation="vertical" className="mx-2 h-8" />
                <Button
                    variant="destructive"
                    size="icon"
                    className="h-12 w-12 rounded-full"
                >
                    <PhoneOff className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
}

function Separator({
    orientation,
    className,
}: {
    orientation: string;
    className?: string;
}) {
    return (
        <div
            className={`bg-border ${orientation === 'vertical' ? 'h-full w-[1px]' : 'h-[1px] w-full'} ${className}`}
        />
    );
}
