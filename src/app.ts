import cors from "cors";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import cookieParser from "cookie-parser";
import type { DocumentNode } from "graphql";
import { ApolloServer } from "@apollo/server";
import type { IResolvers } from "@graphql-tools/utils";
import { expressMiddleware } from "@as-integrations/express5";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";

import { db } from "@/db";
import { users } from "@/db/schema";
import { AUTH_COOKIE_NAME, AUTH_SECRET_NAME } from "@/features/auth/constants";

interface StartApolloServerOptions {
  typeDefs: DocumentNode | DocumentNode[] | string | string[];
  resolvers: IResolvers | IResolvers[];
}

export async function startApolloServer(
  typeDefs: StartApolloServerOptions["typeDefs"],
  resolvers: StartApolloServerOptions["resolvers"]
): Promise<void> {
  const app: express.Express = express();
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 1 }));
  const httpServer: http.Server = http.createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })]
  });
  await server.start();

  app.use(cookieParser());
  app.use(express.json());

  app.use(
    "/graphql",
    cors<cors.CorsRequest>({
      origin: "https://parallel-psi.vercel.app",
      credentials: true
    }),
    expressMiddleware(server, {
      context: async ({ req, res }) => {
        let user = null;
        const session = req.cookies[AUTH_COOKIE_NAME];
        console.log(`➡️  ${req.method} ${req.originalUrl}`);

        if (session) {
          try {
            const decoded = jwt.verify(session, AUTH_SECRET_NAME) as {
              id: string;
            };

            user = await db.query.users.findFirst({
              where: eq(users.id, decoded.id)
            });
          } catch (error) {
            console.error("Error decoding session token:", error);
          }
        } else {
          console.log("No session cookie found");
        }

        return {
          req,
          res,
          user
        };
      }
    })
  );

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: process.env.PORT || 4000 }, resolve)
  );

  console.log(`🚀 Server ready at ${process.env.PORT}`);
}
