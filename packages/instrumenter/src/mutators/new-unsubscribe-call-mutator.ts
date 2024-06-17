import babel from '@babel/core';

import { NodeMutator } from './index.js';

const { types } = babel;

export const newUnsubscribeCallMutator: NodeMutator = {
  name: 'NewUnsubscribeCall',

  *mutate(path) {
    // Delete the unsubscribe call
    if (
      types.isCallExpression(path.node) &&
      types.isMemberExpression(path.node.callee) &&
      types.isIdentifier(path.node.callee.property) &&
      path.node.callee.property.name === 'unsubscribe'
    ) {
      yield path.node.callee.object;
    }
    // Delete the first, take, takeUntil, takeWhile, and takeUntilDestroyed operators from a pipe of an Observable
    else if (
      types.isCallExpression(path.node) &&
      types.isMemberExpression(path.node.callee) &&
      types.isIdentifier(path.node.callee.property) &&
      path.node.callee.property.name === 'pipe'
    ) {
      for (const [index, operator] of path.node.arguments.entries()) {
        if (isRxJSOperator(operator)) {
          const replacement = types.cloneNode(path.node);
          replacement.arguments.splice(index, 1);
          yield replacement;
        }
      }
    }
  },
};

// Check whether this is one of the RxJS operators first, take, takeUntil, takeWhile, and takeUntilDestroyed
function isRxJSOperator(node: babel.types.Node): node is babel.types.CallExpression {
  return (
    types.isCallExpression(node) &&
    types.isIdentifier(node.callee) &&
    ['first', 'take', 'takeUntil', 'takeWhile', 'takeUntilDestroyed'].includes(node.callee.name)
  );
}
