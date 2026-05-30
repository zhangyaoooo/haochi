# 家庭点餐微信小程序 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个单家庭内部使用的微信点餐小程序，支持菜谱管理、点餐、认领烹饪、评价的完整流程。

**Architecture:** 微信小程序前端 + 微信云开发后端（云函数 + 云数据库 + 云存储）。3 个 Tab 页面 + 4 个子页面，3 个数据库集合，15 个云函数。

**Tech Stack:** 微信小程序原生框架、微信云开发（Node.js 云函数）、云数据库（NoSQL）

---

### Task 1: 项目脚手架 & 全局配置

**Files:**
- Create: `project.config.json`
- Create: `miniprogram/app.js`
- Create: `miniprogram/app.json`
- Create: `miniprogram/app.wxss`
- Create: `miniprogram/utils/api.js`

- [ ] **Step 1: 创建项目配置文件**

```json
// project.config.json
{
  "miniprogramRoot": "miniprogram/",
  "cloudfunctionRoot": "cloudfunctions/",
  "setting": {
    "urlCheck": true,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "minified": true
  },
  "appid": "{{YOUR_APPID}}",
  "projectname": "haochi"
}
```

- [ ] **Step 2: 创建小程序入口 app.js**

```js
// miniprogram/app.js
App({
  onLaunch() {
    wx.cloud.init({
      env: '{{YOUR_ENV_ID}}',
      traceUser: true
    });
  },

  // 全局登录态检查
  checkLogin() {
    const isLoggedIn = wx.getStorageSync('isLoggedIn');
    return !!isLoggedIn;
  },

  setLoginState() {
    wx.setStorageSync('isLoggedIn', true);
  }
});
```

- [ ] **Step 3: 创建 app.json（路由 + Tab 栏）**

```json
// miniprogram/app.json
{
  "pages": [
    "pages/recipes/recipes",
    "pages/table/table",
    "pages/mine/mine",
    "pages/login/login",
    "pages/recipe-detail/recipe-detail",
    "pages/recipe-form/recipe-form",
    "pages/history/history"
  ],
  "tabBar": {
    "list": [
      {
        "pagePath": "pages/recipes/recipes",
        "text": "菜谱",
        "iconPath": "images/recipe.png",
        "selectedIconPath": "images/recipe-active.png"
      },
      {
        "pagePath": "pages/table/table",
        "text": "餐桌",
        "iconPath": "images/table.png",
        "selectedIconPath": "images/table-active.png"
      },
      {
        "pagePath": "pages/mine/mine",
        "text": "我的",
        "iconPath": "images/mine.png",
        "selectedIconPath": "images/mine-active.png"
      }
    ]
  },
  "window": {
    "backgroundTextStyle": "light",
    "navigationBarBackgroundColor": "#fff",
    "navigationBarTitleText": "好吃家庭",
    "navigationBarTextStyle": "black"
  },
  "style": "v2",
  "sitemapLocation": "sitemap.json"
}
```

- [ ] **Step 4: 全局样式**

```css
/* miniprogram/app.wxss */
page {
  --color-primary: #e85d04;
  --color-bg: #f8f8f8;
  --color-text: #333;
  --color-text-light: #999;
  --color-border: #eee;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 28rpx;
  color: var(--color-text);
  background: var(--color-bg);
}

.container {
  padding: 24rpx;
}

/* 原子类 */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-1 { flex: 1; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.text-sm { font-size: 24rpx; color: var(--color-text-light); }
.text-lg { font-size: 32rpx; font-weight: 600; }
.mt-2 { margin-top: 16rpx; }
.mb-2 { margin-bottom: 16rpx; }
.p-3 { padding: 24rpx; }
.bg-white { background: #fff; }
.rounded { border-radius: 16rpx; }
.btn-primary {
  background: var(--color-primary);
  color: #fff;
  border-radius: 12rpx;
  padding: 20rpx 48rpx;
  text-align: center;
  font-size: 30rpx;
}
```

- [ ] **Step 5: API 工具封装**

```js
// miniprogram/utils/api.js
const db = wx.cloud.database();

// 调用云函数
function call(name, data = {}) {
  return wx.cloud.callFunction({ name, data }).then(res => res.result);
}

function getCollection(name) {
  return db.collection(name);
}

module.exports = { call, getCollection };
```

- [ ] **Step 6: 初始化 git 并提交**

```bash
git init
git add -A
git commit -m "feat: project scaffold with app config and utility layer

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: 密码验证 & 登录

**Files:**
- Create: `miniprogram/pages/login/login.js`
- Create: `miniprogram/pages/login/login.wxml`
- Create: `miniprogram/pages/login/login.wxss`
- Create: `cloudfunctions/login/index.js`
- Create: `cloudfunctions/login/package.json`

- [ ] **Step 1: 创建登录云函数**

```json
// cloudfunctions/login/package.json
{
  "name": "login",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3"
  }
}
```

```js
// cloudfunctions/login/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const FAMILY_PASSWORD = '33066';

exports.main = async (event) => {
  const { password } = event;
  const { OPENID } = cloud.getWXContext();

  if (password !== FAMILY_PASSWORD) {
    return { code: -1, msg: '密码不对，再试试' };
  }

  // 检查是否已有此用户
  const db = cloud.database();
  const exist = await db.collection('users').where({ openid: OPENID }).get();

  if (exist.data.length === 0) {
    await db.collection('users').add({
      data: {
        openid: OPENID,
        createdAt: db.serverDate()
      }
    });
  }

  return { code: 0, msg: 'ok' };
};
```

- [ ] **Step 2: 创建密码验证页逻辑**

```js
// miniprogram/pages/login/login.js
const { call } = require('../../utils/api');
const app = getApp();

Page({
  data: {
    password: '',
    error: ''
  },

  onInput(e) {
    this.setData({ password: e.detail.value, error: '' });
  },

  onSubmit() {
    const { password } = this.data;
    if (!password.trim()) return;

    wx.showLoading({ title: '验证中...' });

    call('login', { password }).then(res => {
      wx.hideLoading();
      if (res.code === 0) {
        app.setLoginState();
        wx.switchTab({ url: '/pages/recipes/recipes' });
      } else {
        this.setData({ error: res.msg });
      }
    }).catch(() => {
      wx.hideLoading();
      wx.showToast({ title: '网络异常，请重试', icon: 'none' });
    });
  }
});
```

- [ ] **Step 3: 创建密码验证页视图**

```xml
<!-- miniprogram/pages/login/login.wxml -->
<view class="container login-page">
  <view class="login-card">
    <view class="login-title">🍽️ 好吃家庭</view>
    <view class="login-subtitle">请输入家庭密码</view>

    <input
      class="password-input"
      type="password"
      placeholder="输入密码"
      value="{{password}}"
      bindinput="onInput"
      focus="{{true}}"
      bindconfirm="onSubmit"
    />

    <view class="error-msg" wx:if="{{error}}">{{error}}</view>

    <button class="btn-primary login-btn" bindtap="onSubmit">
      进入
    </button>
  </view>
</view>
```

```css
/* miniprogram/pages/login/login.wxss */
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  width: 80%;
  text-align: center;
}

.login-title {
  font-size: 48rpx;
  margin-bottom: 16rpx;
}

.login-subtitle {
  color: var(--color-text-light);
  margin-bottom: 48rpx;
}

.password-input {
  border: 2rpx solid var(--color-border);
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 32rpx;
  text-align: center;
  margin-bottom: 16rpx;
}

.error-msg {
  color: #e74c3c;
  font-size: 26rpx;
  margin-bottom: 16rpx;
}

