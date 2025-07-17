import { z } from "zod";

export const registerUserSchema = z.object({
  email: z.email(),
  name: z.string().min(2).max(30),
});
export type RegisterUserSchema = z.infer<typeof registerUserSchema>;

export const userSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().min(2).max(30),
  createdAt: z.iso.datetime(),
});
export type UserSchema = z.infer<typeof userSchema>;