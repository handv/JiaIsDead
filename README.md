# 贾氏两府清查案 · 小红书小工具

从 [jia-clan](../jia-clan) 整盘搬过来的离线包，给小红书「小工具」上传试效果。玩法、案卷、族谱体量不变，只改打包形态：不联网、根目录 `index.html`、脚本外置。

## 本地看效果

```bash
npm install
npm run dev
```

手机窄屏可把浏览器开到约 390 宽。上传前的包（同步主项目并打包，一键执行）：

```bash
npm run zip
```

或在本目录执行 `./zip.sh`。在主项目 `jia-clan` 里也可以：

```bash
npm run xhs:zip
```

会生成 `jia-clan-xhs-tool.zip`。解压后第一层就是 `index.html`，把这个 zip 传到[创作服务平台 · 小工具](https://creator.xiaohongshu.com/new/red-app)。

只要看本地效果、不重新同步时，用 `npm run build`。已结案检验包：`npm run zip:cleared`（或主项目 `npm run xhs:zip:cleared`），产物是 `jia-clan-xhs-tool-cleared.zip`，不要当正式包上传。

## 上传时注意

- 权限勾 **本地存储**（进度写在本机）和 **保存图片和视频**（结案笺进相册）。不要勾音频 / 麦克风。
- 容器禁内联脚本、禁联网、禁 iframe。本包已按官方 `references/` 收过。
- 案卷里有丧葬、府中忌讳，审核可能打回。这是试效果用的整盘，不是薄工具。
- 推荐体积小于 2MB。