.login-btn {
  width: 100%;
}
```

- [ ] **Step 4: 修改 app.js 添加登录拦截**

在 `miniprogram/app.js` 的 `onLaunch` 末尾添加：检查登录态，未登录则跳转登录页。使用 `wx.redirectTo` 跳转到 `/pages/login/login`。

由于 app.js 已在 Task 1 中创建，这里在下一步更新 app.js。实际操作在 Task 3 中完善路由拦截逻辑。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: add login page and cloud function

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: 云数据库设置 & 路由拦截

**Files:**
- Modify: `miniprogram/app.js`

- [ ] **Step 1: 更新 app.js 添加路由拦截**

```js
// miniprogram/app.js（完整替换）
App({
  onLaunch() {
    wx.cloud.init({
      env: '{{YOUR_ENV_ID}}',
      traceUser: true
    });
  },

  onShow() {
    // 每次切回前台检查登录
    if (!this.checkLogin()) {
      wx.reLaunch({ url: '/pages/login/login' });
    }
  },

  checkLogin() {
    return !!wx.getStorageSync('isLoggedIn');
  },

  setLoginState() {
    wx.setStorageSync('isLoggedIn', true);
  }
});
```

- [ ] **Step 2: 在微信云开发控制台创建数据库集合**

通过微信开发者工具 → 云开发控制台，手动创建以下集合：

```
users     - 权限：所有用户可读，仅创建者可写
recipes   - 权限：所有用户可读，所有用户可写
orders    - 权限：所有用户可读，所有用户可写
```

- [ ] **Step 3: 更新登录云函数，写入用户时补充昵称和头像**

```js
// cloudfunctions/login/index.js（更新）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const FAMILY_PASSWORD = '33066';

exports.main = async (event) => {
  const { password, nickName, avatarUrl } = event;
  const { OPENID } = cloud.getWXContext();

  if (password !== FAMILY_PASSWORD) {
    return { code: -1, msg: '密码不对，再试试' };
  }

  const db = cloud.database();
  const exist = await db.collection('users').where({ openid: OPENID }).get();

  if (exist.data.length === 0) {
    await db.collection('users').add({
      data: {
        openid: OPENID,
        nickName: nickName || '',
        avatarUrl: avatarUrl || '',
        createdAt: db.serverDate()
      }
    });
  } else {
    // 更新昵称和头像（可能变了）
    await db.collection('users').doc(exist.data[0]._id).update({
      data: { nickName: nickName || '', avatarUrl: avatarUrl || '' }
    });
  }

  return { code: 0, msg: 'ok' };
};
```

- [ ] **Step 4: 更新登录页，获取用户信息后传给云函数**

在 `miniprogram/pages/login/login.js` 的 `onSubmit` 中，调用 `wx.getUserProfile` 获取昵称头像（放在密码验证通过后）。

更新后的 `onSubmit`：

```js
onSubmit() {
  const { password } = this.data;
  if (!password.trim()) return;

  wx.showLoading({ title: '验证中...' });

  // 先校验密码
  call('login', { password }).then(res => {
    if (res.code !== 0) {
      wx.hideLoading();
      this.setData({ error: res.msg });
      return;
    }

    // 密码通过后获取用户信息
    wx.getUserProfile({
      desc: '用于显示家庭成员身份'
    }).then(profile => {
      const { nickName, avatarUrl } = profile.userInfo;
      return call('login', { password, nickName, avatarUrl });
    }).then(() => {
      wx.hideLoading();
      app.setLoginState();
      wx.switchTab({ url: '/pages/recipes/recipes' });
    }).catch(err => {
      wx.hideLoading();
      // 用户拒绝授权也放行
      app.setLoginState();
      wx.switchTab({ url: '/pages/recipes/recipes' });
    });
  }).catch(() => {
    wx.hideLoading();
    wx.showToast({ title: '网络异常，请重试', icon: 'none' });
  });
}
```

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: add route guard and update login with user profile

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: 菜谱库列表页（菜谱 Tab）

**Files:**
- Create: `miniprogram/pages/recipes/recipes.js`
- Create: `miniprogram/pages/recipes/recipes.wxml`
- Create: `miniprogram/pages/recipes/recipes.wxss`
- Create: `miniprogram/components/recipe-card/recipe-card.js`
- Create: `miniprogram/components/recipe-card/recipe-card.wxml`
- Create: `miniprogram/components/recipe-card/recipe-card.wxss`
- Create: `miniprogram/components/recipe-card/recipe-card.json`
- Create: `cloudfunctions/getRecipes/index.js`
- Create: `cloudfunctions/getRecipes/package.json`

- [ ] **Step 1: 创建 getRecipes 云函数**

```json
// cloudfunctions/getRecipes/package.json
{
  "name": "getRecipes",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3"
  }
}
```

```js
// cloudfunctions/getRecipes/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

