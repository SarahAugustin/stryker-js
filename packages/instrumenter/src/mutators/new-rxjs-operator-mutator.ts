import babel from '@babel/core';

import { NodeMutator } from './node-mutator.js';

const { types } = babel;

export const newRxjsOperatorMutator: NodeMutator = {
  name: 'NewRxjsOperator',

  *mutate(path) {
    // Check if the path points to an RxJS operator
    if (isRxJSOperatorInPipe(path)) {
      // Get all other RxJS operators that were imported and, if one was found, replace it with the previous operator
      const allImportedOperators = getAllImportedRxJSOperators(path).filter((operatorName) => operatorName !== path.node.name);
      if (allImportedOperators.length > 0) {
        yield types.identifier(allImportedOperators[0]);
      }
    }
  },
};

// Check whether the path points to an RxJS operator located within a pipe function
function isRxJSOperatorInPipe(path: babel.NodePath): path is babel.NodePath<babel.types.Identifier> {
  return (
    types.isIdentifier(path.node) &&
    operators.includes(path.node.name) &&
    types.isCallExpression(path.parentPath?.node) &&
    types.isCallExpression(path.parentPath.parentPath?.node) &&
    types.isMemberExpression(path.parentPath.parentPath.node.callee) &&
    types.isIdentifier(path.parentPath.parentPath.node.callee.property) &&
    path.parentPath.parentPath.node.callee.property.name === 'pipe'
  );
}

// Create an array containing all RxJS operators imported into the program
function getAllImportedRxJSOperators(path: babel.NodePath): string[] {
  let programPath: babel.NodePath = path;
  while (!programPath.isProgram() && programPath.parentPath) {
    programPath = programPath.parentPath;
  }
  if (programPath.isProgram()) {
    const allRxJSOperators: string[] = [];
    const importDeclarations = programPath.node.body.filter((element): element is babel.types.ImportDeclaration =>
      types.isImportDeclaration(element),
    );
    for (const importDeclaration of importDeclarations) {
      for (const importSpecifier of importDeclaration.specifiers) {
        if (
          types.isImportSpecifier(importSpecifier) &&
          types.isIdentifier(importSpecifier.imported) &&
          operators.includes(importSpecifier.imported.name)
        ) {
          allRxJSOperators.push(importSpecifier.imported.name);
        }
      }
    }
    return allRxJSOperators;
  }
  return [];
}

// Array including all RxJS operators
const operators: string[] = [
  'audit',
  'auditTime',
  'buffer',
  'bufferCount',
  'bufferTime',
  'bufferToggle',
  'bufferWhen',
  'catchError',
  'combineAll',
  'combineLatestAll',
  'combineLatestWith',
  'concatAll',
  'concatMap',
  'concatMapTo',
  'concatWith',
  'connect',
  'ConnectConfig',
  'count',
  'debounce',
  'debounceTime',
  'defaultIfEmpty',
  'delay',
  'delayWhen',
  'dematerialize',
  'distinct',
  'distinctUntilChanged',
  'distinctUntilKeyChanged',
  'elementAt',
  'endWith',
  'every',
  'exhaust',
  'exhaustAll',
  'exhaustMap',
  'expand',
  'filter',
  'finalize',
  'find',
  'findIndex',
  'first',
  'groupBy',
  'BasicGroupByOptions',
  'GroupByOptionsWithElement',
  'ignoreElements',
  'isEmpty',
  'last',
  'map',
  'mapTo',
  'materialize',
  'max',
  'mergeAll',
  'flatMap',
  'mergeMap',
  'mergeMapTo',
  'mergeScan',
  'mergeWith',
  'min',
  'multicast',
  'observeOn',
  'onErrorResumeNextWith',
  'pairwise',
  'pluck',
  'publish',
  'publishBehavior',
  'publishLast',
  'publishReplay',
  'raceWith',
  'reduce',
  'repeat',
  'RepeatConfig',
  'repeatWhen',
  'retry',
  'RetryConfig',
  'retryWhen',
  'refCount',
  'sample',
  'sampleTime',
  'scan',
  'sequenceEqual',
  'share',
  'ShareConfig',
  'shareReplay',
  'ShareReplayConfig',
  'single',
  'skip',
  'skipLast',
  'skipUntil',
  'skipWhile',
  'startWith',
  'subscribeOn',
  'switchAll',
  'switchMap',
  'switchMapTo',
  'switchScan',
  'take',
  'takeLast',
  'takeUntil',
  'takeWhile',
  'tap',
  'TapObserver',
  'throttle',
  'ThrottleConfig',
  'throttleTime',
  'throwIfEmpty',
  'timeInterval',
  'timeout',
  'TimeoutConfig',
  'TimeoutInfo',
  'timeoutWith',
  'timestamp',
  'toArray',
  'window',
  'windowCount',
  'windowTime',
  'windowToggle',
  'windowWhen',
  'withLatestFrom',
  'zipAll',
  'zipWith',
] as const;
