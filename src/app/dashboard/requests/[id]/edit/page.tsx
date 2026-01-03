'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Bug,
    Lightbulb,
    MessageSquare,
    HelpCircle,
    Save,
    Upload,
    X,
    Folder,
    Zap,
    ListTodo,
    FileIcon,
    ArrowLeft,
    ExternalLink,
} from 'lucide-react';
import { trpc } from '@/providers/trpc-provider';
import { useOrganization } from '@/providers/organization-provider';
import { toast } from 'sonner';
import { cn, isContentEmpty } from '@/lib/utils';
import {
    REQUEST_TEMPLATES,
    RequestType,
    TemplateField,
} from '@/lib/request-templates';
import TiptapEditor from '@/components/app/tiptap/tiptap-editor';
import { uploadFiles } from '@/lib/s3/helper';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

const typeIcons = {
    bug: Bug,
    feature_request: Lightbulb,
    feedback: MessageSquare,
    query: HelpCircle,
};

const typeBgColors: Record<string, string> = {
    bug: 'bg-red-50 dark:bg-red-950/20',
    feature_request: 'bg-amber-50 dark:bg-amber-950/20',
    feedback: 'bg-blue-50 dark:bg-blue-950/20',
    query: 'bg-purple-50 dark:bg-purple-950/20',
};

