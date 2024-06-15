import babel from '@babel/core';

import { NodeMutator } from './node-mutator.js';

const { types, traverse } = babel;

const operators: Record<string, string> = {
  catchError: 'retry',
  concatMap: 'exhaustMap',
  debounceTime: 'auditTime',
  distinctUntilChanged: 'filter',
  exhaustMap: 'concatMap',
  filter: 'distinctUntilChanged',
  map: 'tap',
  mergeMap: 'switchMap',
  reduce: 'scan',
  retry: 'catchError',
  scan: 'reduce',
  share: 'shareReplay',
  shareReplay: 'share',
  startWith: 'withLatestFrom',
  switchMap: 'mergeMap',
  tap: 'map',
  withLatestFrom: 'startWith',
} as const;

// Check whether the operator is one of the RsJS operators listed above
function isRxJSOperator(operator: string): operator is keyof typeof operators {
  return Object.keys(operators).includes(operator);
}

export const newRxjsOperatorMutator: NodeMutator = {
  name: 'NewRxjsOperator',

  *mutate(path) {
    // Handle the case that the new operator is already imported
    if (isRxJSOperatorInPipe(path)) {
      const oldOperator = path.node.name;
      const newOperator = operators[oldOperator];
      let programPath: babel.NodePath = path;
      while (!programPath.isProgram() && programPath.parentPath) {
        programPath = programPath.parentPath;
      }
      if (programPath.isProgram() && getAllImportedRxJSOperators(programPath).includes(newOperator)) {
        yield types.identifier(newOperator);
      }
    }

    // Handle the case that the new operator is not yet imported (then both the import and the usage of the operator have to be mutated)
    else if (path.isProgram()) {
      const allRxJSOperatorsImported = getAllImportedRxJSOperators(path);
      const importDeclarations = path.node.body.filter((element): element is babel.types.ImportDeclaration => types.isImportDeclaration(element));
      // Iterate over all import declarations
      for (const importDeclaration of importDeclarations) {
        const importSpecifiers = importDeclaration.specifiers.filter(
          (importSpecifier): importSpecifier is babel.types.ImportSpecifier =>
            types.isImportSpecifier(importSpecifier) && types.isIdentifier(importSpecifier.imported) && isRxJSOperator(importSpecifier.imported.name),
        );
        // Iterate over all RxJS operators that were imported
        for (const importSpecifier of importSpecifiers) {
          const oldOperator = types.isIdentifier(importSpecifier.imported) ? importSpecifier.imported.name : '';
          const newOperator = operators[oldOperator];
          // Continue only if the newOperator is not imported yet because otherwise the other case above already handles this operator
          if (!allRxJSOperatorsImported.includes(newOperator)) {
            const operatorLocations: babel.NodePath[] = new Array<babel.NodePath>();
            traverse(path.node, {
              Identifier(currentpath) {
                if (currentpath.isIdentifier() && currentpath.node.name === oldOperator && !currentpath.parentPath.isImportSpecifier()) {
                  operatorLocations.push(currentpath);
                }
              },
            });
            // Mutate the import statement and the locations at which the RxJS operator is used
            importDeclaration.specifiers.push(types.importSpecifier(types.identifier(newOperator), types.identifier(newOperator)));
            for (const operatorLocation of operatorLocations) {
              operatorLocation.replaceWith(types.identifier(newOperator));
              yield path.node;
              operatorLocation.replaceWith(types.identifier(oldOperator));
            }
            importDeclaration.specifiers.pop();
          }
        }
      }
    }
  },
};

// Create an array containing all RxJS operators imported into the program
function getAllImportedRxJSOperators(path: babel.NodePath<babel.types.Program>): string[] {
  const allRxJSOperators: string[] = [];
  const importDeclarations = path.node.body.filter((element): element is babel.types.ImportDeclaration => types.isImportDeclaration(element));
  for (const importDeclaration of importDeclarations) {
    for (const importSpecifier of importDeclaration.specifiers) {
      if (types.isImportSpecifier(importSpecifier) && types.isIdentifier(importSpecifier.imported) && isRxJSOperator(importSpecifier.imported.name)) {
        allRxJSOperators.push(importSpecifier.imported.name);
      }
    }
  }
  return allRxJSOperators;
}

// Check whether the path points to an RxJS operator located within a pipe function
function isRxJSOperatorInPipe(path: babel.NodePath): path is babel.NodePath<babel.types.Identifier> {
  return (
    types.isIdentifier(path.node) &&
    isRxJSOperator(path.node.name) &&
    types.isCallExpression(path.parentPath?.node) &&
    types.isCallExpression(path.parentPath.parentPath?.node) &&
    types.isMemberExpression(path.parentPath.parentPath.node.callee) &&
    types.isIdentifier(path.parentPath.parentPath.node.callee.property) &&
    path.parentPath.parentPath.node.callee.property.name === 'pipe'
  );
}
