import { gql, rest } from "./client";

export interface PresignResponse {
  uploadUrl: string;
  s3Key: string;
  publicUrl: string;
  expiresIn: number;
}

export async function presignUpload(args: {
  contentType: string;
  bytes: number;
  kind: "image" | "video";
}): Promise<PresignResponse> {
  return rest<PresignResponse>({
    path: "/uploads/presign",
    method: "POST",
    body: args,
  });
}

export async function confirmMediaUpload(input: {
  s3Key: string;
  contentType: string;
  bytes: number;
  kind: "image" | "video";
  width?: number;
  height?: number;
  altText?: string;
}): Promise<{ id: string; url: string; altText?: string }> {
  const data = await gql<{
    confirmMediaUpload: { id: string; url: string; altText?: string };
  }>({
    query: `
      mutation Confirm($input: ConfirmMediaInput!) {
        confirmMediaUpload(input: $input) { id url altText }
      }
    `,
    variables: { input },
  });
  return data.confirmMediaUpload;
}
