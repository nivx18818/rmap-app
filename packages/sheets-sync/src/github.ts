import type { ProjectItem, SyncConfig } from './types.js';

import { RetryableRequestError, getRetryAfterMs, retryOperation } from './retry.js';

export type FetchImpl = (input: string | URL, init?: RequestInit) => Promise<Response>;

interface FetchProjectItemsInput {
  config: SyncConfig;
  fetchImpl?: FetchImpl;
  token: string;
}

interface GitHubGraphqlError {
  message?: string;
  type?: string;
}

interface ProjectItemsPage {
  nodes?: ProjectItem[] | null;
  pageInfo?: {
    endCursor?: null | string;
    hasNextPage?: boolean;
  } | null;
}

interface GitHubProjectResponse {
  data?: {
    owner?: {
      projectV2?: {
        items?: ProjectItemsPage | null;
      } | null;
    } | null;
  };
  errors?: GitHubGraphqlError[];
}

const GITHUB_GRAPHQL_ENDPOINT = 'https://api.github.com/graphql';

export async function fetchProjectItems(input: FetchProjectItemsInput): Promise<ProjectItem[]> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const items: ProjectItem[] = [];
  let cursor: null | string = null;

  while (true) {
    const response = await requestProjectItemsPage({
      config: input.config,
      cursor,
      fetchImpl,
      token: input.token,
    });
    const page = response.data?.owner?.projectV2?.items;

    if (page === undefined || page === null) {
      throw new Error('GitHub Project v2 was not found or the token cannot read it.');
    }

    items.push(...(page.nodes ?? []));

    if (page.pageInfo?.hasNextPage !== true) {
      return items;
    }

    cursor = page.pageInfo.endCursor ?? null;
  }
}

async function requestProjectItemsPage(input: {
  config: SyncConfig;
  cursor: null | string;
  fetchImpl: FetchImpl;
  token: string;
}): Promise<GitHubProjectResponse> {
  return retryOperation(async () => {
    const response = await input.fetchImpl(GITHUB_GRAPHQL_ENDPOINT, {
      body: JSON.stringify({
        query: buildProjectItemsQuery(input.config.projectOwnerType),
        variables: {
          after: input.cursor,
          number: input.config.projectNumber,
          owner: input.config.projectOwner,
        },
      }),
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${input.token}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      method: 'POST',
    });

    const parsed = await readJsonResponse(response);

    if (!response.ok) {
      throwGitHubHttpError(response, parsed);
    }

    if (parsed.errors !== undefined && parsed.errors.length > 0) {
      throwGitHubGraphqlError(response, parsed.errors);
    }

    return parsed;
  });
}

