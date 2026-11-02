/**
 * Content-based language detection for the editor. File extension wins when
 * known; otherwise heuristics, ordered TypeScript -> JavaScript -> CSS so a
 * .ts snippet is never mislabelled as CSS.
 */
export const detectLanguage = (codeStr: string, filePath?: string): string => {
  if (filePath) {
    const ext = filePath.split(".").pop()?.toLowerCase();
    if (ext === "yaml" || ext === "yml") return "yaml";
    if (ext === "py") return "python";
    if (ext === "cpp" || ext === "cc" || ext === "h") return "cpp";
    if (ext === "html" || ext === "htm") return "html";
    if (ext === "css") return "css";
    if (ext === "js" || ext === "jsx") return "javascript";
    if (ext === "ts" || ext === "tsx") return "typescript";
  }

  if (!codeStr || !codeStr.trim()) return "unknown";

  // YAML detection (run this first before any JS/TS triggers since YAML config might contain scripts/commands)
  if (
    codeStr.includes("yaml-language-server") ||
    codeStr.includes("rules:") ||
    codeStr.includes("reviews:") ||
    codeStr.includes("early_access:") ||
    (/^[a-zA-Z0-9_-]+:\s+/m.test(codeStr) &&
      !codeStr.includes("{") &&
      !codeStr.includes("}"))
  ) {
    return "yaml";
  }

  if (
    (codeStr.includes("def ") || codeStr.includes("import ")) &&
    codeStr.includes(":")
  )
    return "python";
  if (codeStr.includes("#include") || codeStr.includes("int main"))
    return "cpp";
  if (
    codeStr.includes("<html") ||
    codeStr.includes("<div") ||
    codeStr.includes("<!DOCTYPE html>")
  )
    return "html";

  // TypeScript detection (interface/type declarations, TS syntax)
  if (
    /^\s*(interface|type)\s+\w+\s*[={]/m.test(codeStr) ||
    /:\s*(string|number|boolean|any|unknown|void)\b/.test(codeStr) ||
    /\s*as\s+\w+/m.test(codeStr)
  )
    return "typescript";

  // JavaScript detection (ES6+, includes arrow functions)
  if (
    codeStr.includes("const ") ||
    codeStr.includes("let ") ||
    codeStr.includes("function ") ||
    codeStr.includes("console.log") ||
    codeStr.includes("=>")
  )
    return "javascript";

  // CSS detection: a selector line followed by a declaration block with
  // `prop: value;`. Handles compound + pseudo-class selectors (.btn:hover,
  // a:focus, .a.b), attribute selectors, descendant combinators and at-rules.
  // ponytail: regex heuristic, not a parser — swap for postcss if it misfires.
  if (
    /(^|\n)\s*(@[a-z-]+[^\n{}]*|[.#]?[a-z*][\w-]*(?:[^\n{};]*)|\[[^\n{};]*\])\s*\{[^}]*:[^;{}]+;/.test(
      codeStr,
    )
  )
    return "css";

  return "unknown";
};
