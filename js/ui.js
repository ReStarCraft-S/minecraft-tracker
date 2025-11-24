export class UI {
    constructor(app) {
        this.app = app;
        this.elements = {
            uploadZone: document.getElementById('upload-zone'),
            fileInput: document.getElementById('file-input'),
            dashboard: document.getElementById('dashboard'),
            languageSelector: document.getElementById('language-selector'),
            advancementsList: document.getElementById('advancements-list')
        };
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Global dragover prevention to stop opening files in new tab
        window.addEventListener('dragover', (e) => e.preventDefault());
        window.addEventListener('drop', (e) => e.preventDefault());

        // Upload Zone
        this.elements.uploadZone.addEventListener('click', () => {
            this.elements.fileInput.click();
        });

        this.elements.uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.elements.uploadZone.classList.add('drag-over');
        });

        this.elements.uploadZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.elements.uploadZone.classList.remove('drag-over');
        });

        this.elements.uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.elements.uploadZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file) this.handleFileSelection(file);
        });

        this.elements.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleFileSelection(file);
        });

        // Language Selector
        this.elements.languageSelector.addEventListener('change', (e) => {
            this.app.handleLanguageChange(e.target.value);
        });

        // Category Navigation
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.app.state.currentCategory = category;
                this.renderAdvancements(this.app.state);
            });
        });

        // Filter Buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.app.state.filter = filter;
                this.renderAdvancements(this.app.state);
            });
        });
    }

    handleFileSelection(file) {
        // Security Check: File Type
        if (file.type && file.type !== 'application/json') {
            alert('Error: Only JSON files are allowed.\nエラー: JSONファイルのみアップロード可能です。');
            return;
        }
        // Security Check: File Size (Max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Error: File is too large (Max 5MB).\nエラー: ファイルサイズが大きすぎます（最大5MB）。');
            return;
        }
        this.app.handleFileUpload(file);
    }

    showDashboard(state) {
        this.elements.uploadZone.classList.add('hidden');
        this.elements.dashboard.classList.remove('hidden');
        // Set default category if not set
        if (!state.currentCategory) state.currentCategory = 'story';
        this.renderAdvancements(state);
    }

    updateLanguage(lang) {
        // Update Landing Page
        const landingLabels = {
            'upload_title': { en_us: 'Upload advancements.json', ja_jp: 'advancements.json をアップロード' },
            'upload_desc': { en_us: 'Drag & drop your file here or click to select', ja_jp: 'ここにファイルをドラッグ＆ドロップ、またはクリックして選択' },
            'donation_text': { en_us: 'Gift an Energy Drink to the Developer', ja_jp: '開発者にエナジードリンクを贈る' },
            'donation_desc': {
                en_us: "A solo-developed tool to support your 'one more step'.<br>If you like it, please fuel the development with an energy drink!",
                ja_jp: 'あなたの「あと一歩」を応援する個人開発ツールです。<br>気に入っていただけたら、開発の燃料（エナドリ）を差し入れしてもらえると嬉しいです！'
            },
            'developer_credit': { en_us: "Developed by Resta's Smart Inventory", ja_jp: 'Developed by リスタのスマートインベントリ' }
        };

        const uploadTitle = document.getElementById('upload-title');
        const uploadDesc = document.getElementById('upload-desc');
        const donationText = document.getElementById('donation-text');
        const donationDesc = document.getElementById('donation-desc');
        const developerCredit = document.getElementById('developer-credit');

        if (uploadTitle) uploadTitle.textContent = landingLabels['upload_title'][lang];
        if (uploadDesc) uploadDesc.textContent = landingLabels['upload_desc'][lang];
        if (donationText) donationText.textContent = landingLabels['donation_text'][lang];
        if (donationDesc) donationDesc.innerHTML = landingLabels['donation_desc'][lang];
        if (developerCredit) developerCredit.textContent = landingLabels['developer_credit'][lang];

        // Update Header Titles
        const mainTitle = document.getElementById('main-title');
        const subTitle = document.getElementById('sub-title');

        if (mainTitle && subTitle) {
            if (lang === 'ja_jp') {
                mainTitle.textContent = 'マインクラフト進捗トラッカー';
                subTitle.textContent = 'Minecraft Advancement Tracker';
            } else {
                mainTitle.textContent = 'Minecraft Advancement Tracker';
                subTitle.textContent = 'マインクラフト進捗トラッカー';
            }
        }

        // Re-render if dashboard is visible
        if (!this.elements.dashboard.classList.contains('hidden')) {
            this.renderAdvancements(this.app.state);
        }
    }

    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    renderAdvancements(state) {
        if (!state.advancements || !state.userProgress) return;

        const container = this.elements.advancementsList;
        container.innerHTML = '';

        const currentCategory = state.currentCategory || 'story';
        const lang = state.currentLanguage;
        const filter = state.filter || 'all';

        // UI Labels Localization
        const uiLabels = {
            'all': { en_us: 'All', ja_jp: 'すべて' },
            'completed': { en_us: 'Completed', ja_jp: '達成済み' },
            'incomplete': { en_us: 'Incomplete', ja_jp: '未達成' },
            'total_progress': { en_us: 'Total Progress', ja_jp: '達成率' }, // Or just Total Progress? User asked for "Total Progress (達成率)" change? No, "Total Progress（達成率）を...変更し"
            'completed_count': { en_us: 'Completed', ja_jp: '達成数' },
            'hidden_included': { en_us: '(incl. hidden)', ja_jp: '(隠し進捗含む)' }
        };

        // Update Filter Buttons Text & Active State
        document.querySelectorAll('.filter-btn').forEach(btn => {
            const f = btn.dataset.filter;
            btn.textContent = uiLabels[f][lang];
            if (f === filter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update Stats Labels
        document.querySelector('.stat-item:nth-child(1) .stat-label').textContent = uiLabels['total_progress'][lang];
        document.querySelector('.stat-item:nth-child(2) .stat-label').textContent = uiLabels['completed_count'][lang];

        // Calculate stats for ALL categories first
        const categoryStats = {};
        let globalTotal = 0;
        let globalCompleted = 0;

        Object.entries(state.advancements).forEach(([id, data]) => {
            if (!id.startsWith('minecraft:') || id.includes('recipes/')) return;
            if (!data.display) return;

            const parts = id.split(':')[1].split('/');
            const cat = parts[0];

            if (!categoryStats[cat]) categoryStats[cat] = { total: 0, completed: 0 };

            categoryStats[cat].total++;
            globalTotal++;

            const userAdv = state.userProgress[id];
            if (userAdv && userAdv.done) {
                categoryStats[cat].completed++;
                globalCompleted++;
            }
        });

        // Update Total Progress (Global)
        const globalPercentage = globalTotal === 0 ? 0 : Math.round((globalCompleted / globalTotal) * 100);
        document.getElementById('total-progress').textContent = `${globalPercentage}%`;
        document.getElementById('completed-count').textContent = `${globalCompleted} / ${globalTotal} ${uiLabels['hidden_included'][lang]}`;

        // Update Category Nav with stats
        this.updateCategoryNav(currentCategory, lang, categoryStats);

        // Filter advancements for current view
        let categoryAdvancements = Object.entries(state.advancements).filter(([id, data]) => {
            if (!id.startsWith('minecraft:')) return false;
            const parts = id.split(':')[1].split('/');
            return parts[0] === currentCategory && !id.includes('recipes/');
        });

        // Sort: Root first, then others
        categoryAdvancements.sort((a, b) => a[0].localeCompare(b[0]));

        categoryAdvancements.forEach(([id, data]) => {
            if (!data.display) return;

            const userAdv = state.userProgress[id];
            const isDone = userAdv && userAdv.done;

            // Apply Filter
            if (filter === 'completed' && !isDone) return;
            if (filter === 'incomplete' && isDone) return;

            const card = document.createElement('div');
            card.className = `advancement-card ${isDone ? 'completed' : ''}`;

            // SECURITY: Escape HTML content
            const rawTitle = this.app.dataLoader.resolveTextComponent(data.display.title, lang);
            const rawDescription = this.app.dataLoader.resolveTextComponent(data.display.description, lang);
            const title = this.escapeHtml(rawTitle);
            const description = this.escapeHtml(rawDescription);

            // Special handling for fraction display
            let fractionDisplay = '';
            const specialFractionIds = [
                'minecraft:adventure/kill_all_mobs', // Monsters Hunted
                'minecraft:adventure/adventuring_time', // Adventuring Time
                'minecraft:husbandry/bred_all_animals', // Two by Two
                'minecraft:husbandry/balanced_diet', // A Balanced Diet
                'minecraft:husbandry/complete_catalogue', // A Complete Catalogue
                'minecraft:husbandry/leash_all_frog_variants', // When the Squad Hops into Town
                'minecraft:husbandry/froglights', // With Our Powers Combined!
                'minecraft:husbandry/whole_pack', // One Team
                'minecraft:nether/explore_nether', // Hot Tourist Destinations
                'minecraft:adventure/trim_with_all_exclusive_armor_patterns' // Smithing with Style
            ];

            if (specialFractionIds.includes(id) && data.criteria) {
                let totalCriteria = Object.keys(data.criteria).length;
                let doneCriteriaCount = userAdv && userAdv.criteria ? Object.keys(userAdv.criteria).length : 0;

                // Special override for Froglights (With Our Powers Combined!)
                // Reason: Game data defines it as 1 criterion, but logically it's 3 items.
                if (id === 'minecraft:husbandry/froglights') {
                    totalCriteria = 3;
                    // Since we can't track partial progress (it's all or nothing in the data),
                    // show 3 if done, 0 if not.
                    doneCriteriaCount = isDone ? 3 : 0;
                }

                fractionDisplay = `<div class="fraction-display">${doneCriteriaCount} / ${totalCriteria}</div>`;
            }

            const criteriaHtml = this.renderCriteria(id, data, userAdv, lang);

            const statusText = isDone
                ? (lang === 'ja_jp' ? '達成済み' : 'Completed')
                : (lang === 'ja_jp' ? '未達成' : 'In Progress');

            card.innerHTML = `
                <div class="card-header">
                    <div>
                        <div class="advancement-title">${title}</div>
                        <div class="advancement-description">${description}</div>
                        ${fractionDisplay}
                    </div>
                    <span class="status-badge">${statusText}</span>
                </div>
                ${criteriaHtml}
            `;

            container.appendChild(card);
        });
    }

    renderCriteria(id, data, userAdv, lang) {
        // Special handling for "With Our Powers Combined!" (Froglights)
        if (id === 'minecraft:husbandry/froglights') {
            const froglights = [
                { id: 'minecraft:pearlescent_froglight', ja: '真珠色', en: 'Pearlescent' },
                { id: 'minecraft:verdant_froglight', ja: '新緑色', en: 'Verdant' },
                { id: 'minecraft:ochre_froglight', ja: '黄土色', en: 'Ochre' }
            ];

            let html = '<div class="criteria-list">';
            // Since we can't track partial progress easily for this one (single criterion),
            // we'll show them all as "done" if the advancement is done, or "missing" if not.
            // Or just list them. The user wants to see them.
            const isAdvDone = userAdv && userAdv.done;

            froglights.forEach(fl => {
                const label = lang === 'ja_jp' ? fl.ja : fl.en;
                // If advancement is done, mark all as done. If not, mark all as missing (or maybe we can't know).
                // Let's assume if not done, we don't know, so show as missing.
                html += `
                    <div class="criteria-item ${isAdvDone ? 'done' : 'missing'}">
                        ${label}
                    </div>
                `;
            });
            html += '</div>';
            return html;
        }

        if (!data.criteria) return '';

        const criteriaKeys = Object.keys(data.criteria);
        if (criteriaKeys.length <= 1) return '';

        let html = '<div class="criteria-list">';
        const doneCriteria = userAdv && userAdv.criteria ? Object.keys(userAdv.criteria) : [];

        // Special Translations Map
        const specialTranslations = {
            // Cats (A Complete Catalogue)
            'minecraft:tabby': 'トラ',
            'minecraft:black': '黒',
            'minecraft:red': 'レッド',
            'minecraft:siamese': 'シャム',
            'minecraft:british_shorthair': 'ブリティッシュショートヘア',
            'minecraft:calico': '三毛',
            'minecraft:persian': 'ペルシャ',
            'minecraft:ragdoll': 'ラグドール',
            'minecraft:white': '白',
            'minecraft:jellie': 'ジェリー',
            'minecraft:all_black': 'タキシード',

            // Frogs (When the Squad Hops into Town)
            'minecraft:temperate': '温帯種',
            'minecraft:warm': '熱帯種',
            'minecraft:cold': '冷帯種'
        };

        // Wolf Translations (Scoped to One Team)
        const wolfTranslations = {
            'minecraft:wolf': '灰色のオオカミ', // Default
            'ashen': '灰色のオオカミ', // Ashen
            'black': '黒色のオオカミ',
            'chestnut': '栗色のオオカミ',
            'snowy': '白色のオオカミ',
            'rusty': '赤茶色のオオカミ',
            'spotted': 'まだら模様のオオカミ',
            'striped': 'しま模様のオオカミ',
            'woods': '森のオオカミ',
            'pale': '雪のオオカミ', // Pale
        };

        criteriaKeys.forEach(key => {
            const isMet = doneCriteria.includes(key);

            let label = key;
            let cleanKey = key;
            // Always strip minecraft: prefix for display/lookup
            if (cleanKey.startsWith('minecraft:')) cleanKey = cleanKey.split(':')[1];

            // 1. Check Special Translations
            if (lang === 'ja_jp') {
                if (specialTranslations[key]) label = specialTranslations[key];
                else if (specialTranslations[`minecraft:${cleanKey}`]) label = specialTranslations[`minecraft:${cleanKey}`];
                // Try without prefix in map
                else if (specialTranslations[cleanKey]) label = specialTranslations[cleanKey];

                // Scoped Wolf Translations
                else if ((id === 'minecraft:husbandry/whole_pack' || id === 'minecraft:husbandry/leash_all_wolf_variants') && wolfTranslations[cleanKey]) {
                    label = wolfTranslations[cleanKey];
                }

                // 2. Heuristic Translation
                else {
                    const entityKey = `entity.minecraft.${cleanKey}`;
                    const itemKey = `item.minecraft.${cleanKey}`;
                    const blockKey = `block.minecraft.${cleanKey}`;
                    const biomeKey = `biome.minecraft.${cleanKey}`;

                    const entityTrans = this.app.dataLoader.getTranslation(entityKey, lang);
                    const itemTrans = this.app.dataLoader.getTranslation(itemKey, lang);
                    const blockTrans = this.app.dataLoader.getTranslation(blockKey, lang);
                    const biomeTrans = this.app.dataLoader.getTranslation(biomeKey, lang);

                    if (entityTrans !== entityKey) label = entityTrans;
                    else if (itemTrans !== itemKey) label = itemTrans;
                    else if (blockTrans !== blockKey) label = blockTrans;
                    else if (biomeTrans !== biomeKey) label = biomeTrans;
                    else label = label.replace(/_/g, ' ');
                }
            } else {
                // English: Strip prefix and replace underscores
                label = cleanKey.replace(/_/g, ' ');
                // Capitalize first letter of each word
                label = label.replace(/\b\w/g, l => l.toUpperCase());
            }

            // SECURITY: Escape HTML content in criteria
            const safeLabel = this.escapeHtml(label);

            html += `
                <div class="criteria-item ${isMet ? 'done' : 'missing'}">
                    ${safeLabel}
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    updateStats(completed, total) {
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
        document.getElementById('total-progress').textContent = `${percentage}%`;
        document.getElementById('completed-count').textContent = `${completed} / ${total}`;
    }

    updateCategoryNav(currentCategory, lang, stats) {
        const labels = {
            'story': { en_us: 'Minecraft', ja_jp: 'Minecraft' },
            'nether': { en_us: 'Nether', ja_jp: 'ネザー' },
            'end': { en_us: 'The End', ja_jp: 'ジ・エンド' },
            'adventure': { en_us: 'Adventure', ja_jp: '冒険' },
            'husbandry': { en_us: 'Husbandry', ja_jp: '農業' }
        };

        document.querySelectorAll('.category-btn').forEach(btn => {
            const cat = btn.dataset.category;

            let label = labels[cat] ? (labels[cat][lang] || labels[cat]['en_us']) : cat;

            // Add stats if available
            if (stats && stats[cat]) {
                const s = stats[cat];
                const pct = s.total === 0 ? 0 : Math.round((s.completed / s.total) * 100);
                label += ` ${pct}% (${s.completed}/${s.total})`;
            }

            btn.textContent = label;

            if (cat === currentCategory) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}
