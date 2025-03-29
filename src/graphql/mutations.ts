/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const updateUserActivity = /* GraphQL */ `mutation UpdateUserActivity(
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
` as GeneratedMutation<
  APITypes.UpdateUserActivityMutationVariables,
  APITypes.UpdateUserActivityMutation
>;
export const updateWebsiteActivity = /* GraphQL */ `mutation UpdateWebsiteActivity(
  $id: ID!
  $activeUsers: Int
  $usersByCountry: AWSJSON
  $usersByCity: AWSJSON
  $avgTimeOnPage: Float
  $avgScrollPercentage: Float
  $totalClicks: Int
) {
  updateWebsiteActivity(
    id: $id
    activeUsers: $activeUsers
    usersByCountry: $usersByCountry
    usersByCity: $usersByCity
    avgTimeOnPage: $avgTimeOnPage
    avgScrollPercentage: $avgScrollPercentage
    totalClicks: $totalClicks
  ) {
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
` as GeneratedMutation<
  APITypes.UpdateWebsiteActivityMutationVariables,
  APITypes.UpdateWebsiteActivityMutation
>;
export const createWebsite = /* GraphQL */ `mutation CreateWebsite(
  $input: CreateWebsiteInput!
  $condition: ModelWebsiteConditionInput
) {
  createWebsite(input: $input, condition: $condition) {
    id
    name
    domain
    ownerId
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateWebsiteMutationVariables,
  APITypes.CreateWebsiteMutation
>;
export const updateWebsite = /* GraphQL */ `mutation UpdateWebsite(
  $input: UpdateWebsiteInput!
  $condition: ModelWebsiteConditionInput
) {
  updateWebsite(input: $input, condition: $condition) {
    id
    name
    domain
    ownerId
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateWebsiteMutationVariables,
  APITypes.UpdateWebsiteMutation
>;
export const deleteWebsite = /* GraphQL */ `mutation DeleteWebsite(
  $input: DeleteWebsiteInput!
  $condition: ModelWebsiteConditionInput
) {
  deleteWebsite(input: $input, condition: $condition) {
    id
    name
    domain
    ownerId
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteWebsiteMutationVariables,
  APITypes.DeleteWebsiteMutation
>;
export const createUserSession = /* GraphQL */ `mutation CreateUserSession(
  $input: CreateUserSessionInput!
  $condition: ModelUserSessionConditionInput
) {
  createUserSession(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateUserSessionMutationVariables,
  APITypes.CreateUserSessionMutation
>;
export const updateUserSession = /* GraphQL */ `mutation UpdateUserSession(
  $input: UpdateUserSessionInput!
  $condition: ModelUserSessionConditionInput
) {
  updateUserSession(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateUserSessionMutationVariables,
  APITypes.UpdateUserSessionMutation
>;
export const deleteUserSession = /* GraphQL */ `mutation DeleteUserSession(
  $input: DeleteUserSessionInput!
  $condition: ModelUserSessionConditionInput
) {
  deleteUserSession(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteUserSessionMutationVariables,
  APITypes.DeleteUserSessionMutation
>;
export const createWebsiteStats = /* GraphQL */ `mutation CreateWebsiteStats(
  $input: CreateWebsiteStatsInput!
  $condition: ModelWebsiteStatsConditionInput
) {
  createWebsiteStats(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateWebsiteStatsMutationVariables,
  APITypes.CreateWebsiteStatsMutation
>;
export const updateWebsiteStats = /* GraphQL */ `mutation UpdateWebsiteStats(
  $input: UpdateWebsiteStatsInput!
  $condition: ModelWebsiteStatsConditionInput
) {
  updateWebsiteStats(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateWebsiteStatsMutationVariables,
  APITypes.UpdateWebsiteStatsMutation
>;
export const deleteWebsiteStats = /* GraphQL */ `mutation DeleteWebsiteStats(
  $input: DeleteWebsiteStatsInput!
  $condition: ModelWebsiteStatsConditionInput
) {
  deleteWebsiteStats(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteWebsiteStatsMutationVariables,
  APITypes.DeleteWebsiteStatsMutation
>;
