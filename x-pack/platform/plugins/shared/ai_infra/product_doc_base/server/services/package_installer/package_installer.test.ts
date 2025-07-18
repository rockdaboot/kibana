/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  downloadToDiskMock,
  createIndexMock,
  populateIndexMock,
  loadMappingFileMock,
  loadManifestFileMock,
  openZipArchiveMock,
  validateArtifactArchiveMock,
  fetchArtifactVersionsMock,
  ensureDefaultElserDeployedMock,
} from './package_installer.test.mocks';
import { cloneDeep } from 'lodash';
import {
  getArtifactName,
  getProductDocIndexName,
  DocumentationProduct,
  ProductName,
} from '@kbn/product-doc-common';
import { elasticsearchServiceMock } from '@kbn/core/server/mocks';
import { loggerMock, type MockedLogger } from '@kbn/logging-mocks';
import { installClientMock } from '../doc_install_status/service.mock';
import type { ProductInstallState } from '../../../common/install_status';
import { PackageInstaller } from './package_installer';
import { defaultInferenceEndpoints } from '@kbn/inference-common';
import { InferenceTaskType } from '@elastic/elasticsearch/lib/api/types';

const artifactsFolder = '/lost';
const artifactRepositoryUrl = 'https://repository.com';
const kibanaVersion = '8.16.3';

const callOrder = (fn: { mock: { invocationCallOrder: number[] } }): number => {
  return fn.mock.invocationCallOrder[0];
};

const TEST_FORMAT_VERSION = '2.0.0';

