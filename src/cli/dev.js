/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

const collectExtendedStackTrace = process.argv.includes('--extended-stack-trace');

if (collectExtendedStackTrace) {
  // Using these modules when in dev mode to extend the stack traces.
  // Why?
  //      When running unattended (non-awaited) promises, V8 removes the parent call-stack (as none of those objects are required by V8).
  //      This results in (very) incomplete and unhelpful stack traces that makes it super-hard to figure out what called a failing promise.
  //      The libraries below help to provide more complete stack traces.
  //
  // `trace` uses AsyncHooks to store the call-stack and attaches them to the stack trace when an error occurs.
  // Note that line numbers might be off when using `trace`.
  require('trace');
  // `clarify` tries to remove Node.js' internal libraries from the stack trace to make it a bit more human-friendly.
  require('clarify');
}
// More info in https://trace.js.org/

if (process.features.require_module) {
  console.warn(
    "Node.js's experimental support for native ES modules is enabled.  This will not be enabled in production while the feature is experimental.  It is recommended to add `--no-experimental-require-module` to NODE_OPTIONS."
  );
}

require('../setup_node_env');

require('./apm')(process.env.ELASTIC_APM_SERVICE_NAME || 'kibana-proxy');
require('./cli');
