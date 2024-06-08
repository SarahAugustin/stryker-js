import babel from '@babel/core';

import { NodeMutator } from './node-mutator.js';
import { isIthArgumentOfObjectRelatedToForms } from './../util/form-input-helper.js';

const { types } = babel;

export const newInputDefaultValueMutator: NodeMutator = {
  name: 'NewInputDefaultValue',

  *mutate(path) {
    if (path.isStringLiteral() && isDefaultValue(path)) {
      const replacement = types.cloneDeepWithoutLoc(path.node);
      // If the default value is an empty string, replace it with 'mutated string'
      if (replacement.value === '') {
        replacement.value = 'mutated string';
      }
      // If the default value is a non-empty string, replace it with an empty string
      else {
        replacement.value = '';
      }
      yield replacement;
    }

    // If the default value is a number, increase it by one
    else if (path.isNumericLiteral() && isDefaultValue(path)) {
      const replacement = types.cloneDeepWithoutLoc(path.node);
      replacement.value++;
      yield replacement;
    }

    // If the default value is a boolean, invert it
    else if (path.isBooleanLiteral() && isDefaultValue(path)) {
      const replacement = types.cloneDeepWithoutLoc(path.node);
      replacement.value = !replacement.value;
      yield replacement;
    }
  },
};

function isDefaultValue(path: babel.NodePath) {
  return isIthArgumentOfObjectRelatedToForms(path, 0, true) || isDefaultValueSetInAControlStateObject(path);
}

function isDefaultValueSetInAControlStateObject(path: babel.NodePath): boolean {
  return (
    !!path.parentPath &&
    path.parentPath.isObjectProperty() &&
    path.parentPath.node.value === path.node &&
    types.isIdentifier(path.parentPath.node.key) &&
    path.parentPath.node.key.name === 'value' &&
    path.parentPath.parentPath.isObjectExpression() &&
    isIthArgumentOfObjectRelatedToForms(path.parentPath.parentPath, 0, true)
  );
}
