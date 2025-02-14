// api.js
// 通用的 AI API 调用函数

// 模型配置管理器
const ModelConfigManager = {
  // 模型类型定义
  MODEL_TYPES: {
    O1: 'o1',
    GPT: 'gpt',
    DEEPSEEK: 'deepseek',
    // 后续可以在这里添加更多模型类型
  },

  // 获取模型类型
  getModelType(model) {
    if (model.startsWith('o1-')) return this.MODEL_TYPES.O1;
    if (model.startsWith('deepseek-')) return this.MODEL_TYPES.DEEPSEEK;
    return this.MODEL_TYPES.GPT;
  },

  // 构建请求体
  buildRequestBody(model, messages, functions, function_call) {
    const modelType = this.getModelType(model);
    
    // 压缩消息内容
    const compressedMessages = messages.map(msg => ({
      ...msg,
      content: msg.content.replace(/\s+/g, ' ').trim()
    }));

    // 压缩函数定义
    const compressedFunctions = functions ? functions.map(fn => ({
      ...fn,
      description: fn.description.replace(/\s+/g, ' ').trim()
    })) : undefined;
    
    switch (modelType) {
      case this.MODEL_TYPES.O1:
        return {
          model,
          messages: compressedMessages.map(msg => ({
            role: msg.role === 'system' ? 'user' : msg.role,
            content: msg.content
          })),
          temperature: 1,
          max_tokens: 8000,
        };
      
      case this.MODEL_TYPES.DEEPSEEK:
        return {
          model,
          messages: compressedMessages,
          temperature: 0.3, // 降低温度以提高稳定性
          max_tokens: 8000,
        };
      
      case this.MODEL_TYPES.GPT:
      default:
        return {
          model,
          messages: compressedMessages,
          functions: compressedFunctions,
          function_call,
          temperature: 0.5,
          max_tokens: 8000,
        };
    }
  },

  // 处理响应数据
  handleResponse(model, response, terms = null) {
    const modelType = this.getModelType(model);
    const message = response.choices[0].message;

    // 通用的 JSON 提取和解析函数
    const extractAndParseJSON = (content) => {
      try {
        // 1. 如果已经是对象，直接返回
        if (typeof content === 'object') {
          return content;
        }

        // 2. 尝试从 markdown 代码块中提取 JSON
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[1].trim().replace(/\\"/g, '"');
          return JSON.parse(jsonStr);
        }

        // 3. 尝试直接解析整个内容
        const cleanContent = content.trim().replace(/^[^{]*({[\s\S]*})[^}]*$/, '$1');
        return JSON.parse(cleanContent);
      } catch (error) {
        console.error('JSON 解析失败:', error);
        throw new Error(`AI 返回的数据格式不正确: ${error.message}`);
      }
    };

    // 处理解析后的内容
    const processContent = (parsedContent) => {
      // 如果是动态思维链配置，直接返回
      if (parsedContent.terms && parsedContent.fixedDescriptions) {
        return parsedContent;
      }
      // 如果是主结构内容，需要处理 description 对象
      return this._processMainStructureContent(parsedContent);
    };

    try {
      switch (modelType) {
        case this.MODEL_TYPES.GPT:
          // GPT 模型可能返回 function_call 或直接返回内容
          if (message.function_call && message.function_call.arguments) {
            // 处理 function_call 返回
            return { functionResult: processContent(JSON.parse(message.function_call.arguments)) };
          } else if (message.content) {
            // 处理直接返回内容的情况
            return { functionResult: processContent(extractAndParseJSON(message.content)) };
          }
          throw new Error('GPT 返回的数据格式不正确');

        case this.MODEL_TYPES.DEEPSEEK:
          if (!message.content || message.content.trim() === '') {
            throw new Error('DeepSeek 返回的数据为空');
          }
          try {
            const parsedContent = extractAndParseJSON(message.content);
            if (!parsedContent || typeof parsedContent !== 'object') {
              throw new Error('DeepSeek 返回的数据不是有效的 JSON 对象');
            }
            return { functionResult: processContent(parsedContent) };
          } catch (error) {
            console.error('处理 DeepSeek 响应时出错:', error);
            throw new Error(`处理 DeepSeek 响应失败: ${error.message}`);
          }

        case this.MODEL_TYPES.O1:
          if (!message.content) {
            throw new Error('O1 返回的数据为空');
          }
          return { functionResult: processContent(extractAndParseJSON(message.content)) };

        default:
          throw new Error(`不支持的模型类型: ${modelType}`);
      }
    } catch (error) {
      console.error(`处理 ${modelType} 模型响应时出错:`, error);
      throw new Error(`AI 返回的数据格式不正确: ${error.message}`);
    }
  },

  // 处理主结构内容中的 description 对象
  _processMainStructureContent(content) {
    const processNode = (node) => {
      if (Array.isArray(node)) {
        return node.map(item => {
          if (item.description) {
            const processedItem = { ...item };
            processedItem.content = typeof item.description === 'object' ? 
              Object.entries(item.description)
                .map(([key, value]) => {
                  if (Array.isArray(value)) {
                    return `${key}:\n${value.map(v => `- ${v}`).join('\n')}`;
                  }
                  return `${key}: ${value}`;
                })
                .join('\n') :
              item.description;
            delete processedItem.description;
            return processedItem;
          }
          return item;
        });
      } else if (typeof node === 'object' && node !== null) {
        if (node.description) {
          // 如果节点有 description 和其他属性
          const processedNode = { ...node };
          if (typeof node.description === 'object') {
            processedNode.content = Object.entries(node.description)
              .map(([key, value]) => {
                if (Array.isArray(value)) {
                  return `${key}:\n${value.map(v => `- ${v}`).join('\n')}`;
                }
                return `${key}: ${value}`;
              })
              .join('\n');
          } else {
            processedNode.content = node.description;
          }
          delete processedNode.description;
          
          // 处理其他属性
          for (const [key, value] of Object.entries(processedNode)) {
            if (key !== 'content' && typeof value === 'object' && value !== null) {
              processedNode[key] = processNode(value);
            }
          }
          return processedNode;
        } else if (Object.keys(node).length > 0) {
          const processedObj = {};
          for (const [key, value] of Object.entries(node)) {
            processedObj[key] = processNode(value);
          }
          return processedObj;
        }
      }
      return node;
    };

    // 处理主结构内容
    const result = {};
    for (const [key, value] of Object.entries(content)) {
      if (typeof value === 'object' && value !== null) {
        result[key] = processNode(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
};

export async function callAIAPI(apiUrl, apiKey, model, messages, functions, function_call) {
  const requestBody = ModelConfigManager.buildRequestBody(model, messages, functions, function_call);
  // 压缩整个请求体的 JSON 字符串
  const body = JSON.stringify(requestBody).replace(/\s+/g, ' ').trim();

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: body,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return ModelConfigManager.handleResponse(model, data);
}

// 新增函数,根据模型类型构建消息数组
function buildMessages(model, systemRolePrompt, userPrompt, functionParams) {
  const modelType = ModelConfigManager.getModelType(model);

  switch (modelType) {
    case ModelConfigManager.MODEL_TYPES.O1:
      // O1 模型将所有内容放在一个 user 消息中
      let functionPrompt = '';
      if (functionParams) {
        functionPrompt = `请根据以下要求生成内容:\n${JSON.stringify(functionParams, null, 2)}`;
      }
      return [
        {
          role: 'user',
          content: `${systemRolePrompt}\n\n${userPrompt}\n\n${functionPrompt}`,
        },
      ];

    case ModelConfigManager.MODEL_TYPES.DEEPSEEK:
      // DeepSeek 模型将函数参数加入到 user 消息中
      let deepseekFunctionPrompt = '';
      if (functionParams) {

        deepseekFunctionPrompt = `
请严格按照以下 JSON Schema 格式生成内容:
${JSON.stringify(functionParams, null, 2)}

要求：
1. 必须使用 JSON 格式输出
2. 所有字段必须完全匹配 Schema 定义
3. 不要添加任何额外的解释或说明
4. 输出时使用 markdown 的 json 代码块，如：
\`\`\`json
{
  // 你的输出内容
}
\`\`\`
`;
      }
      return [
        {
          role: 'system',
          content: `${systemRolePrompt}\n\n作为 AI 助手，你必须：\n1. 始终使用 JSON 格式输出\n2. 确保输出的所有字段都符合要求\n3. 不要添加任何额外的解释文字`
        },
        {
          role: 'user',
          content: `${userPrompt}\n\n${deepseekFunctionPrompt}`,
        },
      ];

    case ModelConfigManager.MODEL_TYPES.GPT:
    default:
      // GPT 模型使用标准的 function_call 格式
      return [
        {
          role: 'system',
          content: systemRolePrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ];
  }
}

// 新建流程设计
export async function generateNewMainStructure(apiUrl, apiKey, model, userContent, config) {
  const { prompts, functionCalls, systemRolePrompt } = buildConfigFunctions(config);
  const prompt = prompts.generateMainStructurePrompt(userContent);
  const messages = buildMessages(model, systemRolePrompt, prompt, functionCalls.mainStructureFunction.parameters);
  
  if (model.startsWith('o1-') || model.startsWith('deepseek-')) {
    // O1 和 DeepSeek 模型不使用 functions 参数
    const result = await callAIAPI(apiUrl, apiKey, model, messages);
    // 统一返回格式
    return {
      functionResult: {
        ...result.functionResult,
        type: 'mainStructure'
      }
    };
  } else {
    // GPT 模型使用标准的 function_call 格式
    const functions = [functionCalls.mainStructureFunction];
    const function_call = { name: functionCalls.mainStructureFunction.name };
    const { functionResult } = await callAIAPI(apiUrl, apiKey, model, messages, functions, function_call);
    return {
      functionResult: {
        ...functionResult,
        type: 'mainStructure'
      }
    };
  }
}

// 添加一个函数，根据配置项构建 prompts 和 functionCalls
function buildConfigFunctions(config) {
  if (!config || !config.terms) {
    throw new Error('配置文件缺失或未定义');
  }

  const { terms, fixedDescriptions, systemRolePrompt } = config;

  // 使用配置项中的 terms 和 fixedDescriptions 构建 prompts 和 functionCalls
  const prompts = {
    generateMainStructurePrompt: (userContent) => `
# 设计需求
为"${userContent}"设计一套完整的「${terms.node1}」方案。

# 设计要求
1. 结构完整性
   - 每个「${terms.node2}」必须符合MECE原则（相互独立、完全穷尽）
   - 确保各层级之间存在明确的逻辑关系和递进关系
   - ${terms.node2}的顺序应遵循时间顺序或逻辑递进

2. 内容要求
   - 对于复杂的「${terms.node2}」项（${terms.node2ComplexItems.join('、')}），提供3-5个具体的「${terms.node3}」
   - 每个「${terms.node3}」下设计2-4个关键的「${terms.node4}」
   - 确保内容的可操作性和实用性

请严格按照JSON格式输出。`,

    adjustMainStructurePrompt: (currentDesign, adjustments) =>
      `根据之前的${terms.node1}内容:
\`\`\`json
${JSON.stringify(currentDesign, null, 2).replace(/\s+/g, ' ').trim()}
\`\`\`
调整意见:
${adjustments}
请重新设计${terms.node1}。`,

    generateDetailPrompt: (
      nodeIndexes,
      currentDesign,
      existingSectionsPrompt,
      nodeTitle,
      subNodeTitle
    ) => `
${terms.node1}背景:
${JSON.stringify(currentDesign, null, 2).replace(/\s+/g, ' ').trim()} 

# 已有内容参考
${existingSectionsPrompt}

根据${terms.mainStructure}内容和${terms.outline},为${terms.mainStructure}中的第 ${nodeIndexes.node3} 个${terms.node3} "${nodeTitle}" 的第 ${nodeIndexes.node4} 个${terms.node4} "${subNodeTitle}" 生成详细的${terms.detail}。

# 生成要求
1. 内容相关性
   - 确保内容与当前「${terms.node4}」主题高度相关
   - 与其他「${terms.node4}」内容避免重复
   - 注意与整体「${terms.node1}」的连贯性

2. 内容结构
   - 使用二级标题组织主要内容
   - 每个关键点需要2-3个具体的执行步骤
   - 适当使用要点符号提高可读性

3. 实用性要求
   - 提供可操作的具体建议
   - 包含可衡量的成果指标
   - 注重实践可行性

4. 格式规范
   - 使用Markdown格式
   - 所有字符串内容需要适当转义
   - 避免额外的说明文字或注释

请生成符合以上要求的详细内容，确保内容既独立完整，又与整体流程紧密关联。`,

    adjustDetailPrompt: (
      currentContent,
      adjustments,
      nodeIndexes,
      currentDesign,
      existingSectionsPrompt,
      nodeTitle,
      subNodeTitle
    ) => `
当前${terms.mainStructure}背景和${terms.outline}:
${JSON.stringify(currentDesign, null, 2).replace(/\s+/g, ' ').replace(/\n/g, ' ')}

# 已有内容参考
${existingSectionsPrompt}

根据${terms.mainStructure}内容和${terms.outline},为${terms.mainStructure}中的第 ${nodeIndexes.node3 || ''} 个${terms.node3} "${nodeTitle || ''}" 的第 ${nodeIndexes.node4 || ''} 个${terms.node4} "${subNodeTitle || ''}" 生成详细的${terms.detail}。

# 当前内容
${currentContent}

# 调整意见
${adjustments || ''}

# 调整要求
1. 内容修改
   - 保留原内容中有价值的部分
   - 根据调整意见进行针对性修改
   - 确保与整体「${terms.node1}」保持一致性
   - 维持与其他节点的逻辑关联

2. 质量保证
   - 提升内容的可操作性和实用性
   - 确保修改后的专业性和准确性
   - 保持结构的清晰和连贯
   
请基于以上要求进行内容调整，确保最终输出符合Markdown格式规范。`
  };

  // 根据 terms 构建 functionCalls
  const functionCalls = {
    mainStructureFunction: {
      name: 'generate_main_structure',
      description: `根据提供的需求,生成${terms.node1}方案。`,
      parameters: {
        type: 'object',
        properties: {
          [terms.node1]: {
            type: 'object',
            properties: terms.node2.reduce((acc, node2Name) => {
              if (terms.node2ComplexItems.includes(node2Name)) {
                // 复杂的 node2 项，包含 detailFlag
                acc[node2Name] = {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      [terms.title]: {
                        type: 'string',
                        description: fixedDescriptions[terms.node3],
                      },
                      [terms.content]: {
                        type: 'array',
                        items: { type: 'string' },
                        description: `${terms.node3}包含的${terms.content}`,
                      },
                      [terms.detailFlag]: {
                        type: 'boolean',
                        description: fixedDescriptions[terms.detailFlag],
                      },
                    },
                    required: [terms.title, terms.content, terms.detailFlag],
                  },
                  description: fixedDescriptions[node2Name],
                };
              } else if (Array.isArray(fixedDescriptions[node2Name])) {
                // 简单的数组类型 node2 项
                acc[node2Name] = {
                  type: 'array',
                  items: { type: 'string' },
                  description: fixedDescriptions[node2Name],
                };
              } else {
                // 简单的字符串类型 node2 项
                acc[node2Name] = {
                  type: 'string',
                  description: fixedDescriptions[node2Name],
                };
              }
              return acc;
            }, {}),
            required: terms.node2,
          },
        },
        required: [terms.node1],
      },
    },

    detailFunction: {
      name: 'generate_detail',
      description: `根据提供的${terms.mainStructure}背景和${terms.title},生成${terms.node4}的详细内容。`,
      parameters: {
        type: 'object',
        properties: {
          nodeIndexes: {
            type: 'object',
            properties: {
              node3: {
                type: 'integer',
                description: `当前${terms.node3}的索引`,
              },
              node4: {
                type: 'integer',
                description: `当前${terms.node4}的索引`,
              },
            },
            required: ['node3', 'node4'],
          },
          [terms.title]: {
            type: 'string',
            description: `当前${terms.node4}的${terms.title}`,
          },
          [terms.detail]: {
            type: 'string',
            description: fixedDescriptions[terms.node5],
          },
          [terms.type]: {
            type: 'string',
            description: `消息类型,用于标识这是${terms.node4}内容`,
            enum: [terms.sectionDetailType],
          },
        },
        required: [
          'nodeIndexes',
          terms.title,
          terms.detail,
          terms.type,
        ],
      },
    },
  };

  return { prompts, functionCalls, systemRolePrompt };
}

// 调整流程设计
export async function adjustMainStructure(apiUrl, apiKey, model, currentDesign, adjustments, config) {
  const { prompts, functionCalls, systemRolePrompt } = buildConfigFunctions(config);
  const prompt = prompts.adjustMainStructurePrompt(currentDesign, adjustments);
  const messages = buildMessages(model, systemRolePrompt, prompt, functionCalls.mainStructureFunction.parameters);

  if (model.startsWith('o1-') || model.startsWith('deepseek-')) {
    // O1 和 DeepSeek 模型不使用 functions 参数
    const result = await callAIAPI(apiUrl, apiKey, model, messages);
    // 统一返回格式
    return {
      functionResult: {
        ...result.functionResult,
        type: 'mainStructure'
      }
    };
  } else {
    // GPT 模型使用标准的 function_call 格式
    const functions = [functionCalls.mainStructureFunction];
    const function_call = { name: functionCalls.mainStructureFunction.name };
    const { functionResult } = await callAIAPI(apiUrl, apiKey, model, messages, functions, function_call);
    return {
      functionResult: {
        ...functionResult,
        type: 'mainStructure'
      }
    };
  }
}

function generateDetailId(nodeIndexes) {
  if (!nodeIndexes) return '';
  const { node2Name, node3, node4 } = nodeIndexes;
  return `detail-${node2Name}-${node3}-${node4}`;
}

// 新建详细内容
export async function generateNewDetail(apiUrl, apiKey, model, nodeIndexes, mainStructure, messages, config) {
  const { prompts, functionCalls, systemRolePrompt } = buildConfigFunctions(config);
  const { terms } = config || {};
  
  if (!terms) {
    throw new Error('配置文件缺失或未定义');
  }

  if (!mainStructure || !mainStructure[terms.node1]) {
    throw new Error(`流程设计结构不完整，无法生成${terms.detail}`);
  }

  // 处理简单节点
  if (nodeIndexes.isSimpleNode) {
    const node2Name = nodeIndexes.node2Name;
    const content = nodeIndexes.content;
    const prompt = prompts.generateDetailPrompt(
      nodeIndexes,
      mainStructure,
      '',
      node2Name,
      content
    );
    const messages = buildMessages(model, systemRolePrompt, prompt, functionCalls.detailFunction.parameters);

    if (model.startsWith('o1-') || model.startsWith('deepseek-')) {
      const result = await callAIAPI(apiUrl, apiKey, model, messages);
      return {
        functionResult: {
          ...result.functionResult,
          [terms.title]: node2Name,
          nodeIndexes: nodeIndexes,
          type: 'detail',
          detailId: generateDetailId(nodeIndexes)
        }
      };
    } else {
      const functions = [functionCalls.detailFunction];
      const function_call = { name: functionCalls.detailFunction.name };
      const { functionResult } = await callAIAPI(apiUrl, apiKey, model, messages, functions, function_call);
      return {
        functionResult: {
          ...functionResult,
          [terms.title]: node2Name,
          nodeIndexes: nodeIndexes,
          type: 'detail',
          detailId: generateDetailId(nodeIndexes)
        }
      };
    }
  }

  // 处理复杂节点
  const node2Data = mainStructure[terms.node1][nodeIndexes.node2Name];
  if (!Array.isArray(node2Data) || nodeIndexes.node3 < 1 || nodeIndexes.node3 > node2Data.length) {
    throw new Error(`${terms.node2} 节点 "${nodeIndexes.node2Name}" 的索引 ${nodeIndexes.node3} 超出范围`);
  }

  const node3Data = node2Data[nodeIndexes.node3 - 1];

  if (
    !node3Data[terms.content] ||
    nodeIndexes.node4 < 1 ||
    nodeIndexes.node4 > node3Data[terms.content].length
  ) {
    throw new Error(`${terms.node4} 索引 ${nodeIndexes.node4} 超出范围`);
  }

  // 构建已有内容参考
  const existingSections = node3Data[terms.content]
    .map((section, index) => {
      if (index === nodeIndexes.node4 - 1) return '';

      const sectionTitle = section;
      let sectionDetail = '';

      const detailMessage = messages.find(
        (msg) =>
          msg.type === terms.sectionDetailType &&
          msg.data.nodeIndexes.node2Name === nodeIndexes.node2Name &&
          msg.data.nodeIndexes.node3 === nodeIndexes.node3 &&
          msg.data.nodeIndexes.node4 === index + 1
      );

      sectionDetail = detailMessage ? detailMessage.data[terms.detail] : '';
      if (sectionDetail) {
        return `第${index + 1}${terms.node4}: ${sectionTitle}\n${sectionDetail}`;
      } else {
        return '';
      }
    })
    .filter((section) => section.trim() !== '');

  let existingSectionsPrompt = '';
  if (existingSections.length > 0) {
    existingSectionsPrompt = `
当前${terms.node3} "${node3Data[terms.title]}" 中已有的其他${terms.node4}内容:
${existingSections.join('\n\n')}
    `;
  }

  const node4Title = node3Data[terms.content][nodeIndexes.node4 - 1];
  const prompt = prompts.generateDetailPrompt(
    nodeIndexes,
    mainStructure,
    existingSectionsPrompt,
    node3Data[terms.title],
    node4Title
  );

  const messagesToSend = buildMessages(model, systemRolePrompt, prompt, functionCalls.detailFunction.parameters);

  if (model.startsWith('o1-') || model.startsWith('deepseek-')) {
    const result = await callAIAPI(apiUrl, apiKey, model, messagesToSend);
    return {
      functionResult: {
        ...result.functionResult,
        [terms.title]: node3Data[terms.title],
        nodeIndexes: nodeIndexes,
        type: 'detail',
        detailId: generateDetailId(nodeIndexes)
      }
    };
  } else {
    const functions = [functionCalls.detailFunction];
    const function_call = { name: functionCalls.detailFunction.name };
    const { functionResult } = await callAIAPI(apiUrl, apiKey, model, messagesToSend, functions, function_call);
    return {
      functionResult: {
        ...functionResult,
        [terms.title]: node3Data[terms.title],
        nodeIndexes: nodeIndexes,
        type: 'detail',
        detailId: generateDetailId(nodeIndexes)
      }
    };
  }
}

// 调整详细内容
export async function adjustDetail(apiUrl, apiKey, model, currentContent, adjustments, nodeIndexes, currentDesign, chatMessages, config) {
  const { prompts, functionCalls, systemRolePrompt } = buildConfigFunctions(config);
  
  const { terms } = config || {};
  if (!terms) {
    throw new Error('配置文件缺失或未定义');
  }

  if (!currentDesign || !currentDesign[terms.node1]) {
    throw new Error(`流程设计结构不完整，无法调整${terms.detail}`);
  }

  const node2Data = currentDesign[terms.node1][nodeIndexes.node2Name];
  if (!Array.isArray(node2Data) || nodeIndexes.node3 < 1 || nodeIndexes.node3 > node2Data.length) {
    throw new Error(`${terms.node2} 节点 "${nodeIndexes.node2Name}" 的索引 ${nodeIndexes.node3} 超出范围`);
  }

  const node3Data = node2Data[nodeIndexes.node3 - 1];

  if (
    !node3Data[terms.content] ||
    nodeIndexes.node4 < 1 ||
    nodeIndexes.node4 > node3Data[terms.content].length
  ) {
    throw new Error(`${terms.node4} 索引 ${nodeIndexes.node4} 超出范围`);
  }

  // 构建已有内容参考
  const existingSections = node3Data[terms.content]
    .map((section, index) => {
      if (index === nodeIndexes.node4 - 1) return '';

      const sectionTitle = section;
      let sectionDetail = '';

      const detailMessage = chatMessages.find(
        (msg) =>
          msg.type === terms.sectionDetailType &&
          msg.data.nodeIndexes.node2Name === nodeIndexes.node2Name &&
          msg.data.nodeIndexes.node3 === nodeIndexes.node3 &&
          msg.data.nodeIndexes.node4 === index + 1
      );

      sectionDetail = detailMessage ? detailMessage.data[terms.detail] : '';
      if (sectionDetail) {
        return `第${index + 1}${terms.node4}: ${sectionTitle}\n${sectionDetail}`;
      } else {
        return '';
      }
    })
    .filter((section) => section.trim() !== '');

  let existingSectionsPrompt = '';
  if (existingSections.length > 0) {
    existingSectionsPrompt = `
当前${terms.node3} "${node3Data[terms.title]}" 中已有的其他${terms.node4}内容:
${existingSections.join('\n\n')}
    `;
  }

  const subNodeTitle = node3Data[terms.content][nodeIndexes.node4 - 1];
  const prompt = prompts.adjustDetailPrompt(
    currentContent,
    adjustments,
    nodeIndexes,
    currentDesign,
    existingSectionsPrompt,
    node3Data[terms.title],
    subNodeTitle
  );

  const messages = buildMessages(model, systemRolePrompt, prompt, functionCalls.detailFunction.parameters);

  if (model.startsWith('o1-') || model.startsWith('deepseek-')) {
    // O1 和 DeepSeek 模型都需要从返回内容中提取 JSON
    const result = await callAIAPI(apiUrl, apiKey, model, messages);
    return {
      functionResult: {
        ...result.functionResult,
        [terms.title]: node3Data[terms.title],
        nodeIndexes: nodeIndexes,
        type: 'detail',
        detailId: generateDetailId(nodeIndexes)
      }
    };
  } else {
    // GPT 模型使用标准的 function_call 格式
    const functions = [functionCalls.detailFunction];
    const function_call = { name: functionCalls.detailFunction.name };
    const { functionResult } = await callAIAPI(apiUrl, apiKey, model, messages, functions, function_call);
    return {
      functionResult: {
        ...functionResult,
        [terms.title]: node3Data[terms.title],
        nodeIndexes: nodeIndexes,
        type: 'detail',
        detailId: generateDetailId(nodeIndexes)
      }
    };
  }
}

// 生成动态配置
export async function generateDynamicConfig(apiUrl, apiKey, model, userContent) {
  const systemPrompt = `你是一位专业的流程设计专家，能够根据用户的需求，结合实际场景设计出高质量的思维流程和步骤。请根据以下要求生成相应的配置。
1. 请根据业务场景定义核心流程，并提出关键步骤。
2. 每个关键步骤需要明确目标、任务和关联性，并根据实际业务需求判断哪些步骤需要详细展开。
3. 不同场景下，步骤的设计会有所不同，以下是你需要考虑的几个方面：
   - **自我管理**：明确步骤执行过程中需要哪些自我管理技巧，如时间管理、情绪控制等。
   - **外部影响因素**：如何处理来自他人的影响，比如上级、客户或同事的决策。
   - **时间管理**：如何根据步骤的轻重缓急进行时间规划，确保高效执行。

[业务场景描述]
${userContent}

请生成一个完整的配置文件，必须包含terms，fixedDescriptions，systemRolePrompt三个部分：

1. terms（术语定义）:
   - node1: 主流程名称，体现业务核心
   - node2: 3个以上的关键步骤，按照时间或逻辑顺序排列，通常是当前流程的核心步骤
   - node2ComplexItems: 从node2中选择需要详细展开的重要步骤
   - 其他字段保持默认值:
     node3: "步骤"
     node4: "子步骤"
     node5: "步骤内容"
     mainStructure: "整体流程设计名称"
     title: "标题"
     outline: "大纲"
     content: "内容"
     detail: "详细内容"
     type: "类型"
     detailFlag: "detail"
     sectionDetailType: "sectionDetail"

2. fixedDescriptions（固定描述）:
   *** 重要：必须为node2中的每一个步骤都提供详细描述，该描述是为了更好的分解node2节点的更多子步骤任务 ***
   每个步骤需要提供详细描述。描述要清晰、操作性强，并涵盖以下内容：
   - 目标：该步骤要达到的具体目标
   - 任务：需要执行的具体工作内容
   - 注意事项：执行过程中的关键点和可能遇到的挑战
   - 关联性：该步骤与其他步骤的关联，可能涉及的外部干扰因素及其应对策略
   
   请确保为node2数组中的每一个步骤都提供描述，不能遗漏任何步骤。

3. systemRolePrompt（系统角色提示词）:
   根据业务场景定义AI的专业角色，包括：
   - 专业身份：在该业务领域的专业背景和经验
   - 核心职责：在该业务场景中需要完成的具体工作
   - 工作方法：采用的专业方法论和工作流程
   - 输出标准：确保输出的专业性、可操作性和完整性
   
4. systemRolePrompt 必须根据具体业务场景定制，不能使用通用模板，需要体现该领域的专业性和特点。

请特别注意：
1. node2中的每个步骤都必须在fixedDescriptions中有对应的详细描述
2. fixedDescriptions中每个描述不要再进行分段，直接输出完整描述
3. 所有描述必须专业、具体、可操作
4. 确保生成的配置完整且结构合理
5. systemRolePrompt必须完全根据业务场景定制，体现专业性

参考示例:
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
`
.replace(/\s+/g, ' ')
.trim();

  const messages = [
    {
      role: 'system',
      content: systemPrompt
    }
  ];

  const functions = [
    {
      name: 'generate_dynamic_config',
      description: '根据业务场景生成配置文件',
      parameters: {
        type: 'object',
        properties: {
          terms: {
            type: 'object',
            description: '定义各个节点的名称',
            properties: {
              node1: { type: 'string', description: '主流程名称，体现业务核心' },
              node2: { 
                type: 'array',
                items: { type: 'string' },
                description: '8-12个关键步骤数组，按照时间或逻辑顺序排列，通常是当前流程的核心步骤'
              },
              node2ComplexItems: {
                type: 'array',
                items: { type: 'string' },
                description: '从node2中选择需要详细展开的重要步骤'
              },
              node3: { type: 'string', description: '步骤（保持默认值）' },
              node4: { type: 'string', description: '子步骤（保持默认值）' },
              node5: { type: 'string', description: '步骤内容（保持默认值）' },
              mainStructure: { type: 'string', description: '整体流程设计名称' },
              title: { type: 'string', description: '标题（保持默认值）' },
              outline: { type: 'string', description: '大纲（保持默认值）' },
              content: { type: 'string', description: '内容（保持默认值）' },
              detail: { type: 'string', description: '详细内容（保持默认值）' },
              type: { type: 'string', description: '类型（保持默认值）' },
              detailFlag: { type: 'string', description: 'detail（保持默认值）' },
              sectionDetailType: { type: 'string', description: 'sectionDetail（保持默认值）' }
            },
            required: ['node1', 'node2', 'node2ComplexItems', 'node3', 'node4', 'node5', 'mainStructure', 'title', 'outline', 'content', 'detail', 'type', 'detailFlag', 'sectionDetailType']
          },
          fixedDescriptions: {
            type: 'object',
            description: '为node2中的每个步骤提供详细描述，包含目标、任务、注意事项等，不要分段',
            additionalProperties: {
              type: 'string',
              description: '步骤的详细描述'
            }
          },
          systemRolePrompt: {
            type: 'string',
            description: '根据业务场景定义AI的专业角色，包括专业身份、核心职责、工作方法和输出标准'
          }
        },
        required: ['terms', 'fixedDescriptions', 'systemRolePrompt']
      }
    }
  ];

  const function_call = { name: 'generate_dynamic_config' };

  try {
    const result = await callAIAPI(apiUrl, apiKey, model, messages, functions, function_call);
    
    // 验证配置
    if (result && result.functionResult) {
      validateDynamicConfig(result.functionResult);
      return result;
    } else {
      throw new Error('生成的配置数据无效');
    }
  } catch (error) {
    console.error('生成动态配置失败:', error);
    throw new Error(`生成动态配置失败: ${error.message}`);
  }
}

// 验证动态配置
function validateDynamicConfig(config) {
  // 检查基本结构
  if (!config.terms || !config.fixedDescriptions || !config.systemRolePrompt) {
    throw new Error('配置文件缺少必要字段 (terms/fixedDescriptions/systemRolePrompt)');
  }

  // 检查 terms 必需字段
  const requiredTerms = [
    'node1', 'node2', 'node2ComplexItems', 'node3', 'node4', 'node5',
    'mainStructure', 'title', 'outline', 'content', 'detail', 'type',
    'detailFlag', 'sectionDetailType'
  ];
  
  for (const term of requiredTerms) {
    if (!config.terms[term]) {
      throw new Error(`配置文件缺少必要字段 terms.${term}`);
    }
  }

  // 检查数组类型
  if (!Array.isArray(config.terms.node2)) {
    throw new Error('node2 必须是数组类型');
  }
  if (!Array.isArray(config.terms.node2ComplexItems)) {
    throw new Error('node2ComplexItems 必须是数组类型');
  }

  // 检查 node2 数组长度
  if (config.terms.node2.length < 2 || config.terms.node2.length > 36) {
    throw new Error('node2 数组长度必须大于2');
  }

  // 检查 node2ComplexItems 中的项必须存在于 node2 中
  for (const complexItem of config.terms.node2ComplexItems) {
    if (!config.terms.node2.includes(complexItem)) {
      throw new Error(`node2ComplexItems 中的项 "${complexItem}" 必须存在于 node2 中`);
    }
  }

  // 检查 fixedDescriptions 中的描述是否与 node2 中的步骤匹配
  for (const node2Item of config.terms.node2) {
    if (!config.fixedDescriptions[node2Item]) {
      // 尝试查找数字编号的描述（例如："步骤1"）
      const stepNumber = config.terms.node2.indexOf(node2Item) + 1;
      const alternativeKey = `步骤${stepNumber}`;
      
      if (config.fixedDescriptions[alternativeKey]) {
        // 如果找到了数字编号的描述，将其复制到正确的键名下
        config.fixedDescriptions[node2Item] = config.fixedDescriptions[alternativeKey];
        delete config.fixedDescriptions[alternativeKey];
      } else {
        throw new Error(`缺少 ${node2Item} 的固定描述`);
      }
    }
  }

  // 设置默认值
  config.terms.node3 = config.terms.node3 || '步骤';
  config.terms.node4 = config.terms.node4 || '子步骤';
  config.terms.node5 = config.terms.node5 || '步骤内容';
  config.terms.title = config.terms.title || '标题';
  config.terms.outline = config.terms.outline || '大纲';
  config.terms.content = config.terms.content || '内容';
  config.terms.detail = config.terms.detail || '详细内容';
  config.terms.type = config.terms.type || '类型';
  config.terms.detailFlag = config.terms.detailFlag || 'detail';
  config.terms.sectionDetailType = config.terms.sectionDetailType || 'sectionDetail';

  return true;
}

// 新建大纲
export async function generateNewOutline(apiUrl, apiKey, model, userContent, config) {
  const { prompts, functionCalls, systemRolePrompt } = buildConfigFunctions(config);
  const prompt = prompts.generateOutlinePrompt(userContent);
  const messages = buildMessages(model, systemRolePrompt, prompt, functionCalls.outlineFunction.parameters);

  if (model.startsWith('o1-') || model.startsWith('deepseek-')) {
    // O1 和 DeepSeek 模型不使用 functions 参数
    const result = await callAIAPI(apiUrl, apiKey, model, messages);
    // 统一返回格式
    return {
      functionResult: {
        ...result.functionResult,
        type: 'outline'
      }
    };
  } else {
    // GPT 模型使用标准的 function_call 格式
    const functions = [functionCalls.outlineFunction];
    const function_call = { name: functionCalls.outlineFunction.name };
    const { functionResult } = await callAIAPI(apiUrl, apiKey, model, messages, functions, function_call);
    return {
      functionResult: {
        ...functionResult,
        type: 'outline'
      }
    };
  }
}

// 调整大纲
export async function adjustOutline(apiUrl, apiKey, model, currentOutline, adjustments, config) {
  const { prompts, functionCalls, systemRolePrompt } = buildConfigFunctions(config);
  const prompt = prompts.adjustOutlinePrompt(currentOutline, adjustments);
  const messages = buildMessages(model, systemRolePrompt, prompt, functionCalls.outlineFunction.parameters);

  if (model.startsWith('o1-') || model.startsWith('deepseek-')) {
    // O1 和 DeepSeek 模型不使用 functions 参数
    const result = await callAIAPI(apiUrl, apiKey, model, messages);
    // 统一返回格式
    return {
      functionResult: {
        ...result.functionResult,
        type: 'outline'
      }
    };
  } else {
    // GPT 模型使用标准的 function_call 格式
    const functions = [functionCalls.outlineFunction];
    const function_call = { name: functionCalls.outlineFunction.name };
    const { functionResult } = await callAIAPI(apiUrl, apiKey, model, messages, functions, function_call);
    return {
      functionResult: {
        ...functionResult,
        type: 'outline'
      }
    };
  }
}

