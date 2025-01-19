# AI 思维流程设计工具

这是一个基于 AI 的思维流程设计工具,可以帮助用户生成和管理结构化的思维流程。
效果演示
![image](https://github.com/user-attachments/assets/ec2b997f-14f3-4108-9a3e-58a05e04afa5)

## 功能特点
- 新增动态思维链，每次根据需求生成动态的思维模式
- 支持自定义思维流程模板配置
- 多级节点结构设计
- 详细内容的自动生成与调整 （单独删除节点然后继续生成剩余节点内容）
- 支持导入/导出功能
- 聊天记录管理
- Markdown格式的内容导出
- 多种AI模型支持

## 快速开始


### 直接部署
1. 将build目录下的文件直接部署到支持html的web服务器，当然也可以放到本地使用浏览器打开
2. example目录中的[import_example.json](https://github.com/suwubee/aicot/blob/main/example/import_example.json)文件，点击导入按钮，导入后，点击开始按钮，即可开始生成思维流程结构
3. 配置API URL和API Key，开始生成你需要的思维流程结构
4. 如果需要生成新的思维链模版，以[suggest.md](https://github.com/suwubee/aicot/blob/main/example/suggest.md?plain=1)文件为AI提示词，生成你需要的新的思维链模板，并导入到系统中

### 安装

```bash
# 克隆项目
git clone [项目地址]

# 安装依赖
npm install

# 启动开发服务器
npm start

# 构建生产版本
npm run build
```

### 配置

1. 在 `src/config.js` 中配置默认模板
2. 在界面设置中配置 API 参数:
   - API URL
   - API Key 
   - 选择模型

### 基本使用

1. 选择或创建配置模板
2. 输入业务场景描述
3. 生成思维流程结构
4. 自动生成详细内容
5. 根据需要调整内容
6. 导出成果

## 项目结构

```
├── build/                  # 构建输出目录
├── public/                 # 静态资源
├── src/                   # 源代码
│   ├── api.js            # API 调用相关
│   ├── config.js         # 配置文件
│   ├── ChatInterface.js  # 聊天界面逻辑
│   ├── ChatInterfaceView.js # 聊天界面视图
│   └── ...
└── example/              # 示例文件
    ├── suggest.md       # 配置模板示例
    └── import_example.json # 导入数据示例
```

### 核心文件说明

- `api.js`: 包含与AI服务通信的核心功能
- `config.js`: 默认配置和模板定义
- `ChatInterface.js`: 主要业务逻辑实现
- `ChatInterfaceView.js`: UI组件和渲染逻辑

## 配置文件格式

配置文件包含三个主要部分:

```json
{
  "terms": {
    "node1": "主流程名称",
    "node2": ["节点1", "节点2", ...],
    "node2ComplexItems": ["需要详细展开的节点"],
    ...
  },
  "fixedDescriptions": {
    "节点1": "节点1的描述",
    "节点2": "节点2的描述",
    ...
  },
  "systemRolePrompt": "系统角色提示词"
}
```

## 开发指南

### 添加新功能

1. 在 `api.js` 中添加新的 API 调用函数
2. 在 `ChatInterface.js` 中实现相关业务逻辑
3. 在 `ChatInterfaceView.js` 中添加UI组件
4. 更新配置文件以支持新功能

### 自定义模板

1. 创建新的配置文件
2. 定义节点结构和描述
3. 设置系统提示词
4. 通过界面导入配置

## 注意事项

- 确保 API Key 安全性
- 大型结构生成可能需要较长时间
- 建议定期导出保存重要数据
- 注意调整生成内容的相关性

## 许可证

Apache License 2.0

本项目采用 [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0) 开源协议。

## 贡献指南

欢迎提交 Issue 和 Pull Request

## 联系方式

ISSUE 反馈
