import { z } from 'zod';
import { router, authenticatedProcedure } from '../router';
import { meetingService } from '../services/meet.service';
import { transcriptionService } from '../services/transcription.service';
import { TRPCError } from '@trpc/server';

export const meetRouter = router({
    create: authenticatedProcedure
        .input(
            z.object({
                name: z.string().min(1),
                organizationId: z.number(),
                projectId: z.number().optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            return await meetingService.createMeeting(
                ctx.session.user.id,
                input.name,
                input.organizationId,
                input.projectId,
            );
        }),

    getRoom: authenticatedProcedure
        .input(z.object({ inviteCode: z.string() }))
        .query(async ({ ctx, input }) => {
            const meeting = await meetingService.getMeetingByInviteCode(
                input.inviteCode,
            );
            if (!meeting) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Meeting not found',
                });
            }

            // Check if user can access this meeting
            const canAccess = await meetingService.canUserAccessMeeting(
                ctx.session.user.id,
                meeting,
            );
            if (!canAccess) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not have access to this meeting',
                });
            }

            return meeting;
        }),

    getById: authenticatedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const meeting = await meetingService.getMeetingById(input.id);
            if (!meeting) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Meeting not found',
                });
            }

            // Check access - user must be participant or org/project member
            const isParticipant = meeting.participants.some(
                (p) => p.userId === ctx.session.user.id,
            );
            const canAccess =
                isParticipant ||
                (await meetingService.canUserAccessMeeting(
                    ctx.session.user.id,
                    meeting,
                ));

            if (!canAccess) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not have access to this meeting',
                });
            }

            return meeting;
        }),

    join: authenticatedProcedure
        .input(z.object({ meetingId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const meeting = await meetingService.getMeetingById(
                input.meetingId,
            );
            if (!meeting) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Meeting not found',
                });
            }

            if (meeting.status === 'ended') {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'This meeting has ended and cannot be rejoined',
                });
            }

            // Check if user can access this meeting (org/project member)
            const canAccess = await meetingService.canUserAccessMeeting(
                ctx.session.user.id,
                meeting,
            );
            if (!canAccess) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message:
                        'You must be a member of the organization/project to join this meeting',
                });
            }

            const token = await meetingService.generateToken(
                meeting.id,
                ctx.session.user.id,
                ctx.session.user.name || 'Anonymous',
            );

            await meetingService.joinMeeting(meeting.id, ctx.session.user.id);

            return { token };
        }),

    end: authenticatedProcedure
        .input(z.object({ meetingId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const meeting = await meetingService.getMeetingById(
                input.meetingId,
            );
            if (!meeting) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Meeting not found',
                });
            }

            if (meeting.hostId !== ctx.session.user.id) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Only the host can end the meeting',
                });
            }

            await meetingService.endMeeting(meeting.id);
            return { success: true };
        }),

    // Leave meeting - client fallback when webhooks aren't configured
    leave: authenticatedProcedure
        .input(z.object({ meetingId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const meeting = await meetingService.getMeetingById(
                input.meetingId,
            );
            if (!meeting) {
                return { success: false, ended: false };
            }

            // Mark user as left
            await meetingService.leaveMeeting(
                input.meetingId,
                ctx.session.user.id,
            );

            // Check if meeting should end (no more participants)
            const ended = await meetingService.checkAndEndMeetingIfEmpty(
                input.meetingId,
            );

            console.log(
                `[Meeting] User ${ctx.session.user.id} left meeting ${input.meetingId}, meeting ended: ${ended}`,
            );

            return { success: true, ended };
        }),

    // Get active sessions for an organization
    getActiveSessions: authenticatedProcedure
        .input(z.object({ organizationId: z.number() }))
        .query(async ({ input }) => {
            return await meetingService.getActiveSessions(input.organizationId);
        }),

    // Get meeting history (only meetings user participated in)
    getHistory: authenticatedProcedure
        .input(z.object({ organizationId: z.number().optional() }).optional())
        .query(async ({ ctx, input }) => {
            return await meetingService.getMeetingHistory(
                ctx.session.user.id,
                input?.organizationId,
            );
        }),

    uploadRecording: authenticatedProcedure
        .input(
            z.object({
                meetingId: z.string(),
                audioBase64: z.string(),
            }),
        )
        .mutation(async ({ input }) => {
            const buffer = Buffer.from(input.audioBase64, 'base64');
            // 1. Upload to R2 (placeholder for actual S3 upload logic)
            const audioUrl = `https://storage.anvaya.com/recordings/${input.meetingId}.wav`;

            // 2. Transcribe
            return await transcriptionService.processRecording(
                input.meetingId,
                audioUrl,
                buffer,
            );
        }),

    // Chat message procedures
    sendMessage: authenticatedProcedure
        .input(
            z.object({
                meetingId: z.string(),
                content: z.string().min(1),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            return await meetingService.sendMessage(
                input.meetingId,
                ctx.session.user.id,
                input.content,
            );
        }),

    getMessages: authenticatedProcedure
        .input(z.object({ meetingId: z.string() }))
        .query(async ({ input }) => {
            return await meetingService.getMessages(input.meetingId);
        }),
});