exports.main = async (event) => {
  const { category = '', keyword = '', page = 1, pageSize = 20 } = event;
  const skip = (page - 1) * pageSize;

  let where = {};
  if (category) {
    where.category = category;
  }
  if (keyword) {
    where.name = db.RegExp({ regexp: keyword, options: 'i' });
  }
  // 同时有 category 和 keyword 时用 and
  if (category && keyword) {
    where = _.and([{ category }, { name: db.RegExp({ regexp: keyword, options: 'i' }) }]);
  }

  const result = await db.collection('recipes')
    .where(where)
    .orderBy('createdAt', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get();

  return { code: 0, data: result.data };
};
```

- [ ] **Step 2: 创建菜谱卡片组件**

```json
// miniprogram/components/recipe-card/recipe-card.json
{
  "component": true,
  "usingComponents": {}
}
```

```js
// miniprogram/components/recipe-card/recipe-card.js
Component({
  properties: {
    recipe: {
      type: Object,
      value: {}
    }
  },
  methods: {
    onTap() {
      this.triggerEvent('tap', { id: this.data.recipe._id });
    }
  }
});
```

```xml
<!-- miniprogram/components/recipe-card/recipe-card.wxml -->
<view class="recipe-card bg-white rounded" bindtap="onTap">
  <image class="card-img" src="{{recipe.imageUrl || '/images/default-recipe.png'}}" mode="aspectFill" />
  <view class="card-body p-3">
    <view class="flex justify-between items-center">
      <view class="text-lg">{{recipe.name}}</view>
      <view class="difficulty-tag difficulty-{{recipe.difficulty}}">
        {{recipe.difficulty === 'easy' ? '简单' : recipe.difficulty === 'medium' ? '中等' : '困难'}}
      </view>
    </view>
    <view class="flex mt-2 items-center">
      <view class="text-sm">🕐 {{recipe.cookingTime}}分钟</view>
      <view class="text-sm" style="margin-left: 24rpx;">🏷 {{recipe.category}}</view>
    </view>
  </view>
</view>
```

```css
/* miniprogram/components/recipe-card/recipe-card.wxss */
.recipe-card {
  margin-bottom: 24rpx;
  overflow: hidden;
}

.card-img {
  width: 100%;
  height: 320rpx;
  background: #f0f0f0;
}

.card-body {
  padding: 20rpx 24rpx;
}

.difficulty-tag {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.difficulty-easy { background: #e8f5e9; color: #2e7d32; }
.difficulty-medium { background: #fff3e0; color: #e65100; }
.difficulty-hard { background: #fce4ec; color: #c62828; }
```

- [ ] **Step 3: 创建菜谱库页面**

```js
// miniprogram/pages/recipes/recipes.js
const { call } = require('../../utils/api');

Page({
  data: {
    recipes: [],
    categories: ['全部', '荤菜', '素菜', '汤', '主食', '凉菜', '小吃', '其他'],
    activeCategory: '',
    keyword: '',
    page: 1,
    hasMore: true
  },

  onShow() {
    this.setData({ recipes: [], page: 1, hasMore: true });
    this.loadRecipes();
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this.loadRecipes();
    }
  },

  loadRecipes() {
    const { activeCategory, keyword, page } = this.data;
    const category = activeCategory === '全部' ? '' : activeCategory;

    call('getRecipes', { category, keyword, page, pageSize: 20 }).then(res => {
      if (res.code === 0) {
        this.setData({
          recipes: page === 1 ? res.data : [...this.data.recipes, ...res.data],
          hasMore: res.data.length === 20,
          page: page + 1
        });
      }
    });
  },

  onCategoryTap(e) {
    const cat = e.currentTarget.dataset.category;
    this.setData({
      activeCategory: cat,
      recipes: [],
      page: 1,
      hasMore: true
    });
    this.loadRecipes();
  },

  onSearch(e) {
    this.setData({
      keyword: e.detail.value,
      recipes: [],
      page: 1,
      hasMore: true
    });
    this.loadRecipes();
  },

  onRecipeTap(e) {
    wx.navigateTo({ url: `/pages/recipe-detail/recipe-detail?id=${e.detail.id}` });
  },

  onAddRecipe() {
    wx.navigateTo({ url: '/pages/recipe-form/recipe-form' });
  }
});
```

```xml
<!-- miniprogram/pages/recipes/recipes.wxml -->
<view class="container">
  <!-- 搜索栏 -->
  <view class="search-bar bg-white rounded p-3 mb-2">
    <input placeholder="搜索菜谱..." bindconfirm="onSearch" confirm-type="search" />
  </view>

  <!-- 分类筛选 -->
  <scroll-view class="category-scroll" scroll-x>
    <view
      class="category-tag {{activeCategory === item ? 'active' : ''}}"
      wx:for="{{categories}}"
      wx:key="*this"
      data-category="{{item}}"
      bindtap="onCategoryTap"
    >{{item}}</view>
  </scroll-view>

  <!-- 菜谱列表 -->
  <view class="recipe-list mt-2">
    <recipe-card
      wx:for="{{recipes}}"
      wx:key="_id"
      recipe="{{item}}"
      bind:tap="onRecipeTap"
    />
    <view wx:if="{{!hasMore && recipes.length > 0}}" class="end-tip text-sm">
      — 已经到底了 —
    </view>
    <view wx:if="{{recipes.length === 0}}" class="empty-tip">
      <view class="text-lg">还没有菜谱</view>
      <view class="text-sm mt-2">点击右下角 + 添加第一道菜吧</view>
    </view>
  </view>

  <!-- 浮动添加按钮 -->
  <view class="fab" bindtap="onAddRecipe">＋</view>
</view>
```

```css
/* miniprogram/pages/recipes/recipes.wxss */
.search-bar input {
  padding: 16rpx 24rpx;
  font-size: 28rpx;
}

.category-scroll {
  white-space: nowrap;
  padding: 16rpx 0;
}

.category-tag {
  display: inline-block;
  padding: 12rpx 32rpx;
  margin-right: 16rpx;
  background: #fff;
  border-radius: 32rpx;
  font-size: 26rpx;
}

.category-tag.active {
  background: var(--color-primary);
  color: #fff;
}

.fab {
  position: fixed;
  right: 40rpx;
  bottom: 120rpx;
  width: 96rpx;
  height: 96rpx;
  background: var(--color-primary);
  color: #fff;
  font-size: 48rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(232, 93, 4, 0.4);
}

.end-tip, .empty-tip {
  text-align: center;
  padding: 80rpx 0;
}
```

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: add recipe list page with category filter and search

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: 菜谱详情页 & 创建编辑页

**Files:**
- Create: `miniprogram/pages/recipe-detail/recipe-detail.js`
- Create: `miniprogram/pages/recipe-detail/recipe-detail.wxml`
- Create: `miniprogram/pages/recipe-detail/recipe-detail.wxss`
- Create: `miniprogram/pages/recipe-form/recipe-form.js`
- Create: `miniprogram/pages/recipe-form/recipe-form.wxml`
- Create: `miniprogram/pages/recipe-form/recipe-form.wxss`
- Create: `cloudfunctions/getRecipeDetail/index.js`
- Create: `cloudfunctions/getRecipeDetail/package.json`
- Create: `cloudfunctions/createRecipe/index.js`
- Create: `cloudfunctions/createRecipe/package.json`
- Create: `cloudfunctions/updateRecipe/index.js`
- Create: `cloudfunctions/updateRecipe/package.json`
- Create: `cloudfunctions/deleteRecipe/index.js`
- Create: `cloudfunctions/deleteRecipe/package.json`

- [ ] **Step 1: 创建云函数（getRecipeDetail, createRecipe, updateRecipe, deleteRecipe）**

```json
// cloudfunctions/getRecipeDetail/package.json
{ "name": "getRecipeDetail", "version": "1.0.0", "main": "index.js", "dependencies": { "wx-server-sdk": "~2.6.3" } }
```

```js
// cloudfunctions/getRecipeDetail/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { id } = event;
  const db = cloud.database();
  const result = await db.collection('recipes').doc(id).get();
  return { code: 0, data: result.data };
};
```

```json
// cloudfunctions/createRecipe/package.json
{ "name": "createRecipe", "version": "1.0.0", "main": "index.js", "dependencies": { "wx-server-sdk": "~2.6.3" } }
```

```js
// cloudfunctions/createRecipe/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { name, category, ingredients, steps, cookingTime, difficulty, imageUrl } = event;
  const { OPENID } = cloud.getWXContext();
  const db = cloud.database();

  const result = await db.collection('recipes').add({
    data: {
      name,
      category,
      ingredients: ingredients || [],
      steps: steps || [],
      cookingTime: cookingTime || 0,
      difficulty: difficulty || 'medium',
      imageUrl: imageUrl || '',
      createdBy: OPENID,
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    }
  });

  return { code: 0, data: { _id: result._id } };
};
```

```json
// cloudfunctions/updateRecipe/package.json
{ "name": "updateRecipe", "version": "1.0.0", "main": "index.js", "dependencies": { "wx-server-sdk": "~2.6.3" } }
```

```js
// cloudfunctions/updateRecipe/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { id, ...updates } = event;
  const db = cloud.database();
  await db.collection('recipes').doc(id).update({
    data: { ...updates, updatedAt: db.serverDate() }
  });
  return { code: 0, msg: 'ok' };
};
```

```json
// cloudfunctions/deleteRecipe/package.json
{ "name": "deleteRecipe", "version": "1.0.0", "main": "index.js", "dependencies": { "wx-server-sdk": "~2.6.3" } }
```

```js
// cloudfunctions/deleteRecipe/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { id } = event;
  const db = cloud.database();
  await db.collection('recipes').doc(id).remove();
  return { code: 0, msg: 'ok' };
};
```

- [ ] **Step 2: 创建菜谱详情页**

```js
// miniprogram/pages/recipe-detail/recipe-detail.js
const { call } = require('../../utils/api');

