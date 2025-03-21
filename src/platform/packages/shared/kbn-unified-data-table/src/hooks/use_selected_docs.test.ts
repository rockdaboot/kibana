/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { renderHook, act } from '@testing-library/react';
import { buildDataTableRecord } from '@kbn/discover-utils';
import { useSelectedDocs } from './use_selected_docs';
import { generateEsHits } from '@kbn/discover-utils/src/__mocks__';
import { dataViewWithTimefieldMock } from '../../__mocks__/data_view_with_timefield';

describe('useSelectedDocs', () => {
  const docs = generateEsHits(dataViewWithTimefieldMock, 5).map((hit) =>
    buildDataTableRecord(hit, dataViewWithTimefieldMock)
  );
  const docsMap = new Map(docs.map((doc, docIndex) => [doc.id, { doc, docIndex }]));

  test('should have a correct default state', () => {
    const { result } = renderHook(() => useSelectedDocs(docsMap));
    expect(result.current.hasSelectedDocs).toBe(false);
    expect(result.current.selectedDocsCount).toBe(0);
    expect(result.current.getSelectedDocsOrderedByRows(docs)).toEqual([]);
    expect(result.current.docIdsInSelectionOrder).toEqual([]);
  });

  test('should toggleDocSelection correctly', () => {
    const { result } = renderHook(() => useSelectedDocs(docsMap));

    act(() => {
      result.current.toggleDocSelection(docs[0].id);
    });

    expect(result.current.hasSelectedDocs).toBe(true);
    expect(result.current.selectedDocsCount).toBe(1);
    expect(result.current.getSelectedDocsOrderedByRows(docs)).toEqual([docs[0]]);
    expect(result.current.docIdsInSelectionOrder).toEqual([docs[0].id]);

    expect(result.current.isDocSelected(docs[0].id)).toBe(true);
    expect(result.current.isDocSelected(docs[1].id)).toBe(false);

    act(() => {
      result.current.toggleDocSelection(docs[1].id);
    });

    expect(result.current.hasSelectedDocs).toBe(true);
    expect(result.current.selectedDocsCount).toBe(2);
    expect(result.current.getSelectedDocsOrderedByRows(docs)).toEqual([docs[0], docs[1]]);
    expect(result.current.docIdsInSelectionOrder).toEqual([docs[0].id, docs[1].id]);

    expect(result.current.isDocSelected(docs[0].id)).toBe(true);
    expect(result.current.isDocSelected(docs[1].id)).toBe(true);

    act(() => {
      result.current.toggleDocSelection(docs[0].id);
    });

    expect(result.current.hasSelectedDocs).toBe(true);
    expect(result.current.selectedDocsCount).toBe(1);
    expect(result.current.getSelectedDocsOrderedByRows(docs)).toEqual([docs[1]]);
    expect(result.current.docIdsInSelectionOrder).toEqual([docs[1].id]);

    expect(result.current.isDocSelected(docs[0].id)).toBe(false);
    expect(result.current.isDocSelected(docs[1].id)).toBe(true);

    act(() => {
      result.current.toggleDocSelection(docs[1].id);
    });

    expect(result.current.hasSelectedDocs).toBe(false);
    expect(result.current.selectedDocsCount).toBe(0);
    expect(result.current.getSelectedDocsOrderedByRows(docs)).toEqual([]);
    expect(result.current.docIdsInSelectionOrder).toEqual([]);

    expect(result.current.isDocSelected(docs[0].id)).toBe(false);
    expect(result.current.isDocSelected(docs[1].id)).toBe(false);
  });

  test('should replaceSelectedDocs correctly', () => {
    const { result } = renderHook(() => useSelectedDocs(docsMap));

    act(() => {
      result.current.toggleDocSelection(docs[0].id);
      result.current.toggleDocSelection(docs[1].id);
    });

    expect(result.current.hasSelectedDocs).toBe(true);
    expect(result.current.selectedDocsCount).toBe(2);
    expect(result.current.getSelectedDocsOrderedByRows(docs)).toEqual([docs[0], docs[1]]);
    expect(result.current.docIdsInSelectionOrder).toEqual([docs[0].id, docs[1].id]);

    act(() => {
      result.current.replaceSelectedDocs([docs[2].id, docs[1].id]);
    });

    expect(result.current.hasSelectedDocs).toBe(true);
    expect(result.current.selectedDocsCount).toBe(2);
    expect(result.current.getSelectedDocsOrderedByRows(docs)).toEqual([docs[1], docs[2]]);
    expect(result.current.docIdsInSelectionOrder).toEqual([docs[2].id, docs[1].id]);

    expect(result.current.isDocSelected(docs[0].id)).toBe(false);
    expect(result.current.isDocSelected(docs[1].id)).toBe(true);
    expect(result.current.isDocSelected(docs[2].id)).toBe(true);
  });

  test('should selectAllDocs correctly', () => {
    const { result } = renderHook(() => useSelectedDocs(docsMap));

    act(() => {
      result.current.selectAllDocs();
    });

    expect(result.current.hasSelectedDocs).toBe(true);
    expect(result.current.selectedDocsCount).toBe(docs.length);
    expect(result.current.getSelectedDocsOrderedByRows(docs)).toEqual(docs);
    expect(result.current.docIdsInSelectionOrder).toEqual(docs.map((doc) => doc.id));

    expect(result.current.isDocSelected(docs[0].id)).toBe(true);
    expect(result.current.isDocSelected(docs[docs.length - 1].id)).toBe(true);
  });

  test('should selectMoreDocs correctly', () => {
    const { result } = renderHook(() => useSelectedDocs(docsMap));

    act(() => {
      result.current.toggleDocSelection(docs[0].id);
      result.current.toggleDocSelection(docs[1].id);
    });

    expect(result.current.hasSelectedDocs).toBe(true);
    expect(result.current.selectedDocsCount).toBe(2);
    expect(result.current.getSelectedDocsOrderedByRows(docs)).toEqual([docs[0], docs[1]]);
    expect(result.current.docIdsInSelectionOrder).toEqual([docs[0].id, docs[1].id]);

    act(() => {
      result.current.selectMoreDocs([docs[1].id, docs[2].id]);
    });

    expect(result.current.hasSelectedDocs).toBe(true);
    expect(result.current.selectedDocsCount).toBe(3);
    expect(result.current.getSelectedDocsOrderedByRows(docs)).toEqual([docs[0], docs[1], docs[2]]);
    expect(result.current.docIdsInSelectionOrder).toEqual([docs[0].id, docs[1].id, docs[2].id]);

    expect(result.current.isDocSelected(docs[0].id)).toBe(true);
    expect(result.current.isDocSelected(docs[1].id)).toBe(true);
    expect(result.current.isDocSelected(docs[2].id)).toBe(true);
  });

  test('should deselectSomeDocs correctly', () => {
    const { result } = renderHook(() => useSelectedDocs(docsMap));

    act(() => {
      result.current.toggleDocSelection(docs[0].id);
      result.current.toggleDocSelection(docs[1].id);
      result.current.toggleDocSelection(docs[2].id);
    });

    expect(result.current.hasSelectedDocs).toBe(true);
    expect(result.current.selectedDocsCount).toBe(3);
    expect(result.current.getSelectedDocsOrderedByRows(docs)).toEqual([docs[0], docs[1], docs[2]]);
    expect(result.current.docIdsInSelectionOrder).toEqual([docs[0].id, docs[1].id, docs[2].id]);

    act(() => {
      result.current.deselectSomeDocs([docs[0].id, docs[2].id]);
    });

    expect(result.current.hasSelectedDocs).toBe(true);
    expect(result.current.selectedDocsCount).toBe(1);
    expect(result.current.getSelectedDocsOrderedByRows(docs)).toEqual([docs[1]]);
    expect(result.current.docIdsInSelectionOrder).toEqual([docs[1].id]);

    expect(result.current.isDocSelected(docs[0].id)).toBe(false);
    expect(result.current.isDocSelected(docs[1].id)).toBe(true);
    expect(result.current.isDocSelected(docs[2].id)).toBe(false);
  });

  test('should clearAllSelectedDocs correctly', () => {
    const { result } = renderHook(() => useSelectedDocs(docsMap));

    act(() => {
      result.current.toggleDocSelection(docs[0].id);
      result.current.toggleDocSelection(docs[1].id);
    });

    expect(result.current.hasSelectedDocs).toBe(true);
    expect(result.current.selectedDocsCount).toBe(2);
    expect(result.current.getSelectedDocsOrderedByRows(docs)).toEqual([docs[0], docs[1]]);
    expect(result.current.docIdsInSelectionOrder).toEqual([docs[0].id, docs[1].id]);

    act(() => {
      result.current.clearAllSelectedDocs();
    });

    expect(result.current.hasSelectedDocs).toBe(false);
    expect(result.current.selectedDocsCount).toBe(0);
    expect(result.current.getSelectedDocsOrderedByRows(docs)).toEqual([]);
    expect(result.current.docIdsInSelectionOrder).toEqual([]);

    expect(result.current.isDocSelected(docs[0].id)).toBe(false);
    expect(result.current.isDocSelected(docs[1].id)).toBe(false);
  });

  test('should getCountOfFilteredSelectedDocs correctly', () => {
    const { result } = renderHook(() => useSelectedDocs(docsMap));

    act(() => {
      result.current.toggleDocSelection(docs[0].id);
      result.current.toggleDocSelection(docs[1].id);
    });

    expect(result.current.getCountOfFilteredSelectedDocs([docs[0].id, docs[1].id])).toBe(2);
    expect(result.current.getCountOfFilteredSelectedDocs([docs[2].id, docs[3].id])).toBe(0);

    act(() => {
      result.current.toggleDocSelection(docs[0].id);
    });

    expect(result.current.getCountOfFilteredSelectedDocs([docs[0].id, docs[1].id])).toBe(1);
    expect(result.current.getCountOfFilteredSelectedDocs([docs[1].id])).toBe(1);
    expect(result.current.getCountOfFilteredSelectedDocs([docs[0].id])).toBe(0);
    expect(result.current.getCountOfFilteredSelectedDocs([docs[2].id, docs[3].id])).toBe(0);
  });

  test('should toggleMultipleDocsSelection correctly', () => {
    const { result } = renderHook(() => useSelectedDocs(docsMap));
    const docIds = docs.map((doc) => doc.id);

    // select `0`
    act(() => {
      result.current.toggleDocSelection(docs[0].id);
    });

    expect(result.current.getCountOfFilteredSelectedDocs(docIds)).toBe(1);

    // select from `0` to `4`
    act(() => {
      result.current.toggleMultipleDocsSelection(docs[4].id);
    });

    expect(result.current.getCountOfFilteredSelectedDocs(docIds)).toBe(5);

    // deselect from `2` to `4`
    act(() => {
      result.current.toggleMultipleDocsSelection(docs[2].id);
    });

    expect(result.current.getCountOfFilteredSelectedDocs(docIds)).toBe(2);
  });
});
