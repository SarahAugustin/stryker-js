import babel from '@babel/core';

const { types } = babel;

/** Check if this is a
 * 1. constructor of an (Untyped)FormControl, (Untyped)FormGroup, FormRecord, or (Untyped)FormArray
 * 2. control(), group(), record(), or array() method of an (Untyped/NonNullable)FormBuilder
 * 3. FormControl defined by the group(), record(), or array() method of an (Untyped/NonNullable)FormBuilder
 */
export function isObjectRelatedToForms(path: babel.NodePath, onlyObjectsCreatingFormControls = false): boolean {
  if (onlyObjectsCreatingFormControls) {
    return (
      isAFormControlOrFormGroupOrFormRecordOrFormArray(path.node, ['FormControl', 'UntypedFormControl']) ||
      isAFormBuilder(path.node, ['control']) ||
      isAFormControlDefinedByAFormBuilder(path)
    );
  } else return isAFormControlOrFormGroupOrFormRecordOrFormArray(path.node) || isAFormBuilder(path.node) || isAFormControlDefinedByAFormBuilder(path);
}

/** Return an array of the
 * 1. arguments of the constructor of an (Untyped)FormControl, (Untyped)FormGroup, FormRecord, or (Untyped)FormArray
 * 2. arguments of the control(), group(), record(), or array() method of an (Untyped/NonNullable)FormBuilder
 * 3. arguments used to create a FormControl defined by the group(), record(), or array() method of an (Untyped/NonNullable)FormBuilder
 */
export function getArrayOfArgumentsOfObjectRelatedToForms(path: babel.NodePath, onlyObjectsCreatingFormControls = false): any[] | undefined {
  if (isObjectRelatedToForms(path, onlyObjectsCreatingFormControls)) {
    // it is a constructor of an (Untyped)FormControl, (Untyped)FormGroup, FormRecord, or (Untyped)FormArray
    if (types.isNewExpression(path.node)) {
      return path.node.arguments;
    }
    // it is a control(), group(), record(), or array() method of an (Untyped/NonNullable)FormBuilder
    else if (types.isCallExpression(path.node)) {
      return path.node.arguments;
    }
    // it is a FormControl defined as an Array in the the group(), record(), or array() method of an (Untyped/NonNullable)FormBuilder
    else if (types.isArrayExpression(path.node)) {
      return path.node.elements;
    }
    // it is a FormControl defined as a single default value in the the group(), record(), or array() method of an (Untyped/NonNullable)FormBuilder
    else {
      return [path.node];
    }
  }
  return undefined;
}

/** Check if this is the ith argument of a
 * 1. constructor of an (Untyped)FormControl, (Untyped)FormGroup, FormRecord, or (Untyped)FormArray
 * 2. control(), group(), record(), or array() method of an (Untyped/NonNullable)FormBuilder
 * 3. FormControl defined by the group(), record(), or array() method of an (Untyped/NonNullable)FormBuilder
 */
export function isIthArgumentOfObjectRelatedToForms(path: babel.NodePath, index: number, onlyObjectsCreatingFormControls = false): boolean {
  let array;
  if (!path.isArrayExpression() && isAFormControlDefinedByAFormBuilder(path)) {
    array = getArrayOfArgumentsOfObjectRelatedToForms(path, onlyObjectsCreatingFormControls);
  } else if (path.parentPath) {
    array = getArrayOfArgumentsOfObjectRelatedToForms(path.parentPath, onlyObjectsCreatingFormControls);
  }

  if (array && array.length > index) {
    return array[index] === path.node;
  }

  return false;
}

// Check if this is a constructor of an (Untyped)FormControl, (Untyped)FormGroup, FormRecord, or (Untyped)FormArray
function isAFormControlOrFormGroupOrFormRecordOrFormArray(
  node: babel.types.Node,
  methods: string[] = ['FormControl', 'UntypedFormControl', 'FormGroup', 'UntypedFormGroup', 'FormRecord', 'FormArray', 'UntypedFormArray'],
): node is babel.types.NewExpression {
  return types.isNewExpression(node) && types.isIdentifier(node.callee) && methods.includes(node.callee.name);
}

// Check if this is a control(), group(), record(), or array() method of an (Untyped/NonNullable)FormBuilder
function isAFormBuilder(
  node: babel.types.Node | undefined,
  methods: string[] = ['group', 'record', 'array', 'control'],
): node is babel.types.CallExpression {
  return (
    types.isCallExpression(node) &&
    types.isMemberExpression(node.callee) &&
    types.isIdentifier(node.callee.property) &&
    methods.includes(node.callee.property.name)
  );
}

// Check if this is a FormControl defined by the group(), record(), or array() method of an (Untyped/NonNullable)FormBuilder
function isAFormControlDefinedByAFormBuilder(path: babel.NodePath): boolean {
  return (
    // FormControl defined by the group or record method
    (types.isObjectProperty(path.parentPath?.node) &&
      types.isObjectExpression(path.parentPath.parentPath?.node) &&
      isAFormBuilder(path.parentPath.parentPath.parentPath?.node, ['group', 'record']) &&
      path.parentPath.parentPath.parentPath.node.arguments[0] === path.parentPath.parentPath.node) ||
    // FormControl defined by the array method
    (types.isArrayExpression(path.parentPath?.node) &&
      isAFormBuilder(path.parentPath.parentPath?.node, ['array']) &&
      path.parentPath.parentPath.node.arguments[0] === path.parentPath.node)
  );
}
