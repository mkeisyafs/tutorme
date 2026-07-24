// Python simulation interpreter for code sandbox edits
export function runPythonMock(code: string): string {
  const lines = code.split('\n');
  const variables: Record<string, any> = {};
  const logs: string[] = [];

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;

    const assignMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)$/);
    if (assignMatch) {
      const varName = assignMatch[1];
      let varValueExpr = assignMatch[2].trim();

      if (
        (varValueExpr.startsWith('"') && varValueExpr.endsWith('"')) ||
        (varValueExpr.startsWith("'") && varValueExpr.endsWith("'"))
      ) {
        variables[varName] = varValueExpr.slice(1, -1);
      } else {
        try {
          let expr = varValueExpr;
          for (const [k, v] of Object.entries(variables)) {
            const regex = new RegExp(`\\b${k}\\b`, 'g');
            expr = expr.replace(regex, typeof v === 'string' ? `"${v}"` : v);
          }
          const evaluated = new Function(`return ${expr}`)();
          variables[varName] = evaluated;
        } catch (e) {
          return `NameError: name '${varValueExpr}' is not defined`;
        }
      }
      continue;
    }

    const printMatch = line.match(/^print\((.*)\)$/);
    if (printMatch) {
      let printExpr = printMatch[1].trim();

      if (printExpr.startsWith('f"') || printExpr.startsWith("f'")) {
        let content = printExpr.slice(2, -1);
        const placeholderRegex = /\{(.*?)\}/g;
        let hasError = false;
        content = content.replace(placeholderRegex, (_, g1) => {
          const varName = g1.trim();
          if (varName in variables) {
            return variables[varName];
          } else {
            hasError = true;
            return varName;
          }
        });
        if (hasError) {
          return `NameError: variable name not found in f-string`;
        }
        logs.push(content);
      } else if (
        (printExpr.startsWith('"') && printExpr.endsWith('"')) ||
        (printExpr.startsWith("'") && printExpr.endsWith("'"))
      ) {
        logs.push(printExpr.slice(1, -1));
      } else {
        let expr = printExpr;
        for (const [k, v] of Object.entries(variables)) {
          const regex = new RegExp(`\\b${k}\\b`, 'g');
          expr = expr.replace(regex, typeof v === 'string' ? `"${v}"` : v);
        }
        try {
          const evaluated = new Function(`return ${expr}`)();
          logs.push(String(evaluated));
        } catch (e) {
          return `NameError: name '${printExpr}' is not defined`;
        }
      }
      continue;
    }
  }
  return logs.length > 0 ? logs.join('\n') : 'Ran successfully (no print output).';
}
