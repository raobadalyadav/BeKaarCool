import { gql } from "./client";

export interface CampaignDto {
  id: string;
  slug: string;
  name: string;
  type: string;
  description?: string;
  bannerUrl?: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

export async function getActiveCampaigns(): Promise<CampaignDto[]> {
  const data = await gql<{ activeCampaigns: CampaignDto[] }>({
    query: `
      query {
        activeCampaigns {
          id slug name type description bannerUrl startsAt endsAt isActive
        }
      }
    `,
    cache: "no-store",
  });
  return data.activeCampaigns || [];
}
