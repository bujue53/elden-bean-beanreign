# ELDEN BEAN: BEANREIGN（黑夜豆临）

单人 3D BOSS 战小游戏：选择职业，在黑夜竞技场挑战 **黑夜王 布德奇冥（Heolstor）**。现已替换为参考原作形象制作的四个 Blender 人形角色和 BOSS。

使用 JavaScript、Three.js 和 WebAudio，直接在浏览器运行，无需 Unity 编辑器。玩家与 BOSS 模型由 Blender 制作并导出为 GLB；场景、特效和音效由代码生成。模型与 Three.js 随仓库提供，无需加载 CDN。

## Blender 人形角色

![四职业 Blender 模型](docs/models/lineup.png)

四个可选角色参考万代南梦宫官方角色图重新制作：执刑者的青铜覆面甲与武士刀、守护者的鸟首银甲与长戟大盾、无赖的角盔毛皮与巨斧、隐士的尖帽银发与紫黑长袍。角色改为人形比例，职业数值和操作规则沿用本作。

这是基于参考图重建的轻量风格化初版，并非官方原版模型，也不是原版精度的一比一复刻。BOSS 已替换为参考原作布德奇冥游戏画面制作的尖冠黑甲、紫色破披风与巨剑模型。

可编辑源文件：[nightfarers.blend](assets/blender/nightfarers.blend)。参考来源、模型数据及重新导出方法见 [模型说明](docs/MODELS.md)。玩家只需下载游戏，不需要安装 Blender。

## 下载与运行

### Windows 便携版 0.0.1（推荐游玩）

