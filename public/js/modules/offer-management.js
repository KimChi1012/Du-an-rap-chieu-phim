import { OfferAPI } from '../api/offer.js';
import { showNotification } from './notification.js';

class OfferManagement {
    constructor() {
        console.log('OfferManagement constructor - SQL database only');
        this.offers = [];
        this.filteredOffers = [];
        this.currentOffer = null;
        this.isEditMode = false;
        this.originalOffers = [];
        this.init();
        this.initRichTextEditor();
    }

    async init() {
        console.log('Initializing OfferManagement with SQL database...');
        await this.loadOffers();
        this.setupEventListeners();

        setTimeout(() => {
            console.log('=== DEBUG INFO ===');
            console.log('Table element:', document.getElementById('offerTable'));
            console.log('OfferManagement instance:', window.offerManagement);
            
            if (window.offerManagement) {
                console.log('OfferManagement data:', window.offerManagement.offers);
                console.log('Number of offers:', window.offerManagement.offers.length);
            }

            const table = document.querySelector('.offer-table');
            if (table) {
                table.style.display = 'table';
                table.style.width = '100%';
                table.style.borderCollapse = 'collapse';
                console.log('Table display ensured');
            }

            const tbody = document.getElementById('offerTable');
            if (tbody) {
                console.log('Table body content:', tbody.innerHTML);
                console.log('Table body children count:', tbody.children.length);
            }

            setTimeout(() => {
                if (this.testToolbar) {
                    this.testToolbar();
                }
            }, 1000);
        }, 3000);
    }

