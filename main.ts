import ts from 'typescript';

const stripPatterns = [/console\.\w?/, /debugger/];

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

function flattenExpression(node: ts.CallExpression): string {
  const tokens: string[] = [];

  let expr = node.expression;
  while (expr && ts.isPropertyAccessExpression(expr)) {
    tokens.unshift(expr.name.escapedText.toString());

    expr = expr.expression;
  }

  if (ts.isIdentifier(expr)) {
    tokens.unshift(expr.escapedText.toString());
  }

  return tokens.join('.');
}

const stripTransformer: ts.TransformerFactory<ts.SourceFile> = (
  ctx: ts.TransformationContext
) => {
  return (source: ts.SourceFile) => {
    const walk: ts.Visitor = (node: ts.Node) => {
      if (ts.isCallExpression(node)) {
        const flattened = flattenExpression(node);

        return stripPatterns.some((pattern) => pattern.test(flattened))
          ? ctx.factory.createIdentifier('')
          : node;
      }

      return ts.visitEachChild(node, walk, ctx);
    };

    return ts.visitNode(source, walk) as ts.SourceFile;
  };
};

(() => {
  const source = ts.createSourceFile(
    '',
    `const a = 'Hello World';
console.log('aaa')
console.log('cccccccc')`,
    ts.ScriptTarget.ES2015,
    false,
    ts.ScriptKind.TS
  );

  const result = ts.transform(source, [stripTransformer]);

  console.log(
    printer.printNode(ts.EmitHint.Unspecified, result.transformed[0], source)
  );
})();
