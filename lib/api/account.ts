/**
 * Browser-callable account mutations. Uses the same-origin /bff/graphql so
 * cookies (bf_access) flow through automatically.
 */
import { gqlClient } from "./client";
import type { BackendUser } from "./types";

export async function updateProfile(input: {
  firstName?: string;
  lastName?: string;
  phone?: string;
}): Promise<BackendUser> {
  const data = await gqlClient<{ updateProfile: BackendUser }>({
    query: `
      mutation UP($input: UpdateProfileInput!) {
        updateProfile(input: $input) {
          id email firstName lastName role emailVerified
        }
      }
    `,
    variables: { input },
  });
  return data.updateProfile;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  const data = await gqlClient<{ changePassword: boolean }>({
    query: `
      mutation CP($current: String!, $next: String!) {
        changePassword(currentPassword: $current, newPassword: $next)
      }
    `,
    variables: { current: currentPassword, next: newPassword },
  });
  return data.changePassword;
}
