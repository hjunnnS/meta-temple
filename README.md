# 사사 · Meta Temple

M1의 **실제 엔진 수직 슬라이스**입니다. Babylon.js로 대웅전 일부·단청·연등·조명을 표현합니다. 정식 서비스나 M2 전체 맵이 아닙니다.

## 실행

Node 24에서 `npm ci`, `npm run dev` 후 출력된 로컬 주소를 엽니다.
`npm run check`는 좌표·식별자·측정 계산 테스트와 TypeScript 검사·배포용 빌드를 수행합니다.
`npm run preview`로 빌드된 결과를 검수합니다. `dist`는 검수 산출물이며 자동 공개 배포하지 않습니다.

## 조작

- 드래그 / 두 손가락 / 휠: 회전·확대
- 하단: 전체 풍경·대웅전·단청·내 연등 고정 시점
- 환경 설정: 낮·해질녘·밤, 품질, 반짝임 완화
- 검증 기록: 샘플 수, 3개 내 연등 선택, 측정 시작·종료·JSON 저장

모든 소유자·설치 데이터는 로컬 샘플입니다. 실제 계정·서버·구매·환불·멀티플레이 기능은 구현하지 않았습니다.

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

기준: 기능정의서 v1.1, GitHub M1 #5–#13 및 조기 검증 보완. 문서 제안은 서비스 정책 승인과 다릅니다.

한지 연등 한 개의 재질 검수: 개발 서버의 [/hanji.html](http://127.0.0.1:5173/hanji.html). [구성·검증 기록](docs/hanji-study-01.md).
