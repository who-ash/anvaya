import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Bot,
    User,
    Send,
    Sparkles,
    Wand2,
    History,
    RotateCcw,
} from 'lucide-react';

export default function GPTPage() {
    return (
        <div className="flex h-[calc(100vh-120px)] flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary group flex h-10 w-10 items-center justify-center rounded-xl">
                        <Bot className="h-6 w-6 transition-transform group-hover:scale-110" />
                    </div>
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                            Anvaya GPT{' '}
                            <Sparkles className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        </h1>
                        <p className="text-muted-foreground text-xs">
                            Powered by your project context and AI.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                        <History className="mr-2 h-4 w-4" /> History
                    </Button>
                    <Button variant="outline" size="sm">
                        <RotateCcw className="mr-2 h-4 w-4" /> Reset
                    </Button>
                </div>
            </div>

            <div className="bg-muted/5 flex flex-1 flex-col overflow-hidden rounded-2xl border">
                <ScrollArea className="flex-1 p-6">
                    <div className="mx-auto max-w-3xl space-y-8">
                        <div className="flex flex-col items-center justify-center space-y-4 py-20 text-center">
                            <div className="bg-primary/5 text-primary flex h-16 w-16 items-center justify-center rounded-2xl">
                                <Sparkles className="h-8 w-8" />
                            </div>
                            <h2 className="text-xl font-bold">
                                How can I help you today?
                            </h2>
                            <div className="grid max-w-lg grid-cols-2 gap-2">
                                <Button
                                    variant="outline"
                                    className="flex h-auto flex-col items-start gap-1 px-4 py-3"
                                >
                                    <span className="text-sm font-semibold">
                                        Summarize Sprint
                                    </span>
                                    <span className="text-muted-foreground text-[10px]">
                                        Get a quick update on Sprint 24
                                    </span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex h-auto flex-col items-start gap-1 px-4 py-3"
                                >
                                    <span className="text-sm font-semibold">
                                        Priority Issues
                                    </span>
                                    <span className="text-muted-foreground text-[10px]">
                                        What needs my attention most?
                                    </span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex h-auto flex-col items-start gap-1 px-4 py-3"
                                >
                                    <span className="text-sm font-semibold">
                                        Project Timeline
                                    </span>
                                    <span className="text-muted-foreground text-[10px]">
                                        Visualize upcoming deadlines
                                    </span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex h-auto flex-col items-start gap-1 px-4 py-3"
                                >
                                    <span className="text-sm font-semibold">
                                        Team Efficiency
                                    </span>
                                    <span className="text-muted-foreground text-[10px]">
                                        Analyze last month's performance
                                    </span>
                                </Button>
                            </div>
                        </div>

                        {/* Example message exchange */}
                        {/* <div className="flex gap-4">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground"><User className="h-4 w-4" /></div>
              <div className="space-y-2">
                <p className="text-sm font-medium">What's the status of the E-commerce project?</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold"><Bot className="h-4 w-4" /></div>
              <div className="space-y-4 flex-1">
                <p className="text-sm leading-relaxed">The <span className="font-bold">E-commerce Platform</span> project is currently at <span className="font-bold text-primary">65% completion</span>. 
                Sprint 24 is active with 3 days remaining. There are 8 open tasks, 2 of which are marked as high priority.</p>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg bg-background">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">On Track</p>
                        <p className="text-xs">Cart integration and Payment gateway setup.</p>
                    </div>
                    <div className="p-3 border rounded-lg bg-background">
                        <p className="text-[10px] font-bold uppercase text-red-500 mb-1">Delayed</p>
                        <p className="text-xs">Product recommendation engine refinement.</p>
                    </div>
                </div>
              </div>
            </div> */}
                    </div>
                </ScrollArea>

                <div className="bg-background border-t p-4">
                    <div className="relative mx-auto max-w-3xl">
                        <Input
                            className="focus-visible:ring-primary h-14 rounded-xl border-2 py-6 pr-24"
                            placeholder="Ask Anvaya anything about your projects..."
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground h-10 w-10 rounded-lg"
                            >
                                <Wand2 className="h-4 w-4" />
                            </Button>
                            <Button
                                size="icon"
                                className="h-10 w-10 rounded-lg"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <p className="text-muted-foreground mt-2 text-center text-[10px]">
                        AI can make mistakes. Consider checking important
                        information.
                    </p>
                </div>
            </div>
        </div>
    );
}
