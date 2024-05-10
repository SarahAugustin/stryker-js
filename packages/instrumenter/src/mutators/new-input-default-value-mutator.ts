import babel from '@babel/core';

import { NodeMutator } from './node-mutator.js';
import { isAFormControlOrFormGroupOrFormArray, isAFormBuilder, isAFormControlDefinedByAFormBuilder } from './../util/form-input-helper.js';

const { types } = babel;

export const newInputDefaultValueMutator: NodeMutator = {
  name: 'NewInputDefaultValue',

  *mutate(path) {
    if (
      isAFormControlOrFormGroupOrFormArray(path, ['FormControl', 'UntypedFormControl']) ||
      isAFormBuilder(path, ['control']) ||
      isAFormControlDefinedByAFormBuilder(path)
    ) {
      const replacement = types.cloneNode(path.node);
      const valueOrFormControlState = types.isArrayExpression(replacement) ? replacement.elements[0] : replacement.arguments[0];
      if (valueOrFormControlState && !types.isObjectExpression(valueOrFormControlState)) {
        // mutate default value if it is set directly
        if (mutateDefaultValue(valueOrFormControlState)) yield replacement;
      } else if (types.isObjectExpression(valueOrFormControlState)) {
        // mutate default value if it is set within a FormControlState
        const objectProperty = valueOrFormControlState.properties.find(
          (property): property is babel.types.ObjectProperty =>
            types.isObjectProperty(property) && types.isIdentifier(property.key) && property.key.name === 'value',
        );
        if (objectProperty && mutateDefaultValue(objectProperty.value)) yield replacement;
      }
    }
  },
};

function mutateDefaultValue(node: babel.types.Node): boolean {
  if (types.isStringLiteral(node)) {
    if (node.value === '') {
      node.value = 'mutated string';
    } else {
      node.value = '';
    }
    return true;
  } else if (types.isNumericLiteral(node)) {
    node.value++;
    return true;
  } else if (types.isBooleanLiteral(node)) {
    node.value = !node.value;
    return true;
  } else return false;
}
