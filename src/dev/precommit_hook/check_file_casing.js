/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { relative, basename } from 'path';

import { dim } from 'chalk';

import { createFailError } from '@kbn/dev-cli-errors';
import { matchesAnyGlob } from '../globs';

import {
  IGNORE_DIRECTORY_GLOBS,
  IGNORE_FILE_GLOBS,
  TEMPORARILY_IGNORED_PATHS,
  KEBAB_CASE_DIRECTORY_GLOBS,
  REMOVE_EXTENSION,
} from './casing_check_config';

const NON_SNAKE_CASE_RE = /[A-Z \-]/;
const NON_KEBAB_CASE_RE = /[A-Z \_]/;

function listPaths(paths) {
  return paths.map((path) => ` - ${path}`).join('\n');
}

/**
 * IGNORE_DIRECTORY_GLOBS patterns match directories which should
 * be ignored from casing validation. When one of the parent directories
 * of a file matches these rules this function strips it from the
 * path that is validated.
 *
 * if `file = new File('foo/bar/BAZ/index.js')` and `/foo/bar/BAZ`
 * is matched by an `IGNORE_DIRECTORY_GLOBS` pattern then this
 * function will return 'index.js' and only that part of the path
 * will be validated.
 *
 * @param  {File} file
 * @return {string} pathToCheck
 */
function getPathWithoutIgnoredParents(file) {
  for (const parent of file.getRelativeParentDirs()) {
    if (matchesAnyGlob(parent, IGNORE_DIRECTORY_GLOBS)) {
      return relative(parent, file.getRelativePath());
    }
  }

  return file.getRelativePath();
}

/**
 * Check for directories in the passed File objects which match the
 * KEBAB_CASE_DIRECTORY_GLOBS and ensure that those directories use
 * keban case
 *
 * @param  {ToolingLog} log
 * @param  {Array<File>} files
 * @return {Promise<undefined>}
 */
async function checkForKebabCase(log, files) {
  const errorPaths = files
    .reduce((acc, file) => {
      const parents = file.getRelativeParentDirs();

      return acc.concat(
        parents.filter(
          (parent) =>
            matchesAnyGlob(parent, KEBAB_CASE_DIRECTORY_GLOBS) &&
            NON_KEBAB_CASE_RE.test(basename(parent))
        )
      );
    }, [])
    .reduce((acc, path) => (acc.includes(path) ? acc : acc.concat(path)), []);

  if (errorPaths.length) {
    throw createFailError(`These directories MUST use kebab-case.\n${listPaths(errorPaths)}`);
  }
}

/**
 * Check that all passed File objects are using valid casing. Every
 * file SHOULD be using snake_case but some files are allowed to stray:
 *
 *  - eslint/babel packages: the directory name matches the module
 *    name, which uses kebab-case to mimic other babel/eslint plugins,
 *    configs, and presets
 *  - docs: unsure why, but all docs use kebab-case and that's fine
 *
 * @param {ToolingLog} log
 * @param {Array<File>} files
 * @return {Promise<undefined>}
 */
async function checkForSnakeCase(log, files) {
  const errorPaths = [];
  const warningPaths = [];

  files.forEach((file) => {
    const path = file.getRelativePath();

    if (TEMPORARILY_IGNORED_PATHS.includes(path)) {
      warningPaths.push(file.getRelativePath());
      return;
    }

    const ignored = matchesAnyGlob(path, IGNORE_FILE_GLOBS);
    if (ignored) {
      log.debug('[casing] %j ignored', file);
      return;
    }

    const pathToValidate = getPathWithoutIgnoredParents(file);
    const invalid = NON_SNAKE_CASE_RE.test(pathToValidate);
    if (!invalid) {
      log.debug('[casing] %j uses valid casing', file);
    } else {
      const ignoredParent = file.getRelativePath().slice(0, -pathToValidate.length);
      errorPaths.push(`${dim(ignoredParent)}${pathToValidate}`);
    }
  });

  if (warningPaths.length) {
    log.warning(`Filenames SHOULD be snake_case.\n${listPaths(warningPaths)}`);
  }

  if (errorPaths.length) {
    throw createFailError(`Filenames MUST use snake_case.\n${listPaths(errorPaths)}`);
  }
}

export async function checkFileCasing(log, files) {
  files = files.map((f) =>
    matchesAnyGlob(f.getRelativePath(), REMOVE_EXTENSION) ? f.getWithoutExtension() : f
  );

  await checkForKebabCase(log, files);
  await checkForSnakeCase(log, files);
}
