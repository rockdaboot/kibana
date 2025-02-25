/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { AnnotationDomainType, LineAnnotation, RectAnnotation } from '@elastic/charts';
import { first, last } from 'lodash';
import React from 'react';
import { COMPARATORS } from '@kbn/alerting-comparators';
import type { Color } from '../../../../common/color_palette';
import { colorTransformer } from '../../../../common/color_palette';

interface ThresholdAnnotationsProps {
  threshold: number[];
  sortedThresholds: number[];
  comparator: COMPARATORS;
  color: Color;
  id: string;
  firstTimestamp: number;
  lastTimestamp: number;
  domain: { min: number; max: number };
}

const opacity = 0.3;

export const ThresholdAnnotations = ({
  threshold,
  sortedThresholds,
  comparator,
  color,
  id,
  firstTimestamp,
  lastTimestamp,
  domain,
}: ThresholdAnnotationsProps) => {
  if (!comparator || !threshold) return null;
  const isAbove = [COMPARATORS.GREATER_THAN, COMPARATORS.GREATER_THAN_OR_EQUALS].includes(
    comparator
  );
  const isBelow = [COMPARATORS.LESS_THAN, COMPARATORS.LESS_THAN_OR_EQUALS].includes(comparator);
  return (
    <>
      <LineAnnotation
        id={`${id}-thresholds`}
        domainType={AnnotationDomainType.YDomain}
        data-test-subj="threshold-line"
        dataValues={sortedThresholds.map((t) => ({
          dataValue: t,
        }))}
        style={{
          line: {
            strokeWidth: 2,
            stroke: colorTransformer(color),
            opacity: 1,
          },
        }}
      />
      {sortedThresholds.length === 2 && comparator === COMPARATORS.BETWEEN ? (
        <>
          <RectAnnotation
            id={`${id}-lower-threshold`}
            data-test-subj="between-rect"
            style={{
              fill: colorTransformer(color),
              opacity,
            }}
            dataValues={[
              {
                coordinates: {
                  x0: firstTimestamp,
                  x1: lastTimestamp,
                  y0: first(threshold),
                  y1: last(threshold),
                },
              },
            ]}
          />
        </>
      ) : null}
      {sortedThresholds.length === 2 && comparator === COMPARATORS.NOT_BETWEEN ? (
        <>
          <RectAnnotation
            id={`${id}-lower-threshold`}
            data-test-subj="outside-range-lower-rect"
            style={{
              fill: colorTransformer(color),
              opacity,
            }}
            dataValues={[
              {
                coordinates: {
                  x0: firstTimestamp,
                  x1: lastTimestamp,
                  y0: domain.min,
                  y1: first(threshold),
                },
              },
            ]}
          />
          <RectAnnotation
            id={`${id}-upper-threshold`}
            data-test-subj="outside-range-upper-rect"
            style={{
              fill: colorTransformer(color),
              opacity,
            }}
            dataValues={[
              {
                coordinates: {
                  x0: firstTimestamp,
                  x1: lastTimestamp,
                  y0: last(threshold),
                  y1: domain.max,
                },
              },
            ]}
          />
        </>
      ) : null}
      {isBelow && first(threshold) != null ? (
        <RectAnnotation
          id={`${id}-upper-threshold`}
          data-test-subj="below-rect"
          style={{
            fill: colorTransformer(color),
            opacity,
          }}
          dataValues={[
            {
              coordinates: {
                x0: firstTimestamp,
                x1: lastTimestamp,
                y0: domain.min,
                y1: first(threshold),
              },
            },
          ]}
        />
      ) : null}
      {isAbove && first(threshold) != null ? (
        <RectAnnotation
          id={`${id}-upper-threshold`}
          data-test-subj="above-rect"
          style={{
            fill: colorTransformer(color),
            opacity,
          }}
          dataValues={[
            {
              coordinates: {
                x0: firstTimestamp,
                x1: lastTimestamp,
                y0: first(threshold),
                y1: domain.max,
              },
            },
          ]}
        />
      ) : null}
    </>
  );
};
