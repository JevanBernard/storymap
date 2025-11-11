import routes from '../routes'; 

const router = async () => {
  const appContent = document.getElementById('app-content');
  if (!appContent) {
    console.error("Elemen <main id='app-content'> tidak ditemukan!");
    return;
  }

  const path = window.location.hash.slice(1).toLowerCase() || '/';

  const page = routes[path] || routes['/'];

  if (document.startViewTransition) {
    document.startViewTransition(async () => {
      appContent.innerHTML = await page.render();
      if (page.afterRender) {
        await page.afterRender();
      }
    });
  } else {
    appContent.innerHTML = await page.render();
    if (page.afterRender) {
      await page.afterRender();
    }
  }
};

const initRouter = () => {
  window.addEventListener('load', router);
  window.addEventListener('hashchange', router);
};

export { initRouter };