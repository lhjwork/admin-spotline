# admin-spot-bulk-curation Planning Document

> **Summary**: 크루 대량 Spot 큐레이션 워크플로우 개선 — 벌크 태그/미디어/진행률/에러핸들링
>
> **Project**: admin-spotLine
> **Version**: 0.1.0
> **Author**: Crew
> **Date**: 2026-04-14
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 현재 벌크 등록 시 태그 일괄 지정, 미디어 첨부, 실패 항목 재시도가 불가하여 크루가 200~300 Spot 목표 달성에 비효율적 |
| **Solution** | BulkCurationPanel 확장 — 벌크 태그/카테고리 일괄 지정, 진행률 표시, 개별 에러 핸들링 및 재시도, 대량 작업 히스토리 |
| **Function/UX Effect** | 한 번의 검색으로 10~20개 Spot을 태그/노트와 함께 일괄 등록, 실패 시 개별 재시도로 데이터 손실 없음 |
| **Core Value** | Cold Start 전략의 핵심인 런칭 전 콘텐츠 확보 속도를 3~5배 향상 |

---

## 1. Overview

### 1.1 Purpose

크루가 Place API 검색 결과에서 다수의 Spot을 선별하여 **태그, 카테고리, crewNote, 미디어**를 일괄 지정한 뒤 한 번에 등록할 수 있는 생산성 높은 큐레이션 도구를 제공한다.

### 1.2 Background

- Cold Start 전략: 런칭 전 200~300 Spot + 15~20 SpotLine 확보 필요
- 현재 BulkCurationPanel이 존재하나, crewNote만 일괄 지정 가능
- 태그, 카테고리 변경, 미디어 첨부는 개별 Spot 수정으로만 가능 → 비효율
- 벌크 등록 실패 시 전체 실패(all-or-nothing) → 데이터 손실 위험

### 1.3 Related Documents

- CLAUDE.md: Phase 2 (크루 큐레이션 도구) 정의
- 기존 코드: `src/components/curation/BulkCurationPanel.tsx`
- API: `POST /api/v2/spots/bulk`

---

## 2. Scope

### 2.1 In Scope

- [ ] 벌크 태그 일괄 지정 (글로벌 기본 + 개별 오버라이드)
- [ ] 벌크 카테고리 일괄 변경
- [ ] 벌크 area 일괄 지정/수정
- [ ] 개별 항목 진행률 표시 (Progress Bar)
- [ ] 개별 에러 핸들링 및 실패 항목 재시도
- [ ] 선택 항목 카운터 및 전체 선택/해제
- [ ] 벌크 등록 결과 요약 (성공/실패 카운트)

### 2.2 Out of Scope

- 벌크 미디어 업로드 (개별 Spot 수정에서 처리 — 복잡도 과다)
- CSV 파일 임포트 (별도 feature로 분리)
- 벌크 등록 히스토리/로그 저장 (v2 고려)
- SpotLine 자동 구성 (별도 admin-spotline-builder feature)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 벌크 태그 일괄 지정: 전체 선택 항목에 공통 태그 적용 + 개별 Spot 태그 추가/제거 | High | Pending |
| FR-02 | 벌크 카테고리/area 일괄 변경: 드롭다운으로 전체 선택 항목의 카테고리 또는 area 일괄 수정 | High | Pending |
| FR-03 | 진행률 표시: 벌크 제출 시 N/Total 형태 프로그레스바 + 각 항목 상태 아이콘 (⏳/✅/❌) | High | Pending |
| FR-04 | 개별 에러 핸들링: API 실패 시 실패 항목만 별도 표시 + "재시도" 버튼 | High | Pending |
| FR-05 | 선택 관리 UX: 검색 결과 상단에 선택 카운터, 전체 선택/해제 토글, 선택 항목 클리어 | Medium | Pending |
| FR-06 | 등록 결과 요약: 벌크 완료 후 성공/실패 카운트 + 실패 사유 요약 모달 | Medium | Pending |
| FR-07 | crewNote 글로벌 기본값 + 개별 오버라이드 (기존 기능 유지) | Low | Existing |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 20개 Spot 벌크 등록 < 10초 | 수동 테스트 |
| UX | 벌크 선택 상태는 검색 결과 변경 시에도 유지 | 수동 테스트 |
| Resilience | 일부 실패 시 성공 항목은 정상 등록됨 | API 응답 확인 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] FR-01 ~ FR-06 구현 완료
- [ ] 기존 Quick/Manual 모드 영향 없음
- [ ] TypeScript 빌드 에러 0
- [ ] Vercel 배포 성공

### 4.2 Quality Criteria

- [ ] Zero lint errors
- [ ] Build succeeds (`pnpm build`)
- [ ] 기존 BulkCurationPanel 기능 regression 없음

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Backend bulkCreate가 all-or-nothing이면 개별 에러 핸들링 불가 | High | Medium | Backend API 확인 후, 필요 시 Frontend에서 순차 호출로 대체 |
| 대량 선택 시 메모리/렌더링 성능 저하 | Medium | Low | 선택 상한 50개 설정, 가상화 미적용 (50개 이하) |
| Place API 검색 결과와 선택 상태 동기화 복잡도 | Medium | Medium | 선택 항목을 별도 Map으로 관리, 검색 결과와 독립적 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites | ☐ |
| **Dynamic** | Feature-based modules, BaaS | Web apps with backend | ☑ |
| **Enterprise** | Strict layer separation | High-traffic systems | ☐ |

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Framework | React + Vite | React + Vite | 기존 스택 유지 |
| State Management | React state + React Query | React state + React Query | 기존 패턴 유지 |
| API Client | Axios + React Query | Axios + React Query | 기존 spotAPI 확장 |
| Form Handling | react-hook-form | react-hook-form | 기존 패턴 |
| Styling | Tailwind CSS | Tailwind CSS | 기존 디자인 시스템 |

### 6.3 Clean Architecture Approach

```
수정/신규 파일 예상:
┌─────────────────────────────────────────────────────┐
│ MODIFY: src/components/curation/BulkCurationPanel.tsx│
│   - 태그/카테고리/area 일괄 지정 UI 추가            │
│   - 진행률/에러 핸들링 로직 추가                     │
│                                                     │
│ MODIFY: src/components/curation/PlaceSearchResultCard│
│   - 선택 상태 시각 피드백 개선                       │
│                                                     │
│ NEW: src/components/curation/BulkActionBar.tsx       │
│   - 벌크 태그/카테고리/area 일괄 지정 toolbar        │
│                                                     │
│ NEW: src/components/curation/BulkProgressModal.tsx   │
│   - 벌크 등록 진행률 + 결과 요약 모달               │
│                                                     │
│ MODIFY: src/pages/SpotCuration.tsx                   │
│   - 선택 관리 로직 개선 (Map 기반)                   │
│   - BulkActionBar 통합                              │
│                                                     │
│ MODIFY: src/services/v2/spotAPI.ts                   │
│   - 순차 벌크 호출 유틸 추가 (개별 에러 핸들링)      │
└─────────────────────────────────────────────────────┘
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] `CLAUDE.md` has coding conventions section
- [x] ESLint configuration
- [x] TypeScript configuration (`tsconfig.json`)
- [x] Tailwind CSS 설정

### 7.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Naming** | exists | PascalCase 컴포넌트, camelCase 변수 | - |
| **Folder structure** | exists | `src/components/curation/` 하위 | - |
| **Import order** | exists | 기존 패턴 준수 | - |

### 7.3 Environment Variables Needed

추가 환경변수 불필요 (기존 API_URL, Supabase 키 활용)

---

## 8. Next Steps

1. [ ] Write design document (`admin-spot-bulk-curation.design.md`)
2. [ ] Backend bulkCreate API 동작 확인 (개별 에러 반환 여부)
3. [ ] Start implementation

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-14 | Initial draft | Crew |
