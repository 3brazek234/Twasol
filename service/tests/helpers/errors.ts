import { expect } from "vitest";

export function expectAppError(
  fn: () => Promise<any>,
  expectedCode: string,
  expectedStatus?: number
) {
  const matcher: any = { code: expectedCode };
  if (expectedStatus) matcher.status = expectedStatus;
  return expect(fn()).rejects.toMatchObject(matcher);
}
