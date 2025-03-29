/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type MetricsInput = {
  scrollPercentage?: number | null,
  timeOnPage?: number | null,
  clickCount?: number | null,
};

export type UserSession = {
  __typename: "UserSession",
  id: string,
  clientId: string,
  websiteId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
  location?: LocationData | null,
  lastActive: number,
  metrics?: Metrics | null,
  createdAt: string,
  updatedAt: string,
};

export type LocationData = {
  __typename: "LocationData",
  country?: string | null,
  country_code?: string | null,
  city?: string | null,
  region?: string | null,
};

export type Metrics = {
  __typename: "Metrics",
  scrollPercentage?: number | null,
  timeOnPage?: number | null,
  clickCount?: number | null,
};

export type WebsiteStats = {
  __typename: "WebsiteStats",
  id: string,
  activeUsers: number,
  usersByCountry?: string | null,
  usersByCity?: string | null,
  avgTimeOnPage?: number | null,
  avgScrollPercentage?: number | null,
  totalClicks?: number | null,
  createdAt: string,
  updatedAt: string,
};

export type CreateWebsiteInput = {
  id?: string | null,
  name: string,
  domain: string,
  ownerId: string,
};

export type ModelWebsiteConditionInput = {
  name?: ModelStringInput | null,
  domain?: ModelStringInput | null,
  ownerId?: ModelStringInput | null,
  and?: Array< ModelWebsiteConditionInput | null > | null,
  or?: Array< ModelWebsiteConditionInput | null > | null,
  not?: ModelWebsiteConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelStringInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  size?: ModelSizeInput | null,
};

export enum ModelAttributeTypes {
  binary = "binary",
  binarySet = "binarySet",
  bool = "bool",
  list = "list",
  map = "map",
  number = "number",
  numberSet = "numberSet",
  string = "string",
  stringSet = "stringSet",
  _null = "_null",
}


export type ModelSizeInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
};

export type Website = {
  __typename: "Website",
  id: string,
  name: string,
  domain: string,
  ownerId: string,
  createdAt: string,
  updatedAt: string,
};

export type UpdateWebsiteInput = {
  id: string,
  name?: string | null,
  domain?: string | null,
  ownerId?: string | null,
};

export type DeleteWebsiteInput = {
  id: string,
};

export type CreateUserSessionInput = {
  id?: string | null,
  clientId: string,
  websiteId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
  location?: LocationDataInput | null,
  lastActive: number,
  metrics?: MetricsInput | null,
};

export type LocationDataInput = {
  country?: string | null,
  country_code?: string | null,
  city?: string | null,
  region?: string | null,
};

export type ModelUserSessionConditionInput = {
  clientId?: ModelStringInput | null,
  websiteId?: ModelIDInput | null,
  ipAddress?: ModelStringInput | null,
  userAgent?: ModelStringInput | null,
  lastActive?: ModelIntInput | null,
  and?: Array< ModelUserSessionConditionInput | null > | null,
  or?: Array< ModelUserSessionConditionInput | null > | null,
  not?: ModelUserSessionConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelIDInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  size?: ModelSizeInput | null,
};

export type ModelIntInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
};

export type UpdateUserSessionInput = {
  id: string,
  clientId?: string | null,
  websiteId?: string | null,
  ipAddress?: string | null,
  userAgent?: string | null,
  location?: LocationDataInput | null,
  lastActive?: number | null,
  metrics?: MetricsInput | null,
};

export type DeleteUserSessionInput = {
  id: string,
};

export type CreateWebsiteStatsInput = {
  id?: string | null,
  activeUsers: number,
  usersByCountry?: string | null,
  usersByCity?: string | null,
  avgTimeOnPage?: number | null,
  avgScrollPercentage?: number | null,
  totalClicks?: number | null,
};

export type ModelWebsiteStatsConditionInput = {
  activeUsers?: ModelIntInput | null,
  usersByCountry?: ModelStringInput | null,
  usersByCity?: ModelStringInput | null,
  avgTimeOnPage?: ModelFloatInput | null,
  avgScrollPercentage?: ModelFloatInput | null,
  totalClicks?: ModelIntInput | null,
  and?: Array< ModelWebsiteStatsConditionInput | null > | null,
  or?: Array< ModelWebsiteStatsConditionInput | null > | null,
  not?: ModelWebsiteStatsConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelFloatInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
};

