import { z } from "zod";
export const workspaceSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Required"),
  description: z.string().trim().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export type WorkspaceType = z.infer<typeof workspaceSchema>;

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1, "Name workspace is required"),
  userId: z.string().trim().min(1, "User ID is required"),
  inviteCode: z.string().trim(),
  image: z
    .union([
      z.instanceof(File),
      z.string().transform((value) => (value === "" ? undefined : value))
    ])
    .optional()
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const updateWorkspaceSchema = z.object({
  id: z.string().trim().min(1, "Workspace ID is required"),
  name: z.string().trim().min(1, "Name workspace is required"),
  image: z
    .union([
      z.instanceof(File),
      z.string().transform((value) => (value === "" ? undefined : value))
    ])
    .optional()
});

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
