
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const projectNameEl = document.getElementById('projectName');
    const requirementsEl = document.getElementById('requirements');
    const techSupplementEl = document.getElementById('techSupplement');
    const ruleLanguageEl = document.getElementById('ruleLanguage');
    const ruleProgressInstructionEl = document.getElementById('ruleProgressInstruction');
    const ruleInteractionEl = document.getElementById('ruleInteraction');
    const ruleCodeModEl = document.getElementById('ruleCodeMod');
    const includeReferenceEl = document.getElementById('includeReference');
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const outputArea = document.querySelector('.output-area');
    const outputJsonEl = document.getElementById('outputJson');

    // --- Default Rules (Polished and Professional) ---
    const defaultRules = {
        language: "Chinese",
        progressLogInstruction: "请以模块化方式进行开发。每次完成一个功能模块或关键任务后，请在此处记录清晰的进度摘要。如果开发受阻，也请明确记录遇到的问题、尝试过的解决方案及当前状态。",
        interactionModel: "您的核心职责是代码实现与迭代。您只需专注于根据需求编写和修改代码，并报告进度。所有代码的运行、调试和验证工作将由我负责。请在每次代码交付时，提供清晰的本地运行与调试指令。",
        codeModification: "为保证项目稳定性，已完成并验证的功能模块代码拥有高优先级保护。除非新功能需求或 Bug 修复明确要求，否则严禁修改现有稳定代码。任何必要的修改都必须经过充分评估，并在进度日志中明确说明原因。"
    };
    
    // --- All Possible Deliverables Definitions ---
    const deliverablesDefinitions = {
        analysis: { type: "doc", path: "./项目文档/详细需求分析.md", name: "详细需求分析" },
        dict: { type: "doc", path: "./项目文档/数据字典.md", name: "数据字典" },
        sql: { type: "database", path: "./项目文档/{projectName}.sql", name: "数据库文件" },
        data: { type: "database", path: "./项目文档/data_insert.sql", name: "数据库初始化文件" },
        api: { type: "doc", path: "./项目文档/接口文档.md", name: "接口文档" },
        tech: { type: "doc", path: "./项目文档/项目技术文档.md", name: "项目技术文档" },
        frontendProto: { type: "prototype", path: "./项目文档/frontend_prototype/", name: "动态纯前端原型", checkedByDefault: false }
    };

    // --- Initial Setup ---
    const init = () => {
        ruleLanguageEl.value = defaultRules.language;
        ruleProgressInstructionEl.value = defaultRules.progressLogInstruction;
        ruleInteractionEl.value = defaultRules.interactionModel;
        ruleCodeModEl.value = defaultRules.codeModification;

        // Set default checked state for deliverables (already done in HTML, but good for consistency)
        // For new items, set checked status explicitly if not default true
        document.getElementById('del-frontend-proto').checked = deliverablesDefinitions.frontendProto.checkedByDefault;
    };

    // --- Core Functions ---
    function generateJson() {
        const projectName = projectNameEl.value.trim();
        if (!projectName) {
            alert('请输入项目名！');
            projectNameEl.focus();
            return;
        }

        const requirementsText = requirementsEl.value.trim();
        if (!requirementsText) {
            alert('请输入大致/详细需求！');
            requirementsEl.focus();
            return;
        }

        // --- Inject hidden prompts for Project Name ---
        const overallInstruction = `根据项目名称“${projectName}”和以下提示词要求，开发一个项目。`;
        
        // --- Inject hidden prompts for Requirements ---
        const finalRequirements = `${requirementsText}\n\n---\n**AI 任务指令：**\n基于上述需求，请分析并完善成一份更加细致、可执行的需求文档。`;

        const userInput = { requirements: finalRequirements };
        if (includeReferenceEl.checked) {
            userInput.referenceProject = {
                path: './参考项目',
                instruction: '请参考项目根目录下“参考项目”文件夹内的代码（学习其前后端代码风格、UI/UX 设计）、图片及其他文件，以实现上述需求。'
            };
        }

        const techStack = {
            frontend: getSelectedCheckboxes('frontend'),
            backend: getSelectedCheckboxes('backend'),
            database: getSelectedCheckboxes('database'),
            supplement: techSupplementEl.value.trim(),
            instruction: "大部分情况基于选定的技术栈完成。根据需求分析，您可自行补充或提出更优技术栈方案。但在编码前，请务必提前与我沟通并说明具体技术栈的调整，并在项目技术文档中更新最终技术栈方案。"
        };

        // --- Build Deliverables Array Dynamically and Generate Instruction ---
        const selectedDeliverableKeys = getSelectedCheckboxes('deliverable');
        const finalDeliverables = [];
        const selectedDeliverableNames = [];

        selectedDeliverableKeys.forEach(key => {
            const definition = deliverablesDefinitions[key];
            if (definition) {
                let deliverable = { type: definition.type, path: definition.path };
                if (deliverable.path.includes('{projectName}')) {
                    deliverable.path = deliverable.path.replace('{projectName}', projectName);
                }
                finalDeliverables.push(deliverable);
                selectedDeliverableNames.push(definition.name); // Collect names for instruction
            }
        });

        // --- Deliverables Instruction ---
        const deliverablesInstruction = 
            `根据上面提示词，生成以下文件：${selectedDeliverableNames.join('、')}。` +
            `\n- 数据字典：请详细说明数据库结构，包括字段设计、数据类型、约束、索引、表之间关系以及其他必要的元数据。` +
            `\n- 接口文档：请按模块划分，并严格遵循数据库约束定义接口规范。确保文档完整、准确，作为前后端开发的关键参考依据。` +
            `\n- 项目技术文档：请详细阐述项目的技术栈（包括前端、后端、数据库及其他辅助技术）、开发环境配置、运行与部署环境要求及关键技术选型说明。`;

        const finalRules = {
            language: ruleLanguageEl.value.trim() || defaultRules.language,
            progressLog: {
                path: "./项目文档/项目开发进度.md",
                instruction: ruleProgressInstructionEl.value.trim() || defaultRules.progressLogInstruction
            },
            interactionModel: ruleInteractionEl.value.trim() || defaultRules.interactionModel,
            codeModification: ruleCodeModEl.value.trim() || defaultRules.codeModification
        };

        const output = {
            overallInstruction: overallInstruction,
            projectName: projectName,
            userInput: userInput,
            techStack: techStack,
            deliverables: finalDeliverables,
            deliverablesInstruction: deliverablesInstruction, // Add the instruction here
            rules: finalRules
        };

        outputJsonEl.textContent = JSON.stringify(output, null, 4);
        outputArea.classList.remove('hidden');
    }

    function getSelectedCheckboxes(name) {
        const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
        return Array.from(checkboxes).map(cb => cb.value);
    }

    function copyToClipboard() {
        const textToCopy = outputJsonEl.textContent;
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '复制成功!';
            copyBtn.style.backgroundColor = 'var(--success-color)';
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.backgroundColor = '#5cb85c'; 
            }, 2000);
        }).catch(err => {
            console.error('无法复制到剪贴板:', err);
            alert('复制失败，请手动复制。');
        });
    }

    // --- Event Listeners ---
    generateBtn.addEventListener('click', generateJson);
    copyBtn.addEventListener('click', copyToClipboard);

    // --- Run Initialization ---
    init();
});
