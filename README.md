<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/11_q6mCvdfEoRHTCJogmWC5oBzvfA9Jfr

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

````md
# HabHub — “The beauty of subtraction” Habit Tracker

HabHub は「引き算の美学 (The beauty of subtraction)」をコンセプトとした、極めてミニマルな習慣トラッカーです。  
精神的負担（Cognitive Load）を最小化しつつ、柔軟なスケジューリングと分析を提供し、継続しやすい“日々の道具”として成立することを目指します。

> この README は **仕様 + 実装方針 + Codex 用タスクリスト**を含みます。  
> 後ほど **Codex への「指示文（プロンプト）」**は別途用意します（この README では “何を作るか / どこまでやるか” を固定します）。

---

## 1. ゴール / 非ゴール

### ゴール
- Today（今日やるべき習慣）に集中した **最小入力・最小迷い** の体験
- ログイン（個人アカウント）による **データ同期（端末を跨ぐ）**
- “壊さない改善”のための **テスト可能なドメインロジック**（Due判定・集計・streak）
- データ保護（最低限）：
  - クラウド保存
  - エクスポート/インポート（JSON）
  - マイグレーション（スキーマ変更に耐える）

### 非ゴール（当面やらない）
- 複数人共有（家族・チーム）や公開ランキング
- リマインダー通知（Push）や複雑な通知スケジューラ
- 完全なオフライン・双方向同期（ローカルキャッシュ＋衝突解決）
  - 必要になったらフェーズ2以降で検討

---

## 2. 技術スタック（予定 / 推奨構成）

> 現状の Google AI Studio 生成物（ESM + Tailwind CDN + localStorage）を踏まえ、  
> **長期運用（再現性・テスト・デプロイ容易性）**のために以下へ寄せます。

- **Frontend/Fullstack**: Next.js（App Router） + React + TypeScript
- **Styling**: Tailwind CSS（ビルドに組み込み / CDN依存を避ける）
- **Auth/DB**: Supabase（Auth + Postgres）
- **Hosting**: Vercel
- **Icons/Fonts**: Inter / Material Symbols Outlined
- **AI（任意）**: Gemini（サーバー側で呼ぶ。キーはクライアントに出さない）
- **旧ローカルデータ**: localStorage 由来の JSON を初回取り込み可能にする

---

## 3. アプリ情報設計（画面）

- Today（ダッシュボード）
- Create/Edit Habit（習慣作成・編集）
- Analysis（分析）
- Inventory（習慣一覧管理）
- Settings（当面 UI のみ or 最小設定のみ）

ナビゲーション：ボトムナビ（5タブ）

---

## 4. 機能仕様（現行仕様をベースに固定）

### 4.1 Today View（ダッシュボード）
- 表示ロジック：**「今日やるべき習慣」**のみを表示（`isHabitDue`）
- 進捗表示：今日の完了数 / 表示中の総タスク数
- タスクカード：
  - タイトル、アイコン、進捗リング
  - ワンタップでカウントアップ（ログ記録）
  - リング部分タップで完了/未完了のトグル（実装は `count` を goal に合わせる）
  - Deep Link が設定されている場合、アイコンタップで外部アプリ起動
- 完了状態：目標回数達成で取り消し線 + チェック表示

### 4.2 Create / Edit Habit（習慣作成・編集）
入力項目：
- Title（習慣名）
- Frequency（頻度）:
  - Daily（毎日）
  - Weekly（特定曜日 or 週N回）
  - Monthly（特定日付 or 月N回。月末指定あり）
  - Once（単発タスク：日付指定）
- Icon（Material Icons プリセット or 絵文字）
- Goal（1日あたり目標回数）
- Color（8色）
- External Integration URL（https / mailto / anki:// 等）
編集：プロパティ変更、削除（論理削除でも物理削除でもよいが、運用方針は後述）

