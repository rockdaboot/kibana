/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiPopover,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { debounce } from 'lodash';
import React, { useCallback, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { useVisibilityState } from '../../hooks/use_visibility_state';
import { withAttrs } from '../../utils/theme_utils/with_attrs';

interface LogHighlightsMenuProps {
  onChange: (highlightTerms: string[]) => void;
  isLoading: boolean;
  activeHighlights: boolean;
  hasPreviousHighlight: boolean;
  hasNextHighlight: boolean;
  goToPreviousHighlight: () => void;
  goToNextHighlight: () => void;
}

export const LogHighlightsMenu: React.FC<LogHighlightsMenuProps> = ({
  onChange,
  isLoading,
  activeHighlights,
  hasPreviousHighlight,
  goToPreviousHighlight,
  hasNextHighlight,
  goToNextHighlight,
}) => {
  const {
    isVisible: isPopoverOpen,
    hide: closePopover,
    toggle: togglePopover,
  } = useVisibilityState(false);

  // Input field state
  const [highlightTerm, _setHighlightTerm] = useState('');

  const debouncedOnChange = useMemo(() => debounce(onChange, 275), [onChange]);
  const setHighlightTerm = useCallback<typeof _setHighlightTerm>(
    (valueOrUpdater) =>
      _setHighlightTerm((previousHighlightTerm) => {
        const newHighlightTerm =
          typeof valueOrUpdater === 'function'
            ? valueOrUpdater(previousHighlightTerm)
            : valueOrUpdater;

        if (newHighlightTerm !== previousHighlightTerm) {
          debouncedOnChange([newHighlightTerm]);
        }

        return newHighlightTerm;
      }),
    [debouncedOnChange]
  );
  const changeHighlightTerm = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setHighlightTerm(value);
    },
    [setHighlightTerm]
  );
  const clearHighlightTerm = useCallback(() => setHighlightTerm(''), [setHighlightTerm]);

  const button = (
    <EuiButtonEmpty
      data-test-subj="infraLogHighlightsMenuButton"
      color="text"
      size="xs"
      iconType="brush"
      onClick={togglePopover}
    >
      <FormattedMessage
        id="xpack.infra.logs.highlights.highlightsPopoverButtonLabel"
        defaultMessage="Highlights"
      />
      {activeHighlights ? <ActiveHighlightsIndicator /> : null}
    </EuiButtonEmpty>
  );
  return (
    <EuiPopover
      id="popover"
      button={button}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      ownFocus
    >
      <LogHighlightsMenuContent>
        <EuiFlexGroup alignItems="center" gutterSize="s">
          <EuiFlexItem>
            <EuiFieldText
              data-test-subj="infraLogHighlightsMenuFieldText"
              placeholder={termsFieldLabel}
              fullWidth={true}
              value={highlightTerm}
              onChange={changeHighlightTerm}
              isLoading={isLoading}
              aria-label={termsFieldLabel}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonIcon
              data-test-subj="infraLogHighlightsMenuButton"
              aria-label={goToPreviousHighlightLabel}
              iconType="arrowUp"
              onClick={goToPreviousHighlight}
              title={goToPreviousHighlightLabel}
              isDisabled={!hasPreviousHighlight}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonIcon
              data-test-subj="infraLogHighlightsMenuButton"
              aria-label={goToNextHighlightLabel}
              iconType="arrowDown"
              onClick={goToNextHighlight}
              title={goToNextHighlightLabel}
              isDisabled={!hasNextHighlight}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonIcon
              data-test-subj="infraLogHighlightsMenuButton"
              aria-label={clearTermsButtonLabel}
              color="danger"
              isDisabled={highlightTerm === ''}
              iconType="trash"
              onClick={clearHighlightTerm}
              title={clearTermsButtonLabel}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </LogHighlightsMenuContent>
    </EuiPopover>
  );
};

const termsFieldLabel = i18n.translate('xpack.infra.logs.highlights.highlightTermsFieldLabel', {
  defaultMessage: 'Terms to highlight',
});

const clearTermsButtonLabel = i18n.translate(
  'xpack.infra.logs.highlights.clearHighlightTermsButtonLabel',
  {
    defaultMessage: 'Clear terms to highlight',
  }
);

const goToPreviousHighlightLabel = i18n.translate(
  'xpack.infra.logs.highlights.goToPreviousHighlightButtonLabel',
  {
    defaultMessage: 'Jump to previous highlight',
  }
);

const goToNextHighlightLabel = i18n.translate(
  'xpack.infra.logs.highlights.goToNextHighlightButtonLabel',
  {
    defaultMessage: 'Jump to next highlight',
  }
);

const ActiveHighlightsIndicator = withAttrs(
  styled(EuiIcon)`
    padding-left: ${(props) => props.theme.euiTheme.size.xs};
  `,
  ({ theme }) => ({
    type: 'checkInCircleFilled',
    size: 'm',
    color: theme?.euiTheme.colors.accent,
  })
);

const LogHighlightsMenuContent = styled.div`
  width: 300px;
`;
