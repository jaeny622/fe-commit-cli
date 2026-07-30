import express from "express";
import { ESLint } from "eslint";

// Express 앱 생성
const app = express();
// JSON 요청 본문 파싱 설정
app.use(express.json({ limit: "10mb" }));

// ESLint 인스턴스 생성
// overrideConfigFile: 사용할 ESLint 설정 파일 경로 지정
const eslint = new ESLint({ overrideConfigFile: new URL("./eslint.config.js", import.meta.url).pathname });

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
    // 전달받은 파일들을 하나씩 lint
    for (const file of files) {
      const filePath = file?.filePath;
      const code = file?.code;

      if (!filePath || typeof code !== "string") {
        return res.status(400).json({
          ok: false,
          message: "각 파일은 filePath와 code를 포함해야 합니다."
        });
      }

      // 코드 문자열을 메모리에서 직접 lint
      const lintResults = await eslint.lintText(code, { filePath });
      results.push(...lintResults);
    }

    // 결과를 stylish 포맷으로 변환
    const formatter = await eslint.loadFormatter("stylish");
    const output = formatter.format(results);

    // 전체 에러/경고 수 집계
    const errorCount = results.reduce((sum, item) => sum + item.errorCount, 0);
    const warningCount = results.reduce((sum, item) => sum + item.warningCount, 0);

    // JSON 응답 반환
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

// 서버 실행 포트
const port = 3310;

// 서버 시작
app.listen(port, () => {
  console.log(`checker listening on ${port}`);
});