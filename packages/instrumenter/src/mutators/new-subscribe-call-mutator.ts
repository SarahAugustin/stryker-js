import babel from '@babel/core';

import { NodeMutator } from './index.js';

const { types } = babel;

export const newSubscribeCallMutator: NodeMutator = {
  name: 'NewSubscribeCall',

  *mutate(path) {
    if (
      path.isCallExpression() &&
      types.isMemberExpression(path.node.callee) &&
      types.isIdentifier(path.node.callee.property) &&
      path.node.callee.property.name === 'subscribe'
    ) {
      // Delete the subscribe call of an Observable
      yield types.cloneDeepWithoutLoc(path.node.callee.object);
    }
  },
};