Page({
  data: {
    recipe: null,
    loading: true
  },

  onLoad(options) {
    const { id } = options;
    call('getRecipeDetail', { id }).then(res => {
      if (res.code === 0) {
        this.setData({ recipe: res.data, loading: false });
      }
    });
  },

  onOrder(e) {
    const { date } = e.currentTarget.dataset;
    const { recipe } = this.data;
    if (!recipe) return;

    wx.showModal({
      title: `确认点菜`,
      content: `${date === 'tomorrow' ? '明天' : '今天'}吃 ${recipe.name}？`,
      success: (res) => {
        if (res.confirm) {
          const today = new Date();
          if (date === 'tomorrow') {
            today.setDate(today.getDate() + 1);
          }
          const dateStr = today.toISOString().split('T')[0];

          call('createOrder', { recipeId: recipe._id, recipeName: recipe.name, date: dateStr }).then(r => {
            if (r.code === 0) {
              wx.showToast({ title: '已点好！', icon: 'success' });
            }
          });
        }
      }
    });
  },

  onEdit() {
    const { recipe } = this.data;
    wx.navigateTo({ url: `/pages/recipe-form/recipe-form?id=${recipe._id}` });
  },

  onDelete() {
    wx.showModal({
      title: '删除菜谱',
      content: `确定要删除「${this.data.recipe.name}」吗？`,
      success: (res) => {
        if (res.confirm) {
          call('deleteRecipe', { id: this.data.recipe._id }).then(r => {
            if (r.code === 0) {
              wx.showToast({ title: '已删除', icon: 'success' });
              setTimeout(() => wx.navigateBack(), 1500);
            }
          });
        }
      }
    });
  }
});
```

```xml
<!-- miniprogram/pages/recipe-detail/recipe-detail.wxml -->
<view class="container" wx:if="{{recipe}}">
  <image class="detail-img" src="{{recipe.imageUrl || '/images/default-recipe.png'}}" mode="aspectFill" />

  <view class="bg-white rounded p-3 mb-2">
    <view class="flex justify-between items-center">
      <view class="detail-name">{{recipe.name}}</view>
      <view class="difficulty-tag difficulty-{{recipe.difficulty}}">
        {{recipe.difficulty === 'easy' ? '简单' : recipe.difficulty === 'medium' ? '中等' : '困难'}}
      </view>
    </view>
    <view class="flex mt-2">
      <view class="text-sm">🕐 {{recipe.cookingTime}}分钟</view>
      <view class="text-sm" style="margin-left: 24rpx;">🏷 {{recipe.category}}</view>
    </view>
  </view>

  <view class="bg-white rounded p-3 mb-2">
    <view class="section-title">🥬 食材</view>
    <view class="ingredient-item" wx:for="{{recipe.ingredients}}" wx:key="name">
      <view>{{item.name}}</view>
      <view class="text-sm">{{item.amount}}</view>
    </view>
    <view wx:if="{{recipe.ingredients.length === 0}}" class="text-sm">暂无食材信息</view>
  </view>

  <view class="bg-white rounded p-3 mb-2">
    <view class="section-title">📝 步骤</view>
    <view class="step-item" wx:for="{{recipe.steps}}" wx:key="order">
      <view class="step-num">{{index + 1}}</view>
      <view class="step-text">{{item.text}}</view>
    </view>
    <view wx:if="{{recipe.steps.length === 0}}" class="text-sm">暂无步骤信息</view>
  </view>

  <view style="height: 120rpx;"></view>

  <!-- 底部操作栏 -->
  <view class="bottom-bar">
    <button class="btn-primary flex-1" data-date="today" bindtap="onOrder">今天吃这个</button>
    <button class="btn-secondary flex-1" data-date="tomorrow" bindtap="onOrder">明天吃这个</button>
  </view>
</view>
```

```css
/* miniprogram/pages/recipe-detail/recipe-detail.wxss */
.detail-img {
  width: 100%;
  height: 480rpx;
  background: #f0f0f0;
}

.detail-name {
  font-size: 36rpx;
  font-weight: 700;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}

.ingredient-item {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
  border-bottom: 1rpx solid var(--color-border);
}

.step-item {
  display: flex;
  padding: 16rpx 0;
  border-bottom: 1rpx solid var(--color-border);
}