### 4.3 Analysis（分析）
- Consistency（一貫性）：過去30日間のタスク消化率（%）
- Current Streak（継続日数）：**全タスクを達成し続けている連続日数**
- Activity Heatmap：過去約4ヶ月の活動量を GitHub 風ヒートマップ（5段階）
- Last 7 Days：直近7日の達成率バーチャート
- Summary：アクティブ習慣数、総エントリー数

> 注意：streak は仕様上誤解を生みやすい。将来 “対象習慣を絞る” 等の改善はあり得るが、当面は上記仕様で実装し、テストで固定する。

### 4.4 Inventory（習慣リスト）
- アーカイブ除外の習慣を一覧表示
- 並び替え：上下ボタンで order を入れ替え（永続化）
- クリックで編集へ

### 4.5 Settings
- 当面 UI のみでも可（ただし “週の開始曜日” は実装すると分析精度が上がる）
- データ管理（エクスポート/インポート）は Settings に置く

---

## 5. ドメインモデル（仕様固定）

### 5.1 Habit（習慣）
- id: UUID
- user_id: UUID（Supabase Auth）
- title: string
- goal: number（1日あたり目標回数）
- frequency: `daily | weekly | monthly | once`
- scheduling:
  - specific days:
    - weekDays: number[]（0=Sun..6=Sat など、定義は統一）
    - monthDays: number[]（1..31 + 32=月末）
  - flexible count:
    - targetIntervalCount: number（例：週3回 / 月10回）
  - one-off:
    - targetDate: YYYY-MM-DD
- appearance:
  - color: string（8色のいずれか）
  - icon: string（Material Symbols 名 or 絵文字）
- integration:
  - externalUrl: string | null
- state:
  - createdAt: timestamp
  - archived: boolean
- ordering:
  - sortOrder: number（Inventory 並び替え用）

### 5.2 Entry（記録）
- user_id: UUID
- habit_id: UUID
- date_key: date（YYYY-MM-DD。基本は “ユーザーのローカル日付”）
- count: number（その日の実行回数）

ユニーク制約：
- (user_id, habit_id, date_key) は 1 行のみ（upsert 前提）

### 5.3 App Settings
- user_id: UUID
- week_start: number（0=Sun / 1=Mon など）
- timezone: string（例: `Asia/Tokyo`。当面は任意）

---

## 6. Due 判定ロジック（`isHabitDue` 仕様）

ある習慣が「今日」表示されるべきか：

1. Archived：`archived = true` は表示しない
2. Creation Date：作成日より過去の日付なら表示しない（= “作成前” は表示しない）
3. Frequency 別
   - `daily`：常に表示
   - `once`：`targetDate` と今日が一致する場合のみ表示
   - `weekly/monthly (flexible)`：
     - 期間内（今週/今月）の達成回数が `targetIntervalCount` 未満なら表示
     - 期間内達成済みでも「今日すでに実行済み」なら表示（完了済みとして見せるため）
     - それ以外は非表示
   - `weekly (specific)`：今日の曜日が `weekDays` に含まれる場合表示
   - `monthly (specific)`：今日の日付が `monthDays` に含まれる場合表示（32=月末も含む）

> 実装では `isHabitDue(habit, today, entries, settings)` を **純粋関数**として切り出し、代表ケースをテストで固定する。

---

## 7. データ移行（旧 localStorage からクラウドへ）

- 旧構造（ローカル JSON）から新構造（Supabase）へ **初回インポート導線**を用意する。
- “初回インポート” はログイン後 1 回だけ実行できる UI を用意（Settings 推奨）。
- インポート方針：
  - habits: id を維持（UUID 形式ならそのまま）
  - entries: (user_id, habit_id, date_key) で upsert
  - sortOrder: 無ければ作成順で採番
- インポートが終わったら “完了” を記録し、以後はクラウドを正として扱う

---

## 8. セキュリティ / 設計原則（重要）

