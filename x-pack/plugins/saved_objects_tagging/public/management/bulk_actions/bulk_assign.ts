/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { from } from 'rxjs';
import { takeUntil } from 'rxjs';
import { i18n } from '@kbn/i18n';
import { ITagsCache, ITagAssignmentService } from '../../services';
import { StartServices } from '../../types';
import { TagBulkAction } from '../types';
import { getAssignFlyoutOpener } from '../../components/assign_flyout';

interface GetBulkAssignActionOptions extends StartServices {
  tagCache: ITagsCache;
  assignmentService: ITagAssignmentService;
  assignableTypes: string[];
  setLoading: (loading: boolean) => void;
}

export const getBulkAssignAction = ({
  tagCache,
  assignmentService,
  assignableTypes,
  ...startServices
}: GetBulkAssignActionOptions): TagBulkAction => {
  const openFlyout = getAssignFlyoutOpener({
    ...startServices,
    tagCache,
    assignmentService,
    assignableTypes,
  });

  return {
    id: 'assign',
    label: i18n.translate('xpack.savedObjectsTagging.management.actions.bulkAssign.label', {
      defaultMessage: 'Manage tag assignments',
    }),
    icon: 'tag',
    refreshAfterExecute: true,
    execute: async (tagIds, { canceled$ }) => {
      const flyout = await openFlyout({
        tagIds,
      });

      // close the flyout when the action is canceled
      // this is required when the user navigates away from the page
      canceled$.pipe(takeUntil(from(flyout.onClose))).subscribe(() => {
        flyout.close();
      });

      return flyout.onClose;
    },
  };
};
