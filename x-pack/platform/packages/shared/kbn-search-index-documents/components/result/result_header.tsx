/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState } from 'react';

import {
  EuiButton,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
  EuiPopoverFooter,
  EuiPopoverTitle,
  EuiTextColor,
  EuiTitle,
} from '@elastic/eui';

import { i18n } from '@kbn/i18n';
import { MetaDataProps } from './result_types';

interface Props {
  metaData: MetaDataProps;
  title: string;
}

interface TermDef {
  label: string | number;
}

const Term: React.FC<TermDef> = ({ label }) => (
  <EuiFlexItem grow={false}>
    <strong>
      <EuiTextColor color="subdued">{label}:</EuiTextColor>
    </strong>
  </EuiFlexItem>
);

const Definition: React.FC<TermDef> = ({ label }) => (
  <EuiFlexItem>
    <EuiTextColor color="subdued">{label}</EuiTextColor>
  </EuiFlexItem>
);
const MetadataPopover: React.FC<MetaDataProps> = ({ id, onDocumentDelete }) => {
  const [popoverIsOpen, setPopoverIsOpen] = useState(false);
  const closePopover = () => setPopoverIsOpen(false);

  const metaDataIcon = (
    <EuiButtonIcon
      display="empty"
      size="xs"
      iconType="info"
      color="primary"
      onClick={() => setPopoverIsOpen(!popoverIsOpen)}
      aria-label={i18n.translate(
        'xpack.searchIndexDocuments.result.header.metadata.icon.ariaLabel',
        {
          defaultMessage: 'Metadata for document: {id}',
          values: { id },
        }
      )}
    />
  );

  return (
    <EuiPopover button={metaDataIcon} isOpen={popoverIsOpen} closePopover={closePopover}>
      <EuiPopoverTitle>
        {i18n.translate('xpack.searchIndexDocuments.result.header.metadata.title', {
          defaultMessage: 'Document metadata',
        })}
      </EuiPopoverTitle>
      <EuiFlexGroup gutterSize="s" direction="column" style={{ width: '20rem' }}>
        <EuiFlexItem>
          <EuiFlexGroup justifyContent="spaceBetween" gutterSize="s">
            <Term label="ID" />
            <Definition label={id} />
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
      {onDocumentDelete && (
        <EuiPopoverFooter>
          <EuiButton iconType="trash" color="danger" size="s" onClick={closePopover} fullWidth>
            {i18n.translate('xpack.searchIndexDocuments.result.header.metadata.deleteDocument', {
              defaultMessage: 'Delete document',
            })}
          </EuiButton>
        </EuiPopoverFooter>
      )}
    </EuiPopover>
  );
};

export const ResultHeader: React.FC<Props> = ({ title, metaData }) => {
  return (
    <div className="resultHeader">
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" gutterSize="s">
        <EuiFlexItem>
          <EuiTitle size="xs">
            <h4>{title}</h4>
          </EuiTitle>
        </EuiFlexItem>
        {!!metaData && (
          <EuiFlexItem grow={false}>
            <MetadataPopover {...metaData} />
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    </div>
  );
};
