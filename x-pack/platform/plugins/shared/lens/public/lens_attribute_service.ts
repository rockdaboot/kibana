/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Reference } from '@kbn/content-management-utils';
import { OnSaveProps } from '@kbn/saved-objects-plugin/public';
import { SavedObjectCommon } from '@kbn/saved-objects-finder-plugin/common';
import { noop } from 'lodash';
import { EmbeddableStateWithType } from '@kbn/embeddable-plugin/common';
import type { LensPluginStartDependencies } from './plugin';
import type { LensSavedObjectAttributes as LensSavedObjectAttributesWithoutReferences } from '../common/content_management';
import { extract, inject } from '../common/embeddable_factory';
import { LensDocumentService } from './persistence';
import { DOC_TYPE } from '../common/constants';
import { SharingSavedObjectProps } from './types';
import { LensRuntimeState, LensSavedObjectAttributes } from './react_embeddable/types';

type CheckDuplicateTitleProps = OnSaveProps & {
  id?: string;
  displayName: string;
  lastSavedTitle: string;
  copyOnSave: boolean;
};

export interface LensAttributesService {
  loadFromLibrary: (savedObjectId: string) => Promise<{
    attributes: LensSavedObjectAttributes;
    sharingSavedObjectProps: SharingSavedObjectProps;
    managed: boolean;
  }>;
  saveToLibrary: (
    attributes: LensSavedObjectAttributesWithoutReferences,
    references: Reference[],
    savedObjectId?: string
  ) => Promise<string>;
  checkForDuplicateTitle: (props: CheckDuplicateTitleProps) => Promise<{ isDuplicate: boolean }>;
  injectReferences: (
    runtimeState: LensRuntimeState,
    references: Reference[] | undefined
  ) => LensRuntimeState;
  extractReferences: (runtimeState: LensRuntimeState) => {
    rawState: LensRuntimeState;
    references: Reference[];
  };
}

export const savedObjectToEmbeddableAttributes = (
  savedObject: SavedObjectCommon<LensSavedObjectAttributesWithoutReferences>
): LensSavedObjectAttributes => {
  return {
    ...savedObject.attributes,
    state: savedObject.attributes.state as LensSavedObjectAttributes['state'],
    references: savedObject.references,
  };
};

export function getLensAttributeService({
  contentManagement,
}: LensPluginStartDependencies): LensAttributesService {
  const lensDocumentService = new LensDocumentService(contentManagement);

  return {
    loadFromLibrary: async (
      savedObjectId: string
    ): Promise<{
      attributes: LensSavedObjectAttributes;
      sharingSavedObjectProps: SharingSavedObjectProps;
      managed: boolean;
    }> => {
      const { meta, item } = await lensDocumentService.load(savedObjectId);
      return {
        attributes: {
          ...item.attributes,
          state: item.attributes.state as LensSavedObjectAttributes['state'],
          references: item.references,
        },
        sharingSavedObjectProps: {
          aliasTargetId: meta.aliasTargetId,
          outcome: meta.outcome,
          aliasPurpose: meta.aliasPurpose,
          sourceId: item.id,
        },
        managed: Boolean(item.managed),
      };
    },
    saveToLibrary: async (
      attributes: LensSavedObjectAttributesWithoutReferences,
      references: Reference[],
      savedObjectId?: string
    ) => {
      const result = await lensDocumentService.save({
        ...attributes,
        state: attributes.state as LensSavedObjectAttributes['state'],
        references,
        savedObjectId,
      });
      return result.savedObjectId;
    },
    checkForDuplicateTitle: async ({
      newTitle,
      isTitleDuplicateConfirmed,
      onTitleDuplicate = noop,
      displayName = DOC_TYPE,
      lastSavedTitle = '',
      copyOnSave = false,
      id,
    }: CheckDuplicateTitleProps) => {
      return {
        isDuplicate: await lensDocumentService.checkForDuplicateTitle(
          {
            id,
            title: newTitle,
            isTitleDuplicateConfirmed,
            displayName,
            lastSavedTitle,
            copyOnSave,
          },
          onTitleDuplicate
        ),
      };
    },
    // Make sure to inject references from the container down to the runtime state
    // this ensure migrations/copy to spaces works correctly
    injectReferences: (runtimeState, references) => {
      return inject(
        runtimeState as unknown as EmbeddableStateWithType,
        references ?? runtimeState.attributes.references
      ) as unknown as LensRuntimeState;
    },
    // Make sure to move the internal references into the parent references
    // so migrations/move to spaces can work properly
    extractReferences: (runtimeState) => {
      const { state, references } = extract(runtimeState as unknown as EmbeddableStateWithType);
      return { rawState: state as unknown as LensRuntimeState, references };
    },
  };
}
