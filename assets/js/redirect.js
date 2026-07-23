import { WORKER_URL } from './config.js';

(function() {
    document.addEventListener('DOMContentLoaded', function() {
        const params = new URLSearchParams(window.location.search);
        const shortId = params.get('id');

        if (shortId) {
            document.title = '安全跳转中...';
            document.body.className = 'redirect-mode';
            const mainContainer = document.getElementById('main-container');
            if (mainContainer) {
                mainContainer.innerHTML = `
                    <div id="redirect-card">
                        <div class="redirect-icon">
                            <svg class="spinner" viewBox="0 0 50 50">
                                <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="3"></circle>
                            </svg>
                        </div>
                        <h2 class="redirect-title">正在安全跳转</h2>
                        <p class="redirect-subtitle">请稍候，正在为您导航至目标页面</p>
                        <div class="redirect-progress">
                            <div class="redirect-progress-bar"></div>
                        </div>
                        <p class="redirect-hint" style="display:none;">如果没有自动跳转，请 <a id="redirect-link" href="#">点击这里</a></p>
                    </div>
                `;
            }

            const ua = navigator.userAgent.toLowerCase();
            const isWeixin = ua.indexOf('micromessenger') !== -1;
            const isQQ = ua.indexOf('qq') !== -1;
            const isMobile = /iphone|ipad|ipod|android/.test(ua);

            if (isWeixin || isQQ) {
                let instructionHTML = '';
                instructionHTML += '<div class="browser-icon"><i class="fas fa-globe"></i></div>';
                instructionHTML += '<h2 class="redirect-title">请在外部浏览器中打开</h2>';
                if (isWeixin) {
                    if (isMobile) {
                        instructionHTML += '<p class="redirect-subtitle">点击右上角菜单按钮（三个点）→ 选择"用浏览器打开"</p>';
                    } else {
                        instructionHTML += '<p class="redirect-subtitle">请复制网址，在电脑浏览器中打开</p>';
                    }
                } else {
                    if (isMobile) {
                        instructionHTML += '<p class="redirect-subtitle">点击右上角菜单按钮 → 选择"浏览器打开"</p>';
                    } else {
                        instructionHTML += '<p class="redirect-subtitle">请复制网址，在电脑浏览器中打开</p>';
                    }
                }
                document.getElementById('redirect-card').innerHTML = instructionHTML;
            } else {
                fetch(`${WORKER_URL}/${shortId}`)
                    .then(response => {
                        if (!response.ok) {
                            return response.json().then(err => {
                                let message = '链接未找到或已失效。';
                                if (err && err.error) {
                                    if (err.error.includes('expired')) message = '此链接已过期。';
                                    if (err.error.includes('maximum number of visits') || err.error.includes('Max visits')) message = '此链接已达到最大访问次数。';
                                }
                                throw new Error(message);
                            });
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data && data.url) {
                            const linkEl = document.getElementById('redirect-link');
                            if (linkEl) linkEl.href = data.url;
                            const hintEl = document.querySelector('.redirect-hint');
                            if (hintEl) hintEl.style.display = 'block';
                            const bar = document.querySelector('.redirect-progress-bar');
                            if (bar) bar.style.width = '100%';
                            setTimeout(() => {
                                window.location.href = data.url;
                            }, 800);
                        } else {
                            throw new Error('从服务器返回的数据格式无效。');
                        }
                    })
                    .catch(error => {
                        console.error('Redirect error:', error);
                        document.getElementById('redirect-card').innerHTML = `
                            <div class="redirect-icon error">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <h2 class="redirect-title">跳转失败</h2>
                            <p class="redirect-subtitle">${error.message}</p>
                        `;
                    });
            }
        }
    });
})();