.step-num {
  width: 48rpx;
  height: 48rpx;
  background: var(--color-primary);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.step-text {
  flex: 1;
  line-height: 1.6;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 16rpx;
  padding: 20rpx 24rpx;
  background: #fff;
  box-shadow: 0 -2rpx 16rpx rgba(0,0,0,0.06);
}

.btn-secondary {
  background: #fff;
  color: var(--color-primary);
  border: 2rpx solid var(--color-primary);
  border-radius: 12rpx;
  padding: 20rpx 48rpx;
  text-align: center;
  font-size: 30rpx;
}
```

- [ ] **Step 3: 创建菜谱表单页（新增/编辑）**

```js
// miniprogram/pages/recipe-form/recipe-form.js
const { call } = require('../../utils/api');

Page({
  data: {
    isEdit: false,
    id: '',
    form: {
      name: '',
      category: '荤菜',
      cookingTime: 30,
      difficulty: 'medium',
      imageUrl: ''
    },
    ingredients: [{ name: '', amount: '' }],
    steps: [{ text: '' }],
    categories: ['荤菜', '素菜', '汤', '主食', '凉菜', '小吃', '其他'],
    difficulties: [
      { value: 'easy', label: '简单' },
      { value: 'medium', label: '中等' },
      { value: 'hard', label: '困难' }
    ]
  },

  onLoad(options) {
    if (options.id) {
      wx.setNavigationBarTitle({ title: '编辑菜谱' });
      this.setData({ isEdit: true, id: options.id });
      call('getRecipeDetail', { id: options.id }).then(res => {
        if (res.code === 0) {
          const r = res.data;
          this.setData({
            form: {
              name: r.name,
              category: r.category,
              cookingTime: r.cookingTime,
              difficulty: r.difficulty,
              imageUrl: r.imageUrl || ''
            },
            ingredients: r.ingredients.length > 0 ? r.ingredients : [{ name: '', amount: '' }],
            steps: r.steps.length > 0 ? r.steps : [{ text: '' }]
          });
        }
      });
    }
  },

  onFieldChange(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ ['form.' + field]: e.detail.value });
  },

  // 食材操作
  onIngredientChange(e) {
    const { index, field } = e.currentTarget.dataset;
    this.setData({ [`ingredients[${index}].${field}`]: e.detail.value });
  },

  addIngredient() {
    this.setData({ ingredients: [...this.data.ingredients, { name: '', amount: '' }] });
  },

  removeIngredient(e) {
    const { index } = e.currentTarget.dataset;
    const arr = this.data.ingredients.filter((_, i) => i !== index);
    this.setData({ ingredients: arr.length > 0 ? arr : [{ name: '', amount: '' }] });
  },

  // 步骤操作
  onStepChange(e) {
    const { index } = e.currentTarget.dataset;
    this.setData({ [`steps[${index}].text`]: e.detail.value });
  },

  addStep() {
    this.setData({ steps: [...this.data.steps, { text: '' }] });
  },

  removeStep(e) {
    const { index } = e.currentTarget.dataset;
    const arr = this.data.steps.filter((_, i) => i !== index);
    this.setData({ steps: arr.length > 0 ? arr : [{ text: '' }] });
  },

  // 图片上传
  onChooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      success: (res) => {
        wx.showLoading({ title: '上传中...' });
        wx.cloud.uploadFile({
          cloudPath: `recipe-images/${Date.now()}.png`,
          filePath: res.tempFilePaths[0]
        }).then(uploadRes => {
          wx.hideLoading();
          this.setData({ ['form.imageUrl']: uploadRes.fileID });
        }).catch(() => {
          wx.hideLoading();
          wx.showToast({ title: '上传失败', icon: 'none' });
        });
      }
    });
  },

  onSubmit() {
    const { isEdit, id, form, ingredients, steps } = this.data;

    if (!form.name.trim()) {
      wx.showToast({ title: '请输入菜名', icon: 'none' });
      return;
    }

    const data = {
      ...form,
      name: form.name.trim(),
      ingredients: ingredients.filter(i => i.name.trim()),
      steps: steps.filter(s => s.text.trim()).map((s, i) => ({ text: s.text.trim() }))
    };

    const fn = isEdit ? 'updateRecipe' : 'createRecipe';
    const params = isEdit ? { id, ...data } : data;

    call(fn, params).then(res => {
      if (res.code === 0) {
        wx.showToast({ title: isEdit ? '已更新' : '已创建', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1500);
      }
    });
  },

  onDelete() {
    if (!this.data.isEdit) return;
    wx.showModal({
      title: '删除菜谱',
      content: '确定要删除吗？',
      success: (res) => {
        if (res.confirm) {
          call('deleteRecipe', { id: this.data.id }).then(r => {
            if (r.code === 0) {
              wx.showToast({ title: '已删除', icon: 'success' });
              setTimeout(() => wx.navigateBack(), 1500);
            }
          });
        }
      }
    });
  }
});
```

```xml
<!-- miniprogram/pages/recipe-form/recipe-form.wxml -->
<view class="container">
  <!-- 菜名 -->
  <view class="form-group bg-white rounded p-3 mb-2">
    <view class="form-label">菜名 *</view>
    <input class="form-input" placeholder="例如：红烧肉" value="{{form.name}}" data-field="name" bindinput="onFieldChange" />
  </view>

  <!-- 分类 & 难度 & 耗时 -->
  <view class="form-group bg-white rounded p-3 mb-2">
    <view class="form-label">分类</view>
    <picker mode="selector" range="{{categories}}" value="{{categories.indexOf(form.category)}}" bindchange="onFieldChange" data-field="category">
      <view class="form-picker">{{form.category}}</view>
    </picker>

    <view class="form-label mt-2">难度</view>
    <view class="flex">
      <view
        wx:for="{{difficulties}}"
        wx:key="value"
        class="difficulty-option {{form.difficulty === item.value ? 'active' : ''}}"
        data-field="difficulty"
        bindtap="onFieldTap"
        data-value="{{item.value}}"
      >{{item.label}}</view>
    </view>

    <view class="form-label mt-2">烹饪时间</view>
    <input class="form-input" type="number" placeholder="分钟" value="{{form.cookingTime}}" data-field="cookingTime" bindinput="onFieldChange" />
  </view>

  <!-- 成品图 -->
  <view class="form-group bg-white rounded p-3 mb-2">
    <view class="form-label">成品图</view>
    <view class="image-upload" bindtap="onChooseImage">
      <image wx:if="{{form.imageUrl}}" src="{{form.imageUrl}}" mode="aspectFill" />
      <view wx:else class="upload-placeholder">＋ 点击上传</view>
    </view>
  </view>

  <!-- 食材 -->
  <view class="form-group bg-white rounded p-3 mb-2">
    <view class="form-label">🥬 食材</view>
    <view wx:for="{{ingredients}}" wx:key="index" class="ingredient-row">
      <input class="flex-1" placeholder="食材名" value="{{item.name}}" data-index="{{index}}" data-field="name" bindinput="onIngredientChange" />
      <input style="width: 140rpx; margin-left: 16rpx;" placeholder="用量" value="{{item.amount}}" data-index="{{index}}" data-field="amount" bindinput="onIngredientChange" />
      <view class="remove-btn" data-index="{{index}}" bindtap="removeIngredient">✕</view>
    </view>
    <view class="add-btn" bindtap="addIngredient">+ 添加食材</view>
  </view>

  <!-- 步骤 -->
  <view class="form-group bg-white rounded p-3 mb-2">
    <view class="form-label">📝 步骤</view>
    <view wx:for="{{steps}}" wx:key="index" class="step-row">
      <view class="step-num">{{index + 1}}</view>
      <textarea class="flex-1" placeholder="描述步骤..." value="{{item.text}}" data-index="{{index}}" bindinput="onStepChange" auto-height />
      <view class="remove-btn" data-index="{{index}}" bindtap="removeStep">✕</view>
    </view>
    <view class="add-btn" bindtap="addStep">+ 添加步骤</view>
  </view>

  <view style="height: 120rpx;"></view>

  <!-- 底部按钮 -->
  <view class="bottom-bar">
    <button class="btn-primary flex-1" bindtap="onSubmit">{{isEdit ? '保存' : '创建菜谱'}}</button>
    <button wx:if="{{isEdit}}" class="btn-danger" bindtap="onDelete">删除</button>
  </view>
</view>
```

```css
/* miniprogram/pages/recipe-form/recipe-form.wxss */
.form-group {}
.form-label { font-size: 28rpx; font-weight: 600; margin-bottom: 12rpx; }
.form-input {
  border: 1rpx solid var(--color-border);
  border-radius: 8rpx;
  padding: 16rpx 20rpx;
  font-size: 28rpx;
}
.form-picker {
  border: 1rpx solid var(--color-border);
  border-radius: 8rpx;
  padding: 16rpx 20rpx;
  font-size: 28rpx;
  color: var(--color-primary);
}

.difficulty-option {
  padding: 12rpx 32rpx;
  margin-right: 16rpx;
  border-radius: 32rpx;
  background: #f0f0f0;
  font-size: 26rpx;
}
.difficulty-option.active {
  background: var(--color-primary);
  color: #fff;
}

.image-upload {
  width: 200rpx;
  height: 200rpx;
  border: 2rpx dashed var(--color-border);
  border-radius: 12rpx;
  overflow: hidden;
}
.image-upload image { width: 100%; height: 100%; }
.upload-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-light);
}

.ingredient-row, .step-row {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}
.ingredient-row input, .step-row textarea {
  border: 1rpx solid var(--color-border);
  border-radius: 8rpx;
  padding: 12rpx 16rpx;
  font-size: 26rpx;
}

.remove-btn {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e74c3c;
  font-size: 28rpx;
  margin-left: 12rpx;
}

.add-btn {
  color: var(--color-primary);
  padding: 12rpx 0;
  font-size: 26rpx;
}

