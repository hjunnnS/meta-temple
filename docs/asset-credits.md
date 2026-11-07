# 건축 재질 출처

Poly Haven CC0 assets. License: https://polyhaven.com/license (확인 2026-11-06). 컬러/Normal GL 원본 JPG를 로컬에서 제공하며 외부 요청 없이 실행한다.

- wood_planks_dirt: https://polyhaven.com/a/wood_planks_dirt — Rob Tuytel. 1K diffuse + Normal GL. 색상·반복·요철 강도는 장면에서 조정. 원본 파일 수정 없음.
- stone_wall: https://polyhaven.com/a/stone_wall — Charlotte Baglioni / Dario Barresi. 1K diffuse + Normal GL. 색상·반복·요철 강도는 장면에서 조정. 원본 파일 수정 없음.
- grey_roof_tiles: https://polyhaven.com/a/grey_roof_tiles — Rob Tuytel. 1K diffuse + Normal GL. 색상·반복·요철 강도는 장면에서 조정. 원본 파일 수정 없음.
- rock_face: https://polyhaven.com/a/rock_face — Greg Zaal / Dario Barresi. 1K diffuse + Normal GL. 색상·반복·요철 강도는 장면에서 조정. 원본 파일 수정 없음.

판석에 사용하는 flagstone-gray.jpg는 위 rock_face의 diffuse 원본을 흑백으로 변환하고 밝기와 대비를 조정한 CC0 파생 재질이다.

## M2 웹 반입 기준 (#14)

장면 단위는 1 m, +Y가 위, +Z가 북쪽이다. 승인된 건물과 연등은 기존 절차형 모델과 재질·조명을 재사용한다. 외부 모델은 미터로 정규화한 GLB, 색상 텍스처는 sRGB, 법선은 OpenGL 방향으로 확인한다. 음원은 웹에서 재생 가능한 압축본과 출처를 함께 등록한다. 현재 배포에 외부 모델·음원은 없다.

반입할 파일은 public 아래에 두고 textures/sources.json에 파일명·출처·제작자·권리·바이트 수·SHA-256 버전을 기록한다. 모델에는 metresPerUnit, 재질에는 material 용도를 지정한다. 프로젝트 생성 한지의 제작 근거는 hanji-study-01.md에 있다. 새 라이선스의 상업 이용·수정·배포 허용 여부는 반입자가 원문을 확인해 이 문서에 남긴다. npm run assets가 누락·중복·파일 변경을 검사하고 npm run check와 GitHub 검사에서도 실행된다. 숫자로 정한 전체 배포 예산은 P11 결정 대기다.
