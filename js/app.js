import { DataLoader } from './data-loader.js';
import { UI } from './ui.js';

class App {
    constructor() {
        this.dataLoader = new DataLoader();
        this.ui = new UI(this);
        this.state = {
            advancements: null, // The static game data
            userProgress: null, // The uploaded user data
            currentLanguage: 'ja_jp',
            currentCategory: 'story',
            filter: 'all' // all, completed, incomplete
        };
    }

    async init() {
        console.log('Initializing app...');
        try {
            const staticData = await this.dataLoader.loadStaticData();
            this.state.advancements = staticData.advancements;
            this.state.lang = staticData.lang;
            console.log('State initialized with static data:', this.state);
        } catch (error) {
            console.error('Failed to load static data:', error);
            alert('Failed to load game data. The app may not work correctly. Please check the console for details.');
        } finally {
            this.ui.init();
        }
    }

    async handleFileUpload(file) {
        try {
            const userData = await this.dataLoader.parseUserFile(file);
            this.state.userProgress = userData;
            this.ui.showDashboard(this.state);
        } catch (error) {
            console.error('File upload failed:', error);
            alert('Invalid file format. Please upload a valid advancements.json file.');
        }
    }

    handleLanguageChange(lang) {
        this.state.currentLanguage = lang;
        this.ui.updateLanguage(lang);
    }
}

const app = new App();
document.addEventListener('DOMContentLoaded', () => app.init());
