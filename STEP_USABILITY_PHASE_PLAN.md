# STEP_USABILITY_PHASE_PLAN

目的: 分析画面の習慣別深掘りを除いたUX改善を、段階的に安全実装する。

## STEP 1: Today 画面の体感改善
- ステータス: ✅ 完了（2026-02-16）
- 変更対象（実績）
  - `src/app/app/today/page.tsx`
- 実施（実績）
  - 楽観更新（ローカル state 先反映）
  - 失敗時ロールバック
  - 再試行ボタン/導線の追加
- チェック（実績）
  - `npm test` / `npm run build` は通過
  - 連打時の二重反映抑止（`busyHabitId`）は既存仕組みを維持
- 残タスク
  - Supabase接続環境での手動E2E確認（成功/失敗時挙動）

## STEP 2: Login / Nav 導線改善
- ステータス: ⏳ 未着手
- 変更対象（想定）
  - `src/app/login/page.tsx`
  - `src/components/AppNav.tsx`
- 実施
  - Magic Link送信後の説明・再送導線
  - ナビゲーション補助ラベル導入（常時 or 初回）
- チェック
  - 初見ユーザーが次操作を把握できる

## STEP 3: Habit Form の整合性修正
- ステータス: ⏳ 未着手
- 変更対象（想定）
  - `src/components/HabitForm.tsx`
  - 必要なら `src/types/domain.ts`, SQL/migration
- 実施
  - アイコン/色を保存対象にするか、UIから外すか決定
  - 決定に合わせてコード/型/DBを揃える
- チェック
  - 「入力したが保存されない」項目が存在しない

## STEP 4: Habits 並び替えの堅牢化
- ステータス: ⏳ 未着手
- 変更対象（想定）
  - `src/app/app/habits/page.tsx`
  - 必要なら server action / RPC / SQL
- 実施
  - 隣接要素とのswap or 全件再採番で整合を保証
  - 同時操作時の競合を考慮
- チェック
  - 重複sort_orderや意図しない並び崩れが起きない

## STEP 5: Settings Import/Export 安全化
- ステータス: ⏳ 未着手
- 変更対象（想定）
  - `src/app/app/settings/page.tsx`
- 実施
  - JSON検証結果の明示
  - Dry Runまたは確認ダイアログ
  - 失敗箇所（habits/entries/settings）の表示改善
- チェック
  - 誤インポートの可能性が下がり、失敗原因が分かる

## 共通チェック（各STEP後）
- `npm test`
- `npm run build`
- 影響画面の手動確認

## 非対象
- Analysis 画面の「習慣ごとの深掘り」は本計画に含めない。
