---
tags:
  - AI
modified: 2026-05-27
created: 2026-05-27
---
# 个人 AI 开发工作流终局架构日志：基于“人类控制权”的分级认知路由

## 1. 架构哲学与终局边界（The Core Philosophy）
本架构拒绝屈从于大厂兜售的“End-to-End 全自动化 Agent Loop”神话，核心设计逻辑基于**“责任与控制力对等”**的控制论铁律。由于 AI 模型本质是基于概率的无机算力集合，不承担任何物理世界的工程事故责任，因此本架构通过**“物理文件隔离 + 离散串行状态机”**，强制将系统最终审查权、架构主导权与代码可读性死死卡在**人类的因果认知边界之内**。不盲目追求上帝视角下的“全局最优解”，转而追求**“人类智力可完全收敛、绝对可控的次优确定性方案”**。

【 高维概率区（不确定性、技术红利） 】
│
Trae Solo (云端高阶架构师)
│ (输入：全局项目上下文/模糊需求)
▼
[ 产出：像素级原子化实施文档 (docs/COGNITION.md) ]
│
==================== 【 认知硬边界 / 人类物理锁 】 ====================
│ (人类肉眼审查、冻结状态、拦截高熵癌变代码)
▼
[ 注入：确定性执行指令 (docs/STATUS.md) ]
│
OpenCode (本地开源沙箱环境)
│ (执行：调用本地统一内存与 Skill 资产)
▼
Qwen3.6-35B-A3B (本地网关调度) ───> Qwen3-Coder-Next (无情搬运工)
│
【 内部因果可控区（确定性、绝对主权） 】

---

## 2. 硬件平台参数与本地模型生态位（Hardware & Edge-LLM Spec）

### 2.1 物理硬件基准
* **设备**：Mac Studio (Apple Silicon, 256G Unified Memory)
* **核心瓶颈**：统一内存带宽（以 M 系列 Ultra 芯片带宽为物理上限）。单次 Token 生成的延迟与前向传播激活的参数量成绝对正比。

### 2.2 本地双子星模型配置与物理本质


| 模型名称 | 物理架构特征 | 推理速度/吞吐表现 | 架构生态位分配 | 显存常驻优化参数 |
| :--- | :--- | :--- | :--- | :--- |
| **Qwen3.6-35B-A3B** | Gated DeltaNet (线性注意力) + MoE (256选8) | **极快**。75% 计算退化为类 RNN 线性缩放。吞吐速率对长上下文完全钝化。 | **本地网关与 Skill 总调度官**：解析云端 `COGNITION.md`，将抽象指令翻译为不可变的本地 API 函数调用（Function Calling）。 | **双模型全满血常驻**：完全放弃在本地运行 200B+ 巨型模型的幻想。两款模型总显存占用控制在 60G-80G，通过 OMLX 原生 Metal 算子直接锁死在统一内存中，**消除一切显存权重换入换出（Swap）的物理耗时**。 |
| **Qwen3-Coder-Next** | Hybrid Attention + MoE (512选10，激活仅 3B) | **极速**。剔除了极其耗时的在线思考（Thinking）模块，纯粹为代码高频吞吐特化。 | **沙箱代码执行器（Executor）**：不参与宏观业务逻辑辩证，只听从 Qwen3.6 调度，进行高吞吐的代码编写、单行补全与局部 Debug。 | ^ |

---

## 3. 核心技术踩坑点与工程免疫防御（Technical Pitfalls & Immunization）

### 🛑 踩坑点 1：DeepSeek V4 Flash 的“高分低能”与 Mac 生态失时
* **物理报错/不兼容现象**：DS4 总参数 284B（激活 13B），在 Mac 平台尝试启用 **MTP（多 Token 预测）** 架构和 4-Bit 量化压缩至 80G 运行时，基础解码速度由于内存带宽摩擦出现断崖式下跌。
* **底层原理剖析**：DeepSeek 官方的 MTP 深度优化目前高度依赖 `KTransformers` 或 `SGLang` 框架的 Linux/CUDA 特化算子（如 MXFP4）。Mac 平台的 `llama.cpp` 或 `MLX` 社区在对 spec-decoding 的原生 Metal 算子支持上存在严重滞后。且 4-Bit 强行量化会导致其 MoE 稀疏激活在安全审查时的智商发生“语义断崖”，极易被对抗性提示词欺骗。
* **终局防御方案**：**彻底断念，将 DS4 从本地显存中永久卸载**。腾出空间给高效的线性/混合注意力小模型。

