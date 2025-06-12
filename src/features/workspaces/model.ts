import { db } from "@/db";
import { workspaces, workspaceMembers } from "@/db/schema";
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from "./schemas";
import { and, eq, inArray } from "drizzle-orm";

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
}
