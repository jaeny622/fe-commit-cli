#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process'; // 실행 인자와 환경 변수를 읽기 위해 사용
import { execFile } from 'node:child_process'; // execFileSync : 외부 명령어(git) 실행 위한 모듈
import { promisify } from 'node:util'; // execFile을 Promise 기반으로 쓰기 위해 사용

// callback 스타일 execFile을 await 가능하게 변경
const exec = promisify(execFile);
// checker 서버의 기본 주소
const API_BASE = 'http://127.0.0.1:3310';

function parseArgs(argv) {
    let message = '';

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];

        // 현재 인자가 -m 또는 --message 옵션인지 확인
        if (arg === '-m' || arg === '--message') {
            message = argv[i + 1] || ''; // 다음 값을 메시지로 저장
            i += 1;
            continue;
        }

        // 알 수 없는 인자가 들어오면 에러 발생
        throw new Error(`unknown argument: ${arg}`);
    }

    // 메시지 없으면 에러 발생
    if (!message) {
        throw new Error('usage: pre-commit -m "feat: your message"');
    }

    return { message };
}

// 지정된 경로에서 git 명령 실행
async function git(args, cwd) {
    const { stdout } = await exec('git', args, { cwd });
    return stdout.trim();
}

// 현재 디렉토리 기준으로 git 명령 실행, 출력은 별도 가공 없이 터미널에 그대로 표출
async function gitVoid(args, cwd) {
    await exec('git', args, { cwd, stdio: 'inherit' });
}

// 현재 저장소의 최상위 경로 기준으로 동작하게 함
async function getRepoRoot() {
    return (await git(['rev-parse', '--show-toplevel'])).trim();
}

// staged 된 파일 목록 가져옴
async function getStagedFiles(repoRoot) {
    // --cached : staged 상태 기준, --diff-filter=ACMR : Added, Copied, Modified, Renamed 파일만 포함 (삭제 파일 제외)
    const out = await git(['diff', '--cached', '--name-only', '--diff-filter=ACMR'], repoRoot);
    // staged 된 파일 없으면 빈 배열 반환
    if (!out) return [];
    // 줄 단위로 나누고 빈 값은 제거
    return out.split('\n').map((v) => v.trim()).filter(Boolean);
}

// 검사 대상 확장자 목록
function isLintTarget(file) {
    return /\.(js|jsx|mjs|cjs|ts|tsx|vue)$/i.test(file);
}

async function getStagedFileContent(repoRoot, filePath) {
  return await git(['show', `:${filePath}`], repoRoot);
}

async function runLint(repoRoot, files) {
    const payload = [];

    for (const rel of files) {
        try {
            const content = await getStagedFileContent(repoRoot, rel);
            // 서버로 보낼 객체 추가
            payload.push({ filePath: rel, code: content });
        } catch (err) {
            console.warn(`[pre-commit] staged 파일 내용을 읽지 못해 파일을 건너뜁니다 : ${rel}`, err);
        }
    }

    if (payload.length === 0) {
        throw new Error('대상 staged 파일을 찾을 수 없습니다.');
    }

    const res = await fetch(`${API_BASE}/lint`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ project: path.basename(repoRoot), files: payload })
    });
    
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`lint server failed (${res.status}): ${text.slice(0, 500)}`);
    }

    let result;
    try {
        result = await res.json();
    } catch {
        const text = await res.text().catch(() => '');
        throw new Error(`invalid server response: ${res.status} ${text.slice(0, 500)}`);
    }

    // lint 결과가 정상인지 확인
    if (!result.ok) {
        const message = [ result.message || 'lint failed', result.output || '',  `errors=${result.errorCount ?? 0}, warnings=${result.warningCount ?? 0}`].filter(Boolean).join('\n');
        throw new Error(message);
    }

    // lint 결과 출력
    if (result.output) {
        process.stdout.write(result.output.endsWith('\n') ? result.output : `${result.output}\n`);
    }
}

async function main() {
    const { message } = parseArgs(process.argv.slice(2));
    const repoRoot = await getRepoRoot();
    const stagedFiles = await getStagedFiles(repoRoot);
    const files = stagedFiles.filter(isLintTarget);

    if (files.length === 0) {

        throw new Error('대상 staged 파일을 찾을 수 없습니다.');
    }

    await runLint(repoRoot, files);

    await gitVoid(['commit', '-m', message], repoRoot);
}

main().catch((error) => {
    console.error(`[pre-commit] ${error.message}`);
    process.exit(1);
});