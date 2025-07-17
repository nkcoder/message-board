import { SNSEvent } from "aws-lambda";
import { registerUserSchema } from "../schema/userSchema";
import { generateId } from "../services/idGenerator";
import { createUser } from "../services/userService";

export const processUserRegistration = async (event: SNSEvent): Promise<void> => {
  console.info(`Received user registration requests: ${JSON.stringify(event)}`);

  const recordPromises = event.Records.map(async record => {
    const message = JSON.parse(record.Sns.Message);
    const registerRequest = registerUserSchema.parse(message);
    const id = generateId();
    const user = {
      id,
      email: registerRequest.email,
      name: registerRequest.name,
      createdAt: new Date().toISOString(),
    };
    await createUser(user);
    console.info(`Created user, id: ${id}, name: ${registerRequest.name}, email: ${registerRequest.email}`);
  });

  await Promise.all(recordPromises);

  console.info(`Processed ${event.Records.length} user registration requests.`);
};