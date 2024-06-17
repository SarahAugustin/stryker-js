import { arithmeticOperatorMutator } from './arithmetic-operator-mutator.js';
import { NodeMutator } from './node-mutator.js';
import { blockStatementMutator } from './block-statement-mutator.js';
import { conditionalExpressionMutator } from './conditional-expression-mutator.js';
import { stringLiteralMutator } from './string-literal-mutator.js';
import { arrayDeclarationMutator } from './array-declaration-mutator.js';
import { arrowFunctionMutator } from './arrow-function-mutator.js';
import { booleanLiteralMutator } from './boolean-literal-mutator.js';
import { equalityOperatorMutator } from './equality-operator-mutator.js';
import { methodExpressionMutator } from './method-expression-mutator.js';
import { logicalOperatorMutator } from './logical-operator-mutator.js';
import { objectLiteralMutator } from './object-literal-mutator.js';
import { unaryOperatorMutator } from './unary-operator-mutator.js';
import { updateOperatorMutator } from './update-operator-mutator.js';
import { regexMutator } from './regex-mutator.js';
import { optionalChainingMutator } from './optional-chaining-mutator.js';
import { assignmentOperatorMutator } from './assignment-operator-mutator.js';
import { newInputValidationMutator } from './new-input-validation-mutator.js';
import { newComparisonOperatorMutator } from './new-comparison-operator-mutator.js';
import { newErrorHandlingMutator } from './new-error-handling-mutator.js';
import { newSubscribeCallMutator } from './new-subscribe-call-mutator.js';
import { newRxjsOperatorMutator } from './new-rxjs-operator-mutator.js';
import { newInputDefaultValueMutator } from './new-input-default-value-mutator.js';
import { newInputNameMutator } from './new-input-name-mutator.js';
import { newUnsubscribeCallMutator } from './new-unsubscribe-call-mutator.js';

export const allMutators: NodeMutator[] = [
  arithmeticOperatorMutator,
  arrayDeclarationMutator,
  arrowFunctionMutator,
  blockStatementMutator,
  booleanLiteralMutator,
  conditionalExpressionMutator,
  equalityOperatorMutator,
  logicalOperatorMutator,
  methodExpressionMutator,
  objectLiteralMutator,
  stringLiteralMutator,
  unaryOperatorMutator,
  updateOperatorMutator,
  regexMutator,
  optionalChainingMutator,
  assignmentOperatorMutator,
  newInputValidationMutator,
  newComparisonOperatorMutator,
  newErrorHandlingMutator,
  newSubscribeCallMutator,
  newRxjsOperatorMutator,
  newInputDefaultValueMutator,
  newInputNameMutator,
  newUnsubscribeCallMutator,
];
