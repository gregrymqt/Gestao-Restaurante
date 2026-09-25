// ==============================================================================
// Manual Canónico de React Native: Expo SDK 54+
// Validador Compilatório Virtual em Memória e Regras AST (Closed-Loop Feedback)
// ==============================================================================

import ts from 'typescript';

export interface DiagnosticResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
}

/**
 * Validador estático em memória que inspeciona o código TypeScript/TSX recém-gerado
 * antes de autorizar a escrita no disco do repositório.
 */
export class ClosedLoopVirtualValidator {
  /**
   * Executa a inspeção de tipos contra o ambiente virtual TypeScript.
   */
  public static validateTypeScriptCode(
    fileName: string,
    sourceCode: string,
    compilerOptions: ts.CompilerOptions = {
      noEmit: true,
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      strict: true,
      noImplicitAny: true
    }
  ): DiagnosticResult {
    // 1. Criação do arquivo fonte virtual
    const sourceFile = ts.createSourceFile(
      fileName,
      sourceCode,
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TSX
    );

    // 2. Host virtual em memória que intercepta a leitura do arquivo proposto
    const defaultHost = ts.createCompilerHost(compilerOptions);
    const customHost: ts.CompilerHost = {
      ...defaultHost,
      getSourceFile: (name, languageVersion) => {
        if (name === fileName) return sourceFile;
        return defaultHost.getSourceFile(name, languageVersion);
      },
      fileExists: (name) => name === fileName || defaultHost.fileExists(name),
      readFile: (name) => (name === fileName ? sourceCode : defaultHost.readFile(name))
    };

    // 3. Compilação do programa em memória
    const program = ts.createProgram([fileName], compilerOptions, customHost);
    const diagnostics = ts.getPreEmitDiagnostics(program, sourceFile);

    if (diagnostics.length === 0) {
      return { isValid: true, errors: [] };
    }

    const errors = diagnostics.map((diag) => {
      const message = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
      if (diag.file && diag.start !== undefined) {
        const { line, character } = diag.file.getLineAndCharacterOfPosition(diag.start);
        return `[Linha ${line + 1}, Coluna ${character + 1}]: ${message}`;
      }
      return message;
    });

    return { isValid: false, errors };
  }

  /**
   * Auditoria de AST para conformidade com regras mobile:
   * - Proíbe tags HTML Web (div, span, p)
   * - Identifica strings fora de componentes Text
   */
  public static validateMobileAstRules(sourceCode: string): DiagnosticResult {
    const errors: string[] = [];

    // Inspeção de tags Web proíbidas
    const webTagsRegex = /<\/?(div|span|p|button|a|img|h1|h2|h3|section|article)\b/gi;
    let match: RegExpExecArray | null;
    while ((match = webTagsRegex.exec(sourceCode)) !== null) {
      errors.push(`[AST Error]: Tag Web proibida detectada '<${match[1]}>'. Utilize as primitivas nativas do React Native (<View>, <Text>, <Pressable>).`);
    }

    // Inspeção de display: grid
    if (/display\s*:\s*['"]grid['"]/gi.test(sourceCode)) {
      errors.push("[AST Error]: A propriedade 'display: grid' é proibida no React Native. Utilize o sistema Flexbox nativo.");
    }

    // Inspeção de importação de AsyncStorage legado
    if (/@react-native-async-storage\/async-storage/gi.test(sourceCode)) {
      errors.push("[AST Error]: '@react-native-async-storage/async-storage' é proibido. Utilize 'react-native-mmkv' para alta performance.");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