.btn-danger {
  background: #e74c3c;
  color: #fff;
  border-radius: 12rpx;
  padding: 20rpx 32rpx;
  margin-left: 16rpx;
  font-size: 30rpx;
}
```

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: add recipe detail, form pages and CRUD cloud functions

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: 点餐 & 餐桌页（餐桌 Tab）

**Files:**
- Create: `miniprogram/pages/table/table.js`
- Create: `miniprogram/pages/table/table.wxml`
- Create: `miniprogram/pages/table/table.wxss`
- Create: `miniprogram/components/order-item/order-item.js`
- Create: `miniprogram/components/order-item/order-item.wxml`
- Create: `miniprogram/components/order-item/order-item.wxss`
- Create: `miniprogram/components/order-item/order-item.json`
- Create: `cloudfunctions/createOrder/index.js`
- Create: `cloudfunctions/createOrder/package.json`
- Create: `cloudfunctions/cancelOrder/index.js`
- Create: `cloudfunctions/cancelOrder/package.json`
- Create: `cloudfunctions/claimOrder/index.js`
- Create: `cloudfunctions/claimOrder/package.json`
- Create: `cloudfunctions/unclaimOrder/index.js`
- Create: `cloudfunctions/unclaimOrder/package.json`
- Create: `cloudfunctions/completeOrder/index.js`
- Create: `cloudfunctions/completeOrder/package.json`
- Create: `cloudfunctions/getTodayOrders/index.js`
- Create: `cloudfunctions/getTodayOrders/package.json`

- [ ] **Step 1: 创建订单相关云函数**

```json
// cloudfunctions/createOrder/package.json
{ "name": "createOrder", "version": "1.0.0", "main": "index.js", "dependencies": { "wx-server-sdk": "~2.6.3" } }
```

```js
// cloudfunctions/createOrder/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { recipeId, recipeName, date } = event;
  const { OPENID } = cloud.getWXContext();
  const db = cloud.database();

  // 获取用户昵称
  const user = await db.collection('users').where({ openid: OPENID }).get();
  const orderedByName = user.data.length > 0 ? user.data[0].nickName : '未知';

  await db.collection('orders').add({
    data: {
      recipeId,
      recipeName,
      date,
      orderedBy: OPENID,
      orderedByName,
      status: 'ordered',
      createdAt: db.serverDate()
    }
  });

  return { code: 0, msg: 'ok' };
};
```

```json
// cloudfunctions/cancelOrder/package.json
{ "name": "cancelOrder", "version": "1.0.0", "main": "index.js", "dependencies": { "wx-server-sdk": "~2.6.3" } }
```

```js
// cloudfunctions/cancelOrder/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { id } = event;
  const db = cloud.database();
  await db.collection('orders').doc(id).remove();
  return { code: 0, msg: 'ok' };
};
```

```json
// cloudfunctions/claimOrder/package.json
{ "name": "claimOrder", "version": "1.0.0", "main": "index.js", "dependencies": { "wx-server-sdk": "~2.6.3" } }
```

```js
// cloudfunctions/claimOrder/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { id } = event;
  const { OPENID } = cloud.getWXContext();
  const db = cloud.database();
  const _ = db.command;

  // 检查订单状态是否为 ordered（防并发）
  const order = await db.collection('orders').doc(id).get();
  if (order.data.status !== 'ordered') {
    return { code: -1, msg: '这道菜已经被认领了' };
  }

  const user = await db.collection('users').where({ openid: OPENID }).get();
  const claimedByName = user.data.length > 0 ? user.data[0].nickName : '未知';

  await db.collection('orders').doc(id).update({
    data: {
      status: 'claimed',
      claimedBy: OPENID,
      claimedByName
    }
  });

  return { code: 0, msg: 'ok' };
};
```

```json
// cloudfunctions/unclaimOrder/package.json
{ "name": "unclaimOrder", "version": "1.0.0", "main": "index.js", "dependencies": { "wx-server-sdk": "~2.6.3" } }
```

```js
// cloudfunctions/unclaimOrder/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { id } = event;
  const db = cloud.database();
  await db.collection('orders').doc(id).update({
    data: {
      status: 'ordered',
      claimedBy: '',
      claimedByName: ''
    }
  });
  return { code: 0, msg: 'ok' };
};
```

```json
// cloudfunctions/completeOrder/package.json
{ "name": "completeOrder", "version": "1.0.0", "main": "index.js", "dependencies": { "wx-server-sdk": "~2.6.3" } }
```

```js
// cloudfunctions/completeOrder/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { id } = event;
  const db = cloud.database();
  await db.collection('orders').doc(id).update({
    data: { status: 'completed' }
  });
  return { code: 0, msg: 'ok' };
};
```

```json
// cloudfunctions/getTodayOrders/package.json
{ "name": "getTodayOrders", "version": "1.0.0", "main": "index.js", "dependencies": { "wx-server-sdk": "~2.6.3" } }
```

```js
// cloudfunctions/getTodayOrders/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { date } = event;
  const db = cloud.database();
  const result = await db.collection('orders')
    .where({ date, status: db.command.neq('cancelled') })
    .orderBy('createdAt', 'asc')
    .get();

  // 按菜谱分组汇总
  const grouped = {};
  result.data.forEach(order => {
    const key = order.recipeId;
    if (!grouped[key]) {
      grouped[key] = {
        recipeId: order.recipeId,
        recipeName: order.recipeName,
        orders: [],
        totalCount: 0
      };
    }
    grouped[key].orders.push(order);
    grouped[key].totalCount++;
  });

  return { code: 0, data: Object.values(grouped) };
};
```

- [ ] **Step 2: 创建点单条目组件**

```json
// miniprogram/components/order-item/order-item.json
{ "component": true, "usingComponents": {} }
```

```js
// miniprogram/components/order-item/order-item.js
const { call } = require('../../utils/api');

Component({
  properties: {
    group: { type: Object, value: {} },
    currentOpenid: { type: String, value: '' }
  },
  methods: {
    onClaim() {
      const order = this.data.group.orders.find(o => o.status === 'ordered');
      if (!order) return;

      wx.showModal({
        title: '认领烹饪',
        content: `你要做「${this.data.group.recipeName}」吗？`,
        success: (res) => {
          if (res.confirm) {
            call('claimOrder', { id: order._id }).then(r => {
              if (r.code === 0) {
                wx.showToast({ title: '已认领！', icon: 'success' });
                this.triggerEvent('refresh');
              } else {
                wx.showToast({ title: r.msg, icon: 'none' });
              }
            });
          }
        }
      });
    },

    onComplete() {
      const order = this.data.group.orders.find(o => o.status === 'claimed' && o.claimedBy === this.data.currentOpenid);
      if (!order) return;

      call('completeOrder', { id: order._id }).then(r => {
        if (r.code === 0) {
          wx.showToast({ title: '做好了！', icon: 'success' });
          this.triggerEvent('refresh');
        }
      });
    },

    onUnclaim() {
      const order = this.data.group.orders.find(o => o.status === 'claimed' && o.claimedBy === this.data.currentOpenid);
      if (!order) return;

      call('unclaimOrder', { id: order._id }).then(r => {
        if (r.code === 0) {
          wx.showToast({ title: '已放弃认领', icon: 'none' });
          this.triggerEvent('refresh');
        }
      });
    }
  }
});
```

```xml
<!-- miniprogram/components/order-item/order-item.wxml -->
<view class="order-group bg-white rounded p-3">
  <view class="flex justify-between items-center">
    <view>
      <view class="order-name">{{group.recipeName}}</view>
      <view class="text-sm" wx:if="{{group.totalCount > 1}}">×{{group.totalCount}} 人点了这道菜</view>
      <view class="text-sm" wx:elif="{{group.orders[0].orderedByName}}">{{group.orders[0].orderedByName}}</view>
    </view>

    <block wx:if="{{group.orders[0].status === 'ordered'}}">
      <button class="btn-small btn-primary" bindtap="onClaim">我来做</button>
    </block>

    <block wx:elif="{{group.orders[0].status === 'claimed'}}">
      <view class="text-sm">{{group.orders[0].claimedByName}} 正在做</view>
      <button
        wx:if="{{group.orders[0].claimedBy === currentOpenid}}"
        class="btn-small btn-done"
        bindtap="onComplete"
      >做好了</button>
      <button
        wx:if="{{group.orders[0].claimedBy === currentOpenid}}"
        class="btn-small btn-cancel"
        bindtap="onUnclaim"
      >不做了</button>
    </block>

    <block wx:elif="{{group.orders[0].status === 'completed'}}">
      <view class="completed-tag">✅ 已完成</view>
    </block>
  </view>

  <!-- 多人点同菜时显示所有点单人 -->
  <view wx:if="{{group.totalCount > 1}}" class="mt-2">
    <view wx:for="{{group.orders}}" wx:key="_id" class="text-sm">
      {{item.orderedByName}}
      <text wx:if="{{item.status === 'completed'}}"> — 已评价 {{item.rating}}⭐</text>
    </view>
  </view>
</view>
```

```css
/* miniprogram/components/order-item/order-item.wxss */
.order-group {
  margin-bottom: 16rpx;
}

.order-name {
  font-size: 30rpx;
  font-weight: 600;
}

