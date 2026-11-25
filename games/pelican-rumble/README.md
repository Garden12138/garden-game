# Pelican Rumble —《喙不住了！擂台》

一款可在桌面浏览器游玩的 1v1 鹈鹕摔角卡牌原型。双方在九个站位之间走位，从相同的六张动作卡中暗选一招，同时亮牌。规则先裁定交锋，擂台再演出脚步、抓投和击倒。

## 启动与测试

在当前游戏目录使用 Node.js 20 或更高版本运行以下命令。项目使用原生浏览器模块和 Node.js 标准库，无需安装依赖。

```sh
npm start
```

在本机浏览器打开 [http://127.0.0.1:8000](http://127.0.0.1:8000)。在启动服务器的终端按 Ctrl+C 可结束服务。运行规则与对局流程测试用 `npm test`。

## 选择玩法

| 模式 | 怎么玩 |
| --- | --- |
| 教学练习 | 从红 5、蓝 6 的贴身局面开始。先试着抱摔护翼的蓝角，再接它从绳边起跳的飞扑。两课均可不限时试招并重摆。 |
| 人机对战 | 玩家指挥红角。蓝角根据站位与已经亮过的牌应对，第一次贴身会护翼，吃过抱摔后会改用突刺试探。 |
| 本地双人 | 两人共用一台电脑。红角锁牌后交给蓝角，蓝角就位后选牌，双方同时揭晓。 |

点击动作卡或按数字键 1–6 可选牌并查看当前射程，锁定前可以改选。滑步还需指定前进或后退，以及移动一格或两格。点击「锁定出招」或按 Enter 提交。正式比赛每人每拍有 15 秒，超时自动提交所选动作，空选时出护翼。音效默认关闭，可在比赛中开启。

失衡累积到 3 点即倒地，对手获得一次击倒。先拿两次击倒者胜，第 12 拍后按总分判胜负，同分平局。完整赛的开场和击倒复位均为红 3、蓝 7，两位选手各有 3 点体力。

## 选手美术与设计

红角「车铃爵士」由 GPT-6 以矢量图绘制。蓝角「返场大王」使用内置 ImageGen 生成，工具未提供具体模型版本。两者共用一套数值、射程与动作规则。[红角角色图](assets/arena/bell-knight.svg) · [蓝角档案立绘](assets/encore-king.webp) · [蓝角场上角色图](assets/arena/encore-king.webp)

六张牌的精确射程、移动优先级、同招裁定和十拍示例见 [V0.4 详细玩法设计](docs/gameplay-spec-v0.4.md)。

<details>
<summary>蓝角两张原画的生成提示词</summary>

**档案立绘**

> Use case: stylized-concept. Asset type: full-body wrestler portrait for a vintage 1960s printed pelican wrestling trading card. 为一场郑重转播的海鸟职业摔角赛，画一只侧身、全身入镜的鹈鹕选手，让人一眼认出长喙、喉囊、双翼和蹼脚。 Blue corner wrestler the Encore King. Full body stocky pelican in left-facing profile, head high, giant unmistakable long golden-orange beak and throat pouch, proud playful small eye with bold eyebrow, creamy white plumage, storm-grey wing tips, brilliant cobalt blue cropped cape and white piping, strong orange webbed feet. Showy wrestler rising in a pre-bout salute. Beautiful vintage sports mascot illustration, four-color hand screenprinted dark teal woodcut ink on warm light cream paper, bright blue cape and mustard bill, slight offset printing, deliberate simple heavy outlines, simple bold shapes and skillful sparse hatching, striking silhouette. Plain warm ivory paper background. Square composition; full character with generous margins. No letters, no numbers, no border, no text, no other objects.

**场上角色图**

> 为一场郑重转播的海鸟职业摔角赛，画一只侧身、全身入镜的鹈鹕选手，让人一眼认出长喙、喉囊、双翼和蹼脚。Single isolated game sprite, actual transparent background and no ground shadow. A punchy 1960s silk-screen wrestling poster illustration of a BLUE corner white pelican wrestler, side profile facing LEFT, beak aimed at left. Full bird including all feet. NAME is Encore King, no lettering. Handsome flamboyant pro wrestler. Bold enormous warm mustard-orange long flat bill and buttery throat pouch, proud white head with a small windswept crest, expressive determined eye, meaty upright cream-white bird body, grey-blue feather tips, theatrical BRIGHT OCEAN BLUE short scalloped, gold-trimmed mantle clasped around shoulders, strong spread webbed orange feet. Wings akimbo in compact ready stance so beak is fully visible and feet grounded. Screen-print flat shadow shapes, very clean bold dark navy ink outlines, subtle woodcut feather hatching, limited solid bleu/orange/parchment palette, no gradients, no noise background, no square border, no props, authentic charming vintage graphic novel mascot, designed to read clearly at 160px high. Dynamic personality and anatomy. One single bird and no other elements, transparent EMPTY surroundings. Fit entire figure tightly on square canvas.

</details>
