import { z } from 'zod';
import { router, authenticatedProcedure } from '../router';
import { taskCommentService } from '../services/task-comment.service';

export const taskCommentRouter = router({
    create: authenticatedProcedure
        .input(
            z.object({
                taskId: z.number(),
                comment: z.string().min(1),
                parentId: z.number().optional(),
            }),
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx.session?.user.id) throw new Error('Unauthorized');
            return await taskCommentService.createComment(
                input,
                ctx.session.user.id,
            );
        }),

    getByTaskId: authenticatedProcedure
        .input(z.object({ taskId: z.number() }))
        .query(async ({ input }) => {
            return await taskCommentService.getCommentsByTaskId(input.taskId);
        }),

    update: authenticatedProcedure
        .input(
            z.object({
                id: z.number(),
                comment: z.string().min(1),
            }),
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx.session?.user.id) throw new Error('Unauthorized');
            const { id, ...data } = input;
            return await taskCommentService.updateComment(
                id,
                data,
                ctx.session.user.id,
            );
        }),

    delete: authenticatedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
            if (!ctx.session?.user.id) throw new Error('Unauthorized');
            return await taskCommentService.deleteComment(
                input.id,
                ctx.session.user.id,
            );
        }),
});
