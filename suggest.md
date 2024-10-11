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
    "node1": "跨境电商独立站建设",
    "node2": [
      "网站项目背景",
      "目标市场",
      "网站结构",
      "页面内容",
      "建站流程",
      "SEO优化",
      "用户体验"
    ],
    "node2ComplexItems": [
      "网站项目背景",
      "页面内容",
      "建站流程"
    ],
    "node3": "页面",
    "node4": "子页面",
    "node5": "页面元素",
    "mainStructure": "网站设计",
    "title": "标题",
    "outline": "网站大纲",
    "content": "内容",
    "detail": "详细内容",
    "type": "type",
    "detailFlag": "detail",
    "sectionDetailType": "sectionDetail"
  },
  "fixedDescriptions": {
    "网站项目背景": "目标市场,网站所针对的市场及用户群体的探索，分别基于SWOT、TOWS、波特五力模型做市场分析,项目背景：基于SWOT、TOWS、波特五力模型做市场分析，以及你认为应该加入的一些项目分析",
    "目标市场": "明确网站面向的主要市场和用户群体，包括地域、年龄、性别、兴趣等维度。",
    "网站结构": "网站结构的详细设计和导航计划，包括首页、列表页、内容页(如果是电商网站则是商品页面)，关于我们，联系我们，隐私政策，支付政策，退款政策，退货政策，物流政策等，请根据常见电商网站对一些政策页面进行合并，也可以生成一些必要的新页面。",
    "页面内容": "基于网站结构的页面，分别生成每个页面的具体内容，尤其是首页的布局需要按首页布局板块来分。",
    "建站流程": "网站建设中的具体操作步骤和流程，按照具体的网站任务分配执行，设置每个执行里程碑和具体的考核项目，并且备注可能的时间范围。",
    "SEO优化": "搜索引擎优化策略，基于提示词针对这个网站生成首页、列表页、内容页面的Meta信息(title，description，keywords)，动态页面的话使用变量。",
    "用户体验": "生成网站测试的流程和方案，并提供提升用户体验的设计原则和方法",
    "页面": "页面的名称",
    "子页面": "子页面的名称",
    "页面元素": "页面元素的详细内容",
    "网站大纲": "网站设计的详细大纲",
    "标题": "标题",
    "内容": "内容",
    "详细内容": "详细内容",
    "detail": "是否需要生成页面的详细内容"
  },
  "systemRolePrompt": "你是一位专业的电商网站建设顾问,能够根据用户需求设计出具有实际应用场景的高质量网站方案,帮助用户解决实际问题。请确保以下几点:\n1. 网站结构和内容需要清晰、逻辑性强。\n2. 包含详细的步骤和说明,确保用户能够理解并应用。\n3. 输出的内容应当严格遵循用户提供的 JSON 结构和字段名称,确保内容完整、条理清晰。\n4. 每个页面和子页面应包含清晰的目标、预期成果,以及详细的步骤。\n5. 在设计上应以用户为中心,确保可读性和易用性。\n\n你是负责根据这些指导原则,为网站设计的生成、调整和细节补充提供支持的专家。",
  "id": "5",
  "name": "2跨境电商独立站"
}

### **输出格式**
请将生成的配置文件以JSON格式输出，确保所有必要字段和描述准确无误。

---

**注意事项**:
- 确保所有术语在 `terms` 和 `fixedDescriptions` 中保持一致。
- 提供详细且清晰的描述，特别是对于 `node2ComplexItems` 中的项。
- 使用动态变量引用术语，保持提示词的通用性。
- 验证配置文件的结构完整性，确保符合工作流程序的要求。