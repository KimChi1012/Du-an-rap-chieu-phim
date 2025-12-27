import { showNotification } from './notification.js';
import { initTermsOfUsePosters } from './policy-poster-strips.js';

export class TermsOfUseManager {
    constructor() {
        this.readingProgressBar = null;
        this.notificationShown = false;
        this.posterManager = null;
    }

    async init() {
        console.log('📋 Khởi tạo Terms of Use Manager');

        this.posterManager = initTermsOfUsePosters();

        this.initReadingProgress();
    }

    initReadingProgress() {
        this.readingProgressBar = document.querySelector('.reading-progress-fill');
        
        if (!this.readingProgressBar) {
            console.warn('❌ Không tìm thấy thanh tiến trình đọc');
            return;
        }

        this.handleScroll = this.updateReadingProgress.bind(this);
        window.addEventListener('scroll', this.handleScroll);

        console.log('✅ Đã khởi tạo thanh tiến trình đọc');
    }

    updateReadingProgress() {
        const termsWrapper = document.querySelector('.terms-wrapper');
        if (!termsWrapper || !this.readingProgressBar) return;

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = Math.min(Math.max((scrollTop / docHeight) * 100, 0), 100);

        this.readingProgressBar.style.width = scrollPercent + '%';

        if (scrollPercent >= 70 && !this.notificationShown) {
            this.showTermsNotification();
            this.notificationShown = true;

            setTimeout(() => {
                this.notificationShown = false;
            }, 10000);
        }
    }

    showTermsNotification() {
        const message = `
            <strong>Điều khoản sử dụng</strong><br>
            Việc tiếp tục sử dụng website đồng nghĩa với việc bạn đồng ý với điều khoản sử dụng và chính sách bảo mật của chúng tôi.
        `;
        
        showNotification(message, 'info', 8000);
        console.log('📢 Hiển thị notification điều khoản sử dụng');
    }

    destroy() {
        if (this.posterManager && this.posterManager.destroy) {
            this.posterManager.destroy();
        }

        if (this.handleScroll) {
            window.removeEventListener('scroll', this.handleScroll);
        }
        
        console.log('🧹 Đã dọn dẹp Terms of Use Manager');
    }
}

export function initTermsOfUse() {
    const manager = new TermsOfUseManager();
    manager.init();
    
    window.termsOfUseManager = manager;
    
    return manager;
}