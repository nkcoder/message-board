import { z } from "zod";

export const registerUserSchema = z.object({
  email: z.email(),
  name: z.string().min(2).max(30),
});
export type RegisterUserSchema = z.infer<typeof registerUserSchema>;

