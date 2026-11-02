# HBay 官网改版样稿 V5

New Zealand Miracle Water（HBay Water）官网改版样稿，版式参照 Icelandic Glacial，内容为 HBay。

线上地址：https://hbay-v5.cloud01.top

## 开发方式：直接修改 HTML

- 页面：`index.html`（另有 `privacy.html` / `terms.html`）
- HBay 图片、logo、超市 logo：`hbay/`。新素材一律放这里，不引用外部图片链接
- `cdn/`、`_ext/` 等目录是原站主题的样式、脚本与字体
- 页面带 `noindex`，不被搜索引擎收录

## 本地预览

页面资源使用站点根路径（`/hbay/...`），在仓库根目录启动：

```bash
python3 -m http.server 8899
# 浏览器打开 http://127.0.0.1:8899/
```

提交前在桌面、平板、手机三种宽度下检查，并确认浏览器控制台无报错。

## 协作流程

```bash
git pull                              # 开工前同步
git checkout -b feat/xxx              # 每项改动单独开分支
# 修改、本地预览
git add -A
git commit -m "feat: 简述改动"
git push -u origin feat/xxx
gh pr create                          # 提 Pull Request，确认后合并到 main
```

- `main` 只保留可上线的状态，不在 `main` 上直接提交
- 不提交 `.env`、密钥、账号密码

## 部署（Jundong 执行）

PR 合并到 `main` 后：

```bash
git pull
rsync -az --delete --exclude .git --exclude README.md --exclude .gitignore \
  -e 'ssh -p 2048' ./ jundong@103.44.166.82:~/apps/hbay-demos/sites/v5-icelandic/
```

部署后从公网打开 https://hbay-v5.cloud01.top 确认。

## 内容说明

- 配色：深色区块用 nzmiracle.com 官网主色 `#1D95D4`，粉色 `#E8559F` 作点缀
- 页脚社媒（Facebook / Instagram / LinkedIn / YouTube）与 nzmiracle.com 一致，链接目前是各平台首页，拿到真实账号地址后替换
- 超市 logo（PAK'nSAVE / New World / Four Square）取自各超市官网
- 风景照来自 Wikimedia Commons（CC BY / CC BY-SA / 公有领域），正式上线需署名或替换为实拍
- `privacy.html` / `terms.html` 为样稿文本，上线前需客户审阅
