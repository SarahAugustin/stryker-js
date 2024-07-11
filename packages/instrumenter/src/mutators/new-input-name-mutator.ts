import babel from '@babel/core';

import { isObjectRelatedToForms } from '../util/form-input-helper.js';

import { NodeMutator } from './node-mutator.js';

const { types } = babel;

export const newInputNameMutator: NodeMutator = {
  name: 'NewInputName',

  *mutate(path) {
    // Checks if the path points to a control's name and if so add the postfix '_mutated' to the name
    if (isNameOfControlSavedAsVariable(path) || isNameOfControlSavedAsObjectProperty(path)) {
      if (types.isIdentifier(path.node)) yield types.identifier(path.node.name.concat('_mutated'));
      if (types.isNumericLiteral(path.node)) yield types.numericLiteral(path.node.value + 1000);
    }
  },
};

// Check if this is the name of a form control saved in a variable
function isNameOfControlSavedAsVariable(path: babel.NodePath): path is babel.NodePath {
  const pathToControl = path.parentPath?.get('init') ?? [];
  return (
    (types.isIdentifier(path.node) || types.isNumericLiteral(path.node)) &&
    types.isVariableDeclarator(path.parentPath?.node) &&
    !Array.isArray(pathToControl) &&
    isObjectRelatedToForms(pathToControl)
  );
}

// Check if this is the name of a form control saved as an object property
function isNameOfControlSavedAsObjectProperty(path: babel.NodePath): path is babel.NodePath {
  const pathToControl = path.parentPath?.get('value') ?? [];
  return (
    (types.isIdentifier(path.node) || types.isNumericLiteral(path.node)) &&
    types.isObjectProperty(path.parentPath?.node) &&
    !Array.isArray(pathToControl) &&
    isObjectRelatedToForms(pathToControl)
  );
}
