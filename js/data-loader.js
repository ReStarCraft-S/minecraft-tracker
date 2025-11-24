export class DataLoader {
    constructor() {
        this.staticData = {
            advancements: {},
            lang: {
                en_us: {},
                ja_jp: {}
            }
        };
    }

    async loadStaticData() {
        try {
            const [advancements, en_us, ja_jp] = await Promise.all([
                fetch('data/advancements.json').then(res => res.json()),
                fetch('data/en_us.json').then(res => res.json()),
                fetch('data/ja_jp.json').then(res => res.json())
            ]);

            this.staticData.advancements = advancements;
            this.staticData.lang.en_us = en_us;
            this.staticData.lang.ja_jp = ja_jp;

            console.log('Static data loaded:', this.staticData);
            return this.staticData;
        } catch (error) {
            console.error('Failed to load static data:', error);
            throw error;
        }
    }

    parseUserFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const json = JSON.parse(e.target.result);
                    resolve(json);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    getTranslation(key, lang = 'ja_jp') {
        const langData = this.staticData.lang[lang];
        return langData ? (langData[key] || key) : key;
    }

    resolveTextComponent(component, lang = 'ja_jp') {
        if (!component) return '';
        if (typeof component === 'string') return component;
        if (component.translate) {
            const format = this.getTranslation(component.translate, lang);
            // Simple handling for arguments (with)
            if (component.with) {
                return component.with.reduce((acc, arg, i) => {
                    return acc.replace(`%${i + 1}$s`, this.resolveTextComponent(arg, lang))
                        .replace(`%s`, this.resolveTextComponent(arg, lang));
                }, format);
            }
            return format;
        }
        if (component.text) return component.text;
        return '';
    }
}
