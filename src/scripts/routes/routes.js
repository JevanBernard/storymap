// src/scripts/routes/routes.js
// File ini dari kodemu sudah benar

import LoginPage from '../pages/login/login-page';
import RegisterPage from '../pages/register/register-page';
import StoriesPage from '../pages/stories/stories-page';
import AddStoryPage from '../pages/add-story/add-story-page';

const routes = {
  '/': new LoginPage(),
  '/register': new RegisterPage(),
  '/stories': new StoriesPage(),
  '/add-story': new AddStoryPage(),
};

export default routes;