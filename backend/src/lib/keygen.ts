import { nanoid } from 'nanoid';

/**
 * Generates a 12-character random alphanumeric unique key for a PG member.
 * Example: "PG-K3mN8pQzV1"
 */
export function generateUniqueKey(): string {
  return `PG-${nanoid(10)}`;
}