.btn-small {
  font-size: 24rpx;
  padding: 10rpx 24rpx;
  border-radius: 8rpx;
  margin-left: 12rpx;
}

.btn-done {
  background: #27ae60;
  color: #fff;
  border: none;
}

.btn-cancel {
  background: #fff;
  color: #999;
  border: 1rpx solid #ddd;
}

.completed-tag {
  font-size: 28rpx;
}
```

- [ ] **Step 3: 创建餐桌页**

```js
// miniprogram/pages/table/table.js
const { call } = require('../../utils/api');

Page({
  data: {
    todayOrders: [],
    tomorrowOrders: [],
    todayDate: '',
    tomorrowDate: '',
    currentOpenid: ''
  },

  onShow() {
    const openid = wx.getStorageSync('openid');
    this.setData({ currentOpenid: openid || '' });
    this.loadOrders();
  },

  loadOrders() {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    this.setData({ todayDate: todayStr, tomorrowDate: tomorrowStr });

    Promise.all([
      call('getTodayOrders', { date: todayStr }),
      call('getTodayOrders', { date: tomorrowStr })
    ]).then(([todayRes, tomorrowRes]) => {
      this.setData({
        todayOrders: todayRes.code === 0 ? todayRes.data : [],
        tomorrowOrders: tomorrowRes.code === 0 ? tomorrowRes.data : []
      });
    });
  },

  onRefresh() {
    this.loadOrders();
  }
});
```

```xml
<!-- miniprogram/pages/table/table.wxml -->
<view class="container">
  <!-- 今天 -->
  <view class="section">
    <view class="section-header text-lg">📅 今天 ({{todayDate}})</view>
    <order-item
      wx:for="{{todayOrders}}"
      wx:key="recipeId"
      group="{{item}}"
      currentOpenid="{{currentOpenid}}"
      bind:refresh="onRefresh"
    />
    <view wx:if="{{todayOrders.length === 0}}" class="empty-tip text-sm">
      今天还没有人点菜
    </view>
  </view>

  <!-- 明天 -->
  <view class="section mt-2">
    <view class="section-header text-lg">📅 明天 ({{tomorrowDate}})</view>
    <order-item
      wx:for="{{tomorrowOrders}}"
      wx:key="recipeId"
      group="{{item}}"
      currentOpenid="{{currentOpenid}}"
      bind:refresh="onRefresh"
    />
    <view wx:if="{{tomorrowOrders.length === 0}}" class="empty-tip text-sm">
      明天还没有人点菜
    </view>
  </view>
</view>
```

```css
/* miniprogram/pages/table/table.wxss */
.section {
  margin-bottom: 32rpx;
}

.section-header {
  padding: 16rpx 0;
}

.empty-tip {
  text-align: center;
  padding: 40rpx 0;
}
```

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: add order cloud functions and table tab page

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: "我的"页面 & 评价功能 & 历史记录

**Files:**
- Create: `miniprogram/pages/mine/mine.js`
- Create: `miniprogram/pages/mine/mine.wxml`
- Create: `miniprogram/pages/mine/mine.wxss`
- Create: `miniprogram/pages/history/history.js`
- Create: `miniprogram/pages/history/history.wxml`
- Create: `miniprogram/pages/history/history.wxss`
- Create: `cloudfunctions/rateOrder/index.js`
- Create: `cloudfunctions/rateOrder/package.json`
- Create: `cloudfunctions/getMyOrders/index.js`
- Create: `cloudfunctions/getMyOrders/package.json`
- Create: `cloudfunctions/getHistoryOrders/index.js`
- Create: `cloudfunctions/getHistoryOrders/package.json`
- Modify: `miniprogram/pages/login/login.js` — 登录时存储 openid

- [ ] **Step 1: 创建评价 & 查询云函数**

```json
// cloudfunctions/rateOrder/package.json
{ "name": "rateOrder", "version": "1.0.0", "main": "index.js", "dependencies": { "wx-server-sdk": "~2.6.3" } }
```

```js
// cloudfunctions/rateOrder/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { id, rating, feedback } = event;
  const db = cloud.database();
  await db.collection('orders').doc(id).update({
    data: { rating, feedback: feedback || '' }
  });
  return { code: 0, msg: 'ok' };
};
```

```json
// cloudfunctions/getMyOrders/package.json
{ "name": "getMyOrders", "version": "1.0.0", "main": "index.js", "dependencies": { "wx-server-sdk": "~2.6.3" } }
```

```js
// cloudfunctions/getMyOrders/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { type } = event; // 'ordered' | 'claimed'
  const { OPENID } = cloud.getWXContext();
  const db = cloud.database();
  const field = type === 'ordered' ? 'orderedBy' : 'claimedBy';

  const result = await db.collection('orders')
    .where({ [field]: OPENID, status: db.command.neq('cancelled') })
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  return { code: 0, data: result.data };
};
```

```json
// cloudfunctions/getHistoryOrders/package.json
{ "name": "getHistoryOrders", "version": "1.0.0", "main": "index.js", "dependencies": { "wx-server-sdk": "~2.6.3" } }
```

```js
// cloudfunctions/getHistoryOrders/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async () => {
  const db = cloud.database();
  const result = await db.collection('orders')
    .where({ status: 'completed' })
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  return { code: 0, data: result.data };
};
```

- [ ] **Step 2: 更新登录页，保存 openid**

在 `miniprogram/pages/login/login.js` 中，登录成功后将 openid 存入 storage。由于云函数 `login` 使用 `cloud.getWXContext()` 获取 openid，当前云函数不返回 openid。需要更新云函数返回 openid。

```js
// cloudfunctions/login/index.js（追加返回 openid）
// 在 return { code: 0, msg: 'ok' } 之前，添加 openid 字段
exports.main = async (event) => {
  // ... 前面的代码不变 ...
  return { code: 0, msg: 'ok', openid: OPENID };
};
```

在 `miniprogram/pages/login/login.js` 的 `onSubmit` 中，获取 openid 并存储：

```js
// 在成功回调中修改
call('login', { password, nickName, avatarUrl }).then(res => {
  if (res.openid) {
    wx.setStorageSync('openid', res.openid);
  }
  app.setLoginState();
  wx.switchTab({ url: '/pages/recipes/recipes' });
})
```

- [ ] **Step 3: 创建"我的"页面**

```js
// miniprogram/pages/mine/mine.js
const { call } = require('../../utils/api');

