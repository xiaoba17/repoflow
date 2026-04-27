# RepoFlow 阶段计划

本文档用于定义 RepoFlow 当前与后续阶段的划分、每阶段目标、包含范围与验收标准。当前 `P0-P6` 已完成，其中 `P0-P2` 为 MVP 与开源首发阶段，`P3-P6` 为第一轮产品增强阶段；`P7-P11` 为后续待推进阶段。任务明细请参考 [todo.md](/Users/gongjin/Documents/Codespace/repoflow/docs/todo.md)。

## 阶段总览

当前路线分为 12 个阶段：

- `P0`：跑通最小主链路
- `P1`：补齐 MVP 支持范围
- `P2`：完善交互、测试与发布能力
- `P3`：框架级识别与命令增强
- `P4`：发布质量与回归体系
- `P5`：增强型 GitHub Actions 模板
- `P6`：增强模板第二阶段
- `P7`：识别范围扩展
- `P8`：模板能力体系化
- `P9`：发布与回归自动化补强
- `P10`：GitHub Actions CD 初步支持
- `P11`：多平台扩展评估

## P0：跑通最小主链路

### 阶段目标

先做出一个最小可用版本，能够识别基础 Node 项目，并预览 GitHub Actions CI 配置。

### 包含范围

- 工程与 CLI 基础搭建
- 目录结构初始化
- 核心类型定义
- `scanner`
- `node-detector`
- `node-rules`
- `github-actions-renderer`
- `engine`
- `detect` 命令
- `preview` 命令

### 关键产出

- 可运行的 TypeScript CLI 项目骨架
- 统一的 `ProjectInfo` 和 `WorkflowConfig`
- 能识别 Node 项目的检测链路
- 能在终端预览 GitHub Actions YAML

### 验收标准

- 能识别一个标准 Node 项目
- 能输出统一 `ProjectInfo`
- 能生成并预览 GitHub Actions YAML
- `repoflow detect` 可运行
- `repoflow preview` 可运行

## P1：补齐 MVP 支持范围

### 阶段目标

把设计文档承诺的 MVP 能力补完整，让 RepoFlow 真正支持三类项目，并能写入 workflow 文件。

### 包含范围

- `python-detector`
- `go-detector`
- `python-rules`
- `go-rules`
- detector 聚合
- rules 聚合
- `generate` 命令
- 覆盖确认逻辑
- `.github/workflows/ci.yml` 写入逻辑

### 关键产出

- 支持 `Node / Python / Go`
- 完整的 Detect -> Normalize -> Generate 链路
- 能把 CI workflow 写入仓库
- 已有 workflow 的安全覆盖能力

### 验收标准

- 能识别 `Node / Python / Go`
- 能补全 install / test / build 命令
- 能生成基础 GitHub Actions workflow
- `repoflow generate` 可运行
- 已有文件时可提示是否覆盖

## P2：完善交互、测试与发布能力

### 阶段目标

把项目从“能用”推进到“可维护、可开源发布”。

### 包含范围

- `init` 命令
- 交互确认项目类型
- 交互确认默认分支 `main/master`
- 交互确认 build step
- 交互确认覆盖行为
- fixtures
- 单元测试
- 集成验证
- `README.md`
- npm 发布准备

### 关键产出

- 完整交互式初始化流程
- 用于回归验证的 fixtures 与测试
- 对外可读的 README
- 可发布的初版项目形态

### 验收标准

- `repoflow init` 可串联完整流程
- 核心能力具备基础测试覆盖
- README 足以支撑外部用户安装和使用
- 项目具备初版 npm 发布条件

## P3：框架级识别与命令增强

### 阶段目标

把 RepoFlow 从“识别语言”提升到“识别真实项目形态”，让 `detect / preview / generate / init` 对常见框架仓库给出更贴合的结果。

### 包含范围

- 在 `ProjectInfo` 中稳定启用 `framework`
- Node 框架识别：`Next.js`、`Vite`
- Python 框架识别：`FastAPI`
- Go 框架识别：`Gin`
- 轻量依赖/文件特征识别，不做 AST 解析
- 在不覆盖用户现有脚本的前提下补全更贴合的缺省命令
- 补充框架 fixtures 与回归测试

### 关键产出

- `detect` 输出 `framework`
- 框架仓库的 `preview / generate / init` 结果更贴合实际工程
- 对应语言的命令补全仍保持保守策略
- 新增框架样例仓库供回归验证

### 验收标准

