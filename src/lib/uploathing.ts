import { UTApi } from "uploadthing/server";

export const utapi = new UTApi({
  token: process.env.UPLOADING_API_TOKEN!
});
