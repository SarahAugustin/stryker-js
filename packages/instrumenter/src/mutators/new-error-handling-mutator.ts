import babel from '@babel/core';

import { NodeMutator } from './index.js';

const { types } = babel;

export const newErrorHandlingMutator: NodeMutator = {
  name: 'NewErrorHandling',

  *mutate(path) {
    // Delete the error handling of a try-catch-block
    if (path.isTryStatement()) {
      yield types.cloneDeepWithoutLoc(path.node.block);
    }

    // Delete the error handling of a Promise
    else if (
      types.isCallExpression(path.node) &&
      types.isMemberExpression(path.node.callee) &&
      types.isIdentifier(path.node.callee.property) &&
      path.node.callee.property.name === 'catch'
    ) {
      yield types.cloneDeepWithoutLoc(path.node.callee.object);
    }

    // Delete the error handling within a pipe of an RxJS Observable
    else if (
      types.isCallExpression(path.node) &&
      types.isMemberExpression(path.node.callee) &&
      types.isIdentifier(path.node.callee.property) &&
      path.node.callee.property.name === 'pipe' &&
      path.node.arguments.some((argument) => isCallExpressionACatchError(argument))
    ) {
      const replacement = types.cloneDeepWithoutLoc(path.node);
      replacement.arguments = replacement.arguments.filter((argument) => !isCallExpressionACatchError(argument));
      yield replacement;
    }

    // Delete the error handling within the subscribe block of an RxJS Observable
    else if (
      path.isObjectExpression() &&
      path.node.properties.some((objectProperty) => isObjectPropertyAnError(objectProperty)) &&
      isCallExpressionASubscribeCall(path.parentPath)
    ) {
      const replacement = types.cloneDeepWithoutLoc(path.node);
      replacement.properties = replacement.properties.filter((objectProperty) => !isObjectPropertyAnError(objectProperty));
      yield replacement;
    }
  },
};

// Check whether the ObjectProperty is used for error handling
function isObjectPropertyAnError(objectProperty: babel.types.ObjectMethod | babel.types.ObjectProperty | babel.types.SpreadElement): boolean {
  return types.isObjectProperty(objectProperty) && types.isIdentifier(objectProperty.key) && objectProperty.key.name === 'error';
}

// Check whether the CallExpression is used for error handling
function isCallExpressionACatchError(
  argument: babel.types.ArgumentPlaceholder | babel.types.Expression | babel.types.JSXNamespacedName | babel.types.SpreadElement,
): boolean {
  return types.isCallExpression(argument) && types.isIdentifier(argument.callee) && argument.callee.name === 'catchError';
}

// Check whether the CallExpression is a subscribe call
function isCallExpressionASubscribeCall(path: babel.NodePath): boolean {
  return (
    types.isCallExpression(path.node) &&
    types.isMemberExpression(path.node.callee) &&
    types.isIdentifier(path.node.callee.property) &&
    path.node.callee.property.name === 'subscribe'
  );
}