Page({
  data: {
    userInfo: {},
    myOrders: [],
    myClaims: [],
    tabIndex: 0 // 0=我点的, 1=我做的
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    Promise.all([
      call('getMyOrders', { type: 'ordered' }),
      call('getMyOrders', { type: 'claimed' })
    ]).then(([ordersRes, claimsRes]) => {
      this.setData({
        myOrders: ordersRes.code === 0 ? ordersRes.data : [],
        myClaims: claimsRes.code === 0 ? claimsRes.data : []
      });
    });
  },

  onSwitchTab(e) {
    this.setData({ tabIndex: Number(e.currentTarget.dataset.index) });
  },

  onRate(e) {
    const { id } = e.currentTarget.dataset;
    wx.showActionSheet({
      itemList: ['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'],
      success: (res) => {
        const rating = res.tapIndex + 1;
        wx.showModal({
          title: '写点评价（可选）',
          editable: true,
          placeholderText: '好吃！...',
          success: (modalRes) => {
            if (modalRes.confirm) {
              call('rateOrder', { id, rating, feedback: modalRes.content || '' }).then(r => {
                if (r.code === 0) {
                  wx.showToast({ title: '评价成功', icon: 'success' });
                  this.loadData();
                }
              });
            }
          }
        });
      }
    });
  },

  onCancel(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '取消点单',
      content: '确定取消吗？',
      success: (res) => {
        if (res.confirm) {
          call('cancelOrder', { id }).then(r => {
            if (r.code === 0) {
              wx.showToast({ title: '已取消', icon: 'none' });
              this.loadData();
            }
          });
        }
      }
    });
  },

  onHistory() {
    wx.navigateTo({ url: '/pages/history/history' });
  },

  onLogout() {
    wx.showModal({
      title: '退出',
      content: '退出后需要重新输入密码',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('isLoggedIn');
          wx.removeStorageSync('openid');
          wx.reLaunch({ url: '/pages/login/login' });
        }
      }
    });
  }
});
```

```xml
<!-- miniprogram/pages/mine/mine.wxml -->
<view class="container">
  <!-- 切换 tab -->
  <view class="tab-bar bg-white rounded mb-2">
    <view class="tab-item {{tabIndex === 0 ? 'active' : ''}}" data-index="0" bindtap="onSwitchTab">我点的</view>
    <view class="tab-item {{tabIndex === 1 ? 'active' : ''}}" data-index="1" bindtap="onSwitchTab">我做的</view>
  </view>

  <!-- 我点的 -->
  <block wx:if="{{tabIndex === 0}}">
    <view wx:for="{{myOrders}}" wx:key="_id" class="order-card bg-white rounded p-3 mb-2">
      <view class="flex justify-between items-center">
        <view>
          <view class="text-lg">{{item.recipeName}}</view>
          <view class="text-sm">{{item.date}} · {{item.status === 'ordered' ? '待做' : item.status === 'claimed' ? '有人在做' : item.status === 'completed' ? '已完成' : ''}}</view>
        </view>
        <block wx:if="{{item.status === 'ordered'}}">
          <button class="btn-small btn-cancel" data-id="{{item._id}}" bindtap="onCancel">取消</button>
        </block>
        <block wx:elif="{{item.status === 'completed' && !item.rating}}">
          <button class="btn-small btn-primary" data-id="{{item._id}}" bindtap="onRate">评价</button>
        </block>
        <block wx:elif="{{item.status === 'completed' && item.rating}}">
          <view class="text-sm">{{item.rating}}⭐</view>
        </block>
      </view>
    </view>
    <view wx:if="{{myOrders.length === 0}}" class="empty-tip text-sm">还没点过菜</view>
  </block>

  <!-- 我做的 -->
  <block wx:if="{{tabIndex === 1}}">
    <view wx:for="{{myClaims}}" wx:key="_id" class="order-card bg-white rounded p-3 mb-2">
      <view class="flex justify-between items-center">
        <view>
          <view class="text-lg">{{item.recipeName}}</view>
          <view class="text-sm">{{item.date}} · {{item.status === 'claimed' ? '待完成' : item.status === 'completed' ? '已完成' : ''}}</view>
        </view>
        <view wx:if="{{item.rating}}" class="text-sm">评分: {{item.rating}}⭐</view>
      </view>
    </view>
    <view wx:if="{{myClaims.length === 0}}" class="empty-tip text-sm">还没做过菜</view>
  </block>

  <!-- 底部操作 -->
  <view class="actions mt-2">
    <button class="btn-outline" bindtap="onHistory">📋 历史记录</button>
    <button class="btn-outline" bindtap="onLogout" style="color: #e74c3c;">🚪 退出</button>
  </view>
</view>
```

```css
/* miniprogram/pages/mine/mine.wxss */
.tab-bar {
  display: flex;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 20rpx;
  font-size: 28rpx;
  border-bottom: 4rpx solid transparent;
}

.tab-item.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.order-card {
  border-left: 6rpx solid var(--color-primary);
}

.actions {
  display: flex;
  gap: 16rpx;
}

.btn-outline {
  flex: 1;
  background: #fff;
  border: 1rpx solid var(--color-border);
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
  text-align: center;
}

.btn-cancel {
  font-size: 24rpx;
  padding: 10rpx 24rpx;
  border-radius: 8rpx;
  background: #fff;
  color: #999;
  border: 1rpx solid #ddd;
}
```

- [ ] **Step 4: 创建历史记录页**

```js
// miniprogram/pages/history/history.js
const { call } = require('../../utils/api');

Page({
  data: {
    orders: [],
    loading: true
  },

  onShow() {
    call('getHistoryOrders').then(res => {
      if (res.code === 0) {
        // 按日期分组
        const grouped = {};
        res.data.forEach(order => {
          if (!grouped[order.date]) grouped[order.date] = [];
          grouped[order.date].push(order);
        });
        this.setData({ orders: res.data, grouped, loading: false });
      }
    });
  }
});
```

```xml
<!-- miniprogram/pages/history/history.wxml -->
<view class="container">
  <view class="text-lg mb-2">📋 历史记录</view>

  <block wx:for="{{orders}}" wx:key="_id">
    <view class="history-item bg-white rounded p-3 mb-2">
      <view class="flex justify-between items-center">
        <view>
          <view class="text-lg">{{item.recipeName}}</view>
          <view class="text-sm">{{item.date}}</view>
          <view class="text-sm">点单人: {{item.orderedByName}}  厨师: {{item.claimedByName}}</view>
        </view>
        <view wx:if="{{item.rating}}" class="text-lg">{{item.rating}}⭐</view>
        <view wx:else class="text-sm">未评价</view>
      </view>
      <view wx:if="{{item.feedback}}" class="feedback mt-2 text-sm">"{{item.feedback}}"</view>
    </view>
  </view>

  <view wx:if="{{orders.length === 0 && !loading}}" class="empty-tip text-sm">
    还没有已完成的历史记录
  </view>
</view>
```

```css
/* miniprogram/pages/history/history.wxss */
.history-item {
  border-left: 6rpx solid #27ae60;
}

.feedback {
  background: #f8f8f8;
  padding: 12rpx 16rpx;
  border-radius: 8rpx;
  font-style: italic;
}
```

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: add mine page, rating, and history features

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: 菜谱表单页 Tab 切换修复 & 最终集成

**Files:**
- Modify: `miniprogram/pages/recipe-form/recipe-form.js` — 修复难度选项选择逻辑

- [ ] **Step 1: 修复菜谱表单页难度选择**

```js
// miniprogram/pages/recipe-form/recipe-form.js 中添加方法
onFieldTap(e) {
  const { field, value } = e.currentTarget.dataset;
  this.setData({ ['form.' + field]: value });
}
```

- [ ] **Step 2: 在 recipe-detail 页面 wxss 中补充缺失的样式**

```css
/* miniprogram/pages/recipe-detail/recipe-detail.wxss 追加 */
.difficulty-easy { background: #e8f5e9; color: #2e7d32; }
.difficulty-medium { background: #fff3e0; color: #e65100; }
.difficulty-hard { background: #fce4ec; color: #c62828; }

.difficulty-tag {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}
```

- [ ] **Step 3: 最终验证 & 提交**

在微信开发者工具中：
1. 确认所有页面 path 在 app.json 中正确注册
2. 确认云函数部署成功
3. 端到端走通完整流程（登录→新建菜谱→点餐→认领→完成→评价→查看历史）

```bash
git add -A
git commit -m "feat: final integration fixes and polish

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## 附录：Tab 图标

需要在 `miniprogram/images/` 目录放置 6 张图标（可使用微信开发者工具自带的图标或自定义）：

```
images/recipe.png
images/recipe-active.png
images/table.png
images/table-active.png
images/mine.png
images/mine-active.png
images/default-recipe.png  （菜谱默认图）
```
