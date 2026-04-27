# RepoFlow 开发 Todo

本文档基于 [repoflow_mvp_design.md](/Users/gongjin/Documents/Codespace/repoflow/docs/repoflow_mvp_design.md) 拆解，用于指导 RepoFlow 当前阶段与后续增强阶段开发。当前 `P0-P6` 已完成，本文档现阶段主要用于维护已完成项基线，并指导 `P7-P11` 的后续产品扩展与工程收敛。

## 1. MVP 范围确认

- [x] 只支持 `Node.js`、`Python`、`Go`
- [x] 只支持生成 `GitHub Actions`
- [x] 只输出 `.github/workflows/ci.yml`
- [x] 只做检测、预览、生成、初始化，不做真实执行 CI/CD
- [x] 不实现 Web UI、SaaS、Secrets、部署、Monorepo 编排、AI 修复

## 2. 项目基础搭建

- [x] 初始化 TypeScript CLI 项目
- [x] 安装核心依赖：`commander`、`fs-extra`、`yaml`
- [x] 安装交互依赖：`enquirer` 或 `prompts`
- [x] 安装测试依赖：`vitest`
- [x] 配置 `tsconfig.json`
- [x] 配置构建与启动脚本
- [x] 约定入口文件为 `src/cli.ts`
- [x] 确认 npm 发布所需字段

## 3. 目录结构初始化

- [x] 创建 `src/commands`
- [x] 创建 `src/core`
- [x] 创建 `src/detectors`
- [x] 创建 `src/rules`
- [x] 创建 `src/renderers`
- [x] 创建 `src/utils`
- [x] 创建 `src/__tests__`
- [x] 创建 `fixtures`
- [x] 对齐设计文档中的推荐目录结构

## 4. 类型与核心模型

- [x] 在 `src/core/types.ts` 定义 `RepoScanResult`
- [x] 定义 `LanguageType`
- [x] 定义 `PackageManagerType`
- [x] 定义 `ProjectInfo`
- [x] 定义 `WorkflowStep`
- [x] 定义 `WorkflowJob`
- [x] 定义 `WorkflowConfig`
- [x] 为可选字段和默认值约定统一策略

## 5. Scan 层实现

- [x] 实现 `src/core/scanner.ts`
- [x] 扫描根目录文件列表
- [x] 判断以下关键文件是否存在：
- [x] `package.json`
- [x] `pnpm-lock.yaml`
- [x] `package-lock.json`
- [x] `yarn.lock`
- [x] `requirements.txt`
- [x] `pyproject.toml`
- [x] `poetry.lock`
- [x] `go.mod`
- [x] 支持读取必要配置文件原始内容
- [x] 输出统一的 `RepoScanResult`

## 6. Detect 层实现

### 6.1 Node detector

- [x] 新增 `src/detectors/node-detector.ts`
- [x] 依据 `package.json` 判断 Node 项目
- [x] 识别包管理器：`pnpm` / `npm` / `yarn`
- [x] 提取 `scripts.test`
- [x] 提取 `scripts.build`
- [x] 提取 `engines.node`
- [x] 输出带 `confidence` 的 `ProjectInfo`

### 6.2 Python detector

- [x] 新增 `src/detectors/python-detector.ts`
- [x] 基于 `requirements.txt` / `pyproject.toml` 判断 Python 项目
- [x] 检测是否存在 `poetry.lock`
- [x] 推断包管理器为 `pip` 或 `poetry`
- [x] 输出带 `confidence` 的 `ProjectInfo`

### 6.3 Go detector

- [x] 新增 `src/detectors/go-detector.ts`
- [x] 基于 `go.mod` 判断 Go 项目
- [x] 提取 Go 运行时版本候选
- [x] 输出带 `confidence` 的 `ProjectInfo`

### 6.4 Detector 聚合

- [x] 新增 `src/detectors/index.ts`
- [x] 按顺序执行 `Node -> Python -> Go`
- [x] 选择置信度最高的结果
- [x] 无法识别时返回 `unknown`

## 7. Rules 层实现

### 7.1 Node rules

- [x] 新增 `src/rules/node-rules.ts`
- [x] `npm` 默认安装命令为 `npm ci`
- [x] `pnpm` 默认安装命令为 `pnpm install --frozen-lockfile`
- [x] `yarn` 默认安装命令为 `yarn install --frozen-lockfile`
- [x] 优先使用 `scripts.test`
- [x] 优先使用 `scripts.build`

### 7.2 Python rules

