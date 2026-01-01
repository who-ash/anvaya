'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TiptapEditor from '@/components/app/tiptap/tiptap-editor';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/providers/trpc-provider';
import { uploadFile } from '@/lib/s3/helper';
import { Upload, X, Loader2, Building2 } from 'lucide-react';

interface CreateOrganizationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isLoading: boolean;
    onOrganizationCreated: () => void;
}

type NewOrganizationForm = {
    name: string;
    description: string;
    type: string;
    profilePicture?: string;
};

export function CreateOrganizationDialog({
    open,
    onOpenChange,
    isLoading,
    onOrganizationCreated,
}: CreateOrganizationDialogProps) {
    const [formData, setFormData] = useState<NewOrganizationForm>({
        name: '',
        description: '',
        type: 'company',
        profilePicture: '',
    });
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');

    const createOrganizationMutation = trpc.organization.create.useMutation({
        onSuccess: () => {
            toast.success('Organization created successfully');
            onOpenChange(false);
            onOrganizationCreated();
            resetForm();
        },
        onError: (error: any) => {
            toast.error('Failed to create organization', {
                description: error.message || 'An unknown error occurred',
            });
        },
    });

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            type: 'company',
            profilePicture: '',
        });
        setImageFile(null);
        setImagePreview('');
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        setImageFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview('');
        setFormData({ ...formData, profilePicture: '' });
    };

    const handleCreateOrganization = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.type) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            let logoUrl = formData.profilePicture;

            if (imageFile) {
                setUploadingImage(true);
                const uploadResult = await uploadFile({
                    file: imageFile,
                    filePath: `organizations/${formData.name.toLowerCase().replace(/\s+/g, '-')}`,
                });

                if (!uploadResult.success || !uploadResult.publicUrl) {
                    toast.error('Failed to upload image', {
                        description: uploadResult.error || 'Unknown error',
                    });
                    setUploadingImage(false);
                    return;
                }

                logoUrl = uploadResult.publicUrl;
                setUploadingImage(false);
            }

            createOrganizationMutation.mutate({
                name: formData.name,
                description: formData.description,
                type: formData.type,
                profilePicture: logoUrl,
            });
        } catch (error) {
            setUploadingImage(false);
            toast.error('An error occurred', {
                description:
                    error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    const isSubmitting = createOrganizationMutation.isPending || uploadingImage;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>Create Organization</span>
                    </div>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Create New Organization</DialogTitle>
                    <DialogDescription>
                        Create a new organization with specific settings and
                        type.
                    </DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={handleCreateOrganization}
                    className="space-y-4 py-4"
                >
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label
                            htmlFor="name"
                            className="after:ml-0.1 text-right after:text-red-500 after:content-['*']"
                        >
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    name: e.target.value,
                                })
                            }
                            className="col-span-3"
                            required
                            disabled={isLoading || isSubmitting}
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label
                            htmlFor="type"
                            className="after:ml-0.1 text-right after:text-red-500 after:content-['*']"
                        >
                            Type
                        </Label>
                        <Select
                            value={formData.type}
                            onValueChange={(value: string) =>
                                setFormData({ ...formData, type: value })
                            }
                            disabled={isLoading || isSubmitting}
                        >
                            <SelectTrigger className="col-span-3 w-full">
                                <SelectValue placeholder="Select organization type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="company">Company</SelectItem>
                                <SelectItem value="nonprofit">
                                    Non-Profit
                                </SelectItem>
                                <SelectItem value="educational">
                                    Educational
                                </SelectItem>
                                <SelectItem value="government">
                                    Government
                                </SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label
                            htmlFor="description"
                            className="pt-2 text-right"
                        >
                            Description
                        </Label>
                        <div className="col-span-3">
                            <TiptapEditor
                                initialContent={formData.description}
                                onChange={(content) =>
                                    setFormData({
                                        ...formData,
                                        description: content,
                                    })
                                }
                                placeholder="Enter organization description..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="logo" className="pt-2 text-right">
                            Logo
                        </Label>
                        <div className="col-span-3 space-y-2">
                            {imagePreview ? (
                                <div className="relative inline-block">
                                    <img
                                        src={imagePreview}
                                        alt="Organization logo preview"
                                        className="h-32 w-32 rounded-md border object-cover"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-2 -right-2 h-6 w-6"
                                        onClick={handleRemoveImage}
                                        disabled={isSubmitting}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="logo"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        disabled={isLoading || isSubmitting}
                                        className="hidden"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            document
                                                .getElementById('logo')
                                                ?.click()
                                        }
                                        disabled={isSubmitting}
                                        className="w-full"
                                    >
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload Logo
                                    </Button>
                                </div>
                            )}
                            <p className="text-muted-foreground text-xs">
                                Max size: 5MB. Supported formats: JPG, PNG, GIF,
                                WebP
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={
                                isSubmitting || !formData.name || !formData.type
                            }
                        >
                            {uploadingImage ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : createOrganizationMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Organization'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
