import { AccessToken } from 'livekit-server-sdk';
import { db } from '@/server/db';
import {
    meetings,
    meetingParticipants,
    meetingRecordings,
    meetingMessages,
} from '@/server/db/schema/meet-schema';
import { projectMembers } from '@/server/db/schema/project-schema';
import { organizationMembers } from '@/server/db/schema/organization-schema';
import { eq, and, isNull, asc, desc, sql, inArray, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { env } from '@/lib/env';

export class MeetingService {
    private apiKey: string;
    private apiSecret: string;
    private wsUrl: string;

    constructor() {
        this.apiKey = env.LIVEKIT_API_KEY;
        this.apiSecret = env.LIVEKIT_API_SECRET;
        this.wsUrl = env.LIVEKIT_URL;
    }

    async createMeeting(
        userId: string,
        name: string,
        organizationId: number,
        projectId?: number,
    ) {
        const meetingId = nanoid();
        const inviteCode = nanoid(10);

        const [meeting] = await db
            .insert(meetings)
            .values({
                id: meetingId,
                name,
                hostId: userId,
                organizationId,
                projectId: projectId || null,
                inviteCode,
                status: 'active',
            })
            .returning();

        return meeting;
    }

    async getMeetingByInviteCode(inviteCode: string) {
        return await db.query.meetings.findFirst({
            where: eq(meetings.inviteCode, inviteCode),
            with: {
                organization: true,
                project: true,
            },
        });
    }

    async getMeetingById(id: string) {
        return await db.query.meetings.findFirst({
            where: eq(meetings.id, id),
            with: {
                host: true,
                organization: true,
                project: true,
                participants: {
                    with: {
                        user: true,
                    },
                },
                recordings: true,
            },
        });
    }

    async generateToken(meetingId: string, userId: string, userName: string) {
        const at = new AccessToken(this.apiKey, this.apiSecret, {
            identity: userId,
            name: userName,
        });
        at.addGrant({
            roomJoin: true,
            room: meetingId,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
        });

        return await at.toJwt();
    }

    async joinMeeting(meetingId: string, userId: string) {
        // Record participation
        await db
            .insert(meetingParticipants)
            .values({
                id: nanoid(),
                meetingId,
                userId,
            })
            .onConflictDoNothing();
    }

    async leaveMeeting(meetingId: string, userId: string) {
        await db
            .update(meetingParticipants)
            .set({ leftAt: new Date() })
            .where(
                and(
                    eq(meetingParticipants.meetingId, meetingId),
                    eq(meetingParticipants.userId, userId),
                    isNull(meetingParticipants.leftAt),
                ),
            );
    }

    async getActiveParticipantCount(meetingId: string): Promise<number> {
        const result = await db
            .select({ count: sql<number>`count(*)` })
            .from(meetingParticipants)
            .where(
                and(
                    eq(meetingParticipants.meetingId, meetingId),
                    isNull(meetingParticipants.leftAt),
                ),
            );
        return Number(result[0]?.count || 0);
    }

    async checkAndEndMeetingIfEmpty(meetingId: string): Promise<boolean> {
        const activeCount = await this.getActiveParticipantCount(meetingId);
        if (activeCount === 0) {
            await this.endMeeting(meetingId);
            return true;
        }
        return false;
    }

    async endMeeting(meetingId: string) {
        await db
            .update(meetings)
            .set({
                status: 'ended',
                endedAt: new Date(),
            })
            .where(eq(meetings.id, meetingId));

        // Finalize meeting - export chat messages to R2
        try {
            const { meetingStorageService } =
                await import('./meeting-storage.service');
            await meetingStorageService.finalizeMeeting(meetingId);
        } catch (error) {
            console.error(
                `[Meeting] Failed to finalize meeting ${meetingId}:`,
                error,
            );
            // Don't throw - meeting is still ended, just export failed
        }
    }

    // Check if user can access a meeting (is org member or project member)
    async canUserAccessMeeting(
        userId: string,
        meeting: { organizationId: number; projectId: number | null },
    ): Promise<boolean> {
        // Check if user is org member
        const orgMember = await db.query.organizationMembers.findFirst({
            where: and(
                eq(organizationMembers.organizationId, meeting.organizationId),
                eq(organizationMembers.userId, userId),
                isNull(organizationMembers.deletedAt),
            ),
        });

        if (!orgMember) return false;

        // If meeting has a project, check project membership too
        if (meeting.projectId) {
            const projMember = await db.query.projectMembers.findFirst({
                where: and(
                    eq(projectMembers.projectId, meeting.projectId),
                    eq(projectMembers.userId, userId),
                    isNull(projectMembers.deletedAt),
                ),
            });
            return !!projMember;
        }

        return true;
    }

    // Get active sessions for an organization
    async getActiveSessions(organizationId: number) {
        const activeMeetings = await db.query.meetings.findMany({
            where: and(
                eq(meetings.organizationId, organizationId),
                eq(meetings.status, 'active'),
            ),
            with: {
                host: true,
                project: true,
                participants: {
                    where: isNull(meetingParticipants.leftAt),
                    with: {
                        user: true,
                    },
                },
            },
            orderBy: [desc(meetings.createdAt)],
        });

        // Filter to only include meetings that have at least one active participant
        return activeMeetings.map((meeting) => ({
            ...meeting,
            activeParticipantCount: meeting.participants.length,
        }));
    }

    // Get meeting history for a participant (user was part of the meeting)
    async getMeetingHistory(userId: string, organizationId?: number) {
        // Get all meetings where user was a participant
        const participations = await db.query.meetingParticipants.findMany({
            where: eq(meetingParticipants.userId, userId),
            with: {
                meeting: {
                    with: {
                        host: true,
                        project: true,
                        recordings: true,
                    },
                },
            },
            orderBy: [desc(meetingParticipants.joinedAt)],
        });

        // Filter by organization if specified and only include ended meetings
        let filtered = participations.filter(
            (p) => p.meeting.status === 'ended',
        );

        if (organizationId) {
            filtered = filtered.filter(
                (p) => p.meeting.organizationId === organizationId,
            );
        }

        return filtered;
    }

    // Chat message methods
    async sendMessage(meetingId: string, senderId: string, content: string) {
        const [message] = await db
            .insert(meetingMessages)
            .values({
                id: nanoid(),
                meetingId,
                senderId,
                content,
            })
            .returning();

        // Return message with sender info
        return await db.query.meetingMessages.findFirst({
            where: eq(meetingMessages.id, message.id),
            with: {
                sender: true,
            },
        });
    }

    async getMessages(meetingId: string) {
        const messages = await db.query.meetingMessages.findMany({
            where: eq(meetingMessages.meetingId, meetingId),
            with: {
                sender: true,
            },
            orderBy: [asc(meetingMessages.createdAt)],
        });
        console.log(
            `[Meeting] getMessages for ${meetingId}:`,
            JSON.stringify(messages.slice(0, 2), null, 2),
        );
        return messages;
    }

    // Export messages to JSON format for R2 storage
    async exportMessagesAsJson(meetingId: string): Promise<string> {
        const messages = await this.getMessages(meetingId);
        return JSON.stringify(messages, null, 2);
    }
}

export const meetingService = new MeetingService();
