# HBay 官网（hbaywater.com）

New Zealand Miracle Water（HBay Water）官网，版式参照 Icelandic Glacial，内容为 HBay。

线上地址：https://hbaywater.com （正式官网，2026-11-03 起）

## 开发方式：直接修改 HTML

- 页面：`index.html`（另有 `privacy.html` / `terms.html`）
- HBay 图片、logo、超市 logo：`hbay/`。新素材一律放这里，不引用外部图片链接
- `cdn/`、`_ext/` 等目录是原站主题的样式、脚本与字体
- 页面目前仍带 `noindex`，不被搜索引擎收录（正式开放收录前要去掉）
- 字体只用免费授权字体：标题 Fraunces（`hbay/fonts/`，SIL OFL），正文 Figtree。不要再放收费字体文件

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

## 部署

本仓库就是 hbaywater.com 的线上代码，由 **Cloudflare Pages**（项目 `hbaywater`，账号 hello@magicengine.cloud）从 `main` 自动发布，无构建步骤：

- PR 合并到 `main` 后一两分钟内自动上线，不需要手动上传
- 每个 PR 会自动生成一个预览链接（`*.hbaywater.pages.dev`），合并前可以先看效果
- 域名 hbaywater.com 在 GoDaddy 注册，解析由 Cloudflare 管（GoDaddy 的域名服务器已改成 Cloudflare 的）
- `CNAME` 文件和 `.nojekyll` 留着：旧的 github.io 演示链接靠它们自动跳到 hbaywater.com

上线后从公网打开 https://hbaywater.com 确认。

## 内容说明

- 配色：深色区块用 nzmiracle.com 官网主色 `#1D95D4`，粉色 `#E8559F` 作点缀
- 页脚社媒（Facebook / Instagram / LinkedIn / YouTube）与 nzmiracle.com 一致，链接目前是各平台首页，拿到真实账号地址后替换
- 超市 logo（PAK'nSAVE / New World / Four Square）取自各超市官网
- 风景照来自 Wikimedia Commons（CC BY / CC BY-SA / 公有领域），正式上线需署名或替换为实拍
- `privacy.html` / `terms.html` 为样稿文本，上线前需客户审阅
