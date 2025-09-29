# Tank City One · 纯 CSS 坦克大战

Tank City One 是一款运行在浏览器中的俯视视角坦克对战小游戏，灵感来自经典《Battle City》。所有单位与场景均由纯 CSS 绘制，无需图片素材。项目以数据驱动方式构建关卡，仅通过调整配置即可扩展地图与敌军脚本。

## 功能概览

- 📦 **纯 CSS 资产**：坦克、子弹、砖墙、钢板、水面、树林等全部由 CSS 绘制。
- 🧭 **数据驱动关卡**：`src/data/levels.js` 中定义网格布局、玩家出生点、敌军生成时间/位置/类型。
- 🧠 **基础 AI 与战斗循环**：敌军按时间轴生成，随机巡逻、射击；支持砖墙破坏、基地摧毁、胜利/失败判定。
- 🎯 **双关卡演示**：提供“城墙守卫”“钢铁迷阵”两张难度递进的示例关卡。
- 🛠️ **无构建依赖**：纯原生 HTML/CSS/ESM，直接打开 `index.html` 即可游玩。

## 快速开始

1. 直接双击 `index.html` （或使用 VS Code 的 Live Server）即可本地游玩。
2. 若需要本地服务器，可执行：

   ```bash
   npx serve
   ```

   然后在浏览器访问终端提示的地址。

## 操作说明

- 方向键 / WASD：移动
- 空格：发射炮弹
- Enter / P：暂停 / 继续（在覆盖层上也可直接回车确认）
- 目标：消灭全部敌军，保护基地不被摧毁

## 关卡与数据结构

`src/data/levels.js` 示例：

```js
{
  id: "level-1",
  stage: 1,
  layout: [
    "..S...S...S..",
    "..S.......S..",
    // ... 共 13x13 网格
  ],
  player: {
    lives: 3,
    spawn: { x: 6, y: 11, facing: "up" },
  },
  enemySpawns: [
    { id: "north-west", x: 1, y: 0 },
    { id: "north", x: 6, y: 0 },
    { id: "north-east", x: 11, y: 0 },
  ],
  enemyPlan: [
    { time: 0, type: "grunt", spawn: "north" },
    { time: 30, type: "armor", spawn: "north-east" },
    // ... 时间轴单位生成脚本
  ],
}
```

- `layout`：使用字符描述网格元素（`.` 空地、`B` 砖、`S` 钢板、`W` 水等）。
- `enemyPlan`：按秒为单位的时间轴，描述敌军生成的时间、类型与出生点。
- `enemySpawns`：以 `id` 标识生成点，供 `enemyPlan` 引用。

扩展新关卡只需新增一个对象，无需触及引擎代码。

## 代码结构

```
src/
├─ engine/
│  ├─ game.js          // 主循环、状态机、敌军/子弹处理
│  ├─ input.js         // 键盘输入收集
│  └─ tilemap.js       // 网格表示与砖墙破坏逻辑
├─ entities/
│  ├─ tank.js          // 坦克实体（玩家 & 敌人）
│  └─ bullet.js        // 子弹实体
├─ data/
│  ├─ levels.js        // 数据驱动关卡
│  ├─ enemies.js       // 敌方类型属性表
│  └─ tiles.js         // 网格字符与行为映射
└─ main.js             // 启动入口、UI 桥接
```

## 后续扩展建议

- 增加更多地形（例如道路、道具、随机掉落）。
- 引入关卡编辑器，将 `layout`/`enemyPlan` 可视化。
- 丰富敌军 AI，例如追踪玩家、分波进攻。
- 添加音效与爆炸动画（仍可通过 CSS / Web Audio 实现）。

欢迎在此基础上继续扩展属于你的坦克城冒险！