- [x] 新增 `src/rules/python-rules.ts`
- [x] `requirements.txt` 默认安装命令为 `pip install -r requirements.txt`
- [x] 默认测试命令为 `pytest`
- [x] 检测到 `poetry.lock` 时切换 Poetry 模式
- [x] Poetry 模式默认安装命令为 `poetry install --no-interaction`
- [x] Poetry 模式默认测试命令为 `poetry run pytest`
- [x] 默认 Python 运行时版本补全为 `3.11`

### 7.3 Go rules

- [x] 新增 `src/rules/go-rules.ts`
- [x] 默认安装命令为 `go mod download`
- [x] 默认测试命令为 `go test ./...`
- [x] 默认构建命令为 `go build ./...`
- [x] 默认 Go 运行时版本补全为 `1.22`

### 7.4 Rules 聚合

- [x] 新增 `src/rules/index.ts`
- [x] 根据检测结果补全 install / test / build
- [x] 产出可直接渲染的标准化 `ProjectInfo`

## 8. Generate 层实现

- [x] 新增 `src/renderers/github-actions-renderer.ts`
- [x] 支持输出最小 workflow 结构
- [x] 包含 `push` 与 `pull_request` 触发器
- [x] 默认分支先使用 `main`
- [x] 包含 `actions/checkout@v6`
- [x] 根据语言插入对应 setup action
- [x] 渲染 install step
- [x] 渲染 test step
- [x] 在存在构建命令时渲染 build step
- [x] 输出 YAML 字符串
- [x] 新增 `src/renderers/index.ts`

## 9. Engine 与流程编排

- [x] 新增 `src/core/engine.ts`
- [x] 编排 `Detect -> Normalize -> Generate`
- [x] 对外暴露统一方法供命令层复用
- [x] 统一错误处理与异常提示

## 10. CLI 命令实现

### 10.1 detect

- [x] 新增 `src/commands/detect.ts`
- [x] 输出检测结果 JSON
- [x] 覆盖语言、包管理器、命令、CI provider、confidence

### 10.2 preview

- [x] 新增 `src/commands/preview.ts`
- [x] 仅预览 YAML，不写文件
- [x] 在终端打印生成结果

### 10.3 generate

- [x] 新增 `src/commands/generate.ts`
- [x] 写入 `.github/workflows/ci.yml`
- [x] 目录不存在时自动创建
- [x] 文件存在时提示是否覆盖
- [x] 成功后输出文件路径
- [x] 未识别项目时保守失败，不生成兜底 workflow

### 10.4 init

- [x] 新增 `src/commands/init.ts`
- [x] 串联检测、确认、预览、写入
- [x] 支持确认项目类型
- [x] 支持确认默认分支 `main/master`
- [x] 支持确认是否启用 build step
- [x] 支持确认是否覆盖已有 workflow

### 10.5 CLI 入口

- [x] 在 `src/cli.ts` 注册全部命令
- [x] 统一帮助文案和参数说明
- [x] 验证命令可直接运行

## 11. 工具模块

- [x] 新增 `src/utils/fs.ts`
- [x] 新增 `src/utils/logger.ts`
- [x] 新增 `src/utils/yaml.ts`
- [x] 新增 `src/utils/prompts.ts`
- [x] 统一文件写入、日志输出、YAML 序列化、交互封装

## 12. Fixtures 与测试

### 12.1 Fixtures

- [x] 创建 `fixtures/node-npm`
- [x] 创建 `fixtures/node-pnpm`
- [x] 创建 `fixtures/python-basic`
- [x] 创建 `fixtures/go-basic`

### 12.2 单元测试

- [x] 编写 `src/__tests__/scanner.test.ts`
- [x] 编写 `src/__tests__/detectors.test.ts`
- [x] 编写 `src/__tests__/renderer.test.ts`
- [x] 覆盖 Node / Python / Go 基础识别
- [x] 覆盖命令推断逻辑
- [x] 覆盖 YAML 关键结构输出

### 12.3 集成验证

- [x] 验证 `repoflow detect`
- [x] 验证 `repoflow preview`
- [x] 验证 `repoflow generate`
- [x] 验证已有文件覆盖提示
- [x] 验证 `repoflow init`
- [x] 验证 `init` 的默认分支与 build step 交互

## 13. 文档与发布准备

- [x] 编写 `README.md`
- [x] 补充项目介绍与定位
- [x] 补充安装方式
- [x] 补充使用示例
- [x] 补充当前支持范围
- [x] 补充 Roadmap
- [x] 检查 `LICENSE`
- [x] 整理 npm 发布流程
- [x] 补充 npm 发布元数据：`repository`、`homepage`、`bugs`

## 14. 建议开发顺序

