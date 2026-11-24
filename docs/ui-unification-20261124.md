# 전체 반투명 UI 통일

사용자가 빠진 21종과 밝게 남긴 7종 전체의 통일, 가독성·기능 유지, PC·모바일 검수 및 체험판 반영을 승인했다. 기존 M4 / Epic #1·#74 / Implementation #64·#77 사용성 후속이며 새 Issue·날짜·상태 변경은 하지 않는다. 예상 구현 S, 검수·게시 대기는 별도다.

## 구현 범위

모든 dialog와 service-panel, 명시한 현장 버튼/안내창이 공통 색상 변수를 사용한다. 새 dialog도 별도 ID 추가 없이 같은 바탕을 받으며, 향후 비대화창 안내는 data-ui-surface로 같은 표면을 사용할 수 있다. 불투명도 .68, 하단 메뉴 .65, 일반 버튼 .16, 실시간 블러 없음. 버튼은 최소 44px, 입력 글자는 1rem을 유지한다.

21종 목록(개별 창 기준; 같은 말풍선을 사용하는 여러 NPC나 내부 버튼은 중복 제외):

- 현장 버튼 6: guide-monk-caption, pond-toss, sweeper-greet, private-gate-action, community-open, inspection-exit.
- 말풍선 3: npc-conversation-bubble, daily-monk-caption, sweeper-caption.
- 수행 표시 5: practice-feedback, private-practice-feedback, public-practice-outcome, private-practice-outcome, 수행 중 walk-pad 표면.
- 작은 안내 4: pond-wish, visit-guide, offering-tag, tea-status.
- 선택 창 3: face-dialog, community-dialog, private-views-panel.

밝게 남겼던 7종: spaces-panel, settings-panel, account-panel, private-scenery-dialog, private-display-dialog, private-access-dialog, offering-drawer.

입력칸·네이티브 선택창은 밝은 불투명 표면/진한 글자, 지도 도면과 연등 자리표·신청 요약은 읽기 영역을 유지한다. 빈자리·예약·사용 중 패턴과 선택 표시도 유지한다. 기존 큰 메뉴·안내창·체험판 안내는 같은 공통 스타일로 통합했다. 구형 신청 상태 안내도 같은 스타일을 받는다.

3D 그래픽·동작 로직·접수/가격/결제 로직·서버 설정은 수정하지 않는다. 공동 모금 검수에서는 창 표시만 확인하며 제출하지 않는다.

## 검증 기준

- PC Chrome 1440×900 및 WebKit 모바일 393×852, 추가 320px 세로·852px 가로.
- 28종 계산 스타일 개별 대조. 개인 공간에서 지연 생성되는 UI는 입장 후 확인한다. 숨겨진 상태 UI의 색상 대조와 실제 기능 경로 확인을 구분한다.
- 팝업 뒤 흰 3D 배경을 가정한 일반 글자 대비 4.5 / 큰 글자 3 기준, 선택·비활성화·호버, 배경 alpha, 블러 미사용, 모바일 메뉴 중 3D 렌더 중지.
- 동전 카운트다운, 12지신 선택, 계정 체험 시작, 연등 자리 선택·입력, 개인 공간 풍경·아이템 메뉴·사찰 복귀, 의자·커피·명상 시간·108배 카운터.
- 입력·선택 검수에서는 예약/주문/결제를 확정하지 않는다. 실기기 온도 측정은 포함하지 않는다.

결과·화면은 evidence/ui-unification-20261124/, 전체 스타일 대조 코드는 scripts/check-ui-coverage.mjs, 낮·밤 가독성/레이아웃 검수는 scripts/check-unified-ui.mjs에 보존한다.

## 검수 기록

- coverage-accepted/: PC·WebKit 모바일 각각 28종 스타일 대조 통과. 각 표면 alpha .68, backdrop-filter none, 표면 위 글자 대비 6.15 확인. 별도로 새 dialog 자동 적용도 확인했다.
- 같은 실행에서 동전 던지기 카운트다운, 12지신 선택, 체험 시작, 연등 빈자리 선택·입력, 풍경 선택, 아이템 배치 메뉴 열기·닫기, 사찰 복귀 통과. 접수창 내부 모든 표시 글자는 흰 장면을 가정한 대비 기준을 통과했다(최소 5.27).
- rest-final/: WebKit 모바일 의자 터치/드래그 구분, 주문창 필요 시 열기, 개인 공간 메뉴, 명상 시간, 자동 108배 카운터, 좁은/가로 화면과 사찰 복귀 통과.
- 초기 진단에서 지연 생성되는 개인 공간 UI의 검사 시점을 조정했다. 체험 시작의 비동기 완료를 기다리도록 검수 절차를 보완했다. 접수창 밝은 요약·단계 표시의 색상 충돌은 실제 화면과 대비 검사로 찾아 수정했다. 초기 실패 결과도 별도 디렉터리에 보존한다.
- 수정한 제품 소스는 translucent-ui.css뿐이다. 실제 휴대폰 온도는 측정하지 않았다. WebKit의 기존 SDK protocol fallback 진단은 별도로 기록한다.

## 완료 및 게시

accepted/: PC·모바일 낮·밤, 320px·852px 화면, 전체 글자 대비와 선택·닫기·주문·복귀 검수 통과. 모바일 메뉴 중 렌더 0회 확인. 두 소스의 TypeScript·배포 빌드 통과.

체험판 v64 게시 성공. 공개 주소 published/에서도 PC·모바일 각각 28종 스타일과 주요 선택·입력·동전·복귀 경로를 재검수해 통과했다. Mac 공유 서버 정적 파일 181개가 같은 빌드와 일치한다. 게시 응답은 publication.json에 보존한다.
