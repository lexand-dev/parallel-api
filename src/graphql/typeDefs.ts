import { gql } from "graphql-tag";

export const typeDefs = gql`
  scalar Upload

  enum MemberRole {
    ADMIN
    MEMBER
  }

  enum TaskStatus {
    BACKLOG
    TODO
    IN_PROGRESS
    IN_REVIEW
    DONE
  }

  type Query {
    current: User
    getWorkspaces: [Workspace]
    getWorkspace(id: ID!): Workspace
    getWorkspaceInfo(id: ID!): WorkspaceInfo
    getMembers(workspaceId: ID!): [Member]
    getProjects(workspaceId: ID!): [Project]
    getProject(projectId: ID!): Project
    getTasks(
      workspaceId: ID!
      projectId: ID
      assigneeId: ID
      status: TaskStatus
      search: String
      dueDate: String
    ): [Task]
    getTask(id: ID!): Task
    getAnalyticsProject(projectId: ID!): AnalyticsProject
  }

  type Mutation {
    logout: SuccessResponse
    signup(input: AuthInput!): SuccessResponse
    signin(email: String!, password: String!): SuccessResponse

    deleteWorkspace(id: ID!): SuccessResponse
    joinWorkspace(inviteCode: String!, workspaceId: ID!): Workspace
    resetInviteCode(id: ID!): Workspace
    createWorkspace(name: String!, image: ImageInput): Workspace
    updateWorkspace(id: ID!, name: String!, image: ImageInput): Workspace
    removeMember(memberId: ID!, workspaceId: ID!): SuccessResponse
    updateRole(
      memberId: ID!
      role: MemberRole!
      workspaceId: ID!
    ): SuccessResponse

    createProject(name: String!, workspaceId: ID!, image: ImageInput): Project
    updateProject(id: ID!, name: String!, image: ImageInput): Project
    deleteProject(id: ID!): Project

    createTask(
      name: String!
      status: TaskStatus!
      workspaceId: ID!
      projectId: ID!
      dueDate: String!
      assigneeId: ID!
    ): Task
    updateTask(
      id: ID!
      name: String
      status: TaskStatus
      dueDate: String
      projectId: ID
      assigneeId: ID
      description: String
    ): Task
    deleteTask(id: ID!): Task
    bulkUpdateTasks(tasks: [BulkTask!]!): [Task]
  }

  input AuthInput {
    name: String
    password: String!
    email: String!
  }

  input ImageInput {
    file: Upload
    url: String
  }

  type SuccessResponse {
    success: Boolean
    message: String
  }

  type WorkspaceInfo {
    name: String
  }

  type User {
    id: ID
    name: String
    email: String
  }

  type Member {
    id: ID
    name: String
    role: MemberRole
    email: String
  }

  type Workspace {
    id: ID
    name: String
    image: String
    userId: String
    inviteCode: String
    members: [Member]
  }

  type Project {
    id: ID
    name: String
    image: String
    workspaceId: String
  }

  type Task {
    id: ID
    name: String
    status: TaskStatus
    workspaceId: String
    projectId: String
    dueDate: String
    assigneeId: String
    description: String
    position: Int
    assignee: User
    project: Project
  }

  input BulkTask {
    id: ID!
    status: TaskStatus
    position: Int
  }

  type AnalyticsProject {
    taskCount: Int
    taskDifference: Int
    assignedTaskCount: Int
    assignedTaskDifference: Int
    completedTaskCount: Int
    completedTaskDifference: Int
    incompleteTaskCount: Int
    incompleteTaskDifference: Int
    overdueTaskCount: Int
    overdueTaskDifference: Int
  }
`;
