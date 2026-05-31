export const VISIBLE_COLUMNS = [
  'Area',
  'Feature',
  'Task Detail',
  'Assignee',
  'Size',
  'Status',
  'Evidence',
] as const;

export const METADATA_COLUMNS = [
  'Sync Key',
  'Content Type',
  'Issue/PR Number',
  'Repository',
  'URL',
  'Updated At',
  'Sync Hash',
  'Archived',
  'Archived At',
] as const;

export const DEFAULT_COLUMNS = [...VISIBLE_COLUMNS, ...METADATA_COLUMNS] as const;

export type ColumnName = (typeof DEFAULT_COLUMNS)[number];
export type ProjectOwnerType = 'USER' | 'ORGANIZATION';
export type RowData = Record<ColumnName, string>;

export interface SyncConfig {
  metadataColumns: ColumnName[];
  projectNumber: number;
  projectOwner: string;
  projectOwnerType: ProjectOwnerType;
  sheetName: string;
  visibleColumns: ColumnName[];
}

export interface RuntimeConfig {
  dryRun: boolean;
  githubToken: string;
  googleServiceAccountKey: GoogleServiceAccountKey;
  sheetId: string;
  sheetTabName?: string;
}

export interface GoogleServiceAccountKey {
  client_email: string;
  private_key: string;
  [key: string]: unknown;
}

export interface GraphqlNodeList<T> {
  nodes?: T[] | null;
}

export interface ProjectFieldRef {
  name?: string | null;
}

export type ProjectFieldValue =
  | {
      __typename: 'ProjectV2ItemFieldDateValue';
      date?: string | null;
      field?: ProjectFieldRef | null;
    }
  | {
      __typename: 'ProjectV2ItemFieldLabelValue';
      field?: ProjectFieldRef | null;
      labels?: GraphqlNodeList<{ name?: string | null }> | null;
    }
  | {
      __typename: 'ProjectV2ItemFieldMilestoneValue';
      field?: ProjectFieldRef | null;
      milestone?: { title?: string | null } | null;
    }
  | {
      __typename: 'ProjectV2ItemFieldNumberValue';
      field?: ProjectFieldRef | null;
      number?: number | null;
    }
  | {
      __typename: 'ProjectV2ItemFieldPullRequestValue';
      field?: ProjectFieldRef | null;
      pullRequests?: GraphqlNodeList<{ url?: string | null }> | null;
    }
  | {
      __typename: 'ProjectV2ItemFieldRepositoryValue';
      field?: ProjectFieldRef | null;
      repository?: { nameWithOwner?: string | null } | null;
    }
  | {
      __typename: 'ProjectV2ItemFieldSingleSelectValue';
      field?: ProjectFieldRef | null;
      name?: string | null;
    }
  | {
      __typename: 'ProjectV2ItemFieldTextValue';
      field?: ProjectFieldRef | null;
      text?: string | null;
    }
  | {
      __typename: 'ProjectV2ItemFieldUserValue';
      field?: ProjectFieldRef | null;
      users?: GraphqlNodeList<{ login?: string | null }> | null;
    };

export interface RepositoryRef {
  nameWithOwner?: string | null;
}

export interface AssigneeRef {
  login?: string | null;
}

export interface LabelRef {
  name?: string | null;
}

export interface IssueContent {
  __typename: 'Issue';
  assignees?: GraphqlNodeList<AssigneeRef> | null;
  body?: string | null;
  closedByPullRequestsReferences?: GraphqlNodeList<{ url?: string | null }> | null;
  labels?: GraphqlNodeList<LabelRef> | null;
  number?: number | null;
  repository?: RepositoryRef | null;
  state?: string | null;
  title?: string | null;
  updatedAt?: string | null;
  url?: string | null;
}

export interface PullRequestContent {
  __typename: 'PullRequest';
  assignees?: GraphqlNodeList<AssigneeRef> | null;
  labels?: GraphqlNodeList<LabelRef> | null;
  number?: number | null;
  repository?: RepositoryRef | null;
  state?: string | null;
  title?: string | null;
  updatedAt?: string | null;
  url?: string | null;
}

export interface DraftIssueContent {
  __typename: 'DraftIssue';
  assignees?: GraphqlNodeList<AssigneeRef> | null;
  title?: string | null;
  updatedAt?: string | null;
}

export type ProjectItemContent = DraftIssueContent | IssueContent | PullRequestContent;

export interface ProjectItem {
  content?: ProjectItemContent | null;
  fieldValues?: GraphqlNodeList<ProjectFieldValue> | null;
  id: string;
  isArchived?: boolean | null;
  updatedAt?: string | null;
}

export interface NormalizedProjectItem {
  row: RowData;
  syncHash: string;
  syncKey: string;
}