- 至少能识别 `nextjs`、`vite`、`fastapi`、`gin`
- 无框架特征时不影响现有 `Node / Python / Go` 纯语言识别
- 不因识别到框架而覆盖用户已声明的 `test / build` 命令
- 测试覆盖框架识别与命令补全场景

## P4：发布质量与回归体系

### 阶段目标

把项目从“可发布”推进到“可持续发布”，让发布包内容、发布前检查和回归基线更加稳定。

### 包含范围

- `package.json` 增加 `files` 白名单
- 收紧 npm tarball 内容
- 增加发布前检查脚本或明确的发布 checklist
- 完善 fixtures 组合，覆盖更多真实仓库变体
- 用 GitHub Actions 持续验证本仓库 build/test 主链路

### 关键产出

- 可解释的 npm 包内容清单
- 固定的发布前检查流程
- 更接近真实项目的 fixture 集
- 回归验证不再只依赖手工 spot check

### 验收标准

- `npm pack --dry-run` 的输出清晰且不包含无关源码/文档
- README 的开发/发布说明与实际命令一致
- 测试能覆盖主要框架与已有语言主路径
- 本仓库 GitHub Actions 可持续验证 `test + build`

## P5：增强型 GitHub Actions 模板

### 阶段目标

在不破坏“最小 workflow”定位的前提下，为 `init` 提供更实用的可选模板增强。

### 包含范围

- 默认 `preview / generate` 保持最小模板
- `init` 按选择增加依赖缓存
- Node 依赖缓存
- Python 依赖缓存
- Go module 缓存
- 可选 lint step
- renderer 内部支持最小模板与增强模板组合

### 关键产出

- 仍然简洁的默认输出
- 仅在交互场景暴露增强选项
- 不同语言的 step 顺序稳定、可预测
- 增强模板具备独立测试覆盖

### 验收标准

- 默认 `preview / generate` 输出复杂度不明显增加
- `init` 可生成带 cache 或 lint 的增强 workflow
- 增强 step 顺序固定且不会破坏原有 install/test/build 链路
- renderer 与 CLI 测试覆盖增强模板路径

## P6：增强模板第二阶段

### 阶段目标

在 `P5` 已有增强模板基础上，继续补齐更常见、但仍保持保守边界的 workflow 增强能力。

### 包含范围

- Poetry cache 支持
- Python lint 支持
- Go lint 支持
- `init` 中强化“最小模板 / 增强模板”的交互表达
- 补充更多增强模板 fixtures 与回归测试
- README 补充增强模板使用建议

### 关键产出

- `init` 生成的增强模板覆盖更多常见项目形态
- Python / Go 项目也具备更合理的 lint 增强路径
- 增强交互仍以“有明确依据才暴露”为原则

### 验收标准

- `preview / generate` 默认输出仍保持最小模板
- Poetry 项目可在合适条件下启用 cache
- Python / Go 仅在存在合理特征时暴露 lint 交互
- 新增增强项不会打乱 install/lint/test/build 的固定顺序

## P7：识别范围扩展

### 阶段目标

把 RepoFlow 对“真实仓库形态”的理解继续做广，但保持轻量识别，不引入 AST 或复杂源码分析。

### 包含范围

- Node 新增框架识别，例如 `NestJS`、`Nuxt`
- Python 新增框架识别，例如 `Django`、`Flask`
- Go 评估并补充新的主流框架识别
- 识别更多可观察能力，例如 lint 工具与测试工具特征
- 在 `rules` 层补充更保守的默认命令
- 增加更多真实仓库 fixtures

### 关键产出

- `detect` 输出更贴近真实项目
- `init` 与增强模板交互具备更充分的识别依据
- 同语言不同项目形态的区分更准确

### 验收标准

- 新增识别不影响现有纯语言识别链路
- 不覆盖用户已声明的脚本与命令
- 识别仍以依赖、配置和关键文件为主
- fixtures 与测试可覆盖同语言不同框架的分歧场景

## P8：模板能力体系化

### 阶段目标

将当前零散的 workflow 增强项整理成更稳定、可扩展的模板能力体系，为后续新增质量能力打基础。

### 包含范围

- 归纳 workflow capability，例如 `cache`、`lint`、`build`
- 评估并定义模板 profile，例如 `minimal`、`enhanced`
- 在 `init` 中重组模板相关交互
- 评估是否需要有限的非交互模板选择入口
- 补充模板差异回归测试

### 关键产出

- 模板能力从分散布尔开关演进为更可理解的模板档位
- renderer 内部组织更清晰
- 后续新增能力时更不容易失控

### 验收标准

- 不破坏当前最小模板默认行为
- `init` 的模板选择心智更清晰
- renderer 仍保持显式映射，不引入复杂插件或注册器
- 模板差异具备稳定测试覆盖

