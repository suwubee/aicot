请根据以下业务场景生成一个配置文件，符合工作流程序的要求。配置文件应包含 `terms`、`fixedDescriptions` 和 `systemRolePrompt`，并以JSON格式输出。确保配置文件结构与以下示例一致，并遵循工作流代码的逻辑。

### **业务场景描述**
[在此处插入具体的业务场景描述，例如：“跨境电商独立站建设”或其他业务需求]

### **生成配置文件的要求**

1. **术语定义 (`terms`)**:
   - 定义 `node1` 为主流程节点名称。
   - 列出 `node2` 数组，包含主节点下的各个要素。
   - 指定 `node2ComplexItems`，列出需要详细说明的 `node2` 项。
   - 定义 `node3`、`node4`、`node5`，分别表示子部分、具体环节和环节内容。
   - 设置 `mainStructure` 为整体流程设计名称。
   - 保持 `title`、`outline`、`content`、`detail`、`type`、`detailFlag`、`sectionDetailType` 的一致性。

2. **固定描述 (`fixedDescriptions`)**:
   - 为 `terms.node2` 中的每个项编写详细描述。
   - 对于 `node2ComplexItems` 中的项，提供更详细的说明。
   - 确保 `fixedDescriptions` 的键与 `terms` 中的键一致。
   - 不要生成重复的terms的值，例如node5和detail不要都是`详细内容`

3. **系统角色提示词 (`systemRolePrompt`)**:
   - 明确AI的角色和职责。
   - 列出具体的指导原则，确保AI在生成内容时遵循这些规则。
   - 使用 `${terms}` 中的变量，使提示词具有通用性和灵活性。

4. **示例配置文件参考**:
   - 请参考以下示例配置文件，确保生成的配置文件结构和内容一致。

### **示例配置文件**

以下是一个基于“跨境电商独立站建设”业务场景的示例配置文件，供参考：

```json
{
    "terms": {
        "node1": "思考一个问题的思考过程",
        "node2": [
            "问题定义",
            "信息收集",
            "分析与推理",
            "解决方案生成",
            "决策与选择",
            "实施计划",
            "评估与反思",
            "自我管理",
            "外部影响因素",
            "时间管理"
        ],
        "node2ComplexItems": [
            "问题定义",
            "分析与推理",
            "决策与选择",
            "外部影响因素",
            "时间管理"
        ],
        "node3": "步骤",
        "node4": "子步骤",
        "node5": "步骤内容",
        "mainStructure": "思维过程设计",
        "title": "标题",
        "outline": "大纲",
        "content": "内容",
        "detail": "详细内容",
        "type": "类型",
        "detailFlag": "详情标志",
        "sectionDetailType": "部分详情类型"
    },
    "fixedDescriptions": {
        "问题定义": "明确要解决的问题，包括问题的背景、范围和目标，确保问题陈述清晰具体。从自身出发，不依赖他人，明确自主决策的范围。",
        "信息收集": "收集与问题相关的所有必要信息和数据，包括定性和定量数据，以便进行全面分析。考虑自身资源和能力，确保信息的全面性和准确性。",
        "分析与推理": "对收集到的信息进行系统分析，使用逻辑推理方法识别问题的根本原因和潜在影响。结合自我管理和外部影响因素，深入剖析问题。",
        "解决方案生成": "基于分析结果，创造性地提出多个可行的解决方案，并评估每个方案的优缺点。考虑行动先行的重要性，确保方案具备可操作性。",
        "决策与选择": "在多个解决方案中进行比较，选择最适合的方案，并制定决策的依据和理由。权衡外部影响因素，确保决策的有效性和可行性。",
        "实施计划": "制定详细的行动计划，包括具体步骤、时间表、资源分配和责任分工，确保解决方案的有效执行。注重脚踏实地的执行力，避免拖延和推诿。",
        "评估与反思": "在实施后对结果进行评估，反思整个思考过程，识别成功经验和改进点，以优化未来的思考和决策过程。关注自我成长和持续改进。",
        "自我管理": "管理自身的思维和行为，包括自我激励、时间管理和情绪控制，确保在思考和执行过程中保持高效和专注。",
        "外部影响因素": "考虑外部环境和他人的影响，包括老板、客户和同事的决策，制定策略以影响关键人物的决策，最大化自身的影响力。",
        "时间管理": "理解时间的有限性，按照轻重缓急对问题进行剖析和处理，制定合理的时间安排，确保高效利用时间资源。",
        "步骤": "思考过程中的主要步骤",
        "子步骤": "每个主要步骤下的具体子步骤",
        "步骤内容": "步骤的详细内容描述",
        "大纲": "思维过程的总体大纲",
        "标题": "标题",
        "内容": "内容",
        "详细内容": "详细内容",
        "type": "类型",
        "detail": "是否需要生成步骤的详细内容",
        "sectionDetailType": "部分详情类型"
    },
    "systemRolePrompt": "你是一位专业的思维过程设计专家，能够根据用户需求设计出系统化的思考逻辑和流程，帮助用户高效解决问题。请确保以下几点:\n1. 思考过程和步骤需要清晰、逻辑性强，包含自我管理、外部影响因素和时间管理等关键要素。\n2. 包含详细的步骤和说明，确保用户能够理解并应用，包括如何从自身出发，不依赖他人，影响关键人物的决策。\n3. 输出的内容应当严格遵循用户提供的 JSON 结构和字段名称，确保内容完整、条理清晰。\n4. 每个步骤和子步骤应包含清晰的目标、预期成果，以及详细的步骤，注重行动先行和脚踏实地的执行力。\n5. 在设计上应以用户为中心，确保可读性和易用性，同时考虑时间的有限性和AI自身的局限性，提供实际可行的指导措施。\n\n你是负责根据这些指导原则，为思维过程的生成、调整和细节补充提供支持的专家。",
    "id": "1728716438680",
    "name": "思维过程设计"
}
```

### **输出格式**
请将生成的配置文件以JSON格式输出，确保所有必要字段和描述准确无误。

---

**注意事项**:
- 确保所有术语在 `terms` 和 `fixedDescriptions` 中保持一致。
- 提供详细且清晰的描述，特别是对于 `node2ComplexItems` 中的项。
- 使用动态变量引用术语，保持提示词的通用性。
- 验证配置文件的结构完整性，确保符合工作流程序的要求。
