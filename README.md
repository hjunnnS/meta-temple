# 사사 온라인 사찰 체험판

Sites 공개 체험용 독립 소스. 원본 meta-temple 기준 커밋은 c724c51이다.

`npm run dev`, `npm test`, `npm run build`, `npm run preview`를 사용한다. Sites에는 dist를 배포한다.

언어를 고르고 연꽃을 눌러 입장한다. 사찰 지도로 이동하고 바닥 클릭/터치 또는 방향키로 걷는다. 신청이나 108배가 체험 시작을 요청하면 개인정보 없이 시작할 수 있다. 개인 공간에는 다섯 샘플을 전시할 수 있다.

실제 결제·로그인·공유 서버가 없는 브라우저 저장 체험판이다. 상세 범위와 검수는 docs/sites-trial.md 참조.

## 재현 가능한 검수

Node 24에서 `npm ci` 후 `npx playwright install chromium`으로 브라우저를 준비한다. Linux에서는 `npx playwright install --with-deps chromium`을 사용한다.

- `npm run check`: 전용 자동 검사, 번역 키/자리표시자 검사, 타입 검사와 서비스 빌드.
- `npm run check:browser`: 임시 로컬 서버를 자동 시작해 기본 체험, PC/터치 확장 동선, 14개 언어를 순차 검수하고 서버를 종료한다.
- `TRIAL_URL=https://... npm run check:browser`: 같은 절차를 지정한 배포 주소에서 수행한다. 실제 과금이나 외부 계정은 사용하지 않는다.
- `npm run check:performance`: 공개 Sites에서 20 Mbps·80 ms, 1280×720, 고품질·연등 440개로 첫 방문/재방문, 2분 예열·낮/해질녘/밤 각 5분 보행·개인 공간 10회 출입을 측정한다. 약 18분 이상 걸린다. 다른 GPU 검수와 동시에 실행하지 않는다.

설치된 Chrome으로 확인하려면 `PLAYWRIGHT_CHANNEL=chrome`을 지정한다. 기본값은 프로젝트에 고정한 Playwright Chromium이다. 필요한 경우에만 `PLAYWRIGHT_MODULE`로 모듈 위치를 지정할 수 있다. 개인 Mac 경로는 소스에 고정하지 않는다. GitHub Actions는 `trial/sites-personal`에서 상태/번역 자동 검사·타입·빌드·배포 에셋 무결성을 검사하며 운영 키를 요구하지 않는다. 전체 고품질 WebGL 검사는 GPU가 있는 기기에서 위 명령으로 실행한다. 일반 CPU runner에서는 매우 느리므로 수동 실행의 `full_browser_checks` 옵션으로 분리했다. 실휴대폰 검수와 실제 과금 검수는 포함하지 않는다.