前往 **[Releases 下载页](https://github.com/bujue53/elden-bean-beanreign/releases/tag/v0.0.1)**，下载 `ELDEN-BEAN-BEANREIGN-0.0.1-win-x64.zip`，完整解压后双击 **ELDEN BEAN.exe**。

游戏在独立窗口中运行，可离线游玩，无需安装 Node.js、Unity 或 Blender。F11 或 Alt+Enter 切换全屏，关闭窗口退出。请保留解压目录中的所有文件；不要只发送 EXE。支持 Windows 10/11 64 位，需支持 WebGL 2 的显卡、键盘和鼠标。完整说明见 [Windows 游玩说明](docs/WINDOWS-README.txt)。

### 网页源码版

1. 点击本仓库 **Code → Download ZIP** 并解压，或克隆仓库：

   ```bash
   git clone https://github.com/bujue53/elden-bean-beanreign.git
   cd elden-bean-beanreign
   ```

2. 安装 [Node.js](https://nodejs.org/)（18 或以上）。
3. Windows 双击 **start.bat**；也可以在项目目录执行：

   ```bash
   npm start
   # 或者：node server.js
   ```

4. 浏览器自动打开；若没有打开，访问终端显示的地址，默认 **http://localhost:8123**。

无需 `npm install`。端口被占用时最多向后尝试 20 个端口。服务器只监听本机，按 `Ctrl+C` 停止。只启动服务、不自动打开浏览器可执行 `node server.js --no-open`。

必须通过 HTTP 服务访问；直接双击 `index.html` 会受到浏览器模块加载限制。需要支持 WebGL 2 的桌面浏览器及键盘、鼠标。建议窗口至少 1280 × 720；暂不支持手机触屏和手柄操作。

## 开始游戏

1. 标题页按 **Enter**。
2. 按 **← / →** 选择职业，再按 **Enter** 确认；也可以直接点击职业卡片。
3. 进入竞技场后，**点击画面**启用鼠标视角，战斗才会开始。
4. 按 **E** 锁定 BOSS，移动接近并攻击。锁定时 W 前进、S 后退、A/D 环绕。

## 操作说明

| 操作 | 按键 / 方法 |
| --- | --- |
| 移动 | **W / A / S / D** |
| 调整视角 | 移动鼠标；锁定敌人时自动跟随目标 |
| 轻击 / 连段 | **鼠标左键**；隐士发射远程法术，其他职业近战，长按不会自动连打 |
| 蓄力重击 | **按住鼠标右键，松开释放**；近战蓄力提高伤害 |
| 隐士蓄力弹幕 | **按住鼠标右键，松开发射**；蓄力提高远程弹体大小与伤害 |
| 翻滚 | **轻点 Shift**；配合移动方向，无方向输入时向后滚 |
| 冲刺 | **方向移动 + 按住 Shift**；按下时先翻滚，随后持续冲刺 |
| 跳跃 / 跳劈 | **空格**跳跃；跳起后点击左键跳劈，隐士仍发射法术 |
| 冲刺攻击 | 冲刺移动时点击左键；隐士仍发射法术 |
| 恢复生命 | **R**，每次挑战有 4 瓶；饮用需要时间，会被受击打断 |
| 处决 | BOSS 破韧失衡后，**靠近正面并面对 BOSS，点击左键** |
| 锁定 / 解除锁定 | **E** 或 **鼠标中键** |
| 暂停 / 继续 | **Esc**，或点击暂停菜单的“继续游戏” |
| 重新挑战 | 暂停菜单 → **重新挑战 BOSS**，双方状态重置 |
| 返回标题 | 暂停菜单 → **返回标题** |
| 死亡后复活 | **R**；恢复生命、精力和 4 瓶药，**保留 BOSS 剩余血量** |
| 胜利后返回标题 | **Enter** |

浏览器捕获鼠标后，用 Esc 可释放。若环境不支持捕获，会自动使用窗口内鼠标视角。切换窗口或标签页会自动暂停，回来后点击“继续游戏”。

## 四种职业

| 职业 | HP | 精力 | 攻击倍率 | 特点 |
| --- | ---: | ---: | ---: | --- |
| 执刑者 | 620 | 100 | ×1.25 | 青铜甲武士刀；高伤害、较大近战范围 |
| 守护者 | 820 | 100 | ×0.90 | 鸟首、长戟、大盾；生命最多，盾牌无格挡功能 |
| 无赖 | 500 | 110 | ×0.65 | 角盔毛皮巨斧；保留本作速度与四段连击设定 |
| 隐士 | 560 | 100 | ×0.85 | 银发尖帽法师；左键远程法术，右键远程蓄力弹 |

## 战斗提示

- BOSS 初始生命 3600，低于 38% 时进入二阶段，可能施放扩散波、陨石与“开天”。
- 攻击、翻滚、冲刺消耗精力；停止攻击和冲刺可以恢复。留精力用于翻滚。
- 翻滚短暂无敌，普通受伤后有 0.75 秒保护。跳跃可躲贴地波，陨石应离开落点。
- 蓄力会被受击打断，等待 BOSS 出招后的空隙再用重击。
- 攻击能打出 BOSS 破韧硬直。提示“处决时机”后，靠近正面点击左键：角色用处决刀刺入、停顿，再缓慢拔出，分别造成两段伤害。全程约 3.2 秒，BOSS 不能行动，玩家也不会被打断；结束后恢复正常操作。
- 隐士在地面、冲刺或空中左键攻击都发射远程法术；右键仍是远程蓄力弹。法术只有弹体实际命中才造成伤害。处决属于单独的近身特殊交互。
- 打不过可以按 R 继续消耗 BOSS 生命；想从头练习，用暂停菜单重新挑战。
- 只有竞技场 BOSS 战，无存档、探索关卡或多人联机；刷新会重置进度。

## 可玩性验证

验证日期：**2026-10-16**。当前版本完成 **28 项基础浏览器回归 + 24 项战斗专项检查 + 7 项模型与服务器检查**。最新改动和处决演示见 [战斗更新说明](docs/COMBAT.md)。

完整战斗结果、修复内容及测试限制见 **[可玩性验证记录](docs/PLAYABILITY.md)**。功能回归中的场景构造与正常操作通关分开记录。

服务器测试：

```bash
npm test
```

浏览器回归：启动服务，打开 `http://localhost:8123/?debug`，在开发者工具 Console 执行：

```javascript
await (await import('/tests/browser-smoke.js')).run()
```

R 喝药、隐士远程攻击、两段处决专项检查：

```javascript
await (await import('/tests/combat-features.js')).run()
```

正常按键战斗脚本：在同一个调试网址的**标题界面**执行：

```javascript
await (await import('/tests/playthrough.js')).run()
```

测试会重置对局。战斗脚本只读取调试快照，通过按键和鼠标事件战斗，不修改血量、位置；请保持测试页面前台。普通网址不暴露 `window.__game` 调试接口。

## 文件结构

```text
index.html              入口与菜单
css/style.css           界面样式
js/game.js              战斗、BOSS AI、相机和特效
js/characters.js        职业设定、BOSS 与旧版程序模型
js/nightfarers.js       Blender GLB 加载与关节适配
js/textures.js          程序化贴图
js/audio.js             音效与音乐
lib/                    Three.js r185、GLTFLoader 与许可
assets/models/          游戏使用的 GLB 模型与数据清单
assets/blender/         可编辑 Blender 源文件
assets/portraits/       从模型渲染的选角图
tools/                  Blender 建模与肖像渲染脚本
server.js               本地静态服务器
start.bat               Windows 一键启动
desktop/                Windows 窗口与离线资源加载
tests/                 服务器、浏览器回归及战斗脚本
docs/PLAYABILITY.md    验证记录
```

## 构建 Windows 版本

开发构建需要 Windows 与 Node.js 22.12 或以上（建议 Node.js 24）。玩家使用 Release 包无需安装 Node.js。

```bash
npm ci
npm run build:win
```

输出到 `dist/`，包括可直接运行的游戏文件夹与 Release ZIP。打包包含 Electron 44.8.0 运行环境、五个 GLB 和游戏素材；不含 Blender 源文件、参考图、视频或开发依赖。构建工具会从 Electron 官方下载运行环境。

开发时用 `npx install-electron` 下载运行环境，再运行 `npm run desktop`。桌面版采用隔离沙箱和本地资源协议，无需启动 HTTP 服务器。打包验证记录见 [Windows 版本验证](docs/WINDOWS.md)。

## 致谢

创意致敬 [ELDEN BEAN（tomoko-fureimu）](https://tomoko-fureimu.itch.io/beanreign) 和《艾尔登法环：黑夜君临》。本项目为非官方同人学习作品，与原作者、FromSoftware 或 Bandai Namco 无隶属关系。

依赖 **[Three.js r185](https://github.com/mrdoob/three.js/tree/r185)**，MIT 许可，见 [lib/THREE-LICENSE.txt](lib/THREE-LICENSE.txt)。此许可适用于 Three.js；仓库未另外指定项目代码的开源许可。