- **RLS（Row Level Security）を必ず有効化**し、全テーブルで `auth.uid()` と `user_id` を突き合わせる
- Supabase の `anon` キーは公開され得る前提。守るのは RLS。
- **Gemini API Key は絶対にクライアントへ出さない**（Server Actions / Route Handler で呼ぶ）
- サービスロールキー（`SUPABASE_SERVICE_ROLE_KEY`）は server-only。漏洩すると全権限になる。

---

## 9. DB スキーマ（SQL 例）

> これは “たたき台” 。実装で必要に応じて調整する（ただし user_id と RLS は必須）。

```sql
-- habits
create table if not exists public.habits (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  goal integer not null default 1,
  frequency text not null check (frequency in ('daily','weekly','monthly','once')),
  schedule jsonb not null default '{}'::jsonb,
  color text not null default 'gray',
  icon text not null default 'check',
  external_url text,
  archived boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists habits_user_id_idx on public.habits(user_id);
create index if not exists habits_archived_idx on public.habits(archived);

-- entries
create table if not exists public.entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  date_key date not null,
  count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, habit_id, date_key)
);

create index if not exists entries_user_id_idx on public.entries(user_id);
create index if not exists entries_date_key_idx on public.entries(date_key);

-- settings
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  week_start integer not null default 1,
  timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
````

### RLS（必須）

```sql
alter table public.habits enable row level security;
alter table public.entries enable row level security;
alter table public.user_settings enable row level security;

-- habits: read/write own rows
create policy "habits_select_own" on public.habits
for select using (user_id = auth.uid());

create policy "habits_insert_own" on public.habits
for insert with check (user_id = auth.uid());

create policy "habits_update_own" on public.habits
for update using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "habits_delete_own" on public.habits
for delete using (user_id = auth.uid());

-- entries: read/write own rows
create policy "entries_select_own" on public.entries
for select using (user_id = auth.uid());

create policy "entries_insert_own" on public.entries
for insert with check (user_id = auth.uid());

create policy "entries_update_own" on public.entries
for update using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "entries_delete_own" on public.entries
for delete using (user_id = auth.uid());

-- settings: read/write own rows
create policy "settings_select_own" on public.user_settings
for select using (user_id = auth.uid());

create policy "settings_upsert_own" on public.user_settings
for insert with check (user_id = auth.uid());

