# test_fitnesse

## 概要

このリポジトリは[Fitnesse](https://fitnesse.org/FrontPage.html)の動作を検証するリポジトリとなります。

Fitnessではwikiで記載したテーブルに沿った受け入れテストを実施します。
テーブルには入力データと期待値を入れて動作を検証する受け入れテストのような記載もできますし、テーブルに実行する命令を記載して動かすといういわゆるキーワード駆動型のような使い方も行えます。


## Dockerでの起動方法

```
# ビルド
docker compose build
# 起動
docker compose up

# 以下に起動する
# http://127.0.0.1:8080

# 停止したい場合
docker compose down
```

