# 사사 · Meta Temple

사사는 Babylon.js로 만든 웹 3D 사찰입니다. 일주문과 천왕문을 거쳐 연등 광장과 전각을 방문하고, 다섯 종류의 봉헌 아이템을 신청할 수 있습니다.

## 비공개 웹 후보 실행

이 Mac에서 Node 24와 PostgreSQL 17을 준비한 뒤 저장소 루트에서 `npm ci`, `npm run candidate`를 실행하고 http://127.0.0.1:4340/ 을 엽니다. 익명으로 탐방하거나, 시험 이메일로 로그인해 신청·설치·재방문을 확인할 수 있습니다. 시험 결제와 시험 우편함은 이 Mac에서 동작합니다.

- [후보본 검수 결과와 운영 인계](docs/M4-web-candidate.md)
- [시험 계정·운영 권한·복원 절차](server/service/README.md)

개발용 서비스는 `npm run service`로 4330 포트에서 실행합니다. `npm run check`로 기본 테스트, 형식 검사, 빌드를 확인합니다.

## 조작

방향키·WASD 또는 화면 화살표로 걷고, 드래그로 시선을 돌립니다. 환경 설정에서 낮·해질녘·밤, 화면 품질, 반짝임 완화를 선택합니다. 내 아이템은 원래 설치한 자리에서 강조 표시됩니다.

## M1 일괄 검수

[전체 장면과 9개 이슈 검수표](docs/I10-status.md)에서 같은 검수본의 배치도·대표 화면·웹 성능 기록을 확인한다. 실시간 장면은 공간 둘러보기에서 전환한다. 현재 기준은 웹이며 저사양 모바일 최적화와 앱 검토는 후속 단계다.

- [I01 검증 절차와 제한](docs/I01-validation.md)
- [I02 공간·좌표 설계안](docs/I02-layout.md)
- [I03 상태 계약 초안](docs/I03-state-contract.md)
- [I05 검수 조건 제안](docs/I05-acceptance.md)
- [I06 제작·감수 기준](docs/I06-art-rights.md)
- [I07 렌더링·플랫폼 ADR](docs/I07-platform-adr.md)
- [I08 서버·운영 구조 제안](docs/I08-architecture.md)
- [I09 개발·검수 환경](docs/I09-development.md)
- [I10 실제 완료 현황](docs/I10-status.md)

기준: [기능정의서 v1.2](docs/feature-spec-v1.2.docx), GitHub M1 #5–#13 및 조기 검증 보완. 문서 제안은 서비스 정책 승인과 다릅니다.

한지 연등 한 개의 재질 검수: 개발 서버의 [/hanji.html](http://127.0.0.1:5173/hanji.html). [구성·검증 기록](docs/hanji-study-01.md).
