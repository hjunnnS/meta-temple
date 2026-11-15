# 사찰 Colyseus 공동 방문 시험

사용자 승인: 2026-11-15. Mac에서 실행하고 Cloudflare 임시 외부 주소로 접속한다. Mac이 꺼져도 접속해야 한다는 이전 조건은 이번 시험에서 변경되었다. 가격·결제는 변경하지 않는다.

## 기존 작업 연결

- M3 / Epic #3 / Implementation #53: 방문자 전송을 Colyseus로 교체한다. 기존 사람·12지신·법복·절하기·명상·종치기·음료 자세의 표시 및 보간은 재사용한다.
- M3 / Epic #3 / Implementation #54: 채널 전환, 단절 복귀, 개인 공간 입퇴장과 중복 방문자 정리를 검수한다. 상품·거래 상태 전파 범위를 새로 확장하지 않는다.
- M4 / Epic #3 / Implementation #68: 독립 Chrome 3개가 실제 외부 WebSocket으로 접속하는 시험을 진행한다. 기존 번호·완료 상태·승인 내용은 보존한다. 신규 Issue는 만들지 않는다.
- 기존 예상 작업량과 선행 관계는 각 Issue를 따른다. 이번 3인 검수는 20명 브라우저 부하 검수나 실제 세 사람의 참가 평가를 대체하지 않는다.

## 클럽에서 재사용한 부분

`edm-first-visit/app`의 Colyseus core 0.16.26, ws-transport 0.16.5, SDK 0.16.22를 동일하게 사용한다. Room 안에 참가자를 보관하고 snapshot/move 메시지로 동기화하며, 서버에서만 자리를 배정하고 SDK consumeSeatReservation으로 연결하는 구조를 가져왔다. nanoid 3.3.18 및 Node24 import 호환 어댑터도 동일하다.

클럽의 Auth.js·회원 코드·춤·음악·좌석 규칙은 복사하지 않았다. 사찰의 비회원 탐방, 3개 채널·채널당 20명, 사찰 좌표 범위와 기존 동작 계약을 사용한다. 클럽 서버와 별도 프로세스·포트·통로라 클럽 접속을 재시작하지 않는다.

## 실행과 접속

- 임시 체험 주소: https://landscape-scanner-ate-amongst.trycloudflare.com
- 기존 Sites: https://sasa-temple-personal-trial.fond-bell-1966.chatgpt.site
- 같은 채널을 선택하면 서로 보인다. 첫 채널은 1이다. 로그인 없이 탐방할 수 있다.
- Mac의 서버는 127.0.0.1:18831, 통로 상태 확인은 18832를 사용한다. 일반 LAN 포트를 열지 않는다.
- `launchctl`의 `com.hjunnns.sasa.colyseus`가 별도 실행 폴더의 서버와 통로를 관리한다. 실행 중에만 `caffeinate -i`로 자동 잠자기를 방지한다. 시스템 전역 설정을 바꾸지 않는다.
- 화면을 꺼도 되지만 Mac 전원과 인터넷은 유지해야 한다. 로그아웃·재부팅 후에는 다시 시작해야 할 수 있다.

저장소 `meta-temple`에서:

```text
npm run mac:trial:status
npm run mac:trial:stop
npm run mac:trial:start
```

실행 폴더는 Git에서 제외한 `.local/colyseus-runtime.json`에 기록한다. 로그와 현재 주소는 그 실행 폴더의 `.local`에 있다. 코드·자산 갱신은 실행 중인 서버를 멈춘 뒤 설치하고 다시 시작한다. 이 경우 통로 주소가 바뀔 수 있다. 통로 주소가 바뀌면 직접 임시 링크는 새 주소로 접속할 수 있지만 기존 Sites의 `src/colyseus-config.ts`도 새 주소로 바꿔 다시 게시해야 한다. `VITE_COLYSEUS_URL`이 있으면 그 설정이 우선한다.

## 재설치와 검증

서버는 `server/colyseus`에서 `npm ci` 후 실행한다. Mac 실행 폴더 설치:

```text
node scripts/install-mac-colyseus.mjs <별도-실행-폴더> <cloudflared-실행파일> <체험판-dist>
npm run mac:trial:start
```

검증:

```text
npm test
npm run build
npm run colyseus:test
TRIAL_URL=<접속-주소> SHARED_EVIDENCE=evidence/colyseus/published node scripts/check-shared-visitors.mjs
```

Node 서버의 기본 실행은 로컬 주소만 연다. `SASA_ALLOWED_ORIGINS`는 허용할 화면의 정확한 origin을 쉼표로 지정한다. `/presence/join`에서만 8초짜리 Colyseus 자리를 예약하고 일반 `/matchmake`는 공개하지 않는다. 고정 Room 3개만 생성해 만석일 때 새 방을 만들지 않는다. 메시지는 4KB, 이동 반영은 최대 20Hz, snapshot은 10Hz다. 좌표·외형·동작·역순 sequence·비정상 이동을 검사한다. WebSocket이 끊기면 퇴장하고 새 세션으로 재입장한다. 개인 공간에서는 공유 Room을 나간다.

서버는 로그인·결제·구매 내역·개인 방 배치·기도문을 저장하거나 공유하지 않는다. 기존 시험 신청과 개인 공간 데이터는 각 브라우저 저장 방식 그대로다. 서로 구매 아이템을 공유하는 실서비스 전환이 완료됐다는 뜻은 아니다. 이전 Worker/D1 HTTP 방문자 서버는 체험판에서 더 이상 호출하지 않는다. 기존 배포와 기록은 롤백 자료로 보존했다.

## 검수 기록

- 원본 단위 검사 110건, 체험판 단위 검사 48건 통과. 기존 HTTP 전달 전용 검사 1건은 해당 전달 모듈 폐기와 함께 제거했다.
- Colyseus 서버 통합 검사 3건: 3개 SDK 연결·이동·참배·외형·종·음료, 채널 분리·퇴장·재입장, 20명 정원·21번째 거절·자리 재사용, 잘못된 입력/Origin/역순/비정상 이동 거절.
- 외부 임시 주소의 독립 Chrome 3개에서 서로 2명씩 표시, AI 17명 조절, 이동·12지신·법복·참배, 개인 공간 분리와 복귀, 종료·새로고침을 확인했다.
- 화면·조명·에셋·지도·동작 모델 소스는 바꾸지 않았다. 임시 파일 갱신 중 static 파일 목록이 갱신되지 않던 문제는 파일 제공 방식을 수정하고 재검수했다.
- 최종 Sites 검수와 네트워크 단절 복귀 결과는 `evidence/colyseus` 기록을 따른다.

공식 참고: https://0-16-x.docs.colyseus.io/deployment · https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/
임시 주소는 시험용이며 재생성 시 바뀐다. 상시 운영 호스팅이나 50명 성능을 승인한 결과는 아니다.

최종 결과: Sites v41에서 외부 Colyseus WebSocket 14회(채널 이동·복귀 포함), 독립 Chrome 3개, 네트워크 단절 복귀까지 통과했다. JavaScript 예외 및 방문자 API 실패는 0건이었다. 검수 브라우저는 모두 종료했다. 게시/검수 원본은 `evidence/colyseus/publication.json`에 기록했다.
