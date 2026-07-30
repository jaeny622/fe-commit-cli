import express from "express";
import { ESLint } from "eslint";

const app = express();
app.use(express.json({ limit: "10mb" }));

const eslint = new ESLint({
  overrideConfigFile: new URL("./eslint.config.js", import.meta.url).pathname
});

app.post("/lint", async (req, res) => {
  try {
    const { project, files } = req.body ?? {};

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "files 배열이 필요합니다."
      });
    }

    const results = [];
    for (const file of files) {
      const filePath = file?.filePath;
      const code = file?.code;

      if (!filePath || typeof code !== "string") {
        return res.status(400).json({
          ok: false,
          message: "각 파일은 filePath와 code를 포함해야 합니다."
        });
      }

      const lintResults = await eslint.lintText(code, { filePath });
      results.push(...lintResults);
    }

    const formatter = await eslint.loadFormatter("stylish");
    const output = formatter.format(results);

    const errorCount = results.reduce((sum, item) => sum + item.errorCount, 0);
    const warningCount = results.reduce((sum, item) => sum + item.warningCount, 0);

    return res.json({
      ok: errorCount === 0,
      project: project ?? null,
      errorCount,
      warningCount,
      output,
      results: results.map((r) => ({
        filePath: r.filePath,
        errorCount: r.errorCount,
        warningCount: r.warningCount,
        messages: r.messages.map((m) => ({
          ruleId: m.ruleId,
          severity: m.severity,
          message: m.message,
          line: m.line,
          column: m.column
        }))
      }))
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message
    });
  }
});

const port = 3310;
app.listen(port, () => {
  console.log(`checker listening on ${port}`);
});