# I03 #7 — 거래·권리 상태 계약 초안

상태: M1 설계 산출물 초안. 실제 DB·결제·서버 구현 없음. I02 배치와 미확정 P02~P06·P14 승인 전 해당 M3 분기는 차단한다.

## 독립 상태

슬롯 `free / contending / reserved / payment_locked / occupied`.
거래 `pending / unknown / succeeded / failed / refund_requested / refund_failed / refunded`.
설치 `none / installing / active / recovering / expired`.
콘텐츠 `visible / hidden / deleted`와 공개 범위는 거래 상태와 분리한다.

## 전이와 필수 조건

1. free→contending: 서버에서 판매 상태·상품 호환·사용자·남용 제한 검증. P04 판정 구간 내 계정당 한 후보만 유지.
2. contending→reserved: 서버 난수로 승자 한 명, 원자적 슬롯 소유 토큰과 만료 시각 생성. 패자는 토큰 없음. 선택 완료 전부터 타인의 확정 예약 차단.
3. reserved→free: 결제 시작 전 취소/TTL 정책 P03을 만족하며 서버가 미결제임을 확인할 때만.
4. reserved→payment_locked: 예약자·토큰·금액·판매 정책 버전 재검증. 요청 멱등키로 주문 중복 생성 방지.
5. pending/unknown→succeeded 또는 failed: 제공자 서버 조회·서명·금액·구매자 검증. 클라이언트 복귀값만으로 성공 처리 금지. unknown 동안 슬롯 잠금 유지.
6. succeeded→installing→active: 한 주문당 단일 설치, 선택 슬롯·좌표 보존. 설치 실패는 recovering. 다른 슬롯 대체/재결제 요구 금지.
7. recovering→active 또는 refund_requested: P05 결정에 따른 재시도/환불. 횟수·시간은 미정이며 하드코딩 금지.
8. refund_requested→refund_failed 또는 refunded: 제공자 최종 상태 확인. 환불 처리 동안 설치 작업과 원자적 경합 차단. refunded 이후 작업 차단·권리 정리 완료 후 슬롯 free. 늦은 작업이 재활성화할 수 없음.
9. active→expired: P02 기산/달력 규칙의 서버 시각 기준. 철거·이력·슬롯 free 시점은 P06 결정 전 미확정.
10. 판매 중지: 신규 예약·결제 거절. 기존 예약 인정 여부 P03/P14. pending/unknown은 중지·타이머만으로 슬롯 해제 불가. 기존 주문 스냅샷 유지.

## API와 데이터 경계

M2 읽기 계약: GET /v1/temples/{templeId}/zones/{zoneId}/slots → schemaVersion, layoutVersion, slots[{slotId, position, rotationY, accepts, sampleInstallation?}]. 샘플 소유자 표시는 시험용이며 운영 권리 아님. 오류: unknown-zone, unsupported-schema, temporarily-unavailable.

M3 제안: POST /reservations, DELETE /reservations/{id}, POST /orders, GET /orders/{id}, 결제 제공자별 검증된 webhook, GET /me/installations. 운영 재처리는 같은 명령 처리를 호출한다. DB 제품/인증/제공자 확정 뒤 상세 API를 승인한다.
서버 원본: 주문 스냅샷·정책 버전·거래 ID·설치 ID·슬롯 ID·권한. 이벤트: aggregateId·version·eventId·occurredAt. 중복 eventId 무시, 역순/누락은 원본 재조회. 공개 범위는 서버에서 필터링하며 원문을 먼저 내려보내지 않는다.

## 검토 시나리오와 기대 결과

- 20계정 같은 슬롯: 승자/유효 토큰 1명, 중복 계정 추첨 가중치 없음.
- TTL 종료와 늦은 성공: payment_locked 유지, 원거래 확인 후 단일 설치.
- 성공 통지 3회/역순 실패: 최종 원거래가 성공이면 단일 권리 유지.
- 환불 실패: 슬롯 조기 재판매 금지, 운영 대응으로 남김.
- 환불 완료 뒤 늦은 install 작업: fencing/version 검증으로 거절.
- 만료·환불 동시 처리: 하나의 권리 종료와 한 번의 슬롯 해제, 이력 보존은 P06/P07.
- 콘텐츠 숨김: 결제/기간 변경 없음, 모든 조회 권한과 채널에 반영.

이 시나리오는 계약 리뷰 항목이며 실제 서버 부하/결제 테스트 통과 기록이 아니다.


## 사용자 추가 요구 — 연등 이름표 (2026-11-06)
구매자가 입력한 표시 이름을 설치된 연등 아래 종이 이름표에 표시한다. 구매 입력 #38과 설치 #44를 연결한다. 표시 이름은 계정 실명에서 자동 추출하지 않고 구매 입력값/공개 동의 범위를 따른다. 글자 수·금칙어·수정 가능 기간·공개 범위의 구체값은 기존 정책 검토에서 확정한다. M1의 12글자 임시 미리보기는 운영 정책이나 실제 구매 저장 구현이 아니다.


### 이름표 선택 신청 (2026-11-06 추가)
이름표는 모든 상품에 자동 부착하지 않는다. 사용자가 이름표를 신청하고 표시 이름을 입력한 설치에만 부착한다. M1은 예시 하나만 기본 표시하며, 실제 저장은 기존 M3 #38/#44에서 처리한다.
