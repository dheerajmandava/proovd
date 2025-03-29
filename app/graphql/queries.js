// GraphQL Queries for ProovdPulse

export const getWebsiteStats = /* GraphQL */ `
  query GetWebsiteStats($id: ID!) {
    getWebsiteStats(id: $id) {
      id
      activeUsers
      usersByCountry
      usersByCity
      avgTimeOnPage
      avgScrollPercentage
      totalClicks
    }
  }
`;

export const onActiveUserChange = /* GraphQL */ `
  subscription OnActiveUserChange($websiteId: ID!) {
    onActiveUserChange(websiteId: $websiteId) {
      id
      activeUsers
      usersByCountry
      usersByCity
      avgTimeOnPage
      avgScrollPercentage
      totalClicks
    }
  }
`;

export const updateUserActivity = /* GraphQL */ `
  mutation UpdateUserActivity(
    $clientId: String!
    $websiteId: ID!
    $metrics: MetricsInput
  ) {
    updateUserActivity(
      clientId: $clientId
      websiteId: $websiteId
      metrics: $metrics
    ) {
      id
      clientId
      websiteId
      lastActive
    }
  }
`; 