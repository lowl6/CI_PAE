# 贡献指南

感谢您对CI-PAE项目的关注！我们欢迎所有形式的贡献，包括但不限于代码、文档、问题反馈和功能建议。

## 🤝 如何贡献

### 1. 报告问题

如果您发现了bug或有功能建议：

1. **检查现有Issues**: 在[Issues页面](https://github.com/lowl6/CI_PAE/issues)搜索是否已有相关问题
2. **创建新Issue**: 使用相应的模板创建新问题
3. **提供详细信息**: 包括复现步骤、环境信息、截图等

### 2. 提交代码

#### 开发流程

1. **Fork项目**: 在GitHub上fork项目到您的账户
2. **克隆项目**: `git clone https://github.com/YOUR_USERNAME/CI_PAE.git`
3. **创建分支**: `git checkout -b feature/your-feature-name`
4. **开发功能**: 按照代码规范进行开发
5. **提交代码**: 遵循提交信息规范
6. **推送分支**: `git push origin feature/your-feature-name`
7. **创建PR**: 向主仓库的develop分支提交Pull Request

#### 代码规范

请遵循项目的[开发指南](./DEVELOPMENT.md)中的代码规范：

- 使用ESLint和Prettier格式化代码
- 遵循Vue.js和JavaScript最佳实践
- 编写清晰的注释和文档
- 确保代码通过测试

#### 提交信息规范

```bash
# 格式
<type>(<scope>): <description>

# 示例
feat(analysis): add data export functionality
fix(auth): resolve token expiration issue
docs(readme): update installation guide
```

### 3. 文档贡献

- **改进文档**: 修正错误、补充说明、添加示例
- **翻译文档**: 将文档翻译成其他语言
- **创建教程**: 编写使用教程和最佳实践

## 📋 贡献类型

### 💻 代码贡献

- **新功能**: 实现新的功能模块
- **Bug修复**: 修复已知问题
- **性能优化**: 提升系统性能
- **代码重构**: 改善代码结构

### 📚 文档贡献

- **API文档**: 完善接口文档
- **用户指南**: 编写使用教程
- **开发文档**: 更新技术文档
- **翻译工作**: 多语言支持

### 🎨 设计贡献

- **UI改进**: 优化用户界面
- **UX优化**: 提升用户体验
- **图标设计**: 设计应用图标
- **宣传材料**: 制作宣传资料

### 🐛 测试贡献

- **单元测试**: 编写测试用例
- **集成测试**: 端到端测试
- **性能测试**: 压力测试和性能分析
- **兼容性测试**: 跨浏览器/设备测试

## 📝 开发环境设置

### 环境要求

- Node.js >= 18.0.0
- MySQL >= 8.0.0
- Git >= 2.0.0

### 快速开始

```bash
# 1. Fork并克隆项目
git clone https://github.com/YOUR_USERNAME/CI_PAE.git
cd CI_PAE

# 2. 安装依赖
npm run install:all

# 3. 配置环境变量
cp .env.example .env

# 4. 初始化数据库
npm run init-db

# 5. 启动开发服务器
npm run dev
```

### 开发工具推荐

- **IDE**: VS Code + Vue扩展
- **API测试**: Thunder Client/Postman
- **数据库管理**: MySQL Workbench
- **版本控制**: Git + GitHub Desktop

## 🔄 Pull Request流程

### 1. 准备工作

- [ ] 确保代码符合项目规范
- [ ] 运行测试确保通过
- [ ] 更新相关文档
- [ ] 检查分支最新

### 2. 创建PR

1. **选择目标分支**: 通常向`develop`分支提交
2. **填写PR描述**: 详细说明变更内容
3. **添加相关标签**: 如`feature`、`bugfix`等
4. **关联Issues**: 如果修复了某个问题

### 3. PR模板

```markdown
## 变更描述
简要描述本次变更的内容和目的

## 变更类型
- [ ] 新功能
- [ ] Bug修复
- [ ] 文档更新
- [ ] 代码重构
- [ ] 性能优化
- [ ] 其他

## 测试
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试完成

## 检查清单
- [ ] 代码符合项目规范
- [ ] 已更新相关文档
- [ ] 无明显性能问题
- [ ] 考虑了安全性影响

## 相关Issue
Closes #(issue number)
```

### 4. 代码审查

- **审查重点**: 功能正确性、代码质量、安全性
- **响应时间**: 及时回应审查意见
- **修改要求**: 根据反馈进行调整

## 🏷️ 发布流程

### 版本命名

- **主版本**: 破坏性变更 (如 1.0.0 → 2.0.0)
- **次版本**: 新功能 (如 1.0.0 → 1.1.0)
- **修订版本**: Bug修复 (如 1.0.0 → 1.0.1)

### 发布检查清单

- [ ] 所有测试通过
- [ ] 文档已更新
- [ ] 变更日志已编写
- [ ] 版本号已更新
- [ ] 标签已创建

## 🎖️ 贡献者认可

### 贡献者列表

我们会在以下地方认可贡献者：

- **README.md**: 主要贡献者
- **发布日志**: 每个版本的贡献者
- **项目网站**: 贡献者展示页面
- **年度报告**: 优秀贡献者表彰

### 贡献等级

- **🌟 新手**: 首次贡献
- **🚀 活跃**: 持续贡献
- **💎 核心**: 重要贡献者
- **👑 维护者**: 项目维护者

## 📞 联系方式

- **项目主页**: [GitHub仓库](https://github.com/lowl6/CI_PAE)
- **问题讨论**: [GitHub Discussions](https://github.com/lowl6/CI_PAE/discussions)
- **即时沟通**: [Slack频道](https://ci-pae.slack.com)
- **邮件联系**: contribute@ci-pae.com

## 📄 许可证

通过贡献代码，您同意您的贡献将在[MIT许可证](../LICENSE)下发布。

## 🙏 致谢

感谢所有为CI-PAE项目做出贡献的开发者！您的参与让这个项目变得更好。

---

**最后更新**: 2024年1月XX日
**维护团队**: CI-PAE项目组