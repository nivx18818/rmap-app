import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import type { ProjectFieldValue, ProjectItem } from './types.js';

import { normalizeProjectItem } from './normalize.js';

test('normalizes issue content and Project v2 field values', () => {
  const item = {
    content: {
      __typename: 'Issue',
      assignees: { nodes: [{ login: 'alice' }, { login: 'bob' }] },
      body: [
        '## Description',
        '',
        'Create the roadmap progress API endpoints.',
        '',
        '## Problem',
        '',
        'Learners need progress tracking.',
      ].join('\n'),
      closedByPullRequestsReferences: {
        nodes: [{ url: 'https://github.com/nivx18818/rmap-app/pull/2' }],
      },
      labels: { nodes: [{ name: 'type: feature' }, { name: 'area: backend' }] },
      number: 12,
      repository: { nameWithOwner: 'nivx18818/rmap-app' },
      state: 'OPEN',
      title: '[FEATURE] Build roadmap progress API',
      updatedAt: '2026-05-30T10:00:00Z',
      url: 'https://github.com/nivx18818/rmap-app/issues/12',
    },
    fieldValues: {
      nodes: [
        textField('Area', 'API'),
        selectField('Feature', 'Progress'),
        numberField('Size', 5),
        selectField('Status', 'In Progress'),
        labelField('Evidence', ['backend', 'tested']),
      ],
    },
    id: 'PVTI_issue',
    updatedAt: '2026-05-31T01:00:00Z',
  } satisfies ProjectItem;

  const normalized = normalizeProjectItem(item);

  assert.equal(normalized.syncKey, 'nivx18818/rmap-app#12');
  assert.equal(normalized.row.Area, 'backend');
  assert.equal(normalized.row.Feature, 'Build roadmap progress API');
  assert.equal(normalized.row['Task Detail'], 'Create the roadmap progress API endpoints.');
  assert.equal(normalized.row.Assignee, 'alice, bob');
  assert.equal(normalized.row.Size, '5');
  assert.equal(normalized.row.Status, 'In Progress');
  assert.equal(normalized.row.Evidence, 'backend, tested');
  assert.equal(normalized.row.Repository, 'nivx18818/rmap-app');
  assert.equal(normalized.row['Issue/PR Number'], '12');
  assert.equal(normalized.row['Updated At'], '2026-05-31T01:00:00Z');
  assert.equal(normalized.row.Archived, 'FALSE');
  assert.match(normalized.syncHash, /^[a-f0-9]{64}$/);
});

test('strips improvement issue title prefixes and derives frontend area labels', () => {
  const item = {
    content: {
      __typename: 'Issue',
      body: [
        '## Description',
        '',
        'Improve the dashboard layout.',
        '',
        '## Scope',
        '',
        '- Sidebar',
      ].join('\n'),
      labels: { nodes: [{ name: 'area: frontend' }] },
      number: 14,
      repository: { nameWithOwner: 'nivx18818/rmap-app' },
      state: 'OPEN',
      title: '[IMPROVEMENT] Refine dashboard layout',
      url: 'https://github.com/nivx18818/rmap-app/issues/14',
    },
    id: 'PVTI_improvement',
  } satisfies ProjectItem;

  const normalized = normalizeProjectItem(item);

  assert.equal(normalized.row.Area, 'frontend');
  assert.equal(normalized.row.Feature, 'Refine dashboard layout');
  assert.equal(normalized.row['Task Detail'], 'Improve the dashboard layout.');
});

test('falls back to linked pull requests for issue evidence', () => {
  const item = {
    content: {
      __typename: 'Issue',
      assignees: { nodes: [] },
      closedByPullRequestsReferences: {
        nodes: [{ url: 'https://github.com/nivx18818/rmap-app/pull/9' }],
      },
      number: 8,
      repository: { nameWithOwner: 'nivx18818/rmap-app' },
      state: 'CLOSED',
      title: 'Connect auth form',
      url: 'https://github.com/nivx18818/rmap-app/issues/8',
    },
    id: 'PVTI_issue_evidence',
  } satisfies ProjectItem;

  const normalized = normalizeProjectItem(item);

  assert.equal(normalized.row.Evidence, 'https://github.com/nivx18818/rmap-app/pull/9');
  assert.equal(normalized.row.Status, 'CLOSED');
});

test('uses the pull request URL as default evidence for pull request items', () => {
  const item = {
    content: {
      __typename: 'PullRequest',
      assignees: { nodes: [{ login: 'maintainer' }] },
      number: 18,
      repository: { nameWithOwner: 'nivx18818/rmap-app' },
      state: 'MERGED',
      title: 'Add generated roadmap flow',
      url: 'https://github.com/nivx18818/rmap-app/pull/18',
    },
    id: 'PVTI_pr',
  } satisfies ProjectItem;

  const normalized = normalizeProjectItem(item);

  assert.equal(normalized.syncKey, 'nivx18818/rmap-app#18');
  assert.equal(normalized.row.Evidence, 'https://github.com/nivx18818/rmap-app/pull/18');
  assert.equal(normalized.row['Content Type'], 'PullRequest');
  assert.equal(normalized.row.Assignee, 'maintainer');
});

test('uses the project item id as the sync key for draft issues', () => {
  const item = {
    content: {
      __typename: 'DraftIssue',
      assignees: { nodes: [{ login: 'triage' }] },
      title: 'Draft support task',
    },
    fieldValues: {
      nodes: [userField('Assignee', ['triage', 'owner']), textField('Area', 'Ops')],
    },
    id: 'PVTI_draft',
  } satisfies ProjectItem;

  const normalized = normalizeProjectItem(item);

  assert.equal(normalized.syncKey, 'PVTI_draft');
  assert.equal(normalized.row['Sync Key'], 'PVTI_draft');
  assert.equal(normalized.row.Repository, '');
  assert.equal(normalized.row['Issue/PR Number'], '');
  assert.equal(normalized.row.Assignee, 'triage, owner');
});

function labelField(fieldName: string, names: string[]): ProjectFieldValue {
  return {
    __typename: 'ProjectV2ItemFieldLabelValue',
    field: { name: fieldName },
    labels: { nodes: names.map((name) => ({ name })) },
  };
}

function numberField(fieldName: string, number: number): ProjectFieldValue {
  return {
    __typename: 'ProjectV2ItemFieldNumberValue',
    field: { name: fieldName },
    number,
  };
}

function selectField(fieldName: string, name: string): ProjectFieldValue {
  return {
    __typename: 'ProjectV2ItemFieldSingleSelectValue',
    field: { name: fieldName },
    name,
  };
}

function textField(fieldName: string, text: string): ProjectFieldValue {
  return {
    __typename: 'ProjectV2ItemFieldTextValue',
    field: { name: fieldName },
    text,
  };
}

function userField(fieldName: string, logins: string[]): ProjectFieldValue {
  return {
    __typename: 'ProjectV2ItemFieldUserValue',
    field: { name: fieldName },
    users: { nodes: logins.map((login) => ({ login })) },
  };
}
