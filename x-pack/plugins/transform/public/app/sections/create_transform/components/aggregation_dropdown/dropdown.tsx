/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';

import type { EuiComboBoxOptionsListProps, EuiComboBoxOptionOption } from '@elastic/eui';
import { EuiComboBox } from '@elastic/eui';

interface Props {
  options: EuiComboBoxOptionOption[];
  placeholder?: string;
  changeHandler(d: EuiComboBoxOptionOption[]): void;
  testSubj?: string;
  isDisabled?: boolean;
  renderOption?: EuiComboBoxOptionsListProps<
    string | number | string[] | undefined
  >['renderOption'];
}

export const DropDown: React.FC<Props> = ({
  renderOption,
  changeHandler,
  options,
  placeholder = 'Search ...',
  testSubj,
  isDisabled,
}) => {
  return (
    <EuiComboBox
      fullWidth
      placeholder={placeholder}
      singleSelection={{ asPlainText: true }}
      options={options}
      selectedOptions={[]}
      onChange={changeHandler}
      isClearable={false}
      data-test-subj={testSubj}
      isDisabled={isDisabled}
      renderOption={renderOption}
    />
  );
};
