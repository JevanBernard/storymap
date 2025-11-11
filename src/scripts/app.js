import routes from './routes/routes';
import StoryApi from './data/story-api';
import { updateNavBasedOnAuth } from './utils/auth-ui';
import { initNotificationToggle } from './utils/notification-helper';

class App {
  #content;
  #drawerButton;
  #navigationDrawer;

  constructor({ content, drawerButton, navigationDrawer }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this._setupDrawer();
    this._initNotificationToggle();
    this._initSkipLink();
  }

  _initSkipLink() {
    const skipLink = document.getElementById('skip-link');
    skipLink.addEventListener('click', (event) => {
      event.preventDefault();
      this.#content.focus();
    });
  }

  _isUserLoggedIn() {
    return !!StoryApi.getToken();
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.#navigationDrawer.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove('open');
      }
      const navList = this.#navigationDrawer.querySelector('.nav-list');
      if (navList && navList.contains(event.target) && event.target.tagName === 'A') {
        this.#navigationDrawer.classList.remove('open');
      }
    });

    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
      logoutLink.addEventListener('click', async (event) => { 
        event.preventDefault();
        
        await StoryApi.logout();
        updateNavBasedOnAuth(); 
        
        window.location.hash = '#/';
      });
    }
  }

  _initNotificationToggle() {
    initNotificationToggle().catch(err => {
      console.warn('Gagal inisialisasi toggle notifikasi:', err.message);
    });
  }

  async renderPage() {
    const isLoggedIn = this._isUserLoggedIn();
    const url = this._getActiveRoute();

    if (isLoggedIn && (url === '/' || url === '/register')) {
      window.location.hash = '#/stories';
      return; 
    }
    if (!isLoggedIn && (url === '/add-story')) {
      window.location.hash = '#/';
      return; 
    }

    if (!isLoggedIn && (url === '/add-story' || url === '/offline')) {
      window.location.hash = '#/';
      return; 
    }

    try {
      const page = routes[url] || routes['/']; 
      
      if (document.startViewTransition) {
        document.startViewTransition(async () => {
          this.#content.innerHTML = page.render(); 
          await page.afterRender();
        });
      } else {
        this.#content.innerHTML = page.render();
        await page.afterRender();
      }
      
      updateNavBasedOnAuth();
    } catch (error) {
      console.error('Gagal memuat halaman:', error);
      this.#content.innerHTML = '<p class="auth-page">Gagal memuat halaman. Coba lagi.</p>';
    }
  }

  _getActiveRoute() {
    return window.location.hash.slice(1).toLowerCase() || '/';
  }
}

export default App;