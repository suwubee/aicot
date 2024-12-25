// api.js
// 通用的 AI API 调用函数
export async function callAIAPI(apiUrl, apiKey, model, messages, functions, function_call) {
  let body;
  if (model.startsWith('o1-')) {
    // 如果是 o1- 开头的模型,去掉 functions 和 function_call
    body = JSON.stringify({
      model: model,
      messages: messages,
      temperature: 1,
      max_tokens: 8000,
    });
  } else {
    body = JSON.stringify({
      model: model,
      messages: messages,
      functions: functions,
      function_call: function_call,
      temperature: 0.5,
      max_tokens: 8000,
    });
  }

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
  const message = data.choices[0].message;

  if (model.startsWith('o1-')) {
    // 对于 o1 等模型,需要从 message.content 中提取 JSON
    const jsonMatch = message.content.match(/```json[\s\S]*?\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        // 将匹配到的 JSON 字符串中的换行符替换为空格,并替换掉多余的引号
        const jsonStr = jsonMatch[1].replace(/\n/g, ' ').replace(/\\"/g, '"');
        const functionResult = JSON.parse(jsonStr);
        return { functionResult };
      } catch (error) {
        console.error('提取 JSON 时出错:', error);
        throw new Error('AI 返回的数据格式不正确。');
      }
    } else {
      throw new Error('AI 返回的数据中未找到 JSON。');
    }
  } else {
    // 检查是否有函数调用结果
    if (message.function_call && message.function_call.arguments) {
      const functionResult = JSON.parse(message.function_call.arguments);
      return { functionResult };
    } else {
      throw new Error('AI 返回的数据不包含 function_call 信息。');
    }
  }
}

// 新增函数,根据模型类型构建消息数组
function buildMessages(model, systemRolePrompt, userPrompt, functionParams) {
  if (model.startsWith('o1-')) {
    // 如果是 o1- 开头的模型,将 systemRolePrompt 放在 userPrompt 前面,并将 functionParams 转化为提示词
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
  } else {
    // 其他模型保持原有的消息格式
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

  if (model.startsWith('o1-')) {
    return await callAIAPI(apiUrl, apiKey, model, messages);
  } else {
    const functions = [functionCalls.mainStructureFunction];
    const function_call = { name: functionCalls.mainStructureFunction.name };
    return await callAIAPI(apiUrl, apiKey, model, messages, functions, function_call);
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
    generateMainStructurePrompt: (userContent) =>
      `请为"${userContent}"设计一套完整的${terms.node1}方案。`,

    adjustMainStructurePrompt: (currentDesign, adjustments) =>
      `根据之前的${terms.node1}内容:
\`\`\`json
${JSON.stringify(currentDesign, null, 2).replace(/\s+/g, ' ').replace(/\n/g, ' ')}
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
${JSON.stringify(currentDesign, null, 2).replace(/\s+/g, ' ').replace(/\n/g, ' ')} 

${existingSectionsPrompt}

根据${terms.node1}内容和${terms.outline},为${terms.node1}中的第 ${nodeIndexes.node3} 个${terms.node3} "${nodeTitle}" 的第 ${nodeIndexes.node4} 个${terms.node4} "${subNodeTitle}" 生成详细的${terms.detail}。

请为 "${terms.detail}" 字段生成详细的内容,使用 Markdown 格式。

**重要提示:**
- 所有字符串内容需要进行适当的转义,特别是特殊字符（如引号、反斜杠、换行符等）和 Markdown 标记。
- 不要添加额外的说明文字或注释。
- 请参考当前${terms.node3}中已有的${terms.node4}内容,避免生成重复的内容。

`,

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

${existingSectionsPrompt}

根据${terms.mainStructure}内容和${terms.outline},为${terms.mainStructure}中的第 ${nodeIndexes.node3 || ''} 个${terms.node3} "${nodeTitle || ''}" 的第 ${nodeIndexes.node4 || ''} 个${terms.node4} "${subNodeTitle || ''}" 生成详细的${terms.detail}。


调整意见:
${adjustments || ''}
`,
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

  if (model.startsWith('o1-')) {
    return await callAIAPI(apiUrl, apiKey, model, messages);
  } else {
    const functions = [functionCalls.mainStructureFunction];
    const function_call = { name: functionCalls.mainStructureFunction.name };
    return await callAIAPI(apiUrl, apiKey, model, messages, functions, function_call);
  }
}

// 新建详细内容
export async function generateNewDetail(apiUrl, apiKey, model, nodeIndexes, mainStructure, messages, config) {
  if (!config) {
    throw new Error('配置文件缺失或未定义');
  }
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

    // 构建简单节点的提示词
    const prompt = `
根据${terms.mainStructure}内容:
${JSON.stringify(mainStructure, null, 2).replace(/\s+/g, ' ').replace(/\n/g, ' ')} 

请为 "${node2Name}" 生成详细的${terms.detail}。
当前内容: ${content}

请生成更详细的内容描述，使用 Markdown 格式。
`;

    const messages = buildMessages(model, systemRolePrompt, prompt, functionCalls.detailFunction.parameters);

    if (model.startsWith('o1-')) {
      return await callAIAPI(apiUrl, apiKey, model, messages);
    } else {
      const functions = [functionCalls.detailFunction];
      const function_call = { name: functionCalls.detailFunction.name };
      return await callAIAPI(apiUrl, apiKey, model, messages, functions, function_call);
    }
  }

  // 原有的复杂节点处理逻辑...
  const node2Data = mainStructure[terms.node1][nodeIndexes.node2Name];
  if (!Array.isArray(node2Data) || nodeIndexes.node3 < 1 || nodeIndexes.node3 > node2Data.length) {
    throw new Error(`${terms.node2} 节点 "${nodeIndexes.node2Name}" 的索引 ${nodeIndexes.node3} 超出范围`);
  }

  // 获取模块数据时，防止变量名冲突，改名为 node3DetailData
  const node3DetailData = node2Data[nodeIndexes.node3 - 1];

  if (
    !node3DetailData[terms.content] ||
    nodeIndexes.node4 < 1 ||
    nodeIndexes.node4 > node3DetailData[terms.content].length
  ) {
    throw new Error(`${terms.node4} 索引 ${nodeIndexes.node4} 超出范围`);
  }

  // existingSections 仅包含已生成的 node4 内容，并过滤空内容
  const existingSections = node3DetailData[terms.content]
    .map((section, index) => {
      if (index === nodeIndexes.node4 - 1) return ''; // 跳过当前生成的 node4 环节

      const sectionTitle = section;
      let sectionDetail = '';

      // 查找详细内容
      const detailMessage = messages.find(
        (msg) =>
          msg.type === terms.sectionDetailType &&
          msg.data.nodeIndexes.node2Name === nodeIndexes.node2Name &&
          msg.data.nodeIndexes.node3 === nodeIndexes.node3 &&
          msg.data.nodeIndexes.node4 === index + 1
      );

      // 仅当存在详细内容时才加入该 section
      sectionDetail = detailMessage ? detailMessage.data[terms.detail] : '';
      if (sectionDetail) {
        return `第${index + 1}${terms.node4}: ${sectionTitle}\n${sectionDetail}`;
      } else {
        return ''; // 无内容则返回空字符串以过滤
      }
    })
    .filter((section) => section.trim() !== ''); // 过滤空内容

  // 构建 existingSectionsPrompt
  let existingSectionsPrompt = '';
  if (existingSections.length > 0) {
    existingSectionsPrompt = `
当前${terms.node3} "${node3DetailData[terms.title]}" 中已有的其他${terms.node4}内容:
${existingSections.join('\n\n')}
    `;
  }

  // 生成详细内容的提示词
  const node3Title = node3DetailData[terms.title];
  const node4Title = node3DetailData[terms.content][nodeIndexes.node4 - 1];

  const prompt = prompts.generateDetailPrompt(
    nodeIndexes,
    mainStructure,
    existingSectionsPrompt,
    node3Title,
    node4Title
  );

  const messagesToSend = buildMessages(model, systemRolePrompt, prompt, functionCalls.detailFunction.parameters);

  if (model.startsWith('o1-')) {
    return await callAIAPI(apiUrl, apiKey, model, messagesToSend);
  } else {
    const functions = [functionCalls.detailFunction];
    const function_call = { name: functionCalls.detailFunction.name };
    return await callAIAPI(apiUrl, apiKey, model, messagesToSend, functions, function_call);
  }
}

// 调整详细内容
export async function adjustDetail(apiUrl, apiKey, model, currentContent, adjustments, nodeIndexes, currentDesign, chatMessages, config) {
  const { prompts, functionCalls, systemRolePrompt } = buildConfigFunctions(config);
  
  // 添加以下两行代码
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

  // existingSections 仅包含已生成的 node4 内容，并过滤空内容
  const existingSections = node3Data[terms.content]
    .map((section, index) => {
      if (index === nodeIndexes.node4 - 1) return ''; // 跳过当前生成的 node4 环节

      const sectionTitle = section;
      let sectionDetail = '';

      // 查找详细内容
      const detailMessage = chatMessages.find(
        (msg) =>
          msg.type === terms.sectionDetailType &&
          msg.data.nodeIndexes.node2Name === nodeIndexes.node2Name &&
          msg.data.nodeIndexes.node3 === nodeIndexes.node3 &&
          msg.data.nodeIndexes.node4 === index + 1
      );

      // 仅当存在详细内容时才加入该 section
      sectionDetail = detailMessage ? detailMessage.data[terms.detail] : '';
      if (sectionDetail) {
        return `第${index + 1}${terms.node4}: ${sectionTitle}\n${sectionDetail}`;
      } else {
        return ''; // 无内容则返回空字符串以过滤
      }
    })
    .filter((section) => section.trim() !== ''); // 过滤空内容

  // 构建 existingSectionsPrompt
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

  if (model.startsWith('o1-')) {
    const data = await callAIAPI(apiUrl, apiKey, model, messages);
    const jsonMatch = data.functionResult[terms.detail].match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        const detailContent = JSON.parse(jsonMatch[1]);
        return {
          functionResult: {
            ...data.functionResult,
            [terms.detail]: detailContent,
            [terms.title]: node3Data[terms.title],
            nodeIndexes: nodeIndexes,
          },
        };
      } catch (error) {
        console.error('提取 JSON 时出错:', error);
        throw new Error('AI 返回的数据格式不正确。');
      }
    } else {
      throw new Error('AI 返回的数据中未找到 JSON。');
    }
  } else {
    const functions = [functionCalls.detailFunction];
    const function_call = { name: functionCalls.detailFunction.name };
    const { functionResult } = await callAIAPI(apiUrl, apiKey, model, messages, functions, function_call);
    return {
      functionResult: {
        ...functionResult,
        [terms.title]: node3Data[terms.title],
        nodeIndexes: nodeIndexes,
      },
    };
  }
}