function buildProjectItemsQuery(ownerType: SyncConfig['projectOwnerType']): string {
  const ownerResolver =
    ownerType === 'USER' ? 'user(login: $owner)' : 'organization(login: $owner)';

  return `
    query SyncProjectItems($owner: String!, $number: Int!, $after: String) {
      owner: ${ownerResolver} {
        projectV2(number: $number) {
          items(first: 100, after: $after) {
            nodes {
              id
              isArchived
              updatedAt
              content {
                __typename
                ... on DraftIssue {
                  title
                  assignees(first: 20) {
                    nodes {
                      login
                    }
                  }
                }
                ... on Issue {
                  body
                  number
                  title
                  url
                  state
                  updatedAt
                  repository {
                    nameWithOwner
                  }
                  assignees(first: 20) {
                    nodes {
                      login
                    }
                  }
                  labels(first: 20) {
                    nodes {
                      name
                    }
                  }
                  closedByPullRequestsReferences(first: 10, includeClosedPrs: true) {
                    nodes {
                      url
                    }
                  }
                }
                ... on PullRequest {
                  body
                  number
                  title
                  url
                  state
                  updatedAt
                  repository {
                    nameWithOwner
                  }
                  assignees(first: 20) {
                    nodes {
                      login
                    }
                  }
                  labels(first: 20) {
                    nodes {
                      name
                    }
                  }
                }
              }
              fieldValues(first: 50) {
                nodes {
                  __typename
                  ... on ProjectV2ItemFieldDateValue {
                    date
                    field {
                      ... on ProjectV2FieldCommon {
                        name
                      }
                    }
                  }
                  ... on ProjectV2ItemFieldLabelValue {
                    labels(first: 20) {
                      nodes {
                        name
                      }
                    }
                    field {
                      ... on ProjectV2FieldCommon {
                        name
                      }
                    }
                  }
                  ... on ProjectV2ItemFieldMilestoneValue {
                    milestone {
                      title
                    }
                    field {
                      ... on ProjectV2FieldCommon {
                        name
                      }
                    }
                  }
                  ... on ProjectV2ItemFieldNumberValue {
                    number
                    field {
                      ... on ProjectV2FieldCommon {
                        name
                      }
                    }
                  }
                  ... on ProjectV2ItemFieldPullRequestValue {
                    pullRequests(first: 20) {
                      nodes {
                        url
                      }
                    }
                    field {
                      ... on ProjectV2FieldCommon {
                        name
                      }
                    }
                  }
                  ... on ProjectV2ItemFieldRepositoryValue {
                    repository {
                      nameWithOwner
                    }
                    field {
                      ... on ProjectV2FieldCommon {
                        name
                      }
                    }
                  }
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    name
                    field {
                      ... on ProjectV2FieldCommon {
                        name
                      }
                    }
                  }
                  ... on ProjectV2ItemFieldTextValue {
                    text
                    field {
                      ... on ProjectV2FieldCommon {
                        name
                      }
                    }
                  }
                  ... on ProjectV2ItemFieldUserValue {
                    users(first: 20) {
                      nodes {
                        login
                      }
                    }
                    field {
                      ... on ProjectV2FieldCommon {
                        name
                      }
                    }
                  }
                }
              }
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      }
    }
  `;
}

function errorMessages(errors: readonly GitHubGraphqlError[]): string {
  return errors.map((error) => error.message ?? 'Unknown GraphQL error').join('; ');
}

async function readJsonResponse(response: Response): Promise<GitHubProjectResponse> {
  const body = await response.text();

  if (body.trim() === '') {
    return {};
  }

  try {
    return JSON.parse(body) as GitHubProjectResponse;
  } catch {
    return {};
  }
}

function hasRateLimitGraphqlError(errors: readonly GitHubGraphqlError[]): boolean {
  return errors.some((error) => {
    const message = error.message?.toLowerCase() ?? '';
    const type = error.type?.toLowerCase() ?? '';
    return (
      message.includes('rate limit') || message.includes('secondary rate') || type.includes('rate')
    );
  });
}

function throwGitHubGraphqlError(response: Response, errors: readonly GitHubGraphqlError[]): never {
  if (hasRateLimitGraphqlError(errors)) {
    throw new RetryableRequestError(`GitHub GraphQL rate limit error: ${errorMessages(errors)}`, {
      headers: response.headers,
      retryAfterMs: getRetryAfterMs(response.headers),
      status: 403,
    });
  }

  throw new Error(`GitHub GraphQL error: ${errorMessages(errors)}`);
}

function throwGitHubHttpError(response: Response, parsed: GitHubProjectResponse): never {
  const message = parsed.errors === undefined ? response.statusText : errorMessages(parsed.errors);

  if (response.status === 429 || response.status === 403 || response.status >= 500) {
    throw new RetryableRequestError(`GitHub GraphQL HTTP ${response.status}: ${message}`, {
      headers: response.headers,
      retryAfterMs: getRetryAfterMs(response.headers),
      status: response.status,
    });
  }

  throw new Error(`GitHub GraphQL HTTP ${response.status}: ${message}`);
}
