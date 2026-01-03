import { router } from '../router';
import { userRouter } from './user.router';
import { organizationRouter } from './organization.router';
import { adminRouter } from './admin.router';
import { rbacRouter } from './rbac.router';
import { projectRouter } from './project.router';
import { sprintRouter } from './sprint.router';
import { taskRouter } from './task.router';
import { taskCommentRouter } from './task-comment.router';
import { chatRouter } from './chat.router';
import { timeTrackingRouter } from './time-tracking.router';
import { requestRouter } from './request.router';

export const appRouter = router({
    user: userRouter,
    organization: organizationRouter,
    admin: adminRouter,
    rbac: rbacRouter,
    project: projectRouter,
    sprint: sprintRouter,
    task: taskRouter,
    taskComment: taskCommentRouter,
    chat: chatRouter,
    timeTracking: timeTrackingRouter,
    request: requestRouter,
});

export type AppRouter = typeof appRouter;
