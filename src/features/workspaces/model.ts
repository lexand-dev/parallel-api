import { and, eq, gte, inArray, lt, lte, ne } from "drizzle-orm";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";

import { db } from "@/db";
import { TaskStatus } from "../tasks/schemas";
import { workspaces, workspaceMembers, tasks } from "@/db/schema";
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from "./schemas";

export enum MemberRole {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER"
}

export class WorkspaceModel {
  static async createWorkspace({
    name,
    userId,
    image,
    inviteCode
  }: CreateWorkspaceInput) {
    const [workspace] = await db
      .insert(workspaces)
      .values({
        name,
        userId,
        image: typeof image === "string" ? image : null,
        inviteCode: inviteCode
      })
      .returning();

    return workspace;
  }

  static async addMember({
    workspaceId,
    userId,
    role = MemberRole.MEMBER
  }: {
    workspaceId: string;
    userId: string;
    role: MemberRole;
  }) {
    const [member] = await db
      .insert(workspaceMembers)
      .values({
        workspaceId,
        userId,
        role
      })
      .returning();

    return member;
  }

  static async updateWorkspace({ id, name, image }: UpdateWorkspaceInput) {
    const [workspace] = await db
      .update(workspaces)
      .set({
        name,
        image: typeof image === "string" ? image : null
      })
      .where(eq(workspaces.id, id))
      .returning();

    return workspace;
  }

  static async deleteWorkspace(id: string) {
    const [result] = await db
      .delete(workspaces)
      .where(eq(workspaces.id, id))
      .returning();

    return result;
  }

  static async getWorkspacesbyMember(userId: string) {
    const workspacesList = await db
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, userId));

    if (!workspacesList.length) {
      throw new Error("No workspaces found for the user");
    }

    const workspaceIds = workspacesList.map((member) => member.workspaceId);

    const getWorkspacesbyMember = await db
      .select()
      .from(workspaces)
      .where(inArray(workspaces.id, workspaceIds))
      .execute();

    if (!getWorkspacesbyMember.length) {
      throw new Error("No workspaces found for the user");
    }

    if (getWorkspacesbyMember.length !== workspaceIds.length) {
      throw new Error("Some workspaces not found for the user");
    }
    // TODO: Verify if workspaces exist for this member
    return getWorkspacesbyMember;
  }

  static async getWorkspaceById(id: string) {
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, id))
      .limit(1)
      .execute();

    return workspace;
  }

  static async resetInviteCode({
    id,
    inviteCode
  }: {
    id: string;
    inviteCode: string;
  }) {
    const [workspace] = await db
      .update(workspaces)
      .set({ inviteCode })
      .where(eq(workspaces.id, id))
      .returning();

    return workspace;
  }

  static async joinWorkspace({
    inviteCode,
    userId
  }: {
    inviteCode: string;
    userId: string;
  }) {
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.inviteCode, inviteCode))
      .limit(1)
      .execute();

    if (!workspace) {
      throw new Error("Workspace not found");
    }

    await this.addMember({
      workspaceId: workspace.id,
      userId,
      role: MemberRole.MEMBER
    });

    return workspace;
  }

  static async getAnalyticsWorkspace({
    workspaceId,
    assigneeId
  }: {
    workspaceId: string;
    assigneeId: string;
  }) {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const thisMonthTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          gte(tasks.createdAt, thisMonthStart),
          lte(tasks.createdAt, thisMonthEnd)
        )
      );

    const lastMonthTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          gte(tasks.createdAt, lastMonthStart),
          lte(tasks.createdAt, lastMonthEnd)
        )
      );

    const taskCount = thisMonthTasks.length;
    const taskDifference = taskCount - lastMonthTasks.length;

    const thisMonthAssignedTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          eq(tasks.assigneeId, assigneeId),
          gte(tasks.createdAt, thisMonthStart),
          lte(tasks.createdAt, thisMonthEnd)
        )
      );

    const lastMonthAssignedTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          eq(tasks.assigneeId, assigneeId),
          gte(tasks.createdAt, lastMonthStart),
          lte(tasks.createdAt, lastMonthEnd)
        )
      );

    const assignedTaskCount = thisMonthAssignedTasks.length;
    const assignedTaskDifference =
      assignedTaskCount - lastMonthAssignedTasks.length;

    const thisMonthCompletedTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          eq(tasks.status, TaskStatus.DONE),
          gte(tasks.createdAt, thisMonthStart),
          lte(tasks.createdAt, thisMonthEnd)
        )
      );

    const lastMonthCompletedTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          eq(tasks.status, TaskStatus.DONE),
          gte(tasks.createdAt, lastMonthStart),
          lte(tasks.createdAt, lastMonthEnd)
        )
      );

    const completedTaskCount = thisMonthCompletedTasks.length;
    const completedTaskDifference =
      completedTaskCount - lastMonthCompletedTasks.length;

    const thisMonthIncompleteTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          ne(tasks.status, TaskStatus.DONE),
          gte(tasks.createdAt, thisMonthStart),
          lte(tasks.createdAt, thisMonthEnd)
        )
      );

    const lastMonthIncompleteTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          ne(tasks.status, TaskStatus.DONE),
          gte(tasks.createdAt, lastMonthStart),
          lte(tasks.createdAt, lastMonthEnd)
        )
      );

    const incompleteTaskCount = thisMonthIncompleteTasks.length;
    const incompleteTaskDifference =
      incompleteTaskCount - lastMonthIncompleteTasks.length;

    const thisMonthOverdueTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          ne(tasks.status, TaskStatus.DONE),
          lt(tasks.dueDate, now),
          gte(tasks.createdAt, thisMonthStart),
          lte(tasks.createdAt, thisMonthEnd)
        )
      );

    const lastMonthOverdueTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          ne(tasks.status, TaskStatus.DONE),
          lt(tasks.dueDate, now),
          gte(tasks.createdAt, lastMonthStart),
          lte(tasks.createdAt, lastMonthEnd)
        )
      );

    const overdueTaskCount = thisMonthOverdueTasks.length;
    const overdueTaskDifference =
      overdueTaskCount - lastMonthOverdueTasks.length;

    return {
      taskCount,
      taskDifference,
      assignedTaskCount,
      assignedTaskDifference,
      completedTaskCount,
      completedTaskDifference,
      incompleteTaskCount,
      incompleteTaskDifference,
      overdueTaskCount,
      overdueTaskDifference
    };
  }
}
