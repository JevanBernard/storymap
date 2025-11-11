const DrawerInitiator = {
  init({ button, drawer, content }) {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      this._toggleDrawer(drawer);
    });

    content.addEventListener('click', (event) => {
      this._closeDrawer(drawer);
    });
  },

  _toggleDrawer(drawer) {
    drawer.classList.toggle('open');
  },

  _closeDrawer(drawer) {
    drawer.classList.remove('open');
  },
};

export default DrawerInitiator;
