import { db } from "@/db";
import { desc, eq } from "drizzle-orm";

import { projects } from "@/db/schema";
import type { Project } from "./schemas";

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
}
