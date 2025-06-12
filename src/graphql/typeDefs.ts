import { gql } from "graphql-tag";

export const typeDefs = gql`
  scalar Upload
  type Query {
    current: User
    getWorkspaces: [Workspace]
    getWorkspace(id: ID!): Workspace
    getWorkspaceInfo(id: ID!): WorkspaceInfo
    getProjects(workspaceId: ID!): [Project]
    getProject(projectId: ID!): Project
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
  }

  enum MemberRole {
    ADMIN
    MEMBER
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
`;
