// src/App.js
import React, { useState } from 'react';
import './App.css';

// 用户认证高阶组件
function withAuth(WrappedComponent) {
    return function (props) {
        const [isAuthenticated] = useState(props.isAuthenticated);

        if (!isAuthenticated) {
            return (
                <div className="auth-warning">
                    <h3>🔐 访问受限</h3>
                    <p>您需要登录才能查看此内容</p>
                    <button onClick={() => alert('转到登录页面...')}>登录</button>
                </div>
            );
        }

        return <WrappedComponent {...props} />;
    };
}

// 加载状态高阶组件
function withLoading(WrappedComponent) {
    return function (props) {
        const [isLoading] = useState(props.isLoading);

        if (isLoading) {
            return (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>正在加载数据，请稍候...</p>
                </div>
            );
        }

        return <WrappedComponent {...props} />;
    };
}

// 样式增强高阶组件
function withStyling(WrappedComponent) {
    return function (props) {
        return (
            <div className="styled-container">
                <div className="header">
                    <h3>样式增强组件</h3>
                    <div className="decoration"></div>
                </div>
                <div className="content">
                    <WrappedComponent {...props} />
                </div>
                <div className="footer">
                    <span>HOC装饰器示例</span>
                </div>
            </div>
        );
    };
}

// 基础组件 - 用户信息卡片
function UserProfile({ user }) {
    return (
        <div className="profile-card">
            <h2>用户信息</h2>
            <div className="profile-details">
                <div className="avatar">👤</div>
                <div>
                    <p><strong>姓名:</strong> {user.name}</p>
                    <p><strong>邮箱:</strong> {user.email}</p>
                    <p><strong>角色:</strong> {user.role}</p>
                </div>
            </div>
        </div>
    );
}

// 基础组件 - 产品信息
function ProductInfo({ product }) {
    return (
        <div className="product-card">
            <h2>产品详情</h2>
            <div className="product-details">
                <div className="product-icon">📱</div>
                <div>
                    <p><strong>产品名称:</strong> {product.name}</p>
                    <p><strong>价格:</strong> ${product.price.toFixed(2)}</p>
                    <p><strong>库存:</strong> {product.stock} 件</p>
                </div>
            </div>
        </div>
    );
}

// 应用高阶组件
const AuthProtectedProfile = withAuth(UserProfile);
const ProfileWithLoading = withLoading(UserProfile);
const StyledProductInfo = withStyling(ProductInfo);
const FullyEnhancedProfile = withStyling(withLoading(withAuth(UserProfile)));

function HOC3() {
    const [isAuthenticated, setIsAuthenticated] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const user = {
        name: "张三",
        email: "zhangsan@example.com",
        role: "管理员"
    };

    const product = {
        name: "智能手机 X200",
        price: 599.99,
        stock: 42
    };

    return (
        <div className="app">
            <header>
                <h1>React 高阶组件(HOC)学习示例</h1>
                <p>高阶组件(HOC)是React中用于复用组件逻辑的高级技术</p>
            </header>

            <div className="controls">
                <button onClick={() => setIsAuthenticated(!isAuthenticated)}>
                    {isAuthenticated ? '注销' : '登录'}
                </button>
                <button onClick={() => setIsLoading(!isLoading)}>
                    {isLoading ? '完成加载' : '开始加载'}
                </button>
            </div>

            <div className="examples">
                <div className="example">
                    <h2>1. 认证保护高阶组件</h2>
                    <AuthProtectedProfile
                        user={user}
                        isAuthenticated={isAuthenticated}
                    />
                </div>

                <div className="example">
                    <h2>2. 加载状态高阶组件</h2>
                    <ProfileWithLoading
                        user={user}
                        isLoading={isLoading}
                    />
                </div>

                <div className="example">
                    <h2>3. 样式增强高阶组件</h2>
                    <StyledProductInfo product={product} />
                </div>

                <div className="example">
                    <h2>4. 组合多个高阶组件</h2>
                    <FullyEnhancedProfile
                        user={user}
                        isAuthenticated={isAuthenticated}
                        isLoading={isLoading}
                    />
                </div>
            </div>

            <div className="explanation">
                <h2>高阶组件(HOC)要点</h2>
                <ul>
                    <li>HOC 是一个函数，接收组件并返回新组件</li>
                    <li>用于横切关注点（如认证、加载状态、日志记录等）</li>
                    <li>不会修改原组件，而是组合新组件</li>
                    <li>可以链式调用（如 withA(withB(Component))）</li>
                    <li>传递所有props给被包装组件至关重要</li>
                    <li>命名：通常以"with"开头（如 withAuth）</li>
                </ul>
            </div>
        </div>
    );
}

export default HOC3;