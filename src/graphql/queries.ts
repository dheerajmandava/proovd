/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getWebsite = /* GraphQL */ `query GetWebsite($id: ID!) {
  getWebsite(id: $id) {
    id
    name
    domain
    ownerId
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetWebsiteQueryVariables,
  APITypes.GetWebsiteQuery
>;
export const listWebsites = /* GraphQL */ `query ListWebsites(
  $filter: ModelWebsiteFilterInput
  $limit: Int
  $nextToken: String
) {
  listWebsites(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      name
      domain
      ownerId
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListWebsitesQueryVariables,
  APITypes.ListWebsitesQuery
>;
export const getUserSession = /* GraphQL */ `query GetUserSession($id: ID!) {
  getUserSession(id: $id) {
    id
    clientId
    websiteId
    ipAddress
    userAgent
    location {
      country
      country_code
      city
      region
      __typename
    }
    lastActive
    metrics {
      scrollPercentage
      timeOnPage
      clickCount
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetUserSessionQueryVariables,
  APITypes.GetUserSessionQuery
>;
export const listUserSessions = /* GraphQL */ `query ListUserSessions(
  $filter: ModelUserSessionFilterInput
  $limit: Int
  $nextToken: String
) {
  listUserSessions(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      clientId
      websiteId
      ipAddress
      userAgent
      lastActive
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListUserSessionsQueryVariables,
  APITypes.ListUserSessionsQuery
>;
export const getWebsiteStats = /* GraphQL */ `query GetWebsiteStats($id: ID!) {
  getWebsiteStats(id: $id) {
    id
    activeUsers
    usersByCountry
    usersByCity
    avgTimeOnPage
    avgScrollPercentage
    totalClicks
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetWebsiteStatsQueryVariables,
  APITypes.GetWebsiteStatsQuery
>;
export const listWebsiteStats = /* GraphQL */ `query ListWebsiteStats(
  $filter: ModelWebsiteStatsFilterInput
  $limit: Int
  $nextToken: String
) {
  listWebsiteStats(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      activeUsers
      usersByCountry
      usersByCity
      avgTimeOnPage
      avgScrollPercentage
      totalClicks
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListWebsiteStatsQueryVariables,
  APITypes.ListWebsiteStatsQuery
>;
