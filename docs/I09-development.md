# I09 #12 — 개발·검수 환경

상태: I01 실험을 위한 최소 도구 구성 및 I09 후보 산출물. 선행 기술·플랫폼·운영 구조 승인 전 정식 I09 완료 처리 금지.

- Node 24, TypeScript 7.0.2, Vite 8.3.6, Babylon.js 9.34.0. package-lock.json으로 정확 버전 재현.
- `npm ci`, `npm run check`, `npm run dev`, `npm run preview`.
- GitHub Actions는 테스트·타입검사·production 빌드 후 7일간 dist artifact 보관. 공개 배포 작업 없음.
- `.env*`는 추적 제외, `.env.example`만 공유. M1은 비밀값·외부 API·분석 수집 사용 안 함.
- 검수 기록은 evidence/, 제안/정책/완료 현황은 docs/. 승인 기록과 실제 측정값을 분리.
- 모든 코드 변경은 Issue를 참조하고 완료 조건별 증거를 남긴다. 본 PR은 M1 검토용이며 자동 close 키워드를 사용하지 않는다.

검수 환경을 정식 호스팅에 배포하는 작업은 P13 및 배포 범위 승인 뒤 수행한다. localhost 실행은 실제 배포 환경의 네트워크/캐시/보안 검증을 대신하지 않는다.

## 웹 검수본 재현

2026-11-07 코드 커밋 9cb9175의 추적 파일만 새 임시 디렉터리에 풀어 Node 24.20.0과 npm ci로 설치했다. 17개 테스트·TypeScript 검사·Vite 빌드가 통과했다. 배포용 dist를 로컬 미리보기에서 열어 검수했다. GitHub Actions의 push 및 PR 검사도 같은 커밋에서 통과했다. PR #73의 Checks에서 재현 로그와 검수용 dist를 확인할 수 있다.
