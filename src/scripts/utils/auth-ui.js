import StoryApi from '../data/story-api';

const updateNavBasedOnAuth = () => {
  const token = StoryApi.getToken();
  const body = document.querySelector('body');
  
  if (token) {
    body.setAttribute('data-auth-state', 'user');
  } else {
    body.setAttribute('data-auth-state', 'guest');
  }
};

export { updateNavBasedOnAuth };