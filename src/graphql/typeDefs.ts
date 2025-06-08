import { gql } from "graphql-tag";

export const typeDefs = gql`
  scalar Upload
  type Query {
    current: User
    getWorkspaces: [Workspace]
    getWorkspace(id: ID!): Workspace
  }

  type Mutation {
    logout: AuthResponse
    signup(input: AuthInput!): AuthResponse
    signin(email: String!, password: String!): AuthResponse

    deleteWorkspace(id: ID!): WorkspaceResponse
    joinWorkspace(inviteCode: String!): Workspace
    createWorkspace(name: String!, image: ImageInput): Workspace
    updateWorkspace(id: ID!, name: String!, image: ImageInput): Workspace
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

  type AuthResponse {
    success: Boolean
    message: String
  }

  type WorkspaceResponse {
    success: Boolean
    message: String
    workspace: Workspace
  }

  type User {
    id: ID
    name: String
    email: String
  }

  type Workspace {
    id: ID
    name: String
    image: String
    userId: String
    inviteCode: String
  }
`;
