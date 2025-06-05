import { startApolloServer } from "@/app";
import { typeDefs } from "@/graphql/typeDefs";
import { resolvers } from "@/graphql/resolvers";

startApolloServer(typeDefs, resolvers);
