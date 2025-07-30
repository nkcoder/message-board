import type { SNSEvent } from 'aws-lambda';
import { registerUserSchema } from '../schema/userSchema';
import { createUser } from '../services/userService';

export const processUserRegistration = async (event: SNSEvent): Promise<void> => {
  console.info(`Received user registration requests: ${JSON.stringify(event)}`);

  const recordPromises = event.Records.map(async record => {
    const message = JSON.parse(record.Sns.Message) as unknown;
    const registerRequest = registerUserSchema.parse(message);
    const id = await createUser(registerRequest.email, registerRequest.name);
    console.info(`Created user, id: ${id}, name: ${registerRequest.name}, email: ${registerRequest.email}`);
  });

  await Promise.all(recordPromises);

  console.info(`Processed ${event.Records.length} user registration requests.`);
};
