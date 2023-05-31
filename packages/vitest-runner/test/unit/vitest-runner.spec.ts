import sinon from 'sinon';
import { expect } from 'chai';
import { testInjector } from '@stryker-mutator/test-helpers';
import { TestRunnerCapabilities } from '@stryker-mutator/api/test-runner';
import { Vitest } from 'vitest/node';

import { VitestTestRunner } from '../../src/vitest-test-runner.js';
import { VitestRunnerOptionsWithStrykerOptions } from '../../src/vitest-runner-options-with-stryker-options.js';
import { vitestWrapper } from '../../src/vitest-wrapper.js';
import { createVitestMock } from '../util/factories.js';

describe(VitestTestRunner.name, () => {
  let sut: VitestTestRunner;
  let createVitestStub: sinon.SinonStubbedMember<typeof vitestWrapper.createVitest>;
  let options: VitestRunnerOptionsWithStrykerOptions;
  let vitestStub: sinon.SinonStubbedInstance<Vitest>;

  beforeEach(() => {
    sut = testInjector.injector.provideValue('globalNamespace', '__stryker2__' as const).injectClass(VitestTestRunner);
    createVitestStub = sinon.stub(vitestWrapper, 'createVitest');
    options = testInjector.options as VitestRunnerOptionsWithStrykerOptions;
    options.vitest = {};
    vitestStub = createVitestMock();
    createVitestStub.resolves(vitestStub);
  });

  it('should not have reload capabilities', () => {
    // The files under test are cached between runs
    const expectedCapabilities: TestRunnerCapabilities = { reloadEnvironment: true };
    expect(sut.capabilities()).deep.eq(expectedCapabilities);
  });

  describe('browser mode', () => {
    it('should throw a not supported error', async () => {
      vitestStub.config.browser.enabled = true;
      await expect(sut.init()).rejectedWith(
        'Browser mode is currently not supported by the `@stryker-mutator/vitest-runner`. Please disable `browser.enabled` in your `vitest.config.js`.'
      );
    });
  });
});