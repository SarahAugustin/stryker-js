import babel from '@babel/core';

import { NodeMutator } from './node-mutator.js';
import { isObjectRelatedToForms, isIthArgumentOfObjectRelatedToForms } from './../util/form-input-helper.js';

const { types } = babel;

export const newInputValidationMutator: NodeMutator = {
  name: 'NewInputValidation',

  *mutate(path) {
    if (isObjectRelatedToForms(path)) {
      const array = types.isArrayExpression(path.node) ? path.node.elements : path.node.arguments;

      // Delete the third argument if it exists and if it is not null, undefined, or an empty array
      if (array.length === 3 && !isNullOrUndefinedOrEmptyArray(array[2])) {
        const replacement = types.cloneNode(path.node);
        types.isArrayExpression(replacement) ? replacement.elements.pop() : replacement.arguments.pop();
        yield replacement;
      }

      // Delete the second argument if exactly two arguments exist in total and if it is not null, undefined, an empty array, or an object
      if (array.length === 2 && !isNullOrUndefinedOrEmptyArray(array[1]) && !types.isObjectExpression(array[1])) {
        const replacement = types.cloneNode(path.node);
        types.isArrayExpression(replacement) ? replacement.elements.pop() : replacement.arguments.pop();
        yield replacement;
      }
    }

    // Replace the second argument with an empty array if exactly three arguments exist in total and if the second one is not null, undefined, an empty array, or an object
    if (
      isIthArgumentOfObjectRelatedToForms(path, 1) &&
      !path.isObjectExpression() &&
      !isNullOrUndefinedOrEmptyArray(path.node) &&
      path.parentPath &&
      isObjectRelatedToForms(path.parentPath)
    ) {
      const array = types.isArrayExpression(path.parentPath.node) ? path.parentPath.node.elements : path.parentPath.node.arguments;
      if (array.length === 3) yield types.arrayExpression();
    }

    // If a second argument exists and it is an object, iterate over its properties and delete them if they are a validator or asyncValidator
    if (isIthArgumentOfObjectRelatedToForms(path, 1) && path.isObjectExpression()) {
      for (const [index, property] of path.node.properties.entries()) {
        if (isAValidatorOrAsyncValidator(property)) {
          const replacement = types.cloneNode(path.node);
          replacement.properties.splice(index, 1);
          yield replacement;
        }
      }
    }
  },
};

// Check whether the property includes synchronous or asyncronous validators
function isAValidatorOrAsyncValidator(
  property: babel.types.ObjectMethod | babel.types.ObjectProperty | babel.types.SpreadElement,
): property is babel.types.ObjectProperty {
  return types.isObjectProperty(property) && types.isIdentifier(property.key) && ['validators', 'asyncValidators'].includes(property.key.name);
}

// Check whether the node corresponds to null, undefined, or an empty array
function isNullOrUndefinedOrEmptyArray(node: babel.types.Node | null): boolean {
  return (
    types.isNullLiteral(node) ||
    (types.isIdentifier(node) && node.name === 'undefined') ||
    (types.isArrayExpression(node) && node.elements.length === 0)
  );
}
