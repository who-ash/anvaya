export default function DashboardPage() {
    return (
        <div className="flex flex-1 flex-col gap-4">
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <div className="bg-muted/50 flex aspect-video items-center justify-center rounded-xl border border-dashed">
                    <p className="text-muted-foreground">Recent Projects</p>
                </div>
                <div className="bg-muted/50 flex aspect-video items-center justify-center rounded-xl border border-dashed">
                    <p className="text-muted-foreground">Active Sprints</p>
                </div>
                <div className="bg-muted/50 flex aspect-video items-center justify-center rounded-xl border border-dashed">
                    <p className="text-muted-foreground">Pending Issues</p>
                </div>
            </div>
            <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl border border-dashed p-8 md:min-h-min">
                <div className="flex h-full flex-col items-center justify-center gap-4">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Welcome to Anvaya
                    </h1>
                    <p className="text-muted-foreground max-w-md text-center">
                        Select a project from the sidebar to get started or view
                        your overall statistics here.
                    </p>
                </div>
            </div>
        </div>
    );
}