- [x] 第 1 阶段：类型定义、`scanner`、`node-detector`、`github-actions-renderer`
- [x] 第 2 阶段：`python-detector`、`go-detector`、`preview`、`generate`、覆盖确认
- [x] 第 3 阶段：`init`、fixtures、测试、README、npm 发布

## 15. MVP 验收标准

- [x] 能识别 `Node / Python / Go`
- [x] 能输出统一的 `ProjectInfo`
- [x] 能生成基础 GitHub Actions workflow
- [x] 能预览而不写入文件
- [x] 能安全覆盖已有 workflow
- [x] CLI 可安装并运行
- [x] 具备基础测试与 fixtures
- [x] README 足够支撑开源使用

## 16. 当前优先级建议

建议按照以下优先级推进，避免过早扩展：

- [x] P0：类型、扫描、Node 检测、GitHub Actions 渲染、`detect`
- [x] P1：Python/Go 检测、规则补全、`preview`、`generate`
- [x] P2：交互式 `init`、测试完善、README、发布准备
- [x] P3：框架识别、命令增强、框架 fixtures
- [x] P4：npm 包治理、发布前检查、回归体系
- [x] P5：增强型 workflow 模板、cache、lint 交互
- [x] P6：增强模板第二阶段
- [ ] P7：识别范围扩展
- [ ] P8：模板能力体系化
- [ ] P9：发布与回归自动化补强
- [ ] P10：GitHub Actions CD 初步支持
- [ ] P11：多平台扩展评估

## 17. P3：框架级识别与命令增强

### 17.1 类型与输出

- [x] 在 `src/core/types.ts` 明确 `framework` 字段约定
- [x] 约定首批框架值：`nextjs`、`vite`、`fastapi`、`gin`
- [x] 让 `repoflow detect` 输出 `framework`

### 17.2 Detector 扩展

- [x] 在 `node-detector` 中识别 `Next.js`
- [x] 在 `node-detector` 中识别 `Vite`
- [x] 在 `python-detector` 中识别 `FastAPI`
- [x] 在 `go-detector` 中识别 `Gin`
- [x] 保持“轻量文件/依赖特征识别”，不引入 AST 解析

### 17.3 Rules 与命令补全

- [x] 继续优先使用用户现有 `test/build` 脚本
- [x] 仅在命令缺省时参考框架特征补全命令
- [x] 不因框架识别覆盖用户已声明命令
- [x] 在 `rules` 层保留框架感知命令扩展入口

### 17.4 Fixtures 与测试

- [x] 创建 `fixtures/node-nextjs`
- [x] 创建 `fixtures/node-vite`
- [x] 创建 `fixtures/python-fastapi`
- [x] 创建 `fixtures/go-gin`
- [x] 补充 `detectors.test.ts` 的框架识别断言
- [x] 补充 `cli.test.ts` 的框架 fixture 场景
- [x] 验证无框架特征时不影响原有识别链路

## 18. P4：发布质量与回归体系

### 18.1 npm 包内容治理

- [x] 在 `package.json` 增加 `files` 白名单
- [x] 验证 tarball 不包含测试源码、fixtures、规划文档
- [x] 更新 README 中的发布包说明

### 18.2 发布前检查

- [x] 新增发布前检查脚本或命令集合
- [x] 固定检查项：`npm test`
- [x] 固定检查项：`npm run build`
- [x] 固定检查项：`npm pack --dry-run`
- [x] 在 README 或文档中固化发布 checklist

### 18.3 回归体系

- [x] 增加更接近真实仓库的 fixture 组合
- [x] 补覆盖已有 workflow 的交互回归
- [x] 把本仓库 GitHub Actions 作为持续回归基线
- [x] 确保 README 中的开发说明和 CI 行为一致

## 19. P5：增强型 GitHub Actions 模板

### 19.1 Workflow 选项扩展

- [x] 扩展 workflow 选项结构，支持最小模板与增强模板组合
- [x] 保持默认 `preview/generate` 输出仍为最小 workflow
- [x] 仅在 `init` 中暴露增强模板交互

### 19.2 Cache 能力

- [x] 为 Node 增加依赖缓存选项
- [x] 为 Python 增加依赖缓存选项
- [x] 为 Go 增加 module 缓存选项
- [x] 确保 cache step 或 setup 配置顺序稳定

### 19.3 Lint 能力

- [x] 增加可选 lint step
- [x] 仅在存在合理 lint 命令时启用对应交互
- [x] 确保 lint 位于 install 之后、test 之前

### 19.4 测试与文档

- [x] 补充 `renderer.test.ts` 的增强模板断言
- [x] 补充 `cli.test.ts` 的 `init` 增强交互断言
- [x] 在 README 中说明默认最小模板与 `init` 增强能力的区别