create policy "settings_update_own" on public.user_settings
for update using (user_id = auth.uid())
with check (user_id = auth.uid());
```

---

## 10. 環境変数（ローカル / Vercel）

`.env.local`（例）

```bash
# public (safe to expose)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# server-only (do NOT expose)
SUPABASE_SERVICE_ROLE_KEY=...        # 使うなら（基本不要なら未使用でも良い）
GEMINI_API_KEY=...                   # AI機能を有効化する場合のみ
```

* `NEXT_PUBLIC_` 付きはブラウザに公開されます。
* それ以外はサーバーのみで使用します。

---

## 11. ローカル開発（想定）

```bash
npm install
npm run dev
```

* Supabase はクラウドプロジェクトを使う前提でもOK（URL/Key を env で設定）。
* Supabase CLI によるローカルDB運用は任意（必要になったら導入）。

---

## 12. 品質ゲート（Definition of Done）

最低限、以下を満たす：

* [ ] RLS が全テーブルで有効、かつ他人データが取得/更新できない
* [ ] `isHabitDue` の代表ケース（最低 20 ケース）にテストがある
* [ ] entries の upsert が idempotent（同じ入力で重複しない）
* [ ] Today の操作（+1、完了トグル）が DB に反映される
* [ ] エクスポート/インポート（JSON）が動作する（破損しない）
* [ ] Vercel デプロイ後にログイン→操作→反映ができる

---

# 13. Codex 用タスクリスト（実装計画）

> ここは “何をやるかのチェックリスト”。
> 実際に Codex に渡す “指示文（プロンプト）” は後で別途作る。

## Phase 0：リポジトリの土台（最初にやる）

1. Next.js + TypeScript + Tailwind のプロジェクトを作成
2. ルーティング雛形（`/login` と `/app`）
3. ESLint / フォーマット（最小でOK）
4. Supabase クライアント初期化（browser/server を分離）
5. 環境変数テンプレ（`.env.example`）を用意

## Phase 1：認証（ログインが成立するまで）

1. Supabase Auth（メールOTP or Magic Link）でログイン/ログアウト
2. ログイン必須ページ（`/app/*`）を保護（未ログインは `/login`）
3. `user_settings` を初回作成（week_start デフォルト等）

受け入れ条件：

* ログイン → `/app/today` に遷移 → リロードしてもセッション維持

## Phase 2：DB（スキーマ + RLS + CRUD）

1. `habits`, `entries`, `user_settings` のテーブル作成
2. RLS ポリシー作成（README の方針通り）
3. Habits CRUD（作成/編集/アーカイブ）
4. Entries upsert（(user_id, habit_id, date_key) を 1 行に保つ）

受け入れ条件：

* 別ユーザーでログインすると、他人のデータが一切見えない（API直叩きでも不可）

## Phase 3：ドメインロジック切り出し（テストで固定）

1. 日付ユーティリティ（DateKey / 週開始 / 月末判定 / 月末=32処理）
2. `isHabitDue` を純粋関数化して `tests` を作成（最低 20 ケース）
3. 集計（30日consistency / 7日 / heatmap / streak）の純粋関数化 + テスト（可能な範囲で）

受け入れ条件：

* `isHabitDue` の代表ケーステストが green
* 週開始曜日を変えても集計が破綻しない（少なくとも主要ケースで）

## Phase 4：UI 実装（最低限の見た目で可、体験優先）

1. Today：Due のみ表示、+1、完了トグル、外部URL起動
2. Create/Edit：frequency の4種＋各オプション入力
3. Inventory：並び替え（sort_order 更新）
4. Analysis：4機能（consistency / streak / heatmap / last7days）
5. Settings：週開始曜日＋データ管理（export/import）

受け入れ条件：

* Today の操作が DB に永続化され、別端末でも反映される

## Phase 5：移行導線（旧 localStorage → Supabase）

1. 旧 JSON（AppData v2 相当）を貼り付け/アップロードしてインポート
2. 重複防止（entries upsert）
3. インポート完了フラグ（以後はクラウドを正にする）

受け入れ条件：

* インポート後、Today/Analysis が期待通りに表示される

## Phase 6（任意）：Gemini（サーバー側のみ）

1. `/api/quote` のような Route Handler を追加（server-only）
2. 今日の完了数/総数を渡して Quote / Advice を生成して返す
3. UI は Today の “任意表示” にする（主導線を邪魔しない）

受け入れ条件：

* キーがクライアントに露出していない
* 失敗してもアプリが壊れない（フォールバック表示）

## Phase 7：デプロイ（Vercel）

1. Vercel に接続してデプロイ
2. 環境変数設定（NEXT_PUBLIC_SUPABASE_*、必要なら GEMINI_API_KEY）
3. Supabase 側の URL 設定（必要に応じてリダイレクト）

受け入れ条件：

* 公開URLでログイン→操作→データ反映まで通る

---

## 14. 追加ドキュメント（後で作る）

* `docs/codex-prompt.md`：Codex に渡す “具体指示文（プロンプト）”
* `docs/test-cases.md`：Due判定の代表ケース表（仕様固定用）
* `docs/data-migration.md`：旧 JSON の取り込み仕様

---

## License

TBD（個人用なら private repo 推奨。公開するなら MIT 等を検討）

```

---

必要なら次のターンで、**READMEのタスクリスト（Phase 0〜7）をCodexが実行しやすい順に再分解**して、  
- 「1タスク＝1PR」単位  
- 各タスクに **受け入れ条件 / 変更ファイル候補 / 注意点**  
まで付けた “Codex向けタスクカード” 形式に落とします。
::contentReference[oaicite:0]{index=0}
```
