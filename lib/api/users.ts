import { gql } from "./client";
import type { AddressDto, NotificationDto, SessionDto } from "./types";

const ADDR_FIELDS = `id name phone line1 line2 city state pincode country isDefault`;

export async function myAddresses(): Promise<AddressDto[]> {
  const data = await gql<{ myAddresses: AddressDto[] }>({
    query: `query { myAddresses { ${ADDR_FIELDS} } }`,
    cache: "no-store",
  });
  return data.myAddresses;
}

export async function createAddress(input: {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  isDefault?: boolean;
}): Promise<AddressDto> {
  const data = await gql<{ createAddress: AddressDto }>({
    query: `
      mutation Create($input: CreateAddressInput!) {
        createAddress(input: $input) { ${ADDR_FIELDS} }
      }
    `,
    variables: { input },
  });
  return data.createAddress;
}

export async function deleteAddress(id: string): Promise<boolean> {
  const data = await gql<{ deleteAddress: boolean }>({
    query: `mutation Del($id: String!) { deleteAddress(id: $id) }`,
    variables: { id },
  });
  return data.deleteAddress;
}

export async function myNotifications(limit = 50): Promise<NotificationDto[]> {
  const data = await gql<{ myNotifications: NotificationDto[] }>({
    query: `
      query N($limit: Int!) {
        myNotifications(limit: $limit) {
          id channel template subject status createdAt deliveredAt
        }
      }
    `,
    variables: { limit },
    cache: "no-store",
  });
  return data.myNotifications;
}

export async function mySessions(): Promise<SessionDto[]> {
  const data = await gql<{ mySessions: SessionDto[] }>({
    query: `
      query { mySessions { id sessionId ip userAgent device lastSeenAt createdAt } }
    `,
    cache: "no-store",
  });
  return data.mySessions;
}

export async function revokeSession(sessionId: string): Promise<boolean> {
  const data = await gql<{ revokeSession: boolean }>({
    query: `mutation R($sessionId: String!) { revokeSession(sessionId: $sessionId) }`,
    variables: { sessionId },
  });
  return data.revokeSession;
}

export async function logoutAllDevices(): Promise<boolean> {
  const data = await gql<{ logoutAllDevices: boolean }>({
    query: `mutation { logoutAllDevices }`,
  });
  return data.logoutAllDevices;
}

export async function setupTotp(): Promise<{ secret: string; otpauthUrl: string }> {
  const data = await gql<{ setupTotp: { secret: string; otpauthUrl: string } }>({
    query: `mutation { setupTotp { secret otpauthUrl } }`,
  });
  return data.setupTotp;
}

export async function enableTotp(code: string): Promise<boolean> {
  const data = await gql<{ enableTotp: boolean }>({
    query: `mutation E($code: String!) { enableTotp(code: $code) }`,
    variables: { code },
  });
  return data.enableTotp;
}

export async function disableTotp(code: string): Promise<boolean> {
  const data = await gql<{ disableTotp: boolean }>({
    query: `mutation D($code: String!) { disableTotp(code: $code) }`,
    variables: { code },
  });
  return data.disableTotp;
}

export async function exportMyData(): Promise<string> {
  const data = await gql<{ exportMyData: string }>({
    query: `query { exportMyData }`,
    cache: "no-store",
  });
  return data.exportMyData;
}

export async function requestAccountDeletion(): Promise<boolean> {
  const data = await gql<{ requestAccountDeletion: boolean }>({
    query: `mutation { requestAccountDeletion(confirm: true) }`,
  });
  return data.requestAccountDeletion;
}
