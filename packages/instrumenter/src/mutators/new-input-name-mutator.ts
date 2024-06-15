import babel from '@babel/core';

import { isObjectRelatedToForms } from '../util/form-input-helper.js';

import { NodeMutator } from './node-mutator.js';

const { types, traverse } = babel;

export const newInputNameMutator: NodeMutator = {
  name: 'NewInputName',

  *mutate(path) {
    if (types.isExportNamedDeclaration(path.node) && types.isProgram(path.parentPath?.node)) {
      const allInputNamesWithTheirLocations = new Map<string, Array<babel.NodePath<babel.types.Identifier>>>();
      // Traverse the AST to find all input names
      traverse(path.parentPath.node, {
        Identifier(currentpath) {
          if (isControlName(currentpath)) {
            allInputNamesWithTheirLocations.set(currentpath.node.name, []);
          }
        },
      });
      // Traverse the AST a second time to find for all input names all occurrences
      traverse(path.parentPath.node, {
        Identifier(currentpath) {
          if (types.isIdentifier(currentpath.node) && allInputNamesWithTheirLocations.has(currentpath.node.name)) {
            const arrayOfLocations = allInputNamesWithTheirLocations.get(currentpath.node.name);
            arrayOfLocations?.push(currentpath);
            allInputNamesWithTheirLocations.set(currentpath.node.name, arrayOfLocations!);
          }
        },
      });
      const postfix = '_mutated';
      // Iterate over all input names and append '_mutated' at their end
      for (const [, inputNameLocations] of allInputNamesWithTheirLocations) {
        for (const inputNameLocation of inputNameLocations) {
          inputNameLocation.node.name = inputNameLocation.node.name.concat(postfix);
        }
        yield types.cloneNode(path.node);
        for (const inputNameLocation of inputNameLocations) {
          inputNameLocation.node.name = inputNameLocation.node.name.slice(0, -postfix.length);
        }
      }
    }
  },
};

// Checks if the path points to a control's name
function isControlName(path: babel.NodePath): boolean {
  return isNameOfControlSavedAsVariable(path) || isNameOfControlSavedAsObjectProperty(path) || isNameOfControlSavedInClassVariable(path);
}

// Check if this is the name of a form control saved in a variable
function isNameOfControlSavedAsVariable(path: babel.NodePath): path is babel.NodePath<babel.types.Identifier> {
  const pathToControl = path.parentPath?.get('init') ?? [];
  return (
    types.isIdentifier(path.node) &&
    types.isVariableDeclarator(path.parentPath?.node) &&
    !Array.isArray(pathToControl) &&
    isObjectRelatedToForms(pathToControl)
  );
}

// Check if this is the name of a form control saved in a class variable
function isNameOfControlSavedInClassVariable(path: babel.NodePath): path is babel.NodePath<babel.types.Identifier> {
  const pathToControl = path.parentPath?.parentPath?.get('right') ?? [];
  return (
    types.isIdentifier(path.node) &&
    types.isMemberExpression(path.parentPath?.node) &&
    types.isAssignmentExpression(path.parentPath?.parentPath?.node) &&
    path.parentPath?.parentPath?.node.left === path.parentPath?.node &&
    !Array.isArray(pathToControl) &&
    isObjectRelatedToForms(pathToControl)
  );
}

// Check if this is the name of a form control saved as an object property
function isNameOfControlSavedAsObjectProperty(path: babel.NodePath): path is babel.NodePath<babel.types.Identifier> {
  const pathToControl = path.parentPath?.get('value') ?? [];
  return (
    types.isIdentifier(path.node) &&
    types.isObjectProperty(path.parentPath?.node) &&
    !Array.isArray(pathToControl) &&
    isObjectRelatedToForms(pathToControl)
  );
}
