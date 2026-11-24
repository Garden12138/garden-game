# 峡谷格斗

在同一台电脑上用键盘进行四键 1v1 格斗。可从八名英雄中选择双方角色，与三个难度的电脑对战，或与另一名玩家共用键盘。每回合 99 秒，先赢两回合获胜。

## 运行

在本目录使用 Node.js 22.13 或以上版本。

```sh
npm ci
npm run dev
```

打开终端打印的本地地址。选定英雄后点击「开始对战」。对局中按 Esc 或点击「暂停」可继续对局或返回选人，结算后可选择重赛。

| 玩家 | 移动、跳跃、下蹲 | 轻拳、轻脚、重拳、重脚 |
| --- | --- | --- |
| P1 | A / D、W、S | J、K、U、I |
| P2 | 左 / 右、上、下方向键 | 左方括号、右方括号、分号、单引号，或小键盘 4、5、1、2 |

## 验证与构建

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

生产构建输出在 `dist/`，可部署为静态网站。角色头像和立绘在运行时从 Riot Data Dragon 获取。[Riot Data Dragon](https://developer.riotgames.com/docs/lol#data-dragon)

峡谷格斗是非官方粉丝作品。英雄及相关美术的权利属于 Riot Games。公开发布前须完成 Riot Developer Portal 产品登记。
