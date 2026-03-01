// 身份管理功能测试脚本

const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('🧪 OpenDashboard 身份管理功能测试');
console.log('='.repeat(60));

// 测试 1: 检查 identity.js 文件是否存在
console.log('\n✅ 测试 1: 检查文件是否存在');
const identityFile = path.join(__dirname, 'js/identity.js');
if (fs.existsSync(identityFile)) {
    console.log('   ✅ identity.js 文件存在');
} else {
    console.log('   ❌ identity.js 文件不存在');
}

// 测试 2: 检查 index.html 是否引入 identity.js
console.log('\n✅ 测试 2: 检查 index.html 是否引入 identity.js');
const indexFile = path.join(__dirname, 'index.html');
const indexContent = fs.readFileSync(indexFile, 'utf-8');
if (indexContent.includes('js/identity.js')) {
    console.log('   ✅ index.html 已引入 identity.js');
} else {
    console.log('   ❌ index.html 未引入 identity.js');
}

// 测试 3: 检查身份面板 HTML 结构
console.log('\n✅ 测试 3: 检查身份面板 HTML 结构');
if (indexContent.includes('id="identityPanel"')) {
    console.log('   ✅ identityPanel 元素存在');
} else {
    console.log('   ❌ identityPanel 元素不存在');
}

if (indexContent.includes('id="identityList"')) {
    console.log('   ✅ identityList 元素存在');
} else {
    console.log('   ❌ identityList 元素不存在');
}

if (indexContent.includes('id="taskList"')) {
    console.log('   ✅ taskList 元素存在');
} else {
    console.log('   ❌ taskList 元素不存在');
}

// 测试 4: 检查 CSS 样式
console.log('\n✅ 测试 4: 检查 CSS 样式');
const cssFile = path.join(__dirname, 'css/style.css');
const cssContent = fs.readFileSync(cssFile, 'utf-8');
if (cssContent.includes('.identity-card')) {
    console.log('   ✅ identity-card 样式存在');
} else {
    console.log('   ❌ identity-card 样式不存在');
}

if (cssContent.includes('.task-section')) {
    console.log('   ✅ task-section 样式存在');
} else {
    console.log('   ❌ task-section 样式不存在');
}

// 测试 5: 检查 IdentityManager 类
console.log('\n✅ 测试 5: 检查 IdentityManager 类结构');
const identityContent = fs.readFileSync(identityFile, 'utf-8');
if (identityContent.includes('class IdentityManager')) {
    console.log('   ✅ IdentityManager 类定义存在');
} else {
    console.log('   ❌ IdentityManager 类定义不存在');
}

if (identityContent.includes('addTask')) {
    console.log('   ✅ addTask 方法存在');
} else {
    console.log('   ❌ addTask 方法不存在');
}

if (identityContent.includes('switchIdentity')) {
    console.log('   ✅ switchIdentity 方法存在');
} else {
    console.log('   ❌ switchIdentity 方法不存在');
}

if (identityContent.includes('renderIdentities')) {
    console.log('   ✅ renderIdentities 函数存在');
} else {
    console.log('   ❌ renderIdentities 函数不存在');
}

if (identityContent.includes('renderTasks')) {
    console.log('   ✅ renderTasks 函数存在');
} else {
    console.log('   ❌ renderTasks 函数不存在');
}

// 测试 6: 检查身份 ID 一致性
console.log('\n✅ 测试 6: 检查身份 ID 一致性');
const dogdanMatches = (identityContent.match(/'dogdan'/g) || []).length;
console.log(`   使用 'dogdan': ${dogdanMatches} 次`);
if (dogdanMatches > 0) {
    console.log('   ✅ 身份 ID 使用纯英文');
} else {
    console.log('   ⚠️  身份 ID 可能有问题');
}

// 测试 7: 检查 localStorage 处理
console.log('\n✅ 测试 7: 检查 localStorage 处理');
if (identityContent.includes('localStorage.setItem')) {
    console.log('   ✅ localStorage 保存逻辑存在');
} else {
    console.log('   ❌ localStorage 保存逻辑不存在');
}

if (identityContent.includes('localStorage.getItem')) {
    console.log('   ✅ localStorage 加载逻辑存在');
} else {
    console.log('   ❌ localStorage 加载逻辑不存在');
}

if (identityContent.includes('合并保存的身份和默认身份')) {
    console.log('   ✅ 数据合并逻辑存在');
} else {
    console.log('   ⚠️  数据合并逻辑可能缺失');
}

console.log('\n' + '='.repeat(60));
console.log('✅ 自动化测试完成！');
console.log('='.repeat(60));
