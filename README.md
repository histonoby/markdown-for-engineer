# DevLog Manager

エンジニアのための開発ログ管理アプリ。複数のプロジェクト（案件）の開発ログをMarkdownで記録・管理できます。

**デスクトップアプリ** としても **Webアプリ（PWA）** としても利用可能です。

## 機能

### 基本機能
- **プロジェクト管理**: 複数のプロジェクトを作成・管理
- **ステータス管理**: 進行中/保留/完了のステータスで状況を一目で把握
- **カラーコーディング**: プロジェクトごとに色を割り当てて視覚的に識別
- **開発ログ**: Markdownで開発ログを記録
- **リアルタイムプレビュー**: Markdown編集時にリアルタイムでプレビュー表示
- **タグ機能**: ログにタグを付けて整理
- **画像貼り付け**: Ctrl+Vでクリップボードから画像を貼り付け
- **内部リンク**: `[[プロジェクト名]]` や `[[プロジェクト名/ログタイトル]]` でリンク作成
- **自動保存**: 編集中に自動でデータを保存

### クラウド機能 (Supabase)
- **ユーザー認証**: メール、GitHub、Googleでログイン
- **クラウド同期**: 複数デバイスでデータを同期
- **ローカルモード**: オフラインでもローカルに保存して利用可能

### PWA対応
- **インストール可能**: ブラウザからホーム画面に追加
- **オフライン対応**: Service Workerによるキャッシュ
- **高速起動**: アプリのように素早く起動

## 技術スタック

- **Tauri 2.0** - デスクトップアプリフレームワーク
- **React 18 + TypeScript** - フロントエンド
- **Tailwind CSS** - スタイリング
- **Supabase** - 認証・データベース（オプション）
- **Vite PWA Plugin** - PWA対応
- **react-markdown** - Markdownレンダリング

## 開発環境のセットアップ

### 必要な環境

- Node.js 18+
- Rust (Tauriデスクトップアプリ用、オプション)
- npm または yarn

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動（Webアプリとして）
npm run dev

# Tauriデスクトップアプリとして起動
npm run tauri dev
```

### ビルド

```bash
# Webアプリとしてビルド（Vercelなどにデプロイ可能）
npm run build

# デスクトップアプリとしてビルド
npm run tauri build
```

## Supabase設定（オプション）

クラウド同期機能を使用する場合は、以下の手順でSupabaseを設定してください。

### 1. Supabaseプロジェクトの作成

1. [supabase.com](https://supabase.com) でアカウント作成
2. 新規プロジェクトを作成

### 2. データベースのセットアップ

SQL Editorで `supabase-schema.sql` の内容を実行してテーブルを作成します。

### 3. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. 認証プロバイダーの設定（オプション）

Supabaseダッシュボードの Authentication > Providers で GitHub や Google の OAuth を設定できます。

## Vercelへのデプロイ

```bash
# Vercel CLIでデプロイ
npm i -g vercel
vercel
```

または GitHub リポジトリを Vercel に接続して自動デプロイ。

設定：
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

環境変数（Settings > Environment Variables）：
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 使い方

### ローカルモード
1. アプリを起動すると認証画面が表示されます
2. 「ローカルモードで使用する」をクリック
3. データはブラウザのlocalStorageに保存されます

### クラウドモード
1. メール/GitHub/Googleでサインアップまたはログイン
2. データはSupabaseのデータベースに保存されます
3. 複数のデバイスでデータが同期されます

### 基本操作
1. **プロジェクト作成**: ダッシュボードの「新規プロジェクト」ボタンから作成
2. **ログ追加**: プロジェクトを選択し、「新規ログ」ボタンから追加
3. **Markdown記述**: 左側のエディタでMarkdownを記述、右側でリアルタイムプレビュー
4. **画像貼り付け**: スクリーンショットをCtrl+Vで直接貼り付け
5. **内部リンク**: `[[` と入力して補完候補から選択
6. **タグ付け**: ヘッダーでタグを追加して整理
7. **ステータス管理**: プロジェクトカードでステータスを変更

## キーボードショートカット

- `Ctrl/Cmd + S`: ログを保存
- `Ctrl/Cmd + V`: 画像を貼り付け

## ディレクトリ構造

```
src/
├── components/       # Reactコンポーネント
├── hooks/           # カスタムフック
├── lib/             # ライブラリ設定（Supabase等）
├── types/           # TypeScript型定義
└── App.tsx          # メインアプリケーション

src-tauri/           # Tauriバックエンド（Rust）
public/              # 静的ファイル・PWAアイコン
```

## ライセンス

MIT
