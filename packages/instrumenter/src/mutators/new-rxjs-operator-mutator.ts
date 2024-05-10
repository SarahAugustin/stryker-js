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

export const newRxjsOperatorMutator: NodeMutator = {
  name: 'NewRxjsOperator',

  *mutate(path) {
    if (types.isProgram(path.node)) {
      const importDeclarations = path.node.body.filter((element): element is babel.types.ImportDeclaration => types.isImportDeclaration(element));
      for (const importDeclaration of importDeclarations) {
        const importSpecifiers = importDeclaration.specifiers.filter(
          (importSpecifier): importSpecifier is babel.types.ImportSpecifier =>
            types.isImportSpecifier(importSpecifier) && types.isIdentifier(importSpecifier.imported) && isRxJSOperator(importSpecifier.imported.name),
        );
        for (const importSpecifier of importSpecifiers) {
          const oldOperator = types.isIdentifier(importSpecifier.imported) ? importSpecifier.imported.name : '';
          const newOperator = operators[oldOperator];
          const operatorLocations: babel.NodePath[] = new Array<babel.NodePath>();
          traverse(path.node, {
            Identifier(currentpath) {
              if (currentpath.isIdentifier() && currentpath.node.name === oldOperator && !currentpath.parentPath.isImportSpecifier()) {
                operatorLocations.push(currentpath);
              }
            },
          });
          for (const operatorLocation of operatorLocations) {
            const importWasMutated = applyMutation(newOperator, operatorLocation, importDeclaration);
            yield types.cloneDeepWithoutLoc(path.node);
            removeMutation(oldOperator, operatorLocation, importWasMutated, importDeclaration);
          }
        }
      }
    }
  },
};

function isRxJSOperator(operator: string): operator is keyof typeof operators {
  return Object.keys(operators).includes(operator);
}

function applyMutation(newOperator: string, operatorLocation: babel.NodePath, importDeclarationNode: babel.types.ImportDeclaration): boolean {
  // mutate operator in the code
  operatorLocation.replaceWith(types.identifier(newOperator));
  // mutate import statement if it does not include the new operator yet
  const importNeedsToBeMutated = !importDeclarationNode.specifiers.some(
    (specifier) => types.isImportSpecifier(specifier) && types.isIdentifier(specifier.imported) && specifier.imported.name === newOperator,
  );
  if (importNeedsToBeMutated) {
    importDeclarationNode.specifiers.push(types.importSpecifier(types.identifier(newOperator), types.identifier(newOperator)));
  }
  return importNeedsToBeMutated;
}

function removeMutation(
  oldOperator: string,
  operatorLocation: babel.NodePath,
  importWasMutated: boolean,
  importDeclarationNode: babel.types.ImportDeclaration,
) {
  // undo mutation of the operator in the code
  operatorLocation.replaceWith(types.identifier(oldOperator));
  // undo mutation of the import statement if one was performed
  if (importWasMutated) {
    importDeclarationNode.specifiers.pop();
  }
}
