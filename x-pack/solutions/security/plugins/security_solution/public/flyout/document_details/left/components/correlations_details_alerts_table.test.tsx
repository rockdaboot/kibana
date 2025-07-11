/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { TestProviders } from '../../../../common/mock';
import { useExpandableFlyoutApi } from '@kbn/expandable-flyout';
import { CorrelationsDetailsAlertsTable } from './correlations_details_alerts_table';
import { usePaginatedAlerts } from '../hooks/use_paginated_alerts';
import { mockFlyoutApi } from '../../shared/mocks/mock_flyout_context';
import { mockContextValue } from '../../shared/mocks/mock_context';
import { DocumentDetailsPreviewPanelKey } from '../../shared/constants/panel_keys';
import { ALERT_PREVIEW_BANNER } from '../../preview/constants';
import { RulePreviewPanelKey, RULE_PREVIEW_BANNER } from '../../../rule_details/right';
import { TableId } from '@kbn/securitysolution-data-table';

jest.mock('../hooks/use_paginated_alerts');

jest.mock('@kbn/expandable-flyout');

const TEST_ID = 'TEST';
const alertIds = ['id1', 'id2', 'id3'];

const renderCorrelationsTable = (scopeId: string = mockContextValue.scopeId) =>
  render(
    <TestProviders>
      <CorrelationsDetailsAlertsTable
        title={<p>{'title'}</p>}
        loading={false}
        alertIds={alertIds}
        scopeId={scopeId}
        eventId={mockContextValue.eventId}
        data-test-subj={TEST_ID}
      />
    </TestProviders>
  );

describe('CorrelationsDetailsAlertsTable', () => {
  beforeEach(() => {
    jest.mocked(useExpandableFlyoutApi).mockReturnValue(mockFlyoutApi);
    jest.mocked(usePaginatedAlerts).mockReturnValue({
      setPagination: jest.fn(),
      setSorting: jest.fn(),
      data: [
        {
          _id: '1',
          _index: 'index',
          fields: {
            '@timestamp': ['2022-01-01'],
            'kibana.alert.rule.name': ['Rule1'],
            'kibana.alert.reason': ['Reason1'],
            'kibana.alert.severity': ['Severity1'],
            'kibana.alert.rule.uuid': ['uuid1'],
          },
        },
        {
          _id: '1',
          _index: 'index',
          fields: {
            '@timestamp': ['2022-01-02'],
            'kibana.alert.rule.name': ['Rule2'],
            'kibana.alert.reason': ['Reason2'],
            'kibana.alert.severity': ['Severity2'],
            'kibana.alert.rule.uuid': ['uuid2'],
          },
        },
      ],
      loading: false,
      paginationConfig: {
        pageIndex: 0,
        pageSize: 5,
        totalItemCount: 10,
        pageSizeOptions: [5, 10, 20],
      },
      sorting: { sort: { field: '@timestamp', direction: 'asc' }, enableAllColumns: true },
      error: false,
    });
  });

  it('renders EuiBasicTable with correct props', () => {
    const { getByTestId, getAllByTestId, queryAllByRole } = renderCorrelationsTable();

    expect(getByTestId(`${TEST_ID}InvestigateInTimeline`)).toBeInTheDocument();
    expect(getByTestId(`${TEST_ID}Table`)).toBeInTheDocument();
    expect(getAllByTestId(`${TEST_ID}AlertPreviewButton`)).toHaveLength(2);

    expect(jest.mocked(usePaginatedAlerts)).toHaveBeenCalled();

    expect(queryAllByRole('columnheader').length).toBe(5);
    expect(queryAllByRole('row').length).toBe(3); // 1 header row and 2 data rows
    expect(queryAllByRole('row')[1].textContent).toContain('Jan 1, 2022 @ 00:00:00.000');
    expect(queryAllByRole('row')[1].textContent).toContain('Reason1');
    expect(queryAllByRole('row')[1].textContent).toContain('Rule1');
    expect(queryAllByRole('row')[1].textContent).toContain('Severity1');
  });

  it('renders open preview button', () => {
    const { getByTestId, getAllByTestId } = renderCorrelationsTable(TableId.rulePreview);

    expect(getByTestId(`${TEST_ID}InvestigateInTimeline`)).toBeInTheDocument();
    expect(getAllByTestId(`${TEST_ID}AlertPreviewButton`).length).toBe(2);

    getAllByTestId(`${TEST_ID}AlertPreviewButton`)[0].click();
    expect(mockFlyoutApi.openPreviewPanel).toHaveBeenCalledWith({
      id: DocumentDetailsPreviewPanelKey,
      params: {
        id: '1',
        indexName: 'index',
        scopeId: TableId.rulePreview,
        banner: ALERT_PREVIEW_BANNER,
        isPreviewMode: true,
      },
    });
  });

  it('opens rule preview when isRulePreview is false', () => {
    const { getAllByTestId } = renderCorrelationsTable();

    expect(getAllByTestId(`${TEST_ID}RulePreview`).length).toBe(2);

    getAllByTestId(`${TEST_ID}RulePreview`)[0].click();
    expect(mockFlyoutApi.openPreviewPanel).toHaveBeenCalledWith({
      id: RulePreviewPanelKey,
      params: {
        ruleId: 'uuid1',
        banner: RULE_PREVIEW_BANNER,
        isPreviewMode: true,
      },
    });
  });

  it('does not render preview link when isRulePreview is true', () => {
    const { queryByTestId } = renderCorrelationsTable(TableId.rulePreview);
    expect(queryByTestId(`${TEST_ID}RulePreview`)).not.toBeInTheDocument();
  });
});
