// test/handlers/user.test.ts
import { APIGatewayProxyEvent } from "aws-lambda";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const mockSend = vi.fn();
vi.mock("../../src/services/aws", () => ({
  snsClient: () => ({ send: mockSend })
}));

import { PublishCommand } from "@aws-sdk/client-sns";
import { registerUser } from "../../src/handlers/user";

describe("registerUser", () => {
  const mockTopicArn = "arn:aws:sns:ap-southeast-2:123456789012:user-registration-topic";

  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockClear();
    process.env.USER_REGISTRATION_TOPIC_ARN = mockTopicArn;
  });

  afterAll(() => {
    delete process.env.USER_REGISTRATION_TOPIC_ARN;
  });

  // TODO: to test invalid input, we might need to define a specific type for the input, rather than using any
  const createEvent = (body: any): APIGatewayProxyEvent => ({
    body: JSON.stringify(body),
    headers: {},
    multiValueHeaders: {},
    httpMethod: "POST",
    isBase64Encoded: false,
    path: "/users/register",
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: ""
  });

  it("should successfully register a user", async () => {
    const requestBody = {
      email: "test@example.com",
      name: "Test User"
    };

    mockSend.mockResolvedValueOnce({ MessageId: "123" });

    const event = createEvent(requestBody);
    const result = await registerUser(event);

    expect(result.statusCode).toBe(202);
    expect(JSON.parse(result.body)).toEqual({
      message: "User registration request is accepted."
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith(expect.any(PublishCommand));
    
    const publishCommand = mockSend.mock.calls[0][0];
    expect(publishCommand.input).toEqual({
      TopicArn: mockTopicArn,
      Message: JSON.stringify(requestBody)
    });
  });

  it("should handle invalid email format", async () => {
    const requestBody = {
      email: "invalid-email",
      name: "Test User"
    };

    const event = createEvent(requestBody);
    
    await expect(registerUser(event)).rejects.toThrow();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("should handle invalid name (too short, less than 2 characters)", async () => {
    const requestBody = {
      email: "test@example.com",
      name: "A" 
    };

    const event = createEvent(requestBody);
    
    await expect(registerUser(event)).rejects.toThrow();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("should handle invalid name (too long, more than 30 characters)", async () => {
    const requestBody = {
      email: "test@example.com",
      name: "A".repeat(31) 
    };

    const event = createEvent(requestBody);
    
    await expect(registerUser(event)).rejects.toThrow();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("should handle missing body", async () => {
    const event = createEvent(null);
    event.body = null;
    
    await expect(registerUser(event)).rejects.toThrow();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("should handle empty body", async () => {
    const event = createEvent({});
    
    await expect(registerUser(event)).rejects.toThrow();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("should handle invalid JSON in body", async () => {
    const event = createEvent({});
    event.body = "invalid json";
    
    await expect(registerUser(event)).rejects.toThrow();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("should handle SNS send error", async () => {
    const requestBody = {
      email: "test@example.com",
      name: "Test User"
    };

    mockSend.mockRejectedValueOnce(new Error("SNS error"));

    const event = createEvent(requestBody);
    
    await expect(registerUser(event)).rejects.toThrow("SNS error");
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("should handle missing topic ARN", async () => {
    delete process.env.USER_REGISTRATION_TOPIC_ARN;
    
    const requestBody = {
      email: "test@example.com",
      name: "Test User"
    };

    mockSend.mockResolvedValueOnce({ MessageId: "123" });

    const event = createEvent(requestBody);
    const result = await registerUser(event);

    // Should still work but with undefined topic ARN
    expect(result.statusCode).toBe(202);
    
    const publishCommand = mockSend.mock.calls[0][0];
    expect(publishCommand.input.TopicArn).toBeUndefined();
  });

  it("should handle special characters in name", async () => {
    const requestBody = {
      email: "test@example.com",
      name: "Test User-O'Brien"
    };

    mockSend.mockResolvedValueOnce({ MessageId: "123" });

    const event = createEvent(requestBody);
    const result = await registerUser(event);

    expect(result.statusCode).toBe(202);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });
});