import { db } from '@/server/db';
import {
    chats,
    chatParticipants,
    messages,
    attachments,
} from '@/server/db/schema/chat-schema';
import { users } from '@/server/db/schema/auth-schema';
import { eq, and, or, desc, sql, asc } from 'drizzle-orm';
import { organizationMembers } from '@/server/db/schema/organization-schema';

export class ChatService {
    async createChat(
        organizationId: number,
        participantIds: string[],
        type: 'direct' | 'group' = 'direct',
        name?: string,
    ) {
        return await db.transaction(async (tx) => {
            const [newChat] = await tx
                .insert(chats)
                .values({
                    organizationId,
                    type,
                    name,
                })
                .returning();

            const participantsData = participantIds.map((userId) => ({
                chatId: newChat.id,
                userId,
            }));

            await tx.insert(chatParticipants).values(participantsData);

            return newChat;
        });
    }

    async getOrCreateDirectChat(
        organizationId: number,
        userId1: string,
        userId2: string,
    ) {
        // Check if a direct chat already exists between these two users in this organization
        const existingChat = await db
            .select({ id: chats.id })
            .from(chats)
            .innerJoin(chatParticipants, eq(chats.id, chatParticipants.chatId))
            .where(
                and(
                    eq(chats.organizationId, organizationId),
                    eq(chats.type, 'direct'),
                    or(
                        eq(chatParticipants.userId, userId1),
                        eq(chatParticipants.userId, userId2),
                    ),
                ),
            )
            .groupBy(chats.id)
            .having(sql`count(distinct ${chatParticipants.userId}) = 2`)
            .limit(1);

        if (existingChat.length > 0) {
            return existingChat[0];
        }

        return await this.createChat(
            organizationId,
            [userId1, userId2],
            'direct',
        );
    }

    async getChats(userId: string, organizationId: number) {
        // Get all chats for the user in the organization
        const userChats = await db
            .select({
                id: chats.id,
                name: chats.name,
                type: chats.type,
                updatedAt: chats.updatedAt,
                image: sql<string | null>`NULL`,
                lastMessage: sql<
                    string | null
                >`(SELECT content FROM ${messages} WHERE ${messages.chatId} = ${chats.id} ORDER BY ${messages.createdAt} DESC LIMIT 1)`,
                lastMessageAt: sql<Date | null>`(SELECT created_at FROM ${messages} WHERE ${messages.chatId} = ${chats.id} ORDER BY ${messages.createdAt} DESC LIMIT 1)`,
            })
            .from(chats)
            .innerJoin(chatParticipants, eq(chats.id, chatParticipants.chatId))
            .where(
                and(
                    eq(chatParticipants.userId, userId),
                    eq(chats.organizationId, organizationId),
                ),
            )
            .orderBy(desc(chats.updatedAt));

        // For direct chats, we want the other participant's name if no chat name is set
        const chatsWithParticipants = await Promise.all(
            userChats.map(async (chat) => {
                let name = chat.name;
                let image: string | null = null;

                if (chat.type === 'direct' && !name) {
                    const otherParticipant = await db
                        .select({
                            name: users.name,
                            image: users.image,
                        })
                        .from(chatParticipants)
                        .innerJoin(users, eq(chatParticipants.userId, users.id))
                        .where(
                            and(
                                eq(chatParticipants.chatId, chat.id),
                                sql`${chatParticipants.userId} != ${userId}`,
                            ),
                        )
                        .limit(1);

                    name = otherParticipant[0]?.name || 'Unknown User';
                    image = otherParticipant[0]?.image || null;
                }

                return {
                    id: chat.id,
                    name,
                    image,
                    type: chat.type,
                    updatedAt: chat.updatedAt,
                    lastMessage: chat.lastMessage,
                    lastMessageAt: chat.lastMessageAt,
                };
            }),
        );

        return chatsWithParticipants;
    }

    async getMessages(chatId: number) {
        return await db.query.messages.findMany({
            where: eq(messages.chatId, chatId),
            with: {
                sender: {
                    columns: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
                attachments: {
                    columns: {
                        id: true,
                        fileName: true,
                        fileUrl: true,
                    },
                },
            },
            orderBy: [asc(messages.createdAt)],
        });
    }

    async sendMessage(
        chatId: number,
        senderId: string,
        content: string,
        attachmentsData?: {
            fileName: string;
            fileUrl: string;
            fileType?: string;
            fileSize?: number;
        }[],
    ) {
        return await db.transaction(async (tx) => {
            const [newMessage] = await tx
                .insert(messages)
                .values({
                    chatId,
                    senderId,
                    content,
                })
                .returning();

            if (attachmentsData && attachmentsData.length > 0) {
                const attachmentsToInsert = attachmentsData.map((a) => ({
                    messageId: newMessage.id,
                    ...a,
                }));
                await tx.insert(attachments).values(attachmentsToInsert);
            }

            // Update chat's updatedAt timestamp
            await tx
                .update(chats)
                .set({ updatedAt: new Date() })
                .where(eq(chats.id, chatId));

            return newMessage;
        });
    }

    async getOrganizationMembers(
        organizationId: number,
        currentUserId: string,
    ) {
        return await db
            .select({
                id: users.id,
                name: users.name,
                image: users.image,
                email: users.email,
            })
            .from(organizationMembers)
            .innerJoin(users, eq(organizationMembers.userId, users.id))
            .where(
                and(
                    eq(organizationMembers.organizationId, organizationId),
                    sql`${organizationMembers.userId} != ${currentUserId}`,
                ),
            );
    }

    async markMessagesAsRead(chatId: number, userId: string) {
        return await db
            .update(messages)
            .set({ readAt: new Date() })
            .where(
                and(
                    eq(messages.chatId, chatId),
                    sql`${messages.senderId} != ${userId}`,
                    sql`${messages.readAt} IS NULL`,
                ),
            );
    }

    async isParticipant(chatId: number, userId: string) {
        const participant = await db
            .select({ id: chatParticipants.id })
            .from(chatParticipants)
            .where(
                and(
                    eq(chatParticipants.chatId, chatId),
                    eq(chatParticipants.userId, userId),
                ),
            )
            .limit(1);

        return participant.length > 0;
    }

    async editMessage(messageId: number, userId: string, content: string) {
        return await db
            .update(messages)
            .set({ content, updatedAt: new Date() })
            .where(
                and(eq(messages.id, messageId), eq(messages.senderId, userId)),
            )
            .returning();
    }

    async deleteMessage(messageId: number, userId: string) {
        return await db
            .delete(messages)
            .where(
                and(eq(messages.id, messageId), eq(messages.senderId, userId)),
            )
            .returning();
    }
}

export const chatService = new ChatService();
