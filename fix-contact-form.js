/**
 * 🔧 联系表单修复脚本
 * 直接修复主页联系表单提交功能
 */

(function() {
    'use strict';
    
    console.log('🔧 联系表单修复脚本开始执行...');
    
    // 等待DOM加载完成
    function waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                resolve();
            } else {
                document.addEventListener('DOMContentLoaded', resolve);
            }
        });
    }
    
    // 等待表单元素出现
    function waitForForm() {
        return new Promise((resolve) => {
            const checkForm = () => {
                const form = document.getElementById('inquiryForm');
                if (form) {
                    console.log('✅ 找到联系表单');
                    resolve(form);
                } else {
                    console.log('⏳ 等待表单加载...');
                    setTimeout(checkForm, 100);
                }
            };
            checkForm();
        });
    }
    
    // 显示联系表单消息
    function showContactFormMessage(message, type = 'info') {
        const feedbackDiv = document.getElementById('contactFormFeedback');
        if (feedbackDiv) {
            // 根据类型设置样式
            let alertClass = 'alert-info';
            let iconClass = 'fas fa-info-circle';
            
            if (type === 'success') {
                alertClass = 'alert-success';
                iconClass = 'fas fa-check-circle';
            } else if (type === 'error') {
                alertClass = 'alert-danger';
                iconClass = 'fas fa-exclamation-circle';
            }
            
            feedbackDiv.innerHTML = `
                <div class="alert ${alertClass}" style="
                    padding: 15px;
                    border-radius: 8px;
                    border: none;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    font-size: 14px;
                    line-height: 1.5;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <i class="${iconClass}" style="font-size: 18px; flex-shrink: 0;"></i>
                    <span>${message}</span>
                </div>
            `;
            
            feedbackDiv.style.display = 'block';
            
            // 添加动画效果
            feedbackDiv.style.opacity = '0';
            feedbackDiv.style.transform = 'translateY(-10px)';
            feedbackDiv.style.transition = 'all 0.3s ease';
            
            // 显示动画
            setTimeout(() => {
                feedbackDiv.style.opacity = '1';
                feedbackDiv.style.transform = 'translateY(0)';
            }, 50);
            
            // 成功消息显示更长时间，错误消息显示较短时间
            const displayTime = type === 'success' ? 8000 : 5000;
            
            setTimeout(() => {
                feedbackDiv.style.opacity = '0';
                feedbackDiv.style.transform = 'translateY(-10px)';
                
                // 完全隐藏
                setTimeout(() => {
                    feedbackDiv.style.display = 'none';
                }, 300);
            }, displayTime);
            
            console.log('✅ 联系表单消息显示成功:', message);
        } else {
            console.warn('⚠️ 未找到联系表单反馈区域');
            // 回退到alert
            alert(message);
        }
    }
    
    // 验证表单
    function validateForm(form) {
        const nameInput = form.querySelector('#inquiryName');
        const emailInput = form.querySelector('#inquiryEmail');
        const messageInput = form.querySelector('#inquiryMessage');
        
        if (!nameInput || !nameInput.value.trim()) {
            showContactFormMessage('请填写您的姓名', 'error');
            return false;
        }
        
        if (!emailInput || !emailInput.value.trim()) {
            showContactFormMessage('请填写邮箱地址', 'error');
            return false;
        }
        
        // 简单的邮箱验证
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value.trim())) {
            showContactFormMessage('请填写有效的邮箱地址', 'error');
            return false;
        }
        
        if (!messageInput || !messageInput.value.trim()) {
            showContactFormMessage('请填写详细需求', 'error');
            return false;
        }
        
        if (messageInput.value.trim().length < 10) {
            showContactFormMessage('需求描述至少需要10个字符', 'error');
            return false;
        }
        
        return true;
    }
    
    // 处理表单提交
    async function handleFormSubmit(event) {
        event.preventDefault();
        console.log('📝 表单提交事件触发');
        
        const form = event.target;
        const submitBtn = form.querySelector('.btn-submit');
        
        if (!submitBtn) {
            console.error('❌ 未找到提交按钮');
            return;
        }
        
        const originalText = submitBtn.innerHTML;
        
        // 验证表单
        if (!validateForm(form)) {
            return;
        }
        
        // 显示提交状态
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中...';
        submitBtn.disabled = true;
        
        // 禁用表单所有输入字段
        const formInputs = form.querySelectorAll('input, textarea, select');
        formInputs.forEach(input => {
            input.disabled = true;
            input.style.opacity = '0.6';
        });
        
        // 获取表单数据
        const formData = {
            name: document.getElementById('inquiryName').value.trim(),
            email: document.getElementById('inquiryEmail').value.trim(),
            phone: document.getElementById('inquiryPhone')?.value.trim() || '',
            company: document.getElementById('inquiryCompany')?.value.trim() || '',
            message: document.getElementById('inquiryMessage').value.trim(),
            source: 'contact_form',
            sourceDetails: {
                page: window.location.pathname,
                referrer: document.referrer || 'direct',
                timestamp: new Date().toISOString(),
            },
        };
        
        console.log('📤 准备提交表单数据:', formData);
        
        try {
            // 提交到后台API
            const response = await fetch('/api/inquiries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            
            console.log('📡 收到服务器响应:', response.status);
            const data = await response.json();
            console.log('📨 服务器响应数据:', data);
            
            if (data.success) {
                showContactFormMessage(
                    '📧 询价信息发送成功！我们将在24小时内回复您。',
                    'success'
                );
                form.reset();
            } else {
                throw new Error(data.message || '表单提交失败');
            }
        } catch (error) {
            console.error('❌ 表单提交错误:', error);
            showContactFormMessage('❌ 发送失败，请稍后重试或直接联系我们。', 'error');
        } finally {
            // 恢复按钮状态
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            // 恢复表单输入字段状态
            formInputs.forEach(input => {
                input.disabled = false;
                input.style.opacity = '1';
            });
            
            console.log('🔄 表单状态已完全恢复');
        }
    }
    
    // 初始化表单
    async function initContactForm() {
        try {
            console.log('🔧 开始初始化联系表单...');
            
            await waitForDOM();
            const form = await waitForForm();
            
            // 检查是否已经初始化过
            if (form.dataset.fixInitialized === 'true') {
                console.log('⚠️ 表单已经通过修复脚本初始化过，跳过');
                return;
            }
            
            // 移除可能存在的旧事件监听器
            form.removeEventListener('submit', handleFormSubmit);
            
            // 添加新的事件监听器
            form.addEventListener('submit', handleFormSubmit);
            
            // 标记为已初始化
            form.dataset.fixInitialized = 'true';

            console.log('✅ 联系表单修复完成');
            
        } catch (error) {
            console.error('❌ 联系表单初始化失败:', error);
        }
    }
    
    // 导出到全局作用域
    window.showContactFormMessage = showContactFormMessage;
    window.fixContactForm = initContactForm;
    
    // 自动初始化
    initContactForm();
    
    console.log('🔧 联系表单修复脚本加载完成');
})();
