import StoryApi from '../../data/story-api';
import { updateNavBasedOnAuth } from '../../utils/auth-ui';
import IdbHelper from '../../data/idb-helper'; // Impor IDB

class LoginPage {
  render() {
    return `
      <section class="auth-page">
        <h2 class="auth-page__title">Login</h2>
        <form id="login-form" class="auth-form" novalidate>
          <div class="form-group">
            <label for="login-email">Email:</label>
            <input type="email" id="login-email" name="email" class="form-control" required>
          </div>
          <div class="form-group">
            <label for="login-password">Password:</label>
            <input type="password" id="login-password" name="password" class="form-control" required>
          </div>
          <button type="submit" class="auth-button">Login</button>
          
          <div id="error-message" class="error-message" role="alert" aria-live="assertive"></div>
        </form>
        <p class="auth-redirect">
          Belum punya akun? <a href="#/register">Daftar di sini</a>
        </p>
      </section>
    `;
  }

  async afterRender() {
    const loginForm = document.getElementById('login-form');
    const errorMessageElement = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      errorMessageElement.textContent = '';
      errorMessageElement.style.display = 'none';

      const email = event.target.email.value;
      const password = event.target.password.value;
      if (!email || !password) {
        this._showError(errorMessageElement, 'Email dan Password tidak boleh kosong.');
        return;
      }

      const button = event.target.querySelector('button');
      button.textContent = 'Memproses...';
      button.disabled = true;

      try {
        const response = await StoryApi.login(email, password);
        
        // AMBIL TOKEN DARI RESPONSE
        const token = response.loginResult.token;
        
        // Simpan token ke IndexedDB
        await IdbHelper.saveToken(token);
        
        updateNavBasedOnAuth();
        window.location.hash = '#/stories';

      } catch (error) {
        this._showError(errorMessageElement, error.message);
      } finally {
        button.textContent = 'Login';
        button.disabled = false;
      }
    });
  }

  _showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
  }
}

export default LoginPage;