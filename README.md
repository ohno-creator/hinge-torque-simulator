# ヒンジ トルク計算・保持力シミュレーター

蓋、モニター、操作パネル、カバーなどの重量、重心位置、可動角度から、ヒンジ1個あたりの必要トルク、保持余裕、操作力を概算するReact/Viteアプリです。

## 主な機能

- 2D条件入力による重力モーメント計算
- ヒンジトルクカーブとの比較
- 保持余裕トルクと保持可能範囲の判定
- 開操作力・閉操作力の概算
- Rechartsによる3種類のグラフ表示
- SVGの2D説明図とThree.jsの3D確認ビュー
- サンプル製品候補とCSVトルクカーブ入力
- 問い合わせ条件のJSONコピー

## 起動

```bash
npm install
npm run dev
```

開発サーバーは通常 `http://127.0.0.1:5173/` で確認できます。

## 公開URL

https://ohno-creator.github.io/hinge-torque-simulator/

## ビルド

```bash
npm run build
```