export type UpdateWebsiteStatsInput = {
  id: string,
  activeUsers?: number | null,
  usersByCountry?: string | null,
  usersByCity?: string | null,
  avgTimeOnPage?: number | null,
  avgScrollPercentage?: number | null,
  totalClicks?: number | null,
};

export type DeleteWebsiteStatsInput = {
  id: string,
};

export type ModelWebsiteFilterInput = {
  id?: ModelIDInput | null,
  name?: ModelStringInput | null,
  domain?: ModelStringInput | null,
  ownerId?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelWebsiteFilterInput | null > | null,
  or?: Array< ModelWebsiteFilterInput | null > | null,
  not?: ModelWebsiteFilterInput | null,
};

export type ModelWebsiteConnection = {
  __typename: "ModelWebsiteConnection",
  items:  Array<Website | null >,
  nextToken?: string | null,
};

export type ModelUserSessionFilterInput = {
  id?: ModelIDInput | null,
  clientId?: ModelStringInput | null,
  websiteId?: ModelIDInput | null,
  ipAddress?: ModelStringInput | null,
  userAgent?: ModelStringInput | null,
  lastActive?: ModelIntInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelUserSessionFilterInput | null > | null,
  or?: Array< ModelUserSessionFilterInput | null > | null,
  not?: ModelUserSessionFilterInput | null,
};

export type ModelUserSessionConnection = {
  __typename: "ModelUserSessionConnection",
  items:  Array<UserSession | null >,
  nextToken?: string | null,
};

export type ModelWebsiteStatsFilterInput = {
  id?: ModelIDInput | null,
  activeUsers?: ModelIntInput | null,
  usersByCountry?: ModelStringInput | null,
  usersByCity?: ModelStringInput | null,
  avgTimeOnPage?: ModelFloatInput | null,
  avgScrollPercentage?: ModelFloatInput | null,
  totalClicks?: ModelIntInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelWebsiteStatsFilterInput | null > | null,
  or?: Array< ModelWebsiteStatsFilterInput | null > | null,
  not?: ModelWebsiteStatsFilterInput | null,
};

export type ModelWebsiteStatsConnection = {
  __typename: "ModelWebsiteStatsConnection",
  items:  Array<WebsiteStats | null >,
  nextToken?: string | null,
};

export type ModelSubscriptionWebsiteFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  name?: ModelSubscriptionStringInput | null,
  domain?: ModelSubscriptionStringInput | null,
  ownerId?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionWebsiteFilterInput | null > | null,
  or?: Array< ModelSubscriptionWebsiteFilterInput | null > | null,
};

export type ModelSubscriptionIDInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  in?: Array< string | null > | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionStringInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  in?: Array< string | null > | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionUserSessionFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  clientId?: ModelSubscriptionStringInput | null,
  websiteId?: ModelSubscriptionIDInput | null,
  ipAddress?: ModelSubscriptionStringInput | null,
  userAgent?: ModelSubscriptionStringInput | null,
  lastActive?: ModelSubscriptionIntInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionUserSessionFilterInput | null > | null,
  or?: Array< ModelSubscriptionUserSessionFilterInput | null > | null,
};

export type ModelSubscriptionIntInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  in?: Array< number | null > | null,
  notIn?: Array< number | null > | null,
};

export type ModelSubscriptionWebsiteStatsFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  activeUsers?: ModelSubscriptionIntInput | null,
  usersByCountry?: ModelSubscriptionStringInput | null,
  usersByCity?: ModelSubscriptionStringInput | null,
  avgTimeOnPage?: ModelSubscriptionFloatInput | null,
  avgScrollPercentage?: ModelSubscriptionFloatInput | null,
  totalClicks?: ModelSubscriptionIntInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionWebsiteStatsFilterInput | null > | null,
  or?: Array< ModelSubscriptionWebsiteStatsFilterInput | null > | null,
};

export type ModelSubscriptionFloatInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  in?: Array< number | null > | null,
  notIn?: Array< number | null > | null,
};

export type UpdateUserActivityMutationVariables = {
  clientId: string,
  websiteId: string,
  metrics?: MetricsInput | null,
};