describe('PackageInstaller', () => {
  let logger: MockedLogger;
  let esClient: ReturnType<typeof elasticsearchServiceMock.createElasticsearchClient>;
  let productDocClient: ReturnType<typeof installClientMock.create>;

  let packageInstaller: PackageInstaller;

  beforeEach(() => {
    logger = loggerMock.create();
    esClient = elasticsearchServiceMock.createElasticsearchClient();
    productDocClient = installClientMock.create();
    packageInstaller = new PackageInstaller({
      artifactsFolder,
      logger,
      esClient,
      productDocClient,
      artifactRepositoryUrl,
      kibanaVersion,
    });

    loadManifestFileMock.mockResolvedValue({
      formatVersion: TEST_FORMAT_VERSION,
      productName: 'kibana',
      productVersion: '8.17',
    });
  });

  afterEach(() => {
    downloadToDiskMock.mockReset();
    createIndexMock.mockReset();
    populateIndexMock.mockReset();
    loadMappingFileMock.mockReset();
    loadManifestFileMock.mockReset();
    openZipArchiveMock.mockReset();
    validateArtifactArchiveMock.mockReset();
    fetchArtifactVersionsMock.mockReset();
    ensureDefaultElserDeployedMock.mockReset();
  });

  describe('installPackage', () => {
    it('calls the steps with the right parameters', async () => {
      const zipArchive = {
        close: jest.fn(),
      };
      openZipArchiveMock.mockResolvedValue(zipArchive);

      const mappings = {
        properties: {
          semantic: {
            inference_id: '.elser',
            type: 'semantic_text',
            model_settings: {},
          },
        },
      };
      loadMappingFileMock.mockResolvedValue(mappings);

      await packageInstaller.installPackage({ productName: 'kibana', productVersion: '8.16' });

      const artifactName = getArtifactName({
        productName: 'kibana',
        productVersion: '8.16',
      });
      const indexName = getProductDocIndexName('kibana');
      expect(ensureDefaultElserDeployedMock).toHaveBeenCalledTimes(1);

      expect(downloadToDiskMock).toHaveBeenCalledTimes(1);
      expect(downloadToDiskMock).toHaveBeenCalledWith(
        `${artifactRepositoryUrl}/${artifactName}`,
        `${artifactsFolder}/${artifactName}`
      );

      expect(openZipArchiveMock).toHaveBeenCalledTimes(1);
      expect(openZipArchiveMock).toHaveBeenCalledWith(`${artifactsFolder}/${artifactName}`);

      expect(loadMappingFileMock).toHaveBeenCalledTimes(1);
      expect(loadMappingFileMock).toHaveBeenCalledWith(zipArchive);

      expect(loadManifestFileMock).toHaveBeenCalledTimes(1);
      expect(loadManifestFileMock).toHaveBeenCalledWith(zipArchive);

      expect(createIndexMock).toHaveBeenCalledTimes(1);
      const modifiedMappings = cloneDeep(mappings);
      modifiedMappings.properties.semantic.inference_id = defaultInferenceEndpoints.ELSER;
      expect(createIndexMock).toHaveBeenCalledWith({
        indexName,
        mappings: modifiedMappings,
        manifestVersion: TEST_FORMAT_VERSION,
        esClient,
        log: logger,
      });

      expect(populateIndexMock).toHaveBeenCalledTimes(1);
      expect(populateIndexMock).toHaveBeenCalledWith({
        indexName,
        archive: zipArchive,
        manifestVersion: TEST_FORMAT_VERSION,
        inferenceId: defaultInferenceEndpoints.ELSER,
        esClient,
        log: logger,
      });

      expect(productDocClient.setInstallationSuccessful).toHaveBeenCalledTimes(1);
      expect(productDocClient.setInstallationSuccessful).toHaveBeenCalledWith(
        'kibana',
        indexName,
        defaultInferenceEndpoints.ELSER
      );

      expect(zipArchive.close).toHaveBeenCalledTimes(1);

      expect(productDocClient.setInstallationFailed).not.toHaveBeenCalled();
    });

    it('executes the steps in the right order', async () => {
      await packageInstaller.installPackage({ productName: 'kibana', productVersion: '8.16' });

      expect(callOrder(ensureDefaultElserDeployedMock)).toBeLessThan(callOrder(downloadToDiskMock));
      expect(callOrder(downloadToDiskMock)).toBeLessThan(callOrder(openZipArchiveMock));
      expect(callOrder(openZipArchiveMock)).toBeLessThan(callOrder(loadMappingFileMock));
      expect(callOrder(loadMappingFileMock)).toBeLessThan(callOrder(createIndexMock));
      expect(callOrder(loadManifestFileMock)).toBeLessThan(callOrder(createIndexMock));
      expect(callOrder(createIndexMock)).toBeLessThan(callOrder(populateIndexMock));
      expect(callOrder(populateIndexMock)).toBeLessThan(
        callOrder(productDocClient.setInstallationSuccessful)
      );
    });

    it('closes the archive and calls setInstallationFailed if the installation fails', async () => {
      const zipArchive = {
        close: jest.fn(),
      };
      openZipArchiveMock.mockResolvedValue(zipArchive);

      populateIndexMock.mockImplementation(async () => {
        throw new Error('something bad');
      });

      await expect(
        packageInstaller.installPackage({
          productName: 'kibana',
          productVersion: '8.16',
          customInference: {
            inference_id: defaultInferenceEndpoints.ELSER,
            task_type: 'text_embedding' as InferenceTaskType,
            service: 'elser',
            service_settings: {},
          },
        })
      ).rejects.toThrowError();

      expect(productDocClient.setInstallationSuccessful).not.toHaveBeenCalled();

      expect(zipArchive.close).toHaveBeenCalledTimes(1);

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error during documentation installation')
      );

      expect(productDocClient.setInstallationFailed).toHaveBeenCalledTimes(1);
      expect(productDocClient.setInstallationFailed).toHaveBeenCalledWith(
        'kibana',
        'something bad',
        defaultInferenceEndpoints.ELSER
      );
    });
  });

  describe('installALl', () => {
    it('installs all the packages to their latest version', async () => {
      jest.spyOn(packageInstaller, 'installPackage');

      fetchArtifactVersionsMock.mockResolvedValue({
        kibana: ['8.15', '8.16'],
        elasticsearch: ['8.15'],
      });

      await packageInstaller.installAll({ inferenceId: defaultInferenceEndpoints.ELSER });

      expect(packageInstaller.installPackage).toHaveBeenCalledTimes(2);

      expect(packageInstaller.installPackage).toHaveBeenCalledWith({
        productName: 'kibana',
        productVersion: '8.16',
      });
      expect(packageInstaller.installPackage).toHaveBeenCalledWith({
        productName: 'elasticsearch',
        productVersion: '8.15',
      });
    });
  });

  describe('ensureUpToDate', () => {
    it('updates the installed packages to the latest version', async () => {
      fetchArtifactVersionsMock.mockResolvedValue({
        kibana: ['8.15', '8.16'],
        security: ['8.15', '8.16'],
        elasticsearch: ['8.15'],
      });

      productDocClient.getInstallationStatus.mockResolvedValue({
        kibana: { status: 'installed', version: '8.15' },
        security: { status: 'installed', version: '8.16' },
        elasticsearch: { status: 'uninstalled' },
      } as Record<ProductName, ProductInstallState>);

      jest.spyOn(packageInstaller, 'installPackage');

      await packageInstaller.ensureUpToDate({ inferenceId: defaultInferenceEndpoints.ELSER });

      expect(packageInstaller.installPackage).toHaveBeenCalledTimes(1);
      expect(packageInstaller.installPackage).toHaveBeenCalledWith({
        productName: 'kibana',
        productVersion: '8.16',
      });
    });
  });

  describe('uninstallPackage', () => {
    it('performs the uninstall steps', async () => {
      await packageInstaller.uninstallPackage({ productName: 'kibana' });

      expect(esClient.indices.delete).toHaveBeenCalledTimes(1);
      expect(esClient.indices.delete).toHaveBeenCalledWith(
        {
          index: getProductDocIndexName('kibana'),
        },
        expect.objectContaining({ ignore: [404] })
      );

      expect(productDocClient.setUninstalled).toHaveBeenCalledTimes(1);
      expect(productDocClient.setUninstalled).toHaveBeenCalledWith('kibana', undefined);
    });
  });

  describe('uninstallAll', () => {
    it('calls uninstall for all packages', async () => {
      jest.spyOn(packageInstaller, 'uninstallPackage');

      await packageInstaller.uninstallAll();

      expect(packageInstaller.uninstallPackage).toHaveBeenCalledTimes(
        Object.keys(DocumentationProduct).length
      );
      Object.values(DocumentationProduct).forEach((productName) => {
        expect(packageInstaller.uninstallPackage).toHaveBeenCalledWith({ productName });
      });
    });
  });
});
