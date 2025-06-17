import { GraphQLError } from "graphql";
import type { Request, Response } from "express";
import GraphQLUpload from "graphql-upload/GraphQLUpload.mjs";
import type { FileUpload } from "graphql-upload/processRequest.mjs";

import { utapi } from "@/lib/uploathing";

import type {
  UserType,
  LoginInput,
  RegisterInput
} from "@/features/auth/schemas";
import { generateInviteCode } from "@/lib/utils";
import { signin, signup } from "@/features/auth/model";
import { MembersModel } from "@/features/members/model";
import { ProjectsModel } from "@/features/projects/model";
import { AUTH_COOKIE_NAME } from "@/features/auth/constants";
import { MemberRole, WorkspaceModel } from "@/features/workspaces/model";
import type {
  Task,
  TaskSearch,
  BulkTask,
  UpdateTask
} from "@/features/tasks/schemas";
import { TaskModel } from "@/features/tasks/model";

interface MyContext {
  req: Request;
  res: Response;
  user: UserType | null;
}

interface Input {
  input: LoginInput | RegisterInput;
}

export const resolvers = {
  Upload: GraphQLUpload,
  Workspace: {
    members: async (workspace: { id: string }, _: any, { user }: MyContext) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }

      const member = await MembersModel.getMember({
        workspaceId: workspace.id,
        userId: user.id
      });
      if (!member) {
        throw new GraphQLError("Not a member of this workspace", {
          extensions: {
            code: "FORBIDDEN"
          }
        });
      }

      const members = await MembersModel.getMembers(workspace.id);
      return members.map((member) => ({
        id: member.userId,
        name: member.name,
        role: member.role,
        email: member.email
      }));
    }
  },
  Task: {
    assignee: async (task: Task, _: any, { user }: MyContext) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }

      const member = await MembersModel.getMember({
        workspaceId: task.workspaceId,
        userId: user.id
      });
      if (!member) {
        throw new GraphQLError("Not a member of this workspace", {
          extensions: {
            code: "FORBIDDEN"
          }
        });
      }

      const assignee = await MembersModel.getMemberById(task.assigneeId);

      return {
        id: assignee.id,
        name: assignee.name,
        email: assignee.email
      };
    },
    project: async (task: Task, _: any, { user }: MyContext) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }

      const member = await MembersModel.getMember({
        workspaceId: task.workspaceId,
        userId: user.id
      });
      if (!member) {
        throw new GraphQLError("Not a member of this workspace", {
          extensions: {
            code: "FORBIDDEN"
          }
        });
      }

      const project = await ProjectsModel.getProject(task.projectId);

      return {
        id: project.id,
        name: project.name,
        image: project.image,
        workspaceId: project.workspaceId
      };
    }
  },
  Query: {
    current: async (_: any, __: any, { user, req }: MyContext) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }
      return {
        id: user.id,
        name: user.name,
        email: user.email
      };
    },
    getWorkspaces: async (_: any, __: any, { user }: MyContext) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }

      const workspaces = await WorkspaceModel.getWorkspacesbyMember(user.id);

      return workspaces.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        image: workspace.image,
        userId: workspace.userId,
        inviteCode: workspace.inviteCode
      }));
    },
    getWorkspace: async (
      _: any,
      { id }: { id: string },
      { user }: MyContext
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }

      const member = await MembersModel.getMember({
        workspaceId: id,
        userId: user.id
      });
      if (!member) {
        throw new GraphQLError("Not a member of this workspace", {
          extensions: {
            code: "FORBIDDEN"
          }
        });
      }

      const workspace = await WorkspaceModel.getWorkspaceById(id);
      if (!workspace) {
        throw new GraphQLError("Workspace not found", {
          extensions: {
            code: "NOT_FOUND"
          }
        });
      }

      return {
        id: workspace.id,
        name: workspace.name,
        image: workspace.image,
        userId: workspace.userId,
        inviteCode: workspace.inviteCode
      };
    },
    getWorkspaceInfo: async (
      _: any,
      { id }: { id: string },
      { user }: MyContext
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }

      const workspace = await WorkspaceModel.getWorkspaceById(id);
      if (!workspace) {
        throw new GraphQLError("Workspace not found", {
          extensions: {
            code: "NOT_FOUND"
          }
        });
      }

      return {
        name: workspace.name
      };
    },
    getMembers: async (
      _: any,
      { workspaceId }: { workspaceId: string },
      { user }: MyContext
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }
      const member = await MembersModel.getMember({
        workspaceId,
        userId: user.id
      });
      if (!member) {
        throw new GraphQLError("Not a member of this workspace", {
          extensions: {
            code: "FORBIDDEN"
          }
        });
      }
      const members = await MembersModel.getMembers(workspaceId);
      return members.map((member) => ({
        id: member.userId,
        name: member.name,
        role: member.role,
        email: member.email
      }));
    },
    getProjects: async (
      _: any,
      { workspaceId }: { workspaceId: string },
      { user }: MyContext
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }

      const member = await MembersModel.getMember({
        workspaceId,
        userId: user.id
      });
      if (!member) {
        throw new GraphQLError("Not a member of this workspace", {
          extensions: {
            code: "FORBIDDEN"
          }
        });
      }

      const projects = await ProjectsModel.getProjects(workspaceId);
      return projects.map((project) => ({
        id: project.id,
        name: project.name,
        image: project.image,
        workspaceId: project.workspaceId
      }));
    },
    getProject: async (
      _: any,
      { projectId }: { projectId: string },
      { user }: MyContext
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }

      const project = await ProjectsModel.getProject(projectId);
      if (!project) {
        throw new GraphQLError("Project not found", {
          extensions: {
            code: "NOT_FOUND"
          }
        });
      }

      const member = await MembersModel.getMember({
        workspaceId: project.workspaceId,
        userId: user.id
      });
      if (!member) {
        throw new GraphQLError("Not a member of this workspace", {
          extensions: {
            code: "FORBIDDEN"
          }
        });
      }

      return {
        id: project.id,
        name: project.name,
        image: project.image,
        workspaceId: project.workspaceId
      };
    },
    getTasks: async (
      _: any,
      {
        workspaceId,
        projectId,
        assigneeId,
        status,
        search,
        dueDate
      }: TaskSearch,
      { user }: MyContext
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }

      const member = await MembersModel.getMember({
        workspaceId: workspaceId ? workspaceId : "",
        userId: user.id
      });
      if (!member) {
        throw new GraphQLError("Not a member of this workspace", {
          extensions: {
            code: "FORBIDDEN"
          }
        });
      }

      const tasks = await TaskModel.getTasks({
        workspaceId,
        projectId,
        assigneeId,
        status,
        search,
        dueDate
      });

      return tasks.map((task) => ({
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null
      }));
    },
    getTask: async (_: any, { id }: { id: string }, { user }: MyContext) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }

      const task = await TaskModel.getTaskById(id);
      if (!task) {
        throw new GraphQLError("Task not found", {
          extensions: {
            code: "NOT_FOUND"
          }
        });
      }

      const member = await MembersModel.getMember({
        workspaceId: task.workspaceId,
        userId: user.id
      });
      if (!member) {
        throw new GraphQLError("Not a member of this workspace", {
          extensions: {
            code: "FORBIDDEN"
          }
        });
      }

      return {
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null
      };
    },
    getAnalyticsProject: async (
      _: any,
      { projectId }: { projectId: string },
      { user }: MyContext
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }

      const project = await ProjectsModel.getProject(projectId);

      const member = await MembersModel.getMember({
        workspaceId: project.workspaceId,
        userId: user.id
      });

      if (!member) {
        throw new GraphQLError("Not a member of this workspace", {
          extensions: {
            code: "FORBIDDEN"
          }
        });
      }

      if (!project) {
        throw new GraphQLError("Project not found", {
          extensions: {
            code: "NOT_FOUND"
          }
        });
      }

      const analytics = await ProjectsModel.getAnalyticsProject({
        projectId,
        assigneeId: member.userId
      });

      return analytics;
    },
    getAnalyticsWorkspace: async (
      _: any,
      { workspaceId }: { workspaceId: string },
      { user }: MyContext
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }

      const member = await MembersModel.getMember({
        workspaceId: workspaceId,
        userId: user.id
      });

      if (!member) {
        throw new GraphQLError("Not a member of this workspace", {
          extensions: {
            code: "FORBIDDEN"
          }
        });
      }

      const analytics = await WorkspaceModel.getAnalyticsWorkspace({
        workspaceId,
        assigneeId: member.userId
      });

      return analytics;
    }
  },

  Mutation: {
    signup: async (_: any, { input }: Input, { res }: MyContext) => {
      const { email, password, name } = input as RegisterInput;
      const token = await signup({
        name,
        email,
        password
      });

      res.cookie(AUTH_COOKIE_NAME, token, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        maxAge: 60 * 60 * 24 * 30
      });

      return {
        success: true,
        message: "User registered successfully"
      };
    },
    signin: async (_: any, input: LoginInput, { res, req }: MyContext) => {
      const { email, password } = input;

      const token = await signin({
        email,
        password
      });

      res.cookie(AUTH_COOKIE_NAME, token, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        maxAge: 60 * 60 * 24 * 30
      });

      return {
        success: true,
        message: "User logged in successfully"
      };
    },
    logout: async (_: any, __: any, ctx: MyContext) => {
      ctx.res.clearCookie(AUTH_COOKIE_NAME);

      return {
        success: true,
        message: "User logged out successfully"
      };
    },
    createWorkspace: async (
      _: any,
      {
        name,
        image
      }: { name: string; image?: { file?: Promise<FileUpload>; url?: string } },
      { user }: MyContext
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }

      let uploadedImageUrl: string | undefined;

      if (image?.file) {
        const file: FileUpload = await image.file;

        // Read the file stream and convert it to a Node.js File instance
        const stream = file.createReadStream();
        const chunks: Uint8Array[] = [];

        for await (const chunk of stream) {
          chunks.push(chunk);
        }

        const buffer = Buffer.concat(chunks);

        // Create a Node.js File instance
        const nodeFile = new File([buffer], file.filename, {
          type: file.mimetype
        });

        const result = await utapi.uploadFiles(nodeFile);

        if (!result || result.error) {
          throw new GraphQLError("Failed to upload image", {
            extensions: {
              code: "UPLOAD_FAILED",
              details: result.error
            }
          });
        }

        uploadedImageUrl = result.data.ufsUrl;
      } else if (image?.url) {
        uploadedImageUrl = image.url;
      }

      const workspace = await WorkspaceModel.createWorkspace({
        name,
        userId: user.id,
        image: uploadedImageUrl,
        inviteCode: generateInviteCode(6)
      });

      await WorkspaceModel.addMember({
        workspaceId: workspace.id,
        userId: user.id,
        role: MemberRole.ADMIN
      });

      return {
        id: workspace.id,
        name: workspace.name,
        userId: workspace.userId,
        image: workspace.image,
        inviteCode: workspace.inviteCode
      };
    },
    updateWorkspace: async (
      _: any,
      {
        id,
        name,
        image
      }: {
        id: string;
        name: string;
        image?: { file?: Promise<FileUpload>; url?: string };
      },
      { user }: MyContext
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }

      const member = await MembersModel.getMember({
        workspaceId: id,
        userId: user.id
      });
      if (!member || member.role !== MemberRole.ADMIN) {
        throw new GraphQLError("Not authorized to update this workspace", {
          extensions: {
            code: "FORBIDDEN"
          }
        });
      }

      let uploadedImageUrl: string | undefined;

      if (image?.file) {
        const file: FileUpload = await image.file;

        // Read the file stream and convert it to a Node.js File instance
        const stream = file.createReadStream();
        const chunks: Uint8Array[] = [];

        for await (const chunk of stream) {
          chunks.push(chunk);
        }

        const buffer = Buffer.concat(chunks);

        // Create a Node.js File instance
        const nodeFile = new File([buffer], file.filename, {
          type: file.mimetype
        });

        const result = await utapi.uploadFiles(nodeFile);

        if (!result || result.error) {
          throw new GraphQLError("Failed to upload image", {
            extensions: {
              code: "UPLOAD_FAILED",
              details: result.error
            }
          });
        }

        uploadedImageUrl = result.data.ufsUrl;
      } else {
        uploadedImageUrl = image?.url;
      }

      const updatedWorkspace = await WorkspaceModel.updateWorkspace({
        id,
        name,
        image: uploadedImageUrl
      });

      return {
        id: updatedWorkspace.id,
        name: updatedWorkspace.name,
        userId: updatedWorkspace.userId,
        image: updatedWorkspace.image,
        inviteCode: updatedWorkspace.inviteCode
      };
    },
    deleteWorkspace: async (
      _: any,
      { id }: { id: string },
      { user }: MyContext
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }

      const member = await MembersModel.getMember({
        workspaceId: id,
        userId: user.id
      });
      if (!member || member.role !== MemberRole.ADMIN) {
        throw new GraphQLError("Not authorized to delete this workspace", {
          extensions: {
            code: "FORBIDDEN"
          }
        });
      }

      await WorkspaceModel.deleteWorkspace(id);

      return {
        success: true,
        message: "Workspace deleted successfully"
      };
    },
    resetInviteCode: async (
      _: any,
      { id }: { id: string },
      { user }: MyContext
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }

      const member = await MembersModel.getMember({
        workspaceId: id,
        userId: user.id
      });

      if (!member || member.role !== MemberRole.ADMIN) {
        throw new GraphQLError("Not authorized to reset invite code", {
          extensions: {
            code: "FORBIDDEN"
          }
        });
      }

      const updatedWorkspace = await WorkspaceModel.resetInviteCode({
        id,
        inviteCode: generateInviteCode(6)
      });

      return {
        id: updatedWorkspace.id,
        name: updatedWorkspace.name,
        image: updatedWorkspace.image,
        userId: updatedWorkspace.userId,
        inviteCode: updatedWorkspace.inviteCode
      };
    },
    joinWorkspace: async (
      _: any,
      { inviteCode, workspaceId }: { inviteCode: string; workspaceId: string },
      { user }: MyContext
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }

      const existingMember = await MembersModel.getMember({
        workspaceId,
        userId: user.id
      });

      if (existingMember) {
        throw new GraphQLError("You are already a member of this workspace", {
          extensions: {
            code: "ALREADY_EXISTS"
          }
        });
      }

      const workspace = await WorkspaceModel.joinWorkspace({
        inviteCode,
        userId: user.id
      });

      return {
        id: workspace.id,
        name: workspace.name,
        image: workspace.image,
        userId: workspace.userId,
        inviteCode: workspace.inviteCode
      };
    },
    removeMember: async (
      _: any,
      { memberId, workspaceId }: { memberId: string; workspaceId: string },
      { user }: MyContext
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }

      const allMemberInWorkspace = await MembersModel.getMembers(workspaceId);
      if (allMemberInWorkspace.length <= 1) {
        throw new GraphQLError(
          "Cannot remove the last member from a workspace",
          {
            extensions: {
              code: "INVALID_OPERATION"
            }
          }
        );
      }

      const currentUserMember = await MembersModel.getMember({
        workspaceId: workspaceId,
        userId: user.id
      });
      if (!currentUserMember || currentUserMember.role !== MemberRole.ADMIN) {
        throw new GraphQLError("Not authorized to remove members", {
          extensions: {
            code: "FORBIDDEN"
          }
        });
      }

      await MembersModel.removeMember(memberId);

      return {
        success: true,
        message: `Member removed successfully`
      };
    },
    updateRole: async (
      _: any,
      {
        memberId,
        role,
        workspaceId
      }: { memberId: string; role: MemberRole; workspaceId: string },
      { user }: MyContext
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }

      const allMemberInWorkspace = await MembersModel.getMembers(workspaceId);
      if (allMemberInWorkspace.length <= 1) {
        throw new GraphQLError(
          "Cannot update role of the last member in a workspace",
          {
            extensions: {
              code: "INVALID_OPERATION"
            }
          }
        );
      }

      const currentUserMember = await MembersModel.getMember({
        workspaceId: workspaceId,
        userId: user.id
      });
      if (!currentUserMember || currentUserMember.role !== MemberRole.ADMIN) {
        throw new GraphQLError("Not authorized to update member roles", {
          extensions: {
            code: "FORBIDDEN"
          }
        });
      }

      await MembersModel.updateRole(memberId, role);

      return {
        success: true,
        message: `Member role updated to ${role}`
      };
    },

    createProject: async (
      _: any,
      {
        name,
        workspaceId,
        image
      }: {
        name: string;
        workspaceId: string;
        image?: { file?: Promise<FileUpload>; url?: string };
      },
      { user }: MyContext
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }

      const member = await MembersModel.getMember({
        workspaceId,
        userId: user.id
      });
      if (!member) {
        throw new GraphQLError("Not a member of this workspace", {
          extensions: {
            code: "FORBIDDEN"
          }
        });
      }

      let uploadedImageUrl: string | undefined;

      if (image?.file) {
        const file: FileUpload = await image.file;

        // Read the file stream and convert it to a Node.js File instance
        const stream = file.createReadStream();
        const chunks: Uint8Array[] = [];

        for await (const chunk of stream) {
          chunks.push(chunk);
        }

        const buffer = Buffer.concat(chunks);

        // Create a Node.js File instance
        const nodeFile = new File([buffer], file.filename, {
          type: file.mimetype
        });

        const result = await utapi.uploadFiles(nodeFile);

        if (!result || result.error) {
          throw new GraphQLError("Failed to upload image", {
            extensions: {
              code: "UPLOAD_FAILED",
              details: result.error
            }
          });
        }

        uploadedImageUrl = result.data.ufsUrl;
      } else if (image?.url) {
        uploadedImageUrl = image.url;
      }

      const project = await ProjectsModel.createProject({
        name,
        workspaceId,
        image: uploadedImageUrl
      });

      return {
        id: project.id,
        name: project.name,
        image: project.image,
        workspaceId: project.workspaceId
      };
    },
    updateProject: async (
      _: any,
      {
        id,
        name,
        image
      }: {
        id: string;
        name: string;
        image?: { file?: Promise<FileUpload>; url?: string };
      },
      { user }: MyContext
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }

      const project = await ProjectsModel.getProject(id);
      if (!project) {
        throw new GraphQLError("Project not found", {
          extensions: {
            code: "NOT_FOUND"
          }
        });
      }

      const member = await MembersModel.getMember({
        workspaceId: project.workspaceId,
        userId: user.id
      });
      if (!member) {
        throw new GraphQLError("Not a member of this workspace", {
          extensions: {
            code: "FORBIDDEN"
          }
        });
      }

      let uploadedImageUrl: string | undefined;

      if (image?.file) {
        const file: FileUpload = await image.file;

        // Read the file stream and convert it to a Node.js File instance
        const stream = file.createReadStream();
        const chunks: Uint8Array[] = [];

        for await (const chunk of stream) {
          chunks.push(chunk);
        }

        const buffer = Buffer.concat(chunks);

        // Create a Node.js File instance
        const nodeFile = new File([buffer], file.filename, {
          type: file.mimetype
        });

        const result = await utapi.uploadFiles(nodeFile);

        if (!result || result.error) {
          throw new GraphQLError("Failed to upload image", {
            extensions: {
              code: "UPLOAD_FAILED",
              details: result.error
            }
          });
        }

        uploadedImageUrl = result.data.ufsUrl;
      } else if (image?.url) {
        uploadedImageUrl = image.url;
      }

      const updatedProject = await ProjectsModel.updateProject(id, {
        name,
        image: uploadedImageUrl
      });

      return {
        id: updatedProject.id,
        name: updatedProject.name,
        image: updatedProject.image,
        workspaceId: updatedProject.workspaceId
      };
    },
    deleteProject: async (
      _: any,
      { id }: { id: string },
      { user }: MyContext
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }

      const project = await ProjectsModel.getProject(id);
      if (!project) {
        throw new GraphQLError("Project not found", {
          extensions: {
            code: "NOT_FOUND"
          }
        });
      }

      const member = await MembersModel.getMember({
        workspaceId: project.workspaceId,
        userId: user.id
      });
      if (!member) {
        throw new GraphQLError("Not a member of this workspace", {
          extensions: {
            code: "FORBIDDEN"
          }
        });
      }

      const deletedProject = await ProjectsModel.deleteProject(id);

      return {
        id: deletedProject.id,
        name: deletedProject.name,
        image: deletedProject.image,
        workspaceId: deletedProject.workspaceId
      };
    },

    createTask: async (
      _: any,
      { name, status, workspaceId, projectId, dueDate, assigneeId }: Task,
      { user }: MyContext
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }

      const member = await MembersModel.getMember({
        workspaceId,
        userId: user.id
      });
      if (!member) {
        throw new GraphQLError("Not a member of this workspace", {
          extensions: {
            code: "FORBIDDEN"
          }
        });
      }

      const task = await TaskModel.createTask({
        name,
        status,
        workspaceId,
        projectId,
        dueDate,
        assigneeId
      });
      console.log("Created task:", task);

      return {
        id: task.id,
        name: task.name,
        status: task.status,
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        dueDate: task.dueDate,
        assigneeId: task.assigneeId,
        position: task.position,
        description: task.description
      };
    },
    updateTask: async (
      _: any,
      {
        id,
        name,
        status,
        dueDate,
        projectId,
        assigneeId,
        description
      }: UpdateTask,
      { user }: MyContext
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }

      if (!id) {
        throw new GraphQLError("Task ID is required", {
          extensions: {
            code: "BAD_USER_INPUT"
          }
        });
      }
      const taskWorkspace = await TaskModel.getTaskById(id);

      const member = await MembersModel.getMember({
        workspaceId: taskWorkspace.workspaceId,
        userId: user.id
      });
      if (!member) {
        throw new GraphQLError("Not a member of this workspace", {
          extensions: {
            code: "FORBIDDEN"
          }
        });
      }

      const task = await TaskModel.updateTask({
        id,
        name,
        status,
        dueDate,
        projectId,
        assigneeId,
        description
      });

      return {
        id: task.id,
        name: task.name,
        status: task.status,
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        dueDate: task.dueDate?.toISOString(),
        description: task.description
      };
    },
    deleteTask: async (_: any, { id }: { id: string }, { user }: MyContext) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }

      const task = await TaskModel.getTaskById(id);

      const member = await MembersModel.getMember({
        workspaceId: task.workspaceId,
        userId: user.id
      });
      if (!member) {
        throw new GraphQLError("Not a member of this workspace", {
          extensions: {
            code: "FORBIDDEN"
          }
        });
      }

      await TaskModel.deleteTask(id);

      return {
        id: task.id,
        name: task.name,
        status: task.status,
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        dueDate: task.dueDate?.toISOString()
      };
    },
    bulkUpdateTasks: async (
      _: any,
      { tasks }: { tasks: BulkTask[] },
      { user }: MyContext
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }

      // TODO: check if all tasks belong to the same workspace

      const task = await TaskModel.getTaskById(tasks[0].id);
      const member = await MembersModel.getMember({
        workspaceId: task.workspaceId,
        userId: user.id
      });
      if (!member) {
        throw new GraphQLError("Not a member of this workspace", {
          extensions: {
            code: "FORBIDDEN"
          }
        });
      }

      if (!tasks || tasks.length === 0) {
        throw new GraphQLError("No tasks provided for bulk update", {
          extensions: {
            code: "BAD_USER_INPUT"
          }
        });
      }

      const updatedTasks = await TaskModel.bulkUpdateTasks(tasks);

      const formattedTasks = updatedTasks.map((task) => ({
        id: task.id,
        name: task.name,
        status: task.status,
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        dueDate: task.dueDate?.toISOString(),
        position: task.position,
        assigneeId: task.assigneeId,
        description: task.description
      }));

      return formattedTasks;
    }
  }
};
