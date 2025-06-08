import { db } from "@/db";
import { workspaces, workspaceMembers } from "@/db/schema";
import type { CreateWorkspaceInput } from "./schemas";
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

  static async members(userId: string) {
    const membersList = await db
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, userId));

    return membersList;
  }

  static async updateWorkspace(
    id: string,
    userId: string,
    name?: string,
    image?: string
  ) {
    const updateData: { name?: string; image?: string } = {};
    if (name) updateData.name = name;
    if (image) updateData.image = image;

    const [workspace] = await db
      .update(workspaces)
      .set(updateData)
      .where(and(eq(workspaces.id, id), eq(workspaces.userId, userId)))
      .returning();

    return workspace;
  }

  static async deleteWorkspace(id: string, userId: string) {
    const result = await db
      .delete(workspaces)
      .where(and(eq(workspaces.id, id), eq(workspaces.userId, userId)))
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

  static async getWorkspaceById(id: string, userId: string) {
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(and(eq(workspaces.id, id), eq(workspaces.userId, userId)))
      .limit(1)
      .execute();

    return workspace;
  }
}
