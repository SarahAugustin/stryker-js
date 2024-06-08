import babel from '@babel/core';

import { NodeMutator } from './node-mutator.js';

const { types } = babel;

const operators = {
  '===': '==',
  '==': '===',
  '!=': '!==',
  '!==': '!=',
} as const;

// Check if the operator is one of the comparison operators listed above
function isComparisonOperator(operator: string): operator is keyof typeof operators {
  return Object.keys(operators).includes(operator);
}

export const newComparisonOperatorMutator: NodeMutator = {
  name: 'NewComparisonOperator',

  *mutate(path) {
    // Replace the operator if it is one of the comparison operators
    if (path.isBinaryExpression() && isComparisonOperator(path.node.operator)) {
      const replacement = types.cloneNode(path.node, true);
      replacement.operator = operators[path.node.operator];
      yield replacement;
    }
  },
};
