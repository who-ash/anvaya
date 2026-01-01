'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TiptapEditor from '@/components/app/tiptap/tiptap-editor';
import { trpc } from '@/providers/trpc-provider';
import { Loader2, Upload, X } from 'lucide-react';
import { uploadFile } from '@/lib/s3/helper';

interface EditOrganizationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    organization: {
        id: number;
        name: string;
        description: string | null;
        profilePicture: string | null;
    } | null;
    onOrganizationUpdated: () => void;
}

export function EditOrganizationDialog({
    open,
    onOpenChange,
    organization,
    onOrganizationUpdated,
}: EditOrganizationDialogProps) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        profilePicture: '',
    });
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');

    useEffect(() => {
        if (organization) {
            setFormData({
                name: organization.name || '',
                description: organization.description || '',
                profilePicture: organization.profilePicture || '',
            });
            setImagePreview(organization.profilePicture || '');
        }
    }, [organization]);

    const updateOrganizationMutation = trpc.organization.update.useMutation({
        onSuccess: () => {
            toast.success('Organization updated successfully');
            onOpenChange(false);
            onOrganizationUpdated();
        },
        onError: (error: any) => {
            toast.error('Failed to update organization', {
                description: error.message || 'An unknown error occurred',
            });
        },
    });

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

    const handleUpdateOrganization = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!organization) return;

        try {
            // Build update payload with only changed fields
            const updates: {
                name?: string;
                description?: string;
                profilePicture?: string;
            } = {};

            // Check if name changed
            if (formData.name !== organization.name) {
                updates.name = formData.name;
            }

            // Check if description changed
            if (formData.description !== (organization.description || '')) {
                updates.description = formData.description;
            }

            // Handle image upload if a new file is selected
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

                updates.profilePicture = uploadResult.publicUrl;
                setUploadingImage(false);
            } else if (imagePreview !== organization.profilePicture) {
                // If image was removed (preview is empty but org had an image)
                if (!imagePreview && organization.profilePicture) {
                    updates.profilePicture = '';
                }
            }

            // Only make the API call if there are changes
            if (Object.keys(updates).length === 0) {
                toast.info('No changes to update');
                onOpenChange(false);
                return;
            }

            updateOrganizationMutation.mutate({
                id: organization.id,
                ...updates,
            });
        } catch (error) {
            setUploadingImage(false);
            toast.error('An error occurred', {
                description:
                    error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    const isSubmitting = updateOrganizationMutation.isPending || uploadingImage;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="scrollbar-thin max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Edit Organization</DialogTitle>
                    <DialogDescription>
                        Update organization information
                    </DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={handleUpdateOrganization}
                    className="space-y-4 py-4"
                >
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label
                            htmlFor="edit-org-name"
                            className="after:ml-0.1 text-right after:text-red-500 after:content-['*']"
                        >
                            Name
                        </Label>
                        <Input
                            id="edit-org-name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    name: e.target.value,
                                })
                            }
                            className="col-span-3"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label
                            htmlFor="edit-org-description"
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
                        <Label
                            htmlFor="edit-org-logo"
                            className="pt-2 text-right"
                        >
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
                                        id="edit-org-logo"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        disabled={isSubmitting}
                                        className="hidden"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            document
                                                .getElementById('edit-org-logo')
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
                            disabled={isSubmitting || !formData.name}
                        >
                            {uploadingImage ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : updateOrganizationMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Organization'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