export type UpdateUserActivityMutation = {
  updateUserActivity?:  {
    __typename: "UserSession",
    id: string,
    clientId: string,
    websiteId: string,
    ipAddress?: string | null,
    userAgent?: string | null,
    location?:  {
      __typename: "LocationData",
      country?: string | null,
      country_code?: string | null,
      city?: string | null,
      region?: string | null,
    } | null,
    lastActive: number,
    metrics?:  {
      __typename: "Metrics",
      scrollPercentage?: number | null,
      timeOnPage?: number | null,
      clickCount?: number | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateWebsiteActivityMutationVariables = {
  id: string,
  activeUsers?: number | null,
  usersByCountry?: string | null,
  usersByCity?: string | null,
  avgTimeOnPage?: number | null,
  avgScrollPercentage?: number | null,
  totalClicks?: number | null,
};

export type UpdateWebsiteActivityMutation = {
  updateWebsiteActivity?:  {
    __typename: "WebsiteStats",
    id: string,
    activeUsers: number,
    usersByCountry?: string | null,
    usersByCity?: string | null,
    avgTimeOnPage?: number | null,
    avgScrollPercentage?: number | null,
    totalClicks?: number | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateWebsiteMutationVariables = {
  input: CreateWebsiteInput,
  condition?: ModelWebsiteConditionInput | null,
};

export type CreateWebsiteMutation = {
  createWebsite?:  {
    __typename: "Website",
    id: string,
    name: string,
    domain: string,
    ownerId: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateWebsiteMutationVariables = {
  input: UpdateWebsiteInput,
  condition?: ModelWebsiteConditionInput | null,
};

export type UpdateWebsiteMutation = {
  updateWebsite?:  {
    __typename: "Website",
    id: string,
    name: string,
    domain: string,
    ownerId: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteWebsiteMutationVariables = {
  input: DeleteWebsiteInput,
  condition?: ModelWebsiteConditionInput | null,
};

export type DeleteWebsiteMutation = {
  deleteWebsite?:  {
    __typename: "Website",
    id: string,
    name: string,
    domain: string,
    ownerId: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateUserSessionMutationVariables = {
  input: CreateUserSessionInput,
  condition?: ModelUserSessionConditionInput | null,
};

export type CreateUserSessionMutation = {
  createUserSession?:  {
    __typename: "UserSession",
    id: string,
    clientId: string,
    websiteId: string,
    ipAddress?: string | null,
    userAgent?: string | null,
    location?:  {
      __typename: "LocationData",
      country?: string | null,
      country_code?: string | null,
      city?: string | null,
      region?: string | null,
    } | null,
    lastActive: number,
    metrics?:  {
      __typename: "Metrics",
      scrollPercentage?: number | null,
      timeOnPage?: number | null,
      clickCount?: number | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateUserSessionMutationVariables = {
  input: UpdateUserSessionInput,
  condition?: ModelUserSessionConditionInput | null,
};

export type UpdateUserSessionMutation = {
  updateUserSession?:  {
    __typename: "UserSession",
    id: string,
    clientId: string,
    websiteId: string,
    ipAddress?: string | null,
    userAgent?: string | null,
    location?:  {
      __typename: "LocationData",
      country?: string | null,
      country_code?: string | null,
      city?: string | null,
      region?: string | null,
    } | null,
    lastActive: number,
    metrics?:  {
      __typename: "Metrics",
      scrollPercentage?: number | null,
      timeOnPage?: number | null,
      clickCount?: number | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteUserSessionMutationVariables = {
  input: DeleteUserSessionInput,
  condition?: ModelUserSessionConditionInput | null,
};

export type DeleteUserSessionMutation = {
  deleteUserSession?:  {
    __typename: "UserSession",
    id: string,
    clientId: string,
    websiteId: string,
    ipAddress?: string | null,
    userAgent?: string | null,
    location?:  {
      __typename: "LocationData",
      country?: string | null,
      country_code?: string | null,
      city?: string | null,
      region?: string | null,
    } | null,
    lastActive: number,
    metrics?:  {
      __typename: "Metrics",
      scrollPercentage?: number | null,
      timeOnPage?: number | null,
      clickCount?: number | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateWebsiteStatsMutationVariables = {
  input: CreateWebsiteStatsInput,
  condition?: ModelWebsiteStatsConditionInput | null,
};

export type CreateWebsiteStatsMutation = {
  createWebsiteStats?:  {
    __typename: "WebsiteStats",
    id: string,
    activeUsers: number,
    usersByCountry?: string | null,
    usersByCity?: string | null,
    avgTimeOnPage?: number | null,
    avgScrollPercentage?: number | null,
    totalClicks?: number | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateWebsiteStatsMutationVariables = {
  input: UpdateWebsiteStatsInput,
  condition?: ModelWebsiteStatsConditionInput | null,
};

export type UpdateWebsiteStatsMutation = {
  updateWebsiteStats?:  {
    __typename: "WebsiteStats",
    id: string,
    activeUsers: number,
    usersByCountry?: string | null,
    usersByCity?: string | null,
    avgTimeOnPage?: number | null,
    avgScrollPercentage?: number | null,
    totalClicks?: number | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteWebsiteStatsMutationVariables = {
  input: DeleteWebsiteStatsInput,
  condition?: ModelWebsiteStatsConditionInput | null,
};

export type DeleteWebsiteStatsMutation = {
  deleteWebsiteStats?:  {
    __typename: "WebsiteStats",
    id: string,
    activeUsers: number,
    usersByCountry?: string | null,
    usersByCity?: string | null,
    avgTimeOnPage?: number | null,
    avgScrollPercentage?: number | null,
    totalClicks?: number | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type GetWebsiteQueryVariables = {
  id: string,
};

export type GetWebsiteQuery = {
  getWebsite?:  {
    __typename: "Website",
    id: string,
    name: string,
    domain: string,
    ownerId: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListWebsitesQueryVariables = {
  filter?: ModelWebsiteFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListWebsitesQuery = {
  listWebsites?:  {
    __typename: "ModelWebsiteConnection",
    items:  Array< {
      __typename: "Website",
      id: string,
      name: string,
      domain: string,
      ownerId: string,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetUserSessionQueryVariables = {
  id: string,
};

export type GetUserSessionQuery = {
  getUserSession?:  {
    __typename: "UserSession",
    id: string,
    clientId: string,
    websiteId: string,
    ipAddress?: string | null,
    userAgent?: string | null,
    location?:  {
      __typename: "LocationData",
      country?: string | null,
      country_code?: string | null,
      city?: string | null,
      region?: string | null,
    } | null,
    lastActive: number,
    metrics?:  {
      __typename: "Metrics",
      scrollPercentage?: number | null,
      timeOnPage?: number | null,
      clickCount?: number | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListUserSessionsQueryVariables = {
  filter?: ModelUserSessionFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListUserSessionsQuery = {
  listUserSessions?:  {
    __typename: "ModelUserSessionConnection",
    items:  Array< {
      __typename: "UserSession",
      id: string,
      clientId: string,
      websiteId: string,
      ipAddress?: string | null,
      userAgent?: string | null,
      lastActive: number,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetWebsiteStatsQueryVariables = {
  id: string,
};

export type GetWebsiteStatsQuery = {
  getWebsiteStats?:  {
    __typename: "WebsiteStats",
    id: string,
    activeUsers: number,
    usersByCountry?: string | null,
    usersByCity?: string | null,
    avgTimeOnPage?: number | null,
    avgScrollPercentage?: number | null,
    totalClicks?: number | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListWebsiteStatsQueryVariables = {
  filter?: ModelWebsiteStatsFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListWebsiteStatsQuery = {
  listWebsiteStats?:  {
    __typename: "ModelWebsiteStatsConnection",
    items:  Array< {
      __typename: "WebsiteStats",
      id: string,
      activeUsers: number,
      usersByCountry?: string | null,
      usersByCity?: string | null,
      avgTimeOnPage?: number | null,
      avgScrollPercentage?: number | null,
      totalClicks?: number | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type OnActiveUserChangeSubscriptionVariables = {
  websiteId: string,
};

export type OnActiveUserChangeSubscription = {
  onActiveUserChange?:  {
    __typename: "WebsiteStats",
    id: string,
    activeUsers: number,
    usersByCountry?: string | null,
    usersByCity?: string | null,
    avgTimeOnPage?: number | null,
    avgScrollPercentage?: number | null,
    totalClicks?: number | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateWebsiteSubscriptionVariables = {
  filter?: ModelSubscriptionWebsiteFilterInput | null,
};

export type OnCreateWebsiteSubscription = {
  onCreateWebsite?:  {
    __typename: "Website",
    id: string,
    name: string,
    domain: string,
    ownerId: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateWebsiteSubscriptionVariables = {
  filter?: ModelSubscriptionWebsiteFilterInput | null,
};

export type OnUpdateWebsiteSubscription = {
  onUpdateWebsite?:  {
    __typename: "Website",
    id: string,
    name: string,
    domain: string,
    ownerId: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteWebsiteSubscriptionVariables = {
  filter?: ModelSubscriptionWebsiteFilterInput | null,
};

export type OnDeleteWebsiteSubscription = {
  onDeleteWebsite?:  {
    __typename: "Website",
    id: string,
    name: string,
    domain: string,
    ownerId: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateUserSessionSubscriptionVariables = {
  filter?: ModelSubscriptionUserSessionFilterInput | null,
};

export type OnCreateUserSessionSubscription = {
  onCreateUserSession?:  {
    __typename: "UserSession",
    id: string,
    clientId: string,
    websiteId: string,
    ipAddress?: string | null,
    userAgent?: string | null,
    location?:  {
      __typename: "LocationData",
      country?: string | null,
      country_code?: string | null,
      city?: string | null,
      region?: string | null,
    } | null,
    lastActive: number,
    metrics?:  {
      __typename: "Metrics",
      scrollPercentage?: number | null,
      timeOnPage?: number | null,
      clickCount?: number | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateUserSessionSubscriptionVariables = {
  filter?: ModelSubscriptionUserSessionFilterInput | null,
};

export type OnUpdateUserSessionSubscription = {
  onUpdateUserSession?:  {
    __typename: "UserSession",
    id: string,
    clientId: string,
    websiteId: string,
    ipAddress?: string | null,
    userAgent?: string | null,
    location?:  {
      __typename: "LocationData",
      country?: string | null,
      country_code?: string | null,
      city?: string | null,
      region?: string | null,
    } | null,
    lastActive: number,
    metrics?:  {
      __typename: "Metrics",
      scrollPercentage?: number | null,
      timeOnPage?: number | null,
      clickCount?: number | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteUserSessionSubscriptionVariables = {
  filter?: ModelSubscriptionUserSessionFilterInput | null,
};

export type OnDeleteUserSessionSubscription = {
  onDeleteUserSession?:  {
    __typename: "UserSession",
    id: string,
    clientId: string,
    websiteId: string,
    ipAddress?: string | null,
    userAgent?: string | null,
    location?:  {
      __typename: "LocationData",
      country?: string | null,
      country_code?: string | null,
      city?: string | null,
      region?: string | null,
    } | null,
    lastActive: number,
    metrics?:  {
      __typename: "Metrics",
      scrollPercentage?: number | null,
      timeOnPage?: number | null,
      clickCount?: number | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateWebsiteStatsSubscriptionVariables = {
  filter?: ModelSubscriptionWebsiteStatsFilterInput | null,
};

export type OnCreateWebsiteStatsSubscription = {
  onCreateWebsiteStats?:  {
    __typename: "WebsiteStats",
    id: string,
    activeUsers: number,
    usersByCountry?: string | null,
    usersByCity?: string | null,
    avgTimeOnPage?: number | null,
    avgScrollPercentage?: number | null,
    totalClicks?: number | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateWebsiteStatsSubscriptionVariables = {
  filter?: ModelSubscriptionWebsiteStatsFilterInput | null,
};

export type OnUpdateWebsiteStatsSubscription = {
  onUpdateWebsiteStats?:  {
    __typename: "WebsiteStats",
    id: string,
    activeUsers: number,
    usersByCountry?: string | null,
    usersByCity?: string | null,
    avgTimeOnPage?: number | null,
    avgScrollPercentage?: number | null,
    totalClicks?: number | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteWebsiteStatsSubscriptionVariables = {
  filter?: ModelSubscriptionWebsiteStatsFilterInput | null,
};

export type OnDeleteWebsiteStatsSubscription = {
  onDeleteWebsiteStats?:  {
    __typename: "WebsiteStats",
    id: string,
    activeUsers: number,
    usersByCountry?: string | null,
    usersByCity?: string | null,
    avgTimeOnPage?: number | null,
    avgScrollPercentage?: number | null,
    totalClicks?: number | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};
