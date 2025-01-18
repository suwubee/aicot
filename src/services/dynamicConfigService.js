// dynamicConfigService.js
import { generateDynamicConfig } from '../api';
import { createAssistantMessage } from './messageService';

/**
 * 处理动态配置生成
 * @param {string} apiUrl - API地址
 * @param {string} apiKey - API密钥
 * @param {string} model - 模型名称
 * @param {string} userContent - 用户输入内容
 * @returns {Promise<Object>} 包含配置和消息的对象
 */
export const handleDynamicConfig = async (apiUrl, apiKey, model, userContent) => {
  try {
    // 调用API生成动态配置
    const { functionResult: config } = await generateDynamicConfig(apiUrl, apiKey, model, userContent);

    // 确保配置包含所有必要的字段
    const completeConfig = {
      ...config,
      id: 'dynamic',
      name: '动态思维链',
      isDynamic: true,
      isSystemConfig: true,
      // 确保terms包含所有必要的默认值
      terms: {
        node1: config.terms.node1 || '',
        node2: config.terms.node2 || [],
        node2ComplexItems: config.terms.node2ComplexItems || [],
        node3: config.terms.node3 || '步骤',
        node4: config.terms.node4 || '子步骤',
        node5: config.terms.node5 || '内容',
        mainStructure: config.terms.mainStructure || '流程设计',
        title: config.terms.title || '标题',
        outline: config.terms.outline || '大纲',
        content: config.terms.content || '内容',
        detail: config.terms.detail || '详细内容',
        type: config.terms.type || '类型',
        detailFlag: config.terms.detailFlag || 'detail',
        sectionDetailType: config.terms.sectionDetailType || 'sectionDetail'
      },
      fixedDescriptions: config.fixedDescriptions || {},
      systemRolePrompt: config.systemRolePrompt || ''
    };

    // 创建配置生成成功的消息
    const configMessage = createAssistantMessage(
      `已根据业务场景生成配置:\n\`\`\`json\n${JSON.stringify(completeConfig, null, 2)}\n\`\`\``,
      'config',
      completeConfig
    );

    // 返回配置和消息
    return {
      config: completeConfig,
      message: configMessage
    };
  } catch (error) {
    console.error('生成动态配置失败:', error);
    throw new Error(`生成动态配置失败: ${error.message}`);
  }
}; 