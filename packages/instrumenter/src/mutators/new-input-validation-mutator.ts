import babel from '@babel/core';

import { NodeMutator } from './node-mutator.js';
import { isObjectRelatedToForms, isIthArgumentOfObjectRelatedToForms } from './../util/form-input-helper.js';

const { types } = babel;

function isAValidatorOrAsyncValidator(
  property: babel.types.ObjectMethod | babel.types.ObjectProperty | babel.types.SpreadElement,
): property is babel.types.ObjectProperty {
  return types.isObjectProperty(property) && types.isIdentifier(property.key) && ['validators', 'asyncValidators'].includes(property.key.name);
}

function isNullOrUndefinedOrEmptyArray(node: babel.types.Node | null): boolean {
  return (
    types.isNullLiteral(node) ||
    (types.isIdentifier(node) && node.name === 'undefined') ||
    (types.isArrayExpression(node) && node.elements.length === 0)
  );
}

export const newInputValidationMutator: NodeMutator = {
  name: 'NewInputValidation',

  *mutate(path) {
    if (isObjectRelatedToForms(path)) {
      const replacement = types.cloneNode(path.node);
      const array = types.isArrayExpression(replacement) ? replacement.elements : replacement.arguments;

      // delete third argument if it exists and if it is not null, undefined or an empty array
      if (array.length === 3 && !isNullOrUndefinedOrEmptyArray(array[2])) {
        array.pop();
        yield replacement;
      }

      // handle second argument if it exists and if it is not null, undefined, an empty array or an object
      if (array.length >= 2 && !isNullOrUndefinedOrEmptyArray(array[1]) && !types.isObjectExpression(array[1])) {
        array.length === 3 ? (array[1] = types.arrayExpression()) : array.pop();
        yield replacement;
      }
    }

    // if a second argument exists and it is an Object with at least one property being a validator or an asyncValidator, delete those validators
    if (
      isIthArgumentOfObjectRelatedToForms(path, 1) &&
      path.isObjectExpression() &&
      path.node.properties.some((property) => isAValidatorOrAsyncValidator(property))
    ) {
      const replacement = types.cloneNode(path.node);
      replacement.properties = path.node.properties.filter((property) => !isAValidatorOrAsyncValidator(property));
      yield replacement;
    }
  },
};
