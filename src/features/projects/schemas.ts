import { z } from "zod";

export const ProjectSchema = z.object({
  name: z.string(),
  image: z
    .union([
      z.instanceof(File),
      z.string().transform((value) => (value === "" ? undefined : value))
    ])
    .optional(),
  workspaceId: z.string()
});

export type Project = z.infer<typeof ProjectSchema>;
