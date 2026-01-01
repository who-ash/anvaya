'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TiptapEditor from '@/components/app/tiptap/tiptap-editor';
import { Loader2, Upload, X } from 'lucide-react';
import { trpc } from '@/providers/trpc-provider';
import { toast } from 'sonner';
import { uploadFile } from '@/lib/s3/helper';

interface EditGroupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    group: {
        id: number;
        name: string;
        description: string | null;
        profilePicture?: string | null;
    } | null;
    onGroupUpdated: () => void;
}

export function EditGroupDialog({
    open,
    onOpenChange,
    group,
    onGroupUpdated,
}: EditGroupDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        if (group) {
            setName(group.name);
            setDescription(group.description || '');
            setImagePreview(group.profilePicture || '');
            setImageFile(null);
        }
    }, [group]);

    const updateGroupMutation = trpc.organization.updateGroup.useMutation({
        onSuccess: () => {
            toast.success('Group updated successfully');
            onOpenChange(false);
            onGroupUpdated();
        },
        onError: (error) => {
            toast.error('Failed to update group', {
                description: error.message,
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
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!group) return;

        if (!name.trim()) {
            toast.error('Please enter a group name');
            return;
        }

        try {
            // Build update payload with only changed fields
            const updates: {
                name?: string;
                description?: string;
                profilePicture?: string;
            } = {};

            // Check if name changed
            if (name !== group.name) {
                updates.name = name.trim();
            }

            // Check if description changed
            if (description !== (group.description || '')) {
                updates.description = description.trim() || undefined;
            }

            // Handle image upload if a new file is selected
            if (imageFile) {
                setUploadingImage(true);
                const uploadResult = await uploadFile({
                    file: imageFile,
                    filePath: `groups/${name.toLowerCase().replace(/\s+/g, '-')}`,
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
            } else if (imagePreview !== group.profilePicture) {
                // If image was removed (preview is empty but group had an image)
                if (!imagePreview && group.profilePicture) {
                    updates.profilePicture = '';
                }
            }

            // Only make the API call if there are changes
            if (Object.keys(updates).length === 0) {
                toast.info('No changes to update');
                onOpenChange(false);
                return;
            }

            updateGroupMutation.mutate({
                groupId: group.id,
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

    const isSubmitting = updateGroupMutation.isPending || uploadingImage;

    if (!group) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="scrollbar-thin max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Edit Group</DialogTitle>
                    <DialogDescription>
                        Update the group name, description, and picture.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Group Name *</Label>
                            <Input
                                id="name"
                                placeholder="e.g., Engineering Team"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <TiptapEditor
                                initialContent={description}
                                onChange={(content) => setDescription(content)}
                                placeholder="Enter group description..."
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="picture">Picture</Label>
                            {imagePreview ? (
                                <div className="relative inline-block">
                                    <img
                                        src={imagePreview}
                                        alt="Group picture preview"
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
                                        id="picture"
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
                                                .getElementById('picture')
                                                ?.click()
                                        }
                                        disabled={isSubmitting}
                                        className="w-full"
                                    >
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload Picture
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
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {uploadingImage ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : updateGroupMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Group'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
