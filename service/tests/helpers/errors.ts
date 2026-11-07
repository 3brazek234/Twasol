import { expect } from "vitest";

export async function expectAppError(
  fn: () => Promise<any>,
  expectedCode: string,
  expectedStatus?: number,
) {
  let caught: any;
  try {
    await fn();
  } catch (err) {
    caught = err;
  }
  expect(caught).toBeDefined();
  const matcher: any = { code: expectedCode };
  if (expectedStatus !== undefined) matcher.statusCode = expectedStatus;
  expect(caught).toMatchObject(matcher);
  return caught;
}

