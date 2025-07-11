/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import { mountWithIntl } from '@kbn/test-jest-helpers';
import type { ReactWrapper } from 'enzyme';
import { LoadingSpinner } from './loading_spinner';
import { findTestSubject } from '@elastic/eui/lib/test';
import { DiscoverTestProvider } from '../../../../__mocks__/test_provider';

describe('loading spinner', function () {
  let component: ReactWrapper;

  it('LoadingSpinner renders a Searching text and a spinner', () => {
    component = mountWithIntl(
      <DiscoverTestProvider>
        <LoadingSpinner />
      </DiscoverTestProvider>
    );
    expect(findTestSubject(component, 'loadingSpinnerText').text()).toBe('Searching');
    expect(findTestSubject(component, 'loadingSpinner').length).toBe(1);
  });
});