## 20. P6：增强模板第二阶段

### 20.1 Cache 增强

- [x] 为 Poetry 增加保守的 cache 支持
- [x] 明确 Poetry cache 的暴露条件与交互边界
- [x] 验证新增 cache 不影响默认最小模板输出

### 20.2 Lint 增强

- [x] 为 Python 增加可选 lint 交互
- [x] 仅在存在合理工具特征时暴露 Python lint
- [x] 为 Go 增加可选 lint 交互
- [x] 仅在存在合理工具特征时暴露 Go lint
- [x] 继续保证 lint 位于 install 之后、test 之前

### 20.3 `init` 交互优化

- [x] 强化 `init` 中“最小模板 / 增强模板”的交互表达
- [x] 保持不引入与 `generate` 分叉的第二条生成链路
- [x] 确保未选择增强项时输出尽量等同最小模板

### 20.4 测试与文档

- [x] 增加增强模板 fixtures
- [x] 补充 Python / Go / Poetry 增强路径测试
- [x] 在 README 中补充增强模板使用建议

## 21. P7：识别范围扩展

### 21.1 Node 框架扩展

- [ ] 评估并补充 `NestJS`
- [ ] 评估并补充 `Nuxt`
- [ ] 保持轻量依赖 / 文件特征识别

### 21.2 Python / Go 框架扩展

- [ ] 评估并补充 `Django`
- [ ] 评估并补充 `Flask`
- [ ] 评估新的 Go 主流框架识别候选

### 21.3 能力识别扩展

- [ ] 识别更多 lint 工具特征
- [ ] 识别更多 test 工具特征
- [ ] 在 `rules` 层补更保守的默认命令

### 21.4 Fixtures 与测试

- [ ] 增加更多真实仓库 fixtures
- [ ] 增加同语言不同框架的区分测试
- [ ] 验证新增识别不影响已有纯语言主路径

## 22. P8：模板能力体系化

### 22.1 模板能力整理

- [ ] 归纳 workflow capability，例如 `cache`、`lint`、`build`
- [ ] 梳理现有 `WorkflowOptions` 是否需要整理
- [ ] 保持 renderer 侧显式映射，不引入复杂插件系统

### 22.2 模板档位

- [ ] 评估模板 profile，例如 `minimal`、`enhanced`
- [ ] 在 `init` 中重组模板选择交互
- [ ] 评估是否需要有限的非交互模板选择入口

### 22.3 测试与回归

- [ ] 补模板差异回归测试
- [ ] 验证模板档位不会破坏当前默认行为
- [ ] 更新 README 与文档中的模板说明

## 23. P9：发布与回归自动化补强

### 23.1 发布自动化

- [ ] 增加自动 release workflow
- [ ] 增加发布前后 smoke check
- [ ] 对齐 release 文档与自动流程

### 23.2 回归自动化

- [ ] 扩充 fixture matrix
- [ ] 在 CI 中补充 pack / install / CLI 基础验证
- [ ] 减少对手工发布检查的依赖

### 23.3 文档与可维护性

- [ ] 确保 README / `docs/release.md` 与实际流程一致
- [ ] 固化自动化发布与回归的维护边界

## 24. P10：GitHub Actions CD 初步支持

### 24.1 Release workflow

- [ ] 评估并生成第二类 workflow，例如 `release.yml`
- [ ] 支持最小 npm publish workflow 骨架
- [ ] 支持最小 GitHub Release workflow 骨架
- [ ] 明确 tag / branch / 手动触发的保守边界

### 24.2 Deploy / publish 骨架

- [ ] 评估 Docker build / publish 的最小支持形态
- [ ] 明确哪些场景只生成骨架、不接管平台细节
- [ ] 保持不接管 secrets、云资源与复杂环境编排

### 24.3 Workflow 组织

- [ ] 明确 `ci.yml` 与 `release.yml` / `deploy.yml` 的职责划分
- [ ] 保持 workflow 命名、路径和 trigger 结构稳定
- [ ] 补充 CI / CD 多 workflow 场景测试

## 25. P11：多平台扩展评估

### 25.1 CI 平台评估

- [ ] 评估第二个 CI provider，例如 GitLab CI
- [ ] 判断多平台支持的收益与复杂度

### 25.2 相关场景评估

- [ ] 评估 Dockerfile 生成功能价值
- [ ] 评估 Monorepo 最小支持形态
- [ ] 输出最小 spike 或设计草案

### 25.3 方向决策

- [ ] 明确是否继续深耕 GitHub Actions
- [ ] 如扩展平台，给出后续阶段的设计输入
