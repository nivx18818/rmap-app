import { computeSyncHash } from './hash.js';
import {
  DEFAULT_COLUMNS,
  type ColumnName,
  type NormalizedProjectItem,
  type ProjectFieldValue,
  type ProjectItem,
  type ProjectItemContent,
  type RowData,
} from './types.js';

export function normalizeProjectItem(item: ProjectItem): NormalizedProjectItem {
  const content = item.content ?? undefined;
  const repository = getRepository(content);
  const issueOrPullRequestNumber = getIssueOrPullRequestNumber(content);
  const syncKey =
    repository !== '' && issueOrPullRequestNumber !== ''
      ? `${repository}#${issueOrPullRequestNumber}`
      : item.id;
  const fieldValues = item.fieldValues?.nodes ?? [];

  const row = createEmptyRow();
  row.Area = getProjectFieldValue(fieldValues, 'Area');
  row.Feature = getProjectFieldValue(fieldValues, 'Feature');
  row['Task Detail'] = content?.title ?? '';
  row.Assignee = getProjectFieldValue(fieldValues, 'Assignee') || getAssignees(content);
  row.Size = getProjectFieldValue(fieldValues, 'Size');
  row.Status = getProjectFieldValue(fieldValues, 'Status') || getState(content);
  row.Evidence = getEvidence(fieldValues, content);
  row['Sync Key'] = syncKey;
  row['Content Type'] = content?.__typename ?? 'ProjectItem';
  row['Issue/PR Number'] = issueOrPullRequestNumber;
  row.Repository = repository;
  row.URL = getUrl(content);
  row['Updated At'] = item.updatedAt ?? content?.updatedAt ?? '';
  row.Archived = item.isArchived === true ? 'TRUE' : 'FALSE';
  row['Archived At'] = '';
  row['Sync Hash'] = computeSyncHash(row);

  return {
    row,
    syncHash: row['Sync Hash'],
    syncKey,
  };
}

export function createEmptyRow(): RowData {
  return Object.fromEntries(DEFAULT_COLUMNS.map((column) => [column, ''])) as RowData;
}

export function getProjectFieldValue(
  fieldValues: readonly ProjectFieldValue[],
  fieldName: ColumnName | string,
): string {
  const fieldValue = fieldValues.find((value) => value.field?.name === fieldName);

  if (fieldValue === undefined) {
    return '';
  }

  switch (fieldValue.__typename) {
    case 'ProjectV2ItemFieldDateValue':
      return fieldValue.date ?? '';
    case 'ProjectV2ItemFieldLabelValue':
      return joinValues(fieldValue.labels?.nodes?.map((label) => label.name) ?? []);
    case 'ProjectV2ItemFieldMilestoneValue':
      return fieldValue.milestone?.title ?? '';
    case 'ProjectV2ItemFieldNumberValue':
      return fieldValue.number === null || fieldValue.number === undefined
        ? ''
        : String(fieldValue.number);
    case 'ProjectV2ItemFieldPullRequestValue':
      return joinValues(
        fieldValue.pullRequests?.nodes?.map((pullRequest) => pullRequest.url) ?? [],
      );
    case 'ProjectV2ItemFieldRepositoryValue':
      return fieldValue.repository?.nameWithOwner ?? '';
    case 'ProjectV2ItemFieldSingleSelectValue':
      return fieldValue.name ?? '';
    case 'ProjectV2ItemFieldTextValue':
      return fieldValue.text ?? '';
    case 'ProjectV2ItemFieldUserValue':
      return joinValues(fieldValue.users?.nodes?.map((user) => user.login) ?? []);
    default:
      return '';
  }
}

function getAssignees(content?: ProjectItemContent): string {
  return joinValues(content?.assignees?.nodes?.map((assignee) => assignee.login) ?? []);
}

function getEvidence(
  fieldValues: readonly ProjectFieldValue[],
  content?: ProjectItemContent,
): string {
  const evidenceField = getProjectFieldValue(fieldValues, 'Evidence');

  if (evidenceField !== '') {
    return evidenceField;
  }

  if (content?.__typename === 'PullRequest') {
    return content.url ?? '';
  }

  if (content?.__typename === 'Issue') {
    return joinValues(
      content.closedByPullRequestsReferences?.nodes?.map((pullRequest) => pullRequest.url) ?? [],
    );
  }

  return '';
}

function getIssueOrPullRequestNumber(content?: ProjectItemContent): string {
  if (content?.__typename !== 'Issue' && content?.__typename !== 'PullRequest') {
    return '';
  }

  return content.number === null || content.number === undefined ? '' : String(content.number);
}

function getRepository(content?: ProjectItemContent): string {
  if (content?.__typename !== 'Issue' && content?.__typename !== 'PullRequest') {
    return '';
  }

  return content.repository?.nameWithOwner ?? '';
}

function getState(content?: ProjectItemContent): string {
  if (content?.__typename !== 'Issue' && content?.__typename !== 'PullRequest') {
    return '';
  }

  return content.state ?? '';
}

function getUrl(content?: ProjectItemContent): string {
  if (content?.__typename !== 'Issue' && content?.__typename !== 'PullRequest') {
    return '';
  }

  return content.url ?? '';
}

function joinValues(values: readonly (null | string | undefined)[]): string {
  return values
    .filter((value): value is string => value !== null && value !== undefined && value !== '')
    .join(', ');
}
