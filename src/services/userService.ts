import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { RegisterUserSchema } from "../schema/userSchema";
import { dynamoDbClient } from "./aws";

export const createUser = async (user: RegisterUserSchema): Promise<void> => {
  try {
    const db = dynamoDbClient();
    await db.send(new PutCommand({
      TableName: process.env.USERS_TABLE,
      Item: {
        id: user.email,
        name: user.name,
        createdAt: new Date().toISOString(),
      },
    }));
  } catch (error) {
    console.error(`Error creating user: ${error}`);
    throw error;
  }
};