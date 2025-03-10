/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { NamedExoticComponent } from 'react';
import { BlockListFlyoutProps, BlockListFormProps, SelectedDataView } from '../types';
import { SecuritySolutionPluginContext } from '..';

export const getSecuritySolutionContextMock = (): SecuritySolutionPluginContext => ({
  getFiltersGlobalComponent:
    () =>
    ({ children }) =>
      <div>{children}</div>,
  licenseService: {
    isEnterprise(): boolean {
      return true;
    },
    isPlatinumPlus(): boolean {
      return true;
    },
  },
  getPageWrapper:
    () =>
    ({ children }) =>
      <div>{children}</div>,
  sourcererDataView: {
    sourcererDataView: {
      id: 'security-solution-default',
    },
    browserFields: {},
    selectedPatterns: [],
    indexPattern: { fields: [], title: '' },
    loading: false,
  } as unknown as SelectedDataView,
  securitySolutionStore: {
    // @ts-ignore
    dispatch: () => jest.fn(),
  },
  getUseInvestigateInTimeline:
    ({ dataProviders, from, to }) =>
    () =>
      new Promise((resolve) => window.alert('investigate in timeline')),
  hasAccessToTimeline: true,

  SiemSearchBar: () => <div data-test-subj="SiemSearchBar">mock siem search</div>,

  useFilters: () => [],

  useGlobalTime: () => ({ from: '', to: '' }),

  useQuery: () => ({ language: 'kuery', query: '' }),

  registerQuery: () => {},

  deregisterQuery: () => {},

  blockList: {
    canWriteBlocklist: true,
    exceptionListApiClient: {},
    useSetUrlParams: () => (params, replace) => {},
    getFlyoutComponent: () => (<div />) as unknown as NamedExoticComponent<BlockListFlyoutProps>,
    getFormComponent: () => (<div />) as unknown as NamedExoticComponent<BlockListFormProps>,
  },
});