## P9：发布与回归自动化补强

### 阶段目标

把当前“可持续发布”的基础流程进一步自动化，降低后续维护与发版成本。

### 包含范围

- 自动 release workflow
- 发布前后 smoke check
- fixture matrix 扩充与自动回归组合
- CI 中补充 pack / install / CLI 基础验证
- 对齐 README 与 release 文档中的发布流程

### 关键产出

- 更自动化的版本发布链路
- 更稳定的回归验证基线
- 对外发布结果更可预测

### 验收标准

- 发布前关键检查可由 CI 自动执行
- npm 包内容与 CLI 基础行为可持续验证
- README / release 文档与自动流程保持一致
- 发布不再主要依赖手工 spot check

## P10：GitHub Actions CD 初步支持

### 阶段目标

在保持单平台、保守输出和脚手架定位的前提下，让 RepoFlow 从“CI 生成器”迈向“GitHub Actions 下的最小 CD 辅助工具”。

### 包含范围

- 继续只支持 GitHub Actions
- 评估并生成第二类 workflow，例如 `release.yml` 或 `deploy.yml`
- 优先支持明确、收敛的 CD 场景，例如 npm publish、GitHub Release
- 评估 Docker build / publish 的最小骨架能力
- 明确 CD 场景下的 trigger、job 命名与文件职责边界

### 关键产出

- RepoFlow 首次支持生成最小 CD workflow 骨架
- `ci.yml` 与 `release.yml` / `deploy.yml` 的职责边界更清晰
- GitHub Actions 下的 CI / CD 路线形成连续产品能力

### 验收标准

- 不破坏当前 `.github/workflows/ci.yml` 主路径
- CD 能力以少量清晰场景为主，不扩张到复杂部署编排
- 不接管 secrets、云资源配置或复杂环境编排
- 新增 workflow 结构与命名保持可预测

## P11：多平台扩展评估

### 阶段目标

在 GitHub Actions 下已经形成更完整 CI / CD 能力模型后，再评估 RepoFlow 是否值得进入多平台与更复杂场景支持。

### 包含范围

- 评估第二个 CI provider，例如 GitLab CI
- 评估 Dockerfile 生成价值
- 评估 Monorepo 最小支持形态
- 输出最小 spike 或设计草案，不大规模实现

### 关键产出

- 更明确的中长期平台方向判断
- 是否继续深耕 GitHub Actions 的取舍依据
- 若扩展平台，具备初步设计基线

### 验收标准

- 有清晰的结论或取舍说明
- 不因探索破坏现有主链路
- 不提前引入复杂平台抽象
- 能为下一阶段提供稳定决策输入

## 推荐执行顺序

建议按 `P0 -> P1 -> P2 -> P3 -> P4 -> P5 -> P6 -> P7 -> P8 -> P9 -> P10 -> P11` 推进，不在前一阶段未闭环时提前展开下一阶段。

原因如下：

- `P0` 解决“主链路是否成立”
- `P1` 解决“支持范围是否达标”
- `P2` 解决“工程质量是否足以上线/开源”
- `P3` 解决“是否更懂真实项目”
- `P4` 解决“是否具备稳定发布与回归”
- `P5` 解决“是否能在保守默认值上提供更实用模板”
- `P6` 解决“增强模板是否足够覆盖常见使用场景”
- `P7` 解决“是否能进一步识别更多真实项目形态”
- `P8` 解决“模板能力是否仍然清晰、可维护”
- `P9` 解决“发布与回归是否足够自动化”
- `P10` 解决“是否能在 GitHub Actions 下补上最小 CD 能力”
- `P11` 解决“是否值得进入多平台和更复杂场景”

## 当前建议

当前阶段状态如下：

- `P0`：已完成
- `P1`：已完成
- `P2`：已完成
- `P3`：已完成
- `P4`：已完成
- `P5`：已完成
- `P6`：已完成
- `P7`：未开始
- `P8`：未开始
- `P9`：未开始
- `P10`：未开始
- `P11`：未开始

当前建议优先进入 `P7`，在保持增强模板边界清晰的前提下，继续扩展对真实仓库形态的识别能力：

- 保持 `preview / generate` 默认输出仍为最小模板
- 保持 `init` 中最小模板与增强模板的分层表达
- 在 `P7` 中优先扩展更多可观察的语言 / 框架 / lint 工具特征
- 避免识别增强反向破坏当前 `P6` 已稳定的模板交互
- 在单平台下补齐更完整 CI / CD 能力后，再进入多平台评估
