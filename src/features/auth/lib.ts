import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { AUTH_SECRET_NAME } from "./constants";

export const createTokenForUser = (userId: string) => {
  const token = jwt.sign({ id: userId }, AUTH_SECRET_NAME);
  return token;
};

export const signin = async ({
  email,
  password
}: {
  email: string;
  password: string;
}) => {
  const match = await db.query.users.findFirst({
    where: eq(users.email, email)
  });

  if (!match) return null;

  const correctPW = await bcrypt.compare(password, match.password);

  if (!correctPW) {
    return null;
  }

  const token = createTokenForUser(match.id);

  return token;
};

export const signup = async ({
  name,
  email,
  password
}: {
  name: string;
  email: string;
  password: string;
}) => {
  const hashedPW = await bcrypt.hash(password, 10);

  const [newUser] = await db
    .insert(users)
    .values({
      name,
      email,
      password: hashedPW
    })
    .returning();

  const token = createTokenForUser(newUser.id);

  return token;
};
