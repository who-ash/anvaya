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
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TiptapEditor from '@/components/app/tiptap/tiptap-editor';
import { trpc } from '@/providers/trpc-provider';
import { uploadFile } from '@/lib/s3/helper';
import {
    Upload,
    X,
    Loader2,
    Users,
    Search,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CreateGroupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    organizationId: number;
    onGroupCreated: () => void;
}

type NewGroupForm = {
    name: string;
    description: string;
    profilePicture: string;
};

type OrgMember = {
    id: number;
    userId: string;
    name: string;
    email: string;
    image: string | null;
};

export function CreateGroupDialog({
    open,
    onOpenChange,
    organizationId,
    onGroupCreated,
}: CreateGroupDialogProps) {
    const [formData, setFormData] = useState<NewGroupForm>({
        name: '',
        description: '',
        profilePicture: '',
    });
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');

    // Member selection state
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]); // Array of userIds
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 10;

    const { data: membersData, isLoading: isSearching } =
        trpc.organization.getOrgMembers.useQuery(
            {
                organizationId,
                query: searchQuery,
                page: currentPage,
                limit,
            },
            {
                enabled: open,
                refetchOnWindowFocus: false,
            },
        );

    const members = membersData?.data || [];
    const pagination = membersData?.pagination;

    const createGroupMutation = trpc.organization.createGroup.useMutation({
        onSuccess: () => {
            toast.success('Group created successfully');
            handleClose();
            onGroupCreated();
        },
        onError: (error: any) => {
            toast.error('Failed to create group', {
                description: error.message || 'An unknown error occurred',
            });
        },
    });

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            profilePicture: '',
        });
        setImageFile(null);
        setImagePreview('');
        setSearchQuery('');
        setSelectedMembers([]);
        setCurrentPage(1);
    };

    const handleClose = () => {
        onOpenChange(false);
    };

    // Reset page when search query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

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

    const handleMemberToggle = (userId: string) => {
        if (selectedMembers.includes(userId)) {
            setSelectedMembers(selectedMembers.filter((id) => id !== userId));
        } else {
            setSelectedMembers([...selectedMembers, userId]);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            let pictureUrl = formData.profilePicture;

            if (imageFile) {
                setUploadingImage(true);
                const uploadResult = await uploadFile({
                    file: imageFile,
                    filePath: `groups/${formData.name.toLowerCase().replace(/\s+/g, '-')}`,
                });

                if (!uploadResult.success || !uploadResult.publicUrl) {
                    toast.error('Failed to upload image', {
                        description: uploadResult.error || 'Unknown error',
                    });
                    setUploadingImage(false);
                    return;
                }

                pictureUrl = uploadResult.publicUrl;
                setUploadingImage(false);
            }

            createGroupMutation.mutate({
                organizationId,
                name: formData.name,
                description: formData.description,
                profilePicture: pictureUrl,
                members: selectedMembers,
            });
        } catch (error) {
            setUploadingImage(false);
            toast.error('An error occurred', {
                description:
                    error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    const isSubmitting = createGroupMutation.isPending || uploadingImage;

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    resetForm();
                }
                onOpenChange(isOpen);
            }}
        >
            <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Create New Group</DialogTitle>
                    <DialogDescription>
                        Create a new group and optionally add members.
                    </DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={handleCreateGroup}
                    className="flex flex-col gap-4"
                >
                    <ScrollArea className="h-[500px] pr-4">
                        <div className="space-y-4 pr-4">
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
                                    disabled={isSubmitting}
                                />
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
                                        placeholder="Enter group description..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label
                                    htmlFor="picture"
                                    className="pt-2 text-right"
                                >
                                    Picture
                                </Label>
                                <div className="col-span-3 space-y-2">
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
                                                        .getElementById(
                                                            'picture',
                                                        )
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
                                        Max size: 5MB. Supported formats: JPG,
                                        PNG, GIF, WebP
                                    </p>
                                </div>
                            </div>

                            {/* Member Selection */}
                            <div className="grid grid-cols-4 items-start gap-4 border-t pt-4">
                                <Label className="pt-2 text-right">
                                    Add Members
                                </Label>
                                <div className="col-span-3 space-y-2">
                                    <div className="relative">
                                        <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
                                        <Input
                                            placeholder="Search organization members..."
                                            className="pl-8"
                                            value={searchQuery}
                                            onChange={(e) =>
                                                setSearchQuery(e.target.value)
                                            }
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    <div className="rounded-md border">
                                        <div className="h-[200px] overflow-y-auto p-2">
                                            {isSearching ? (
                                                <div className="flex items-center justify-center p-4">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                </div>
                                            ) : members &&
                                              members.length > 0 ? (
                                                <div className="space-y-2">
                                                    {members.map((member) => {
                                                        const isSelected =
                                                            selectedMembers.includes(
                                                                member.userId,
                                                            );
                                                        return (
                                                            <div
                                                                key={member.id}
                                                                className="hover:bg-muted flex cursor-pointer items-center gap-3 rounded-md p-2"
                                                            >
                                                                <Checkbox
                                                                    checked={
                                                                        isSelected
                                                                    }
                                                                    onCheckedChange={() =>
                                                                        handleMemberToggle(
                                                                            member.userId,
                                                                        )
                                                                    }
                                                                    onClick={(
                                                                        e,
                                                                    ) =>
                                                                        e.stopPropagation()
                                                                    }
                                                                />
                                                                <div
                                                                    className="flex gap-2"
                                                                    onClick={() =>
                                                                        handleMemberToggle(
                                                                            member.userId,
                                                                        )
                                                                    }
                                                                >
                                                                    <Avatar className="h-8 w-8">
                                                                        {member.image && (
                                                                            <AvatarImage
                                                                                src={
                                                                                    member.image
                                                                                }
                                                                            />
                                                                        )}
                                                                        <AvatarFallback>
                                                                            {getInitials(
                                                                                member.name,
                                                                            )}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-medium">
                                                                            {
                                                                                member.name
                                                                            }
                                                                        </p>
                                                                        <p className="text-muted-foreground text-xs">
                                                                            {
                                                                                member.email
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-muted-foreground p-4 text-center text-sm">
                                                    No members found
                                                </p>
                                            )}
                                        </div>

                                        {/* Pagination */}
                                        {pagination &&
                                            pagination.totalPages > 1 && (
                                                <div className="bg-muted/20 flex items-center justify-between border-t p-2">
                                                    <p className="text-muted-foreground text-xs">
                                                        Page {currentPage} of{' '}
                                                        {pagination.totalPages}
                                                    </p>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 w-7 p-0"
                                                            onClick={() =>
                                                                setCurrentPage(
                                                                    (p) =>
                                                                        Math.max(
                                                                            1,
                                                                            p -
                                                                                1,
                                                                        ),
                                                                )
                                                            }
                                                            disabled={
                                                                !pagination.hasPreviousPage ||
                                                                isSubmitting
                                                            }
                                                        >
                                                            <ChevronLeft className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 w-7 p-0"
                                                            onClick={() =>
                                                                setCurrentPage(
                                                                    (p) =>
                                                                        p + 1,
                                                                )
                                                            }
                                                            disabled={
                                                                !pagination.hasNextPage ||
                                                                isSubmitting
                                                            }
                                                        >
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                    <p className="text-muted-foreground text-xs">
                                        Selected: {selectedMembers.length}{' '}
                                        members
                                    </p>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

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
                            ) : createGroupMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Group'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
