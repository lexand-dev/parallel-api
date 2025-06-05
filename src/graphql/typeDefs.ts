import { gql } from "graphql-tag";

export const typeDefs = gql`
  type Query {
    current: User
  }

  input AuthInput {
    email: String!
    password: String!
    name: String
    userId: String
  }

  type Mutation {
    signup(
      email: String!
      password: String!
      name: String
      userId: String
    ): MutationResponse
    signin(email: String!, password: String!): MutationResponse
    logout: MutationResponse
  }

  type MutationResponse {
    success: Boolean
    message: String
  }

  type User {
    _id: ID
    name: String
    email: String
  }
`;
