import babel from '@babel/core';

import { NodeMutator } from './node-mutator.js';
import { isAFormControlOrFormGroupOrFormArray, isAFormBuilder, isAFormControlDefinedByAFormBuilder } from './../util/form-input-helper.js';

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
    



    if (isAFormControlOrFormGroupOrFormArray(path) || isAFormBuilder(path) || isAFormControlDefinedByAFormBuilder(path)) {
      const replacement = types.cloneNode(path.node);
      const argumentsToBeMutated = types.isArrayExpression(replacement) ? replacement.elements : replacement.arguments;
      let isChanged = false;

      // if a third argument exists, remove it. If it was neither an empty array nor an empty object, set isChanged to true, because a proper change was made.
      if (argumentsToBeMutated.length === 3) {
        if (!isNullOrUndefinedOrEmptyArray(argumentsToBeMutated[2])) isChanged = true;
        argumentsToBeMutated.pop();
      }

      // if a second argument exists and it is an Object with at least one property being a validator or an asyncValidator, delete those validators
      if (
        argumentsToBeMutated.length === 2 &&
        types.isObjectExpression(argumentsToBeMutated[1]) &&
        argumentsToBeMutated[1].properties.some((property) => isAValidatorOrAsyncValidator(property))
      ) {
        argumentsToBeMutated[1].properties = argumentsToBeMutated[1].properties.filter((property) => !isAValidatorOrAsyncValidator(property));
        if (argumentsToBeMutated[1].properties.length === 0) argumentsToBeMutated.pop();
        isChanged = true;
      }

      // if a second argument exists and it is netiher an object nor an empty array, null or undefined, remove it
      else if (
        argumentsToBeMutated.length === 2 &&
        !types.isObjectExpression(argumentsToBeMutated[1]) &&
        !isNullOrUndefinedOrEmptyArray(argumentsToBeMutated[1])
      ) {
        argumentsToBeMutated.pop();
        isChanged = true;
      }

      // if a change was made return the mutated node
      if (isChanged) yield replacement;
    }
  },
};
