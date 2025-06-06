import { GraphQLError } from "graphql";
import type { Request, Response } from "express";

import { signin, signup } from "@/features/auth/lib";
import { AUTH_COOKIE_NAME } from "@/features/auth/constants";

import type { LoginInput, RegisterInput, UserType } from "./types";

interface MyContext {
  req: Request;
  res: Response;
  user: UserType | null;
}

export const resolvers = {
  Query: {
    current: (_: any, __: any, { user, req }: MyContext) => {
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }
      return {
        name: user.name,
        email: user.email
      };
    }
  },
  Mutation: {
    signup: async (_: any, input: RegisterInput, { res }: MyContext) => {
      const { email, password, name } = input;
      const token = await signup({
        name,
        email,
        password
      });

      res.cookie(AUTH_COOKIE_NAME, token, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "strict",
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
        secure: true,
        sameSite: "strict",
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
    }
  }
};
