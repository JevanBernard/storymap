// src/pages/register/register-page.js
// PERBAIKAN: 'render()' dibuat sinkron

import StoryApi from '../../data/story-api';

class RegisterPage {
  // PERBAIKAN: 'render()' dibuat sinkron
  render() {
    return `
      <section class="auth-page">
        <h2 class="auth-page__title">Daftar Akun Baru</h2>
        <form id="register-form" class="auth-form" novalidate>
          <div class="form-group">
            <label for="register-name">Nama:</label>
            <input type="text" id="register-name" name="name" class="form-control" required minlength="3">
          </div>
          <div class="form-group">
            <label for="register-email">Email:</label>
            <input type="email" id="register-email" name="email" class="form-control" required>
          </div>
          <div class="form-group">
            <label for="register-password">Password:</label>
            <input type="password" id="register-password" name="password" class="form-control" required minlength="8">
          </div>
          <button type="submit" class="auth-button">Daftar</button>
          
          <div id="error-message" class="error-message" role="alert" aria-live="assertive"></div>
        </form>
        <p class="auth-redirect">
          Sudah punya akun? <a href="#/">Login di sini</a>
        </p>
      </section>
    `;
  }

  async afterRender() {
    // ... (kode afterRender-mu sudah benar) ...
    const registerForm = document.getElementById('register-form');
    const errorMessageElement = document.getElementById('error-message');

    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      const name = event.target.name.value;
      const email = event.target.email.value;
      const password = event.target.password.value;

      errorMessageElement.textContent = '';
      errorMessageElement.style.display = 'none';

      if (!name || !email || !password) {
        this._showError(errorMessageElement, 'Semua field tidak boleh kosong.');
        return;
      }
      if (password.length < 8) {
        this._showError(errorMessageElement, 'Password minimal harus 8 karakter.');
        return;
      }

      try {
        event.target.querySelector('button').textContent = 'Mendaftarkan...';
        event.target.querySelector('button').disabled = true;

        await StoryApi.register(name, email, password);

        alert('Registrasi berhasil! Silakan login.'); 
        window.location.hash = '#/'; 

      } catch (error) {
        this._showError(errorMessageElement, error.message);
      } finally {
        event.target.querySelector('button').textContent = 'Daftar';
        event.target.querySelector('button').disabled = false;
      }
    });
  }

  _showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
  }
}

export default RegisterPage;