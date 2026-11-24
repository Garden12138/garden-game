# garden-game

Garden Game — A playground for creative indie games.<!-- 复制 -->

Garden Game 是个人独立游戏创作与实验平台，用于记录玩法设计、制作可玩原型，并持续迭代值得深入开发的作品。

## 游戏项目

| 游戏 | 类型 | 状态 |
| --- | --- | --- |
| [Pelican Rumble —《喙不住了！擂台》](games/pelican-rumble/README.md) | 双人策略卡牌与擂台格斗 | Design / Pre-production |
| [峡谷身份战](games/rift-identity/README.md) | 身份推理卡牌，支持单机与局域网 | 可玩 |
| [峡谷格斗](games/rift-fight/README.md) | 四键 2D 格斗，支持人机与本地双人 | 可玩 |
| [峡谷决斗](games/rift-duel/README.md) | 预组卡牌决斗，单人挑战 AI | 可玩 |

Pelican Rumble 目前处于 V0.4 核心玩法设计阶段，首个验证平台为 PC 浏览器，尚未进入程序开发。

## 仓库组织

本仓库采用 Monorepo。每款游戏在 `games/<游戏目录名>/` 下独立开发，自行管理设计文档、源码、资源、依赖和构建流程。当前项目的 [设计概要](games/pelican-rumble/docs/README.md) 和 [历史方案归档](games/pelican-rumble/docs/archive/README.md) 位于该游戏的 `docs/` 目录。

新增游戏时，在 `games/` 下以小写英文单词和连字符命名目录，编写项目 README，并在上表添加入口和状态。各游戏按自身需要选择引擎和工具，在实际开发时再加入对应配置。
