import { db } from "@/db";
import { workspaces, workspaceMembers } from "@/db/schema";
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from "./schemas";
import { and, eq } from "drizzle-orm";

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
    role?: MemberRole;
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

  static async getMember({
    workspaceId,
    userId
  }: {
    workspaceId: string;
    userId: string;
  }) {
    const [member] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId)
        )
      )
      .limit(1)
      .execute();

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

  static async getWorkspacesByUserId(userId: string) {
    const workspacesList = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.userId, userId));

    return workspacesList;
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
}
