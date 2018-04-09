# git-set-file-times.js

https://gist.github.com/mAster-rAdio/642fff6acb79b7a587fb3bce7ee1c9ef

Perl -> TypeScript -> JavaScript

# Use

```
npm run start
```

```
node ./docs/git-set-file-times.js
```

```
import { GitSetFileTimes } from './git-set-file-times';

const git = new GitSetFileTimes( { debug: true } );

git.start();
//git.start( { dryrun: true, debug: true } );
```

# Build

## TypeScript

If you not installed TypeScript.

```
npm i typescript
```

## types

```
npm i
```

## Build TypeScript

```
npm run build
```

or

```
tsc
```

# 日本語で

必要に迫られPerlで書かれたGitのツール、`git-set-file-times` をTypeScriptで書いてJavaScriptに移植しました。
単体で実行すればスクリプトとして、JSで読み込めばモジュールとして利用可能です。

元ソース：

https://gist.github.com/mAster-rAdio/642fff6acb79b7a587fb3bce7ee1c9ef

実行すると今いるGitリポジトリのファイルの更新日時を、コミットしたときのものに変更してくれるはずです。
多分、うまく動いてる。多分。

あと、使い方はよく知らない（）
