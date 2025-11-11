import StoryApi from '../data/story-api'; // <-- Impor default class

const updateNavBasedOnAuth = () => {
  const token = StoryApi.getToken(); // <-- Panggil static method dari class
  const body = document.querySelector('body');
  
  if (token) {
    body.setAttribute('data-auth-state', 'user');
  } else {
    body.setAttribute('data-auth-state', 'guest');
  }
};

export { updateNavBasedOnAuth };