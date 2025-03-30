// GraphQL Queries for ProovdPulse

export const getWebsiteStats = /* GraphQL */ `
  query GetWebsiteStats($id: ID!) {
    getWebsiteStats(id: $id) {
      id
      activeUsers
      totalClicks
      avgScrollPercentage
      avgTimeOnPage
      updatedAt
    }
  }
`;

export const onActiveUserChange = /* GraphQL */ `
  subscription OnActiveUserChange($websiteId: String!) {
    onActiveUserChange(websiteId: $websiteId) {
      id
      activeUsers
      totalClicks
      avgScrollPercentage
      avgTimeOnPage
      updatedAt
    }
  }
`;

export const updateUserActivity = /* GraphQL */ `
  mutation UpdateUserActivity(
    $clientId: String!,
    $websiteId: String!,
    $metrics: MetricsInput!
  ) {
    updateUserActivity(
      clientId: $clientId,
      websiteId: $websiteId,
      metrics: $metrics
    ) {
      id
      activeUsers
      totalClicks
      avgScrollPercentage
      avgTimeOnPage
      updatedAt
    }
  }
`; 