export default function EditRequestPage() {
    const router = useRouter();
    const params = useParams();
    const requestId = parseInt(params.id as string);
    const { activeOrgId } = useOrganization();

    const [formData, setFormData] = useState<Record<string, any>>({});
    const [priority, setPriority] = useState<
        'low' | 'medium' | 'high' | 'critical'
    >('medium');
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
        null,
    );
    const [selectedSprintId, setSelectedSprintId] = useState<number | null>(
        null,
    );
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<
        Record<string, { name: string; url: string }[]>
    >({});
    const [isUploading, setIsUploading] = useState(false);

    const { data: request, isLoading: isLoadingRequest } =
        trpc.request.getById.useQuery(
            { id: requestId },
            { enabled: !!requestId },
        );

    const { data: projectsResponse, isLoading: isLoadingProjects } =
        trpc.project.search.useQuery(
            { organizationId: activeOrgId || 0, limit: 100 },
            { enabled: !!activeOrgId },
        );
    const projects = projectsResponse?.data || [];

    // Fetch sprints for selected project
    const { data: sprintsResponse, isLoading: isLoadingSprints } =
        trpc.sprint.search.useQuery(
            {
                projectIds: selectedProjectId ? [selectedProjectId] : undefined,
                limit: 100,
            },
            { enabled: !!selectedProjectId },
        );
    const sprints = sprintsResponse?.data || [];

    // Fetch tasks for selected project/sprint
    const { data: tasksResponse, isLoading: isLoadingTasks } =
        trpc.task.search.useQuery(
            {
                projectIds: selectedProjectId ? [selectedProjectId] : undefined,
                sprintIds: selectedSprintId ? [selectedSprintId] : undefined,
                limit: 100,
            },
            { enabled: !!selectedProjectId },
        );
    const tasks = tasksResponse?.data || [];

    const updateMutation = trpc.request.update.useMutation({
        onSuccess: () => {
            toast.success('Request updated successfully');
            router.push(`/dashboard/requests/${requestId}`);
        },
        onError: (error) => {
            toast.error('Failed to update request', {
                description: error.message,
            });
        },
    });

    // Initialize form state when request data is loaded
    useEffect(() => {
        if (request) {
            setFormData((request.content as Record<string, any>) || {});
            setPriority(request.priority as any);
            setSelectedProjectId(request.projectId);
            setSelectedSprintId(request.sprintId);
            setSelectedTaskId(request.taskId);

            // Extract files from content if any
            const template = REQUEST_TEMPLATES[request.type as RequestType];
            if (template) {
                const newUploadedFiles: Record<
                    string,
                    { name: string; url: string }[]
                > = {};
                template.schema.fields.forEach((field) => {
                    if (field.type === 'file') {
                        const urls = (request.content as any)?.[field.id] || [];
                        if (Array.isArray(urls)) {
                            newUploadedFiles[field.id] = urls.map((url, i) => ({
                                name: url.split('/').pop() || `File ${i + 1}`,
                                url,
                            }));
                        }
                    }
                });
                setUploadedFiles(newUploadedFiles);
            }
        }
    }, [request]);

    const handleFieldChange = (fieldId: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [fieldId]: value,
        }));
    };

    const handleFileUpload = async (
        fieldId: string,
        files: FileList | null,
    ) => {
        if (!files || files.length === 0) return;

        setIsUploading(true);
        try {
            const results = await uploadFiles(Array.from(files), 'requests');
            const successfulUploads = results
                .filter((r) => r.success && r.publicUrl)
                .map((r) => ({ name: r.fileName, url: r.publicUrl! }));

            setUploadedFiles((prev) => ({
                ...prev,
                [fieldId]: [...(prev[fieldId] || []), ...successfulUploads],
            }));

            // Store URLs in form data
            setFormData((prev) => {
                const existingUrls = prev[fieldId] || [];
                return {
                    ...prev,
                    [fieldId]: [
                        ...existingUrls,
                        ...successfulUploads.map((f) => f.url),
                    ],
                };
            });

            if (successfulUploads.length > 0) {
                toast.success(`Uploaded ${successfulUploads.length} file(s)`);
            }
        } catch (error) {
            toast.error('Failed to upload files');
        } finally {
            setIsUploading(false);
        }
    };

    const removeFile = (fieldId: string, index: number) => {
        setUploadedFiles((prev) => ({
            ...prev,
            [fieldId]: prev[fieldId]?.filter((_, i) => i !== index) || [],
        }));
        setFormData((prev) => {
            const existingUrls = prev[fieldId] || [];
            return {
                ...prev,
                [fieldId]: existingUrls.filter(
                    (_: any, i: number) => i !== index,
                ),
            };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!request || !activeOrgId || !selectedProjectId) return;

        const template = REQUEST_TEMPLATES[request.type as RequestType];
        const title = formData.title || request.title;
        const description =
            formData.description ||
            formData.question ||
            formData.feedback ||
            '';

        // Validate required fields
        const requiredFields = template.schema.fields.filter((f) => f.required);
        const missingFields = requiredFields.filter((f) => {
            const val = formData[f.id];
            return isContentEmpty(val);
        });

        if (missingFields.length > 0) {
            toast.error(
                `Please fill in: ${missingFields.map((f) => f.label).join(', ')}`,
            );
            return;
        }

        // Map form data priority if it comes from the template
        let effectivePriority = priority;
        if (formData.severity) {
            const severityMap: Record<
                string,
                'low' | 'medium' | 'high' | 'critical'
            > = {
                blocker: 'critical',
                critical: 'critical',
                major: 'high',
                minor: 'low',
            };
            effectivePriority = severityMap[formData.severity] || priority;
        }
        if (formData.businessValue) {
            const valueMap: Record<
                string,
                'low' | 'medium' | 'high' | 'critical'
            > = {
                high: 'high',
                medium: 'medium',
                low: 'low',
            };
            effectivePriority = valueMap[formData.businessValue] || priority;
        }

        updateMutation.mutate({
            id: requestId,
            organizationId: activeOrgId,
            projectId: selectedProjectId,
            sprintId: selectedSprintId || undefined,
            taskId: selectedTaskId || undefined,
            title,
            description,
            content: formData,
            priority: effectivePriority,
        });
    };

    const renderField = (field: TemplateField) => {
        const value = formData[field.id] || '';

        switch (field.type) {
            case 'text':
                return (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id}>
                            {field.label}
                            {field.required && (
                                <span className="text-destructive ml-1">*</span>
                            )}
                        </Label>
                        <Input
                            id={field.id}
                            placeholder={field.placeholder}
                            value={value}
                            onChange={(e) =>
                                handleFieldChange(field.id, e.target.value)
                            }
                            required={field.required}
                        />
                        {field.helperText && (
                            <p className="text-muted-foreground text-xs">
                                {field.helperText}
                            </p>
                        )}
                    </div>
                );
            case 'textarea':
            case 'richtext':
                return (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id}>
                            {field.label}
                            {field.required && (
                                <span className="text-destructive ml-1">*</span>
                            )}
                        </Label>
                        <div className="rounded-md border">
                            <TiptapEditor
                                initialContent={value || '<p></p>'}
                                placeholder={field.placeholder}
                                onChange={(content) =>
                                    handleFieldChange(field.id, content)
                                }
                                className="min-h-[120px]"
                            />
                        </div>
                        {field.helperText && (
                            <p className="text-muted-foreground text-xs">
                                {field.helperText}
                            </p>
                        )}
                    </div>
                );
            case 'select':
                return (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id}>
                            {field.label}
                            {field.required && (
                                <span className="text-destructive ml-1">*</span>
                            )}
                        </Label>
                        <Select
                            value={value}
                            onValueChange={(v) =>
                                handleFieldChange(field.id, v)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={`Select ${field.label.toLowerCase()}`}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {field.options?.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {field.helperText && (
                            <p className="text-muted-foreground text-xs">
                                {field.helperText}
                            </p>
                        )}
                    </div>
                );
            case 'file':
                const files = uploadedFiles[field.id] || [];
                return (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id}>
                            {field.label}
                            {field.required && (
                                <span className="text-destructive ml-1">*</span>
                            )}
                        </Label>
                        <label
                            htmlFor={field.id}
                            className="hover:border-primary/50 block cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors"
                        >
                            <Upload className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                            <p className="text-muted-foreground text-sm">
                                {isUploading
                                    ? 'Uploading...'
                                    : 'Click to upload or drag and drop'}
                            </p>
                            <p className="text-muted-foreground mt-1 text-xs">
                                {field.helperText || 'Upload files'}
                            </p>
                            <input
                                id={field.id}
                                type="file"
                                className="hidden"
                                accept={field.accept}
                                multiple={field.multiple}
                                onChange={(e) =>
                                    handleFileUpload(field.id, e.target.files)
                                }
                                disabled={isUploading}
                            />
                        </label>
                        {files.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {files.map((file, index) => (
                                    <div
                                        key={index}
                                        className="bg-muted flex items-center gap-2 rounded-md px-2 py-1 text-sm"
                                    >
                                        <FileIcon className="h-3 w-3" />
                                        <span className="max-w-32 truncate">
                                            {file.name}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeFile(field.id, index)
                                            }
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    if (isLoadingRequest || !request) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                <Separator />
                <div className="space-y-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        );
    }

    const template = REQUEST_TEMPLATES[request.type as RequestType];
    const Icon = typeIcons[request.type as keyof typeof typeIcons];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                'flex h-10 w-10 items-center justify-center rounded-lg',
                                typeBgColors[request.type as RequestType],
                            )}
                        >
                            <Icon className="text-foreground h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">
                                Edit {template?.name || 'Request'}
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Make changes to this{' '}
                                {request.type.replace('_', ' ')}
                            </p>
                        </div>
                    </div>
                </div>
                <Badge variant="outline" className="capitalize">
                    {request.status}
                </Badge>
            </div>

            <Separator />

            {/* Form */}
            <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-6 scroll-smooth lg:flex-row lg:items-start"
            >
                {/* Main Content Area */}
                <div className="min-w-0 flex-1 space-y-8 p-1">
                    {template?.schema.fields.map((field) => (
                        <div key={field.id} className="scroll-mt-24">
                            {renderField(field)}
                        </div>
                    ))}
                </div>

                {/* Right Sidebar for Actions and Meta */}
                <aside className="bg-background/50 sticky top-[5.5rem] w-full shrink-0 space-y-6 self-start pb-10 backdrop-blur-sm lg:w-72 lg:border-l lg:pl-6">
                    {/* Project selector */}
                    <div className="scroll-mt-24 space-y-2">
                        <Label
                            htmlFor="project"
                            className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase"
                        >
                            <Folder className="h-3 w-3" /> Project{' '}
                            <span className="text-destructive ml-1">*</span>
                        </Label>
                        <Select
                            value={selectedProjectId?.toString()}
                            onValueChange={(v) => {
                                setSelectedProjectId(parseInt(v));
                                setSelectedSprintId(null);
                                setSelectedTaskId(null);
                            }}
                            required
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a project" />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoadingProjects ? (
                                    <SelectItem value="loading" disabled>
                                        Loading projects...
                                    </SelectItem>
                                ) : projects.length === 0 ? (
                                    <SelectItem value="none" disabled>
                                        No projects found
                                    </SelectItem>
                                ) : (
                                    projects.map((project) => (
                                        <SelectItem
                                            key={project.id}
                                            value={project.id.toString()}
                                        >
                                            {project.name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sprint selector */}
                    <div className="scroll-mt-24 space-y-2">
                        <Label
                            htmlFor="sprint"
                            className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase"
                        >
                            <Zap className="h-3 w-3" /> Sprint
                        </Label>
                        <Select
                            value={selectedSprintId?.toString() || 'none'}
                            onValueChange={(v) => {
                                const sprintId =
                                    v === 'none' ? null : parseInt(v);
                                setSelectedSprintId(sprintId);

                                // Reset task if it doesn't belong to the new sprint
                                if (sprintId && selectedTaskId) {
                                    const task = tasks.find(
                                        (t) => t.id === selectedTaskId,
                                    );
                                    if (task && task.sprintId !== sprintId) {
                                        setSelectedTaskId(null);
                                    }
                                }
                            }}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a sprint (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No Sprint</SelectItem>
                                {isLoadingSprints ? (
                                    <SelectItem value="loading" disabled>
                                        Loading sprints...
                                    </SelectItem>
                                ) : sprints.length === 0 ? (
                                    <SelectItem value="none" disabled>
                                        No sprints found
                                    </SelectItem>
                                ) : (
                                    sprints.map((sprint) => (
                                        <SelectItem
                                            key={sprint.id}
                                            value={sprint.id.toString()}
                                        >
                                            {sprint.name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Task selector */}
                    <div className="scroll-mt-24 space-y-2">
                        <Label
                            htmlFor="task"
                            className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase"
                        >
                            <ListTodo className="h-3 w-3" /> Task
                        </Label>
                        <Select
                            value={selectedTaskId?.toString() || 'none'}
                            onValueChange={(v) =>
                                setSelectedTaskId(
                                    v === 'none' ? null : parseInt(v),
                                )
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a task (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No Task</SelectItem>
                                {isLoadingTasks ? (
                                    <SelectItem value="loading" disabled>
                                        Loading tasks...
                                    </SelectItem>
                                ) : tasks.filter(
                                      (t) =>
                                          !selectedSprintId ||
                                          t.sprintId === selectedSprintId,
                                  ).length === 0 ? (
                                    <SelectItem value="none" disabled>
                                        No tasks found
                                    </SelectItem>
                                ) : (
                                    tasks
                                        .filter(
                                            (task) =>
                                                !selectedSprintId ||
                                                task.sprintId ===
                                                    selectedSprintId,
                                        )
                                        .map((task) => (
                                            <SelectItem
                                                key={task.id}
                                                value={task.id.toString()}
                                            >
                                                {task.name}
                                            </SelectItem>
                                        ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Priority selector (if not already in fields) */}
                    {template &&
                        !template.schema.fields.some(
                            (f) =>
                                f.id === 'severity' || f.id === 'businessValue',
                        ) && (
                            <div className="scroll-mt-24 space-y-2">
                                <Label
                                    htmlFor="priority"
                                    className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase"
                                >
                                    Priority
                                </Label>
                                <Select
                                    value={priority}
                                    onValueChange={(v: any) => setPriority(v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">
                                            Medium
                                        </SelectItem>
                                        <SelectItem value="high">
                                            High
                                        </SelectItem>
                                        <SelectItem value="critical">
                                            Critical
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                    <Separator />

                    {/* Actions */}
                    <div className="space-y-3">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="w-full">
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={
                                                updateMutation.isPending ||
                                                isUploading ||
                                                !selectedProjectId
                                            }
                                        >
                                            <Save className="mr-2 h-4 w-4" />
                                            {updateMutation.isPending
                                                ? 'Saving...'
                                                : 'Save Changes'}
                                        </Button>
                                    </div>
                                </TooltipTrigger>
                                {!selectedProjectId && (
                                    <TooltipContent>
                                        <p>Please select a project first</p>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>
                        <Button variant="outline" className="w-full" asChild>
                            <Link href={`/dashboard/requests/${requestId}`}>
                                Cancel
                            </Link>
                        </Button>
                    </div>

                    {isUploading && (
                        <p className="text-muted-foreground animate-pulse text-center text-xs">
                            Files are uploading...
                        </p>
                    )}
                </aside>
            </form>
        </div>
    );
}
