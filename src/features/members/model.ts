import { db } from "@/db";
import { and, eq } from "drizzle-orm";

import { workspaceMembers, users } from "@/db/schema";
import type { MemberRole } from "../workspaces/model";

export class MembersModel {
  static async getMembers(workspaceId: string) {
    const members = await db
      .select({
        workspaceId: workspaceMembers.workspaceId,
        userId: workspaceMembers.userId,
        role: workspaceMembers.role,
        createdAt: workspaceMembers.createdAt,
        updatedAt: workspaceMembers.updatedAt,
        name: users.name,
        email: users.email
      })
      .from(workspaceMembers)
      .leftJoin(users, eq(workspaceMembers.userId, users.id))
      .where(eq(workspaceMembers.workspaceId, workspaceId));

    return members;
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

  static async removeMember(memberId: string) {
    const [member] = await db
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.userId, memberId))
      .returning();

    return member;
  }

  static async updateRole(memberId: string, role: MemberRole) {
    const [member] = await db
      .update(workspaceMembers)
      .set({ role })
      .where(eq(workspaceMembers.userId, memberId))
      .returning();

    return member;
  }
}