    initRichTextEditor() {
        console.log('Rich Text Editor loaded');

        document.addEventListener('mousedown', function(e) {
            const toolbarBtn = e.target.closest('.toolbar-btn');
            if (toolbarBtn) {
                e.preventDefault(); 
            }
        });

        document.addEventListener('click', (e) => {
            const toolbarBtn = e.target.closest('.toolbar-btn');
            if (toolbarBtn) {
                console.log('Toolbar button clicked:', toolbarBtn.dataset.command);
                
                e.preventDefault();
                e.stopPropagation();
                
                const command = toolbarBtn.dataset.command;
                const editor = document.querySelector('.editor-content');
                
                if (editor) {
                    editor.focus();
                    
                    setTimeout(() => {
                        try {
                            let result = false;
                            
                            switch(command) {
                                case 'bold':
                                case 'italic':
                                case 'underline':
                                    result = document.execCommand(command, false, null);
                                    break;
                                    
                                case 'insertUnorderedList':
                                case 'insertOrderedList':
                                    result = document.execCommand(command, false, null);
                                    if (!result) {
                                        this.insertListManually(command === 'insertUnorderedList' ? 'ul' : 'ol');
                                        result = true;
                                    }
                                    break;
                                    
                                case 'justifyLeft':
                                case 'justifyCenter':
                                case 'justifyRight':
                                case 'justifyFull':
                                    result = document.execCommand(command, false, null);
                                    if (!result) {
                                        this.applyAlignment(command);
                                        result = true;
                                    }
                                    break;
                                    
                                default:
                                    result = document.execCommand(command, false, null);
                            }
                            
                            console.log('Command executed:', command, 'Result:', result);
                            
                            setTimeout(() => this.updateButtonStates(), 10);
                            
                            editor.focus();
                        } catch (error) {
                            console.error('Command error:', error);
                        }
                    }, 10);
                }
            }
        });

        document.addEventListener('keydown', (e) => {
            const isInEditor = e.target.classList.contains('editor-content') || 
                             e.target.closest('.editor-content');
            
            if ((e.ctrlKey || e.metaKey) && isInEditor) {
                let command = null;
                
                switch(e.key.toLowerCase()) {
                    case 'b': 
                        command = 'bold'; 
                        break;
                    case 'i': 
                        command = 'italic'; 
                        break;
                    case 'u': 
                        command = 'underline'; 
                        break;
                    case 'l':
                        command = 'insertUnorderedList';
                        break;
                    case 'e':
                        command = 'justifyCenter';
                        break;
                    case 'r':
                        command = 'justifyRight';
                        break;
                    case 'j':
                        command = 'justifyFull';
                        break;
                }
                
                if (command) {
                    e.preventDefault();
                    
                    const editor = document.querySelector('.editor-content');
                    if (editor) {
                        editor.focus();
                        
                        try {
                            const result = document.execCommand(command, false, null);
                            console.log('Keyboard shortcut executed:', command, 'Result:', result);
                            
                            setTimeout(() => this.updateButtonStates(), 10);
                        } catch (error) {
                            console.error('Keyboard shortcut error:', error);
                        }
                    }
                }
            }
        });

        document.addEventListener('selectionchange', () => this.updateButtonStates());

        setTimeout(() => {
            const toolbarButtons = document.querySelectorAll('.toolbar-btn');
            toolbarButtons.forEach(button => {
                button.addEventListener('mousedown', function(e) {
                    e.preventDefault();
                });
                
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const command = button.dataset.command;
                    const editor = document.querySelector('.editor-content');
                    
                    if (editor && command) {
                        console.log('Direct toolbar click:', command);
                        
                        editor.focus();
                        
                        setTimeout(() => {
                            try {
                                const result = document.execCommand(command, false, null);
                                console.log('Command result:', command, result);
                                
                                setTimeout(() => this.updateButtonStates(), 10);
                                
                                editor.focus();
                            } catch (error) {
                                console.error('Command error:', error);
                            }
                        }, 10);
                    }
                });
            });

            const observer = new MutationObserver(() => this.updateButtonStates());
            const editor = document.querySelector('.editor-content');
            if (editor) {
                observer.observe(editor, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['style']
                });
            }
        }, 1000);
        
        console.log('Rich text editor setup completed');
    }

    insertListManually(type) {
        const editor = document.querySelector('.editor-content');
        const selection = window.getSelection();
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const list = document.createElement(type);
            const listItem = document.createElement('li');
            
            const selectedText = range.toString() || 'Mục danh sách';
            listItem.textContent = selectedText;
            list.appendChild(listItem);
            
            try {
                range.deleteContents();
                range.insertNode(list);
                
                range.selectNodeContents(listItem);
                selection.removeAllRanges();
                selection.addRange(range);
            } catch (error) {
                console.error('List insertion error:', error);
            }
        }
    }

    applyAlignment(alignCommand) {
        const editor = document.querySelector('.editor-content');
        const selection = window.getSelection();
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            let container = range.commonAncestorContainer;
            
            if (container.nodeType === Node.TEXT_NODE) {
                container = container.parentElement;
            }
            
            let targetElement = container.closest('p, div');
            if (!targetElement || !editor.contains(targetElement)) {
                targetElement = editor;
            }
            
            const alignmentMap = {
                'justifyLeft': 'left',
                'justifyCenter': 'center',
                'justifyRight': 'right',
                'justifyFull': 'justify'
            };
            
            const alignment = alignmentMap[alignCommand];
            if (alignment) {
                targetElement.style.textAlign = alignment;
            }
        }
    }

    updateButtonStates() {
        const buttons = document.querySelectorAll('.toolbar-btn');
        buttons.forEach(button => {
            const command = button.dataset.command;
            let isActive = false;
            
            try {
                if (command === 'bold' || command === 'italic' || command === 'underline') {
                    isActive = document.queryCommandState(command);
                } else if (command === 'insertUnorderedList' || command === 'insertOrderedList') {
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        const container = selection.getRangeAt(0).commonAncestorContainer;
                        const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
                        
                        if (command === 'insertUnorderedList') {
                            isActive = !!element.closest('ul');
                        } else if (command === 'insertOrderedList') {
                            isActive = !!element.closest('ol');
                        }
                    }
                } else if (command.startsWith('justify')) {
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        const container = selection.getRangeAt(0).commonAncestorContainer;
                        const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
                        const targetElement = element.closest('p, div') || element;
                        
                        const alignmentMap = {
                            'justifyLeft': 'left',
                            'justifyCenter': 'center',
                            'justifyRight': 'right',
                            'justifyFull': 'justify'
                        };
                        
                        const expectedAlignment = alignmentMap[command];
                        const currentAlignment = targetElement.style.textAlign || 'left';
                        isActive = currentAlignment === expectedAlignment;
                    }
                } else {
                    isActive = document.queryCommandState(command);
                }
                
                button.classList.toggle('active', isActive);
            } catch (error) {
                console.debug('Command state check failed for:', command);
            }
        });
    }

    testToolbar() {
        console.log('=== Testing Toolbar ===');
        const buttons = document.querySelectorAll('.toolbar-btn');
        console.log('Found buttons:', buttons.length);
        
        buttons.forEach((btn, index) => {
            console.log(`Button ${index}:`, {
                command: btn.dataset.command,
                title: btn.title,
                clickable: true,
                hasEventListener: btn.onclick !== null
            });
        });
        
        console.log('Available keyboard shortcuts:');
        console.log('- Ctrl+B for Bold');
        console.log('- Ctrl+I for Italic');
        console.log('- Ctrl+U for Underline');
        console.log('- Ctrl+L for Bullet List');
        console.log('- Ctrl+E for Center Align');
        console.log('- Ctrl+R for Right Align');
        console.log('- Ctrl+J for Justify');
    }

    async loadOffers() {
        try {
            console.log('Loading offers from SQL database...');
            this.offers = await OfferAPI.getOffers();
            console.log('Offers loaded from database:', this.offers);

            this.originalOffers = [...this.offers];
            this.filteredOffers = [...this.offers];

            this.renderTable();
            


        } catch (error) {
            console.error('Lỗi khi tải dữ liệu từ database:', error);
            showNotification('Lỗi kết nối database. Vui lòng kiểm tra PHP server và MySQL.', 'error');
            
            const tbody = document.getElementById('offerTable');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-6 text-red-500">
                            ❌ Lỗi: ${error.message}
                        </td>
                    </tr>
                `;
            }
        }
    }

    filterByDate() {
        const startDateValue = document.getElementById('filterStartDate').value;
        const endDateValue = document.getElementById('filterEndDate').value;

        let filtered = [...this.originalOffers];

        if (startDateValue) {
            const startDate = new Date(startDateValue);
            filtered = filtered.filter(item =>
                new Date(item.NgayBatDau) >= startDate
            );
        }

        if (endDateValue) {
            const endDate = new Date(endDateValue);
            filtered = filtered.filter(item =>
                new Date(item.NgayKetThuc) <= endDate
            );
        }

        this.filteredOffers = filtered;
        this.renderTable();
    }

    resetFilter() {
        document.getElementById('filterStartDate').value = '';
        document.getElementById('filterEndDate').value = '';

        this.filteredOffers = [...this.originalOffers];
        this.renderTable();
    }

    showDatabaseError() {
        const tbody = document.getElementById('offerTable');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-6 text-red-500">
                        ❌ Lỗi kết nối database
                    </td>
                </tr>
            `;
        }
    }

    renderTable() {
        const tbody = document.getElementById('offerTable');
        if (!tbody) {
            console.error('Table body element not found!');
            return;
        }

        tbody.innerHTML = '';

        if (this.filteredOffers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-6 text-gray-400">
                        Không có ưu đãi
                    </td>
                </tr>
            `;
            return;
        }

        this.filteredOffers.forEach((offer, index) => {
            const row = this.createTableRow(offer);
            tbody.appendChild(row);
        });
    }

    createTableRow(offer) {
        const tr = document.createElement('tr');
        tr.className = 'odd:bg-white even:bg-slate-50 hover:bg-blue-50 transition';
        const formatDate = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN');
        };

        tr.innerHTML = `
            <td class="px-4 py-3 text-sm font-medium text-gray-900">${offer.MaUD || ''}</td>
            <td class="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title="${offer.TenUD || ''}">${offer.TenUD || ''}</td>
            <td class="px-4 py-3 text-sm text-gray-600 max-w-xs leading-relaxed">
                <div class="line-clamp-3">
                    ${offer.MoTa || ''}
                </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600 text-center">${formatDate(offer.NgayBatDau)}</td>
            <td class="px-4 py-3 text-sm text-gray-600 text-center">${formatDate(offer.NgayKetThuc)}</td>
            <td class="px-4 py-3 text-sm text-gray-600 text-center">
                <div class="flex justify-center">
                    ${
                    offer.Anh
                        ? `<img src="${offer.Anh}" 
                                alt="Ảnh ưu đãi" 
                                class="w-12 h-12 object-cover rounded border">`
                        : '<span class="text-gray-400">Không có ảnh</span>'
                    }
                </div>
            </td>
            <td class="px-4 py-3 text-sm text-center">
                <div class="flex justify-center space-x-2">
                    <div class="action-button-wrapper">
                        <button onclick="window.offerManagement.viewDetail('${offer.MaUD}')"
                                class="action-button"
                                title="Xem chi tiết">
                            <i class="fas fa-eye emoji"></i>
                            <span>Xem</span>
                        </button>
                    </div>
                    <div class="action-button-wrapper">
                        <button onclick="window.offerManagement.editOffer('${offer.MaUD}')"
                                class="action-button"
                                title="Sửa">
                            <i class="fas fa-edit emoji"></i>
                            <span>Sửa</span>
                        </button>
                    </div>
                    <div class="action-button-wrapper">
                        <button onclick="window.offerManagement.deleteOffer('${offer.MaUD}')"
                                class="action-button"
                                title="Xóa">
                            <i class="fas fa-trash emoji"></i>
                            <span>Xóa</span>
                        </button>
                    </div>
                </div>
            </td>
        `;

        return tr;
    }

    searchOffers() {
        const input = document.getElementById('searchInput');
        if (!input) return;

        const keyword = input.value.toLowerCase().trim();

        if (!keyword) {
            this.filteredOffers = [...this.originalOffers];
        } else {
            this.filteredOffers = this.originalOffers.filter(offer =>
                (offer.MaUD && offer.MaUD.toLowerCase().includes(keyword)) ||
                (offer.TenUD && offer.TenUD.toLowerCase().includes(keyword))
            );
        }

        this.renderTable();
    }

    clearForm() {
        document.getElementById('MaUD').value = '';
        document.getElementById('TenUD').value = '';
        document.getElementById('NgayBatDau').value = '';
        document.getElementById('NgayKetThuc').value = '';
        document.getElementById('Anh').value = '';

        const moTaElement = document.getElementById('MoTa');
        if (moTaElement) {
            moTaElement.innerHTML = '';
        }
    }

    fillForm(offer) {
        document.getElementById('MaUD').value = offer.MaUD;
        document.getElementById('TenUD').value = offer.TenUD;
        document.getElementById('NgayBatDau').value = offer.NgayBatDau.split('T')[0];
        document.getElementById('NgayKetThuc').value = offer.NgayKetThuc.split('T')[0];

        const moTaElement = document.getElementById('MoTa');
        if (moTaElement) {
            moTaElement.innerHTML = offer.MoTa || '';
        }
    }

    getFormData() {
        const moTaElement = document.getElementById('MoTa');
        return {
            MaUD: document.getElementById('MaUD').value.trim(),
            TenUD: document.getElementById('TenUD').value.trim(),
            MoTa: moTaElement ? moTaElement.innerHTML : '',
            NgayBatDau: document.getElementById('NgayBatDau').value,
            NgayKetThuc: document.getElementById('NgayKetThuc').value,
            Anh: document.getElementById('Anh').files[0]
        };
    }

    validateForm(data) {
        if (!this.isEditMode && !data.MaUD) {
            window.showNotification('Vui lòng nhập mã ưu đãi!', 'warning');
            return false;
        }

        if (!data.TenUD) {
            window.showNotification('Vui lòng nhập tên ưu đãi!', 'warning');
            return false;
        }

        const moTaElement = document.getElementById('MoTa');
        if (!moTaElement || moTaElement.textContent.trim().length === 0) {
            window.showNotification('Vui lòng nhập mô tả!', 'warning');
            return false;
        }

        if (!data.NgayBatDau) {
            window.showNotification('Vui lòng chọn ngày bắt đầu!', 'warning');
            return false;
        }

        if (!data.NgayKetThuc) {
            window.showNotification('Vui lòng chọn ngày kết thúc!', 'warning');
            return false;
        }

        if (!this.isEditMode && !data.Anh) {
            window.showNotification('Vui lòng chọn ảnh ưu đãi!', 'warning');
            return false;
        }

        const startDate = new Date(data.NgayBatDau);
        const endDate = new Date(data.NgayKetThuc);

        if (endDate <= startDate) {
            window.showNotification('Ngày kết thúc phải sau ngày bắt đầu!', 'warning');
            return false;
        }

        return true;
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.searchOffers());
        }
    }

    handleImageSelect(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('imagePreview');
                const previewImg = document.getElementById('previewImg');
                
                if (preview && previewImg) {
                    previewImg.src = e.target.result;
                    preview.classList.remove('hidden');
                }
            };
            reader.readAsDataURL(file);
        }
    }

    removeImage() {
        const fileInput = document.getElementById('Anh');
        const preview = document.getElementById('imagePreview');
        
        if (fileInput) fileInput.value = '';
        if (preview) preview.classList.add('hidden');
    }
}

export { OfferManagement };