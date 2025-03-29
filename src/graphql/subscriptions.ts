/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onActiveUserChange = /* GraphQL */ `subscription OnActiveUserChange($websiteId: ID!) {
  onActiveUserChange(websiteId: $websiteId) {
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
` as GeneratedSubscription<
  APITypes.OnActiveUserChangeSubscriptionVariables,
  APITypes.OnActiveUserChangeSubscription
>;
export const onCreateWebsite = /* GraphQL */ `subscription OnCreateWebsite($filter: ModelSubscriptionWebsiteFilterInput) {
  onCreateWebsite(filter: $filter) {
    id
    name
    domain
    ownerId
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateWebsiteSubscriptionVariables,
  APITypes.OnCreateWebsiteSubscription
>;
export const onUpdateWebsite = /* GraphQL */ `subscription OnUpdateWebsite($filter: ModelSubscriptionWebsiteFilterInput) {
  onUpdateWebsite(filter: $filter) {
    id
    name
    domain
    ownerId
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateWebsiteSubscriptionVariables,
  APITypes.OnUpdateWebsiteSubscription
>;
export const onDeleteWebsite = /* GraphQL */ `subscription OnDeleteWebsite($filter: ModelSubscriptionWebsiteFilterInput) {
  onDeleteWebsite(filter: $filter) {
    id
    name
    domain
    ownerId
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteWebsiteSubscriptionVariables,
  APITypes.OnDeleteWebsiteSubscription
>;
export const onCreateUserSession = /* GraphQL */ `subscription OnCreateUserSession(
  $filter: ModelSubscriptionUserSessionFilterInput
) {
  onCreateUserSession(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateUserSessionSubscriptionVariables,
  APITypes.OnCreateUserSessionSubscription
>;
export const onUpdateUserSession = /* GraphQL */ `subscription OnUpdateUserSession(
  $filter: ModelSubscriptionUserSessionFilterInput
) {
  onUpdateUserSession(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateUserSessionSubscriptionVariables,
  APITypes.OnUpdateUserSessionSubscription
>;
export const onDeleteUserSession = /* GraphQL */ `subscription OnDeleteUserSession(
  $filter: ModelSubscriptionUserSessionFilterInput
) {
  onDeleteUserSession(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteUserSessionSubscriptionVariables,
  APITypes.OnDeleteUserSessionSubscription
>;
export const onCreateWebsiteStats = /* GraphQL */ `subscription OnCreateWebsiteStats(
  $filter: ModelSubscriptionWebsiteStatsFilterInput
) {
  onCreateWebsiteStats(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateWebsiteStatsSubscriptionVariables,
  APITypes.OnCreateWebsiteStatsSubscription
>;
export const onUpdateWebsiteStats = /* GraphQL */ `subscription OnUpdateWebsiteStats(
  $filter: ModelSubscriptionWebsiteStatsFilterInput
) {
  onUpdateWebsiteStats(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateWebsiteStatsSubscriptionVariables,
  APITypes.OnUpdateWebsiteStatsSubscription
>;
export const onDeleteWebsiteStats = /* GraphQL */ `subscription OnDeleteWebsiteStats(
  $filter: ModelSubscriptionWebsiteStatsFilterInput
) {
  onDeleteWebsiteStats(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteWebsiteStatsSubscriptionVariables,
  APITypes.OnDeleteWebsiteStatsSubscription
>;
