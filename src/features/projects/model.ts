import { db } from "@/db";
import { sql } from "drizzle-orm/sql";
import { desc, eq, and, gte, lte, ne, lt } from "drizzle-orm";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

import type { Project } from "./schemas";
import { projects, tasks } from "@/db/schema";
import { TaskStatus } from "../tasks/schemas";

export class ProjectsModel {
  static async getProjects(workspaceId: string) {
    const projectsList = await db
      .select()
      .from(projects)
      .where(eq(projects.workspaceId, workspaceId))
      .orderBy(desc(projects.createdAt));

    return projectsList;
  }

  static async getProject(projectId: string) {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    return project;
  }

  static async createProject({ name, workspaceId, image }: Project) {
    const [newProject] = await db
      .insert(projects)
      .values({
        name,
        workspaceId,
        image: typeof image === "string" ? image : null
      })
      .returning();

    return newProject;
  }

  static async updateProject(
    projectId: string,
    { image, name }: Partial<Project>
  ) {
    const [updatedProject] = await db
      .update(projects)
      .set({
        name,
        image: typeof image === "string" ? image : null
      })
      .where(eq(projects.id, projectId))
      .returning();

    return updatedProject;
  }

  static async deleteProject(projectId: string) {
    const [deletedProject] = await db
      .delete(projects)
      .where(eq(projects.id, projectId))
      .returning();

    return deletedProject;
  }

  static async getAnalyticsProject({
    projectId,
    assigneeId
  }: {
    projectId: string;
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
          eq(tasks.projectId, projectId),
          gte(tasks.createdAt, thisMonthStart),
          lte(tasks.createdAt, thisMonthEnd)
        )
      );

    const lastMonthTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.projectId, projectId),
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
          eq(tasks.projectId, projectId),
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
          eq(tasks.projectId, projectId),
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
          eq(tasks.projectId, projectId),
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
          eq(tasks.projectId, projectId),
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
          eq(tasks.projectId, projectId),
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
          eq(tasks.projectId, projectId),
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
          eq(tasks.projectId, projectId),
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
          eq(tasks.projectId, projectId),
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