### 🛑 踩坑点 2：商业 AI 辅助 IDE（如 Trae Solo/Cursor）的“控制权收缴”与数据虹吸
* **商业陷阱现象**：使用 Trae Solo 模式或 Cursor Agent 时，高阶全自动修改本地代码功能强制绑定厂商托管的云端服务，且本地自定义 LLM 接口权限在 Agent 工作流中被严重阉割，只能做简单的 Inline 补全。
* **底层原理剖析**：资本的底层逻辑是通过全自动（Full-managed）体验喂养用户的惰性。厂商通过高频的自回归（Autoregressive）循环在云端自动读取、修改你的多文件目录，其本质是在无偿剥夺开发者对项目全局架构的“认知所有权”，并将项目彻底黑盒化、异化为只有 AI 自己看得懂的“代码癌变屎山”。
* **终局防御方案**：**物理剥夺 Trae Solo 的本地文件修改权限（Write Permission）**。仅将其作为一次性的“高阶云端图纸设计员”。实际执行和本地调用彻底降级更换为基于终端、遵循 MIT 开源协议的 **OpenCode**。

---

## 4. “增量认知沙箱”协同行为协议标准（The Sandbox Protocol）

为了将系统的“高熵自动猜几率状态”强行收敛为“确定性状态”，两端必须严格遵守基于物理共享目录的串行通信协议。

### 4.1 目录权限硬性切割（AI Rules）
在项目根目录设立 `.ai_rules` 守则，通过文件系统对两个 Agent 实体实施行为禁锢：
```json
{
  "remote_agent (Trae Solo)": {
    "read_access": ["/src/*", "/docs/*"],
    "write_access": ["/docs/plans/*"],
    "permission_denied": ["/src/*", "Terminal_Execution"]
  },
  "local_agent (OpenCode)": {
    "read_access": ["/docs/plans/*", "/src/*"],
    "write_access": ["/src/*", "/docs/logs/*"],
    "sandbox_restriction": "Require_Human_Physical_Confirmation_Before_Any_Bash_Execution"
  }
}
```

### 4.2 拦截“全局代码泄露”：增量逆向 Debug 协议（Incremental Debugging Protocol）
当本地 OpenCode 在编译、硬件或实施上出错，本地 Qwen 无法闭环解决时，**严禁将整个项目源码重新丢回远程 AI 重新扫描**。必须实施“局部提纯”，用最小局部相关性对冲云端 Input Token 的暴利收割：
1. **本地自动化提纯**：利用本地脚本抓取报错那一瞬间的 `Error Stack Trace`（堆栈信息） + 当前被改动文件的 `Git Diff` 增量内容 + 原始 `COGNITION.md` 指令。
2. **强制限制云端输出**：在远程新开干净对话，输入上述提纯三件套。提示词中强制加锁：*“DO NOT write full files. Output standard Markdown Diff syntax (+/-) only. Provide a strict explanation of the logical fix within 10 lines.”*
3. **人类终审合入**：看懂云端解释后，由开发者肉眼走查，亲手将代码拼回本地系统。

---

## 5. 日志总结：独立开发者的主权防线
通过该架构的实施，你将 AI 彻底锚定在**“智力放大器”**的从属位置：
* **云端**：是你免费榨取全球最顶尖智力演进、进行高阶咨询的“无状态临时智囊”。
* **本地**：是你由 256G 统一内存硬件、开源 Qwen 模型、标准 MCP 协议和人类确定性因果逻辑共同浇筑的**“数字隔离绿洲”**。系统可能不是最有效率的，但它在物理上是绝对安全的、100% 可读的、且永远无法被科技巨头软性绑架。