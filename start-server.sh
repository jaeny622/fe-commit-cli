# 현재 스크립트를 sh 환경에서 실행하도록지정
#!/usr/bin/env sh

# -e 명령어 실행 중 오류 발생 시 즉시 종료
# -u 정의되지 않은 변수를 사용할 경우 오류 처리
set -eu

# 현재 스크립트 파일이 위치한 디렉토리 절대 경로 
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
# lint-server 디렉토리 경로 설정
SERVER_DIR="$SCRIPT_DIR/lint-server"

# 기존에 실행 중이거나 존재하는 lint-api 컨테이너 강제 삭제 (초기화 단계)
docker rm -f lint-api >/dev/null 2>&1 || true

cd "$SERVER_DIR"
docker build -t lint-server .

# 컨테이너를 백그라운드(-d)로 실행
docker run -d --name lint-api -p 127.0.0.1:3310:3310 lint-server