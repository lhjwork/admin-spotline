# Gap Analysis: crew-curation-tool

| Item | Detail |
|------|--------|
| Feature | crew-curation-tool (Phase 2A) |
| Design Reference | `docs/02-design/features/crew-curation-tool.design.md` |
| Analyzed | 2026-03-28 |
| Match Rate | **100%** |

---

## Analysis Summary

| Step | Item | Design | Implementation | Match |
|------|------|--------|---------------|:-----:|
| 1-1 | placeToSpotRequest | `src/utils/placeConverter.ts` (new) | ✅ 존재. 시그니처 `(place, crewNote?, tags?)` 일치. title, address, area, category, source, placeId 매핑 모두 일치 | ✅ |
| 2-1 | QuickSpotForm | `src/components/curation/QuickSpotForm.tsx` (new) | ✅ 존재. Props `{place, onSubmit, onCancel, saving}` 일치. crewNote 필수 검증, tags 콤마 구분, placeToSpotRequest 호출, 자동 매핑 필드 표시 | ✅ |
| 2-2 | PlaceSearchResultCard 개선 | `src/components/curation/PlaceSearchResultCard.tsx` (modify) | ✅ bulkMode, checked, onCheckChange, onQuickRegister props 추가. 체크박스 표시, "바로 등록" 버튼, 기존 "선택" 버튼 유지 | ✅ |
| 2-3 | PlaceSearchPanel 개선 | `src/components/curation/PlaceSearchPanel.tsx` (modify) | ✅ bulkMode, checkedPlaces, onCheckedChange, onQuickRegister props 추가. checkedIds Set 관리, "N개 선택됨" 배지 표시 | ✅ |
| 3-1 | BulkCurationPanel | `src/components/curation/BulkCurationPanel.tsx` (new) | ✅ 존재. Props `{places, onComplete, onRemove}` 일치. 기본 crewNote, 개별 crewNote, placeToSpotRequest×N, spotAPI.bulkCreate, BulkResultToast 연동 | ✅ |
| 3-2 | BulkResultToast | `src/components/curation/BulkResultToast.tsx` (new) | ✅ 존재. Props `{total, success, onClose}` 일치. 녹색/노란색/빨간색 3단계, 3초 자동 사라짐, X 버튼 | ✅ |
| 4-1 | SpotCuration 리팩토링 | `src/pages/SpotCuration.tsx` (modify) | ✅ CurationMode = "quick" \| "bulk" \| "manual". 3모드 탭 UI. Quick: PlaceSearchPanel+QuickSpotForm, Bulk: PlaceSearchPanel(bulkMode)+BulkCurationPanel, Manual: SpotFormPanel+카카오맵. 모드 전환 시 상태 초기화 | ✅ |
| 5-1 | AreaHeatmap | `src/components/dashboard/AreaHeatmap.tsx` (new) | ✅ 존재. AREAS 20개 4×5 그리드(grid-cols-4). 색상: gray-100/blue-100/blue-300/blue-500. 범례 포함 | ✅ |
| 5-2 | CategoryPieChart | `src/components/dashboard/CategoryPieChart.tsx` (new) | ✅ 존재. recharts PieChart. 카테고리별 고유색 10개. 빈 데이터 처리. label+legend+tooltip | ✅ |
| 5-3 | CurationGoalDetail | `src/components/dashboard/CurationGoalDetail.tsx` (new) | ✅ 존재. Props `{goals, totalTarget, totalCurrent}` 일치. 전체 프로그레스 바 + 지역별 상세. 100% 시 green-500 | ✅ |
| 5-4 | Dashboard 개선 | `src/pages/Dashboard.tsx` (modify) | ✅ 20개 지역 쿼리(AREAS.map), 10개 카테고리 쿼리(CATEGORY_KEYS.map). AreaHeatmap+CategoryPieChart+CurationGoalDetail 통합. 목표 지역 7개 + TOTAL_SPOT_TARGET=300 | ✅ |

---

## Data Flow Verification

### Quick Spot Flow
```
Design:  PlaceSearchPanel → onQuickRegister(place) → setSelectedPlace → QuickSpotForm → crewNote → placeToSpotRequest → spotAPI.create → invalidateQueries
Implementation: ✅ SpotCuration.tsx에서 동일 flow 구현. handleQuickRegister → setSelectedPlace, handleQuickSubmit → createMutation.mutateAsync
```

### Bulk Flow
```
Design:  PlaceSearchPanel → onCheckedChange → setCheckedPlaces → BulkCurationPanel → crewNote × N → placeToSpotRequest × N → spotAPI.bulkCreate → BulkResultToast → onComplete
Implementation: ✅ SpotCuration.tsx에서 동일 flow 구현. checkedPlaces state, handleBulkRemove, handleBulkComplete
```

---

## Error & Empty States

| Scenario | Design | Implementation | Match |
|----------|--------|---------------|:-----:|
| Place 검색 결과 없음 | 기존 유지 | ✅ PlaceSearchPanel 기존 메시지 유지 | ✅ |
| Quick Spot 등록 실패 | 하단 에러 메시지 | ✅ QuickSpotForm catch → setError | ✅ |
| Bulk 부분 실패 | 노란색 토스트 | ✅ BulkResultToast yellow | ✅ |
| Bulk 전체 실패 | 빨간색 토스트 | ✅ BulkResultToast red | ✅ |
| 카테고리 매핑 실패 | "OTHER" fallback | ✅ mapPlaceCategoryToSpotCategory 기존 동작 | ✅ |
| area 추출 실패 | 빈 문자열 | ✅ extractAreaFromAddress returns "" + QuickSpotForm "지역 자동 추출 실패" 경고 표시 | ✅ |

---

## Existing Code Reuse

| Design 항목 | 구현 확인 |
|-------------|----------|
| PlaceSearchResultCard (modify) | ✅ 기존 + 신규 props |
| PlaceSearchPanel (modify) | ✅ 기존 + 신규 props |
| SpotFormPanel (manual mode) | ✅ SpotCuration manual 모드에서 기존 그대로 사용 |
| CurationProgress | ✅ SpotCuration + Dashboard에서 기존 사용 |
| spotAPI.create() | ✅ QuickSpotForm에서 사용 |
| spotAPI.bulkCreate() | ✅ BulkCurationPanel에서 사용 |
| mapPlaceCategoryToSpotCategory() | ✅ placeConverter에서 사용 |
| extractAreaFromAddress() | ✅ placeConverter에서 사용 |
| recharts | ✅ CategoryPieChart에서 사용 |

---

## Result

**Match Rate: 11/11 (100%)**

모든 Design 항목이 구현과 일치합니다. Gap 없음.
