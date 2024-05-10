import babel from '@babel/core';

const { types } = babel;

/** Check if this is a
 * FormControl, UntypedFormControl, FormGroup, UntypedFormGroup, FormArray, UntypedFormArray
 * FormBuilder, UntypedFormBuilder or NonNullableFormBuilder, or
 * FormControl defined by a FormBuilder, UntypedFormBuilder or NonNullableFormBuilder
 */
export function isObjectRelatedToForms(
  path: babel.NodePath,
  onlyObjectsCreatingFormControls = false,
): path is babel.NodePath<babel.types.ArrayExpression | babel.types.CallExpression | babel.types.NewExpression> {
  if (onlyObjectsCreatingFormControls) {
    return (
      isAFormControlOrFormGroupOrFormArray(path, ['FormControl', 'UntypedFormControl']) ||
      isAFormBuilder(path, ['control']) ||
      isAFormControlDefinedByAFormBuilder(path)
    );
  } else return isAFormControlOrFormGroupOrFormArray(path) || isAFormBuilder(path) || isAFormControlDefinedByAFormBuilder(path);
}

export function isIthArgumentOfObjectRelatedToForms(path: babel.NodePath, index: number, onlyObjectsCreatingFormControls = false): boolean {
  if (path.parentPath && isObjectRelatedToForms(path.parentPath, onlyObjectsCreatingFormControls)) {
    const array = types.isArrayExpression(path.parentPath.node) ? path.parentPath.node.elements : path.parentPath.node.arguments;
    return array[index] === path.node;
  } else return false;
}

// Check if this is a FormControl, UntypedFormControl, FormGroup, UntypedFormGroup, FormArray or UntypedFormArray
function isAFormControlOrFormGroupOrFormArray(
  path: babel.NodePath,
  methods: string[] = ['FormControl', 'UntypedFormControl', 'FormGroup', 'UntypedFormGroup', 'FormArray', 'UntypedFormArray'],
): path is babel.NodePath<babel.types.NewExpression> {
  return path.isNewExpression() && types.isIdentifier(path.node.callee) && methods.includes(path.node.callee.name);
}

// Check if this is a FormBuilder, UntypedFormBuilder or NonNullableFormBuilder
function isAFormBuilder(
  path: babel.NodePath,
  methods: string[] = ['group', 'record', 'array', 'control'],
): path is babel.NodePath<babel.types.CallExpression> {
  return (
    path.isCallExpression() &&
    types.isMemberExpression(path.node.callee) &&
    types.isIdentifier(path.node.callee.property) &&
    methods.includes(path.node.callee.property.name)
  );
}

// Check if this is a FormControl defined by a FormBuilder, UntypedFormBuilder or NonNullableFormBuilder
function isAFormControlDefinedByAFormBuilder(path: babel.NodePath): path is babel.NodePath<babel.types.ArrayExpression> {
  return (
    // FormControl defined by the group of record method
    (!!path.parentPath?.parentPath?.parentPath &&
      types.isArrayExpression(path.node) &&
      types.isObjectProperty(path.parentPath.node) &&
      types.isObjectExpression(path.parentPath.parentPath.node) &&
      isAFormBuilder(path.parentPath.parentPath.parentPath, ['group', 'record']) &&
      path.parentPath.parentPath.parentPath.node.arguments[0] === path.parentPath.parentPath.node) ||
    // FormControl defined by the array method
    (!!path.parentPath?.parentPath &&
      types.isArrayExpression(path.node) &&
      types.isArrayExpression(path.parentPath.node) &&
      isAFormBuilder(path.parentPath.parentPath, ['array']) &&
      path.parentPath.parentPath.node.arguments[0] === path.parentPath.node)
  );
}
