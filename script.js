// ============================================
// Admin Panel - Script
// ============================================

const API_BASE = "https://chat-bot-application-backend-s08h.onrender.com";

let authToken = null;
let allQuestions = [];

// ============================================
// Page Navigation
// ============================================

function showPage(pageName) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  document.querySelectorAll('.content-page').forEach(page => {
    page.classList.remove('active');
  });

  // Show selected page
  if (pageName === 'login') {
    document.getElementById('loginPage').classList.add('active');
  } else if (pageName === 'admin') {
    document.getElementById('adminPage').classList.add('active');
    showContentPage('add-question');
  }
}

function showContentPage(contentPageName) {
  // Hide all content pages
  document.querySelectorAll('.content-page').forEach(page => {
    page.classList.remove('active');
  });
  
  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected content page
  document.getElementById(contentPageName).classList.add('active');
  
  // Update nav button
  document.querySelector(`[data-page="${contentPageName}"]`).classList.add('active');

  // Load questions when viewing them
  if (contentPageName === 'view-questions') {
    loadQuestions();
  }
}

// ============================================
// Login / Logout
// ============================================

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  try {
    const response = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (data.success) {
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      showPage('admin');
    } else {
      showLoginError(data.error || 'Invalid credentials');
    }
  } catch (error) {
    showLoginError('Connection error. Please try again.');
    console.error('Login error:', error);
  }
});

function showLoginError(message) {
  const errorEl = document.getElementById('loginError');
  errorEl.textContent = message;
  errorEl.style.display = 'block';
  setTimeout(() => {
    errorEl.style.display = 'none';
  }, 5000);
}

document.getElementById('logoutBtn').addEventListener('click', () => {
  authToken = null;
  localStorage.removeItem('authToken');
  document.getElementById('loginForm').reset();
  showPage('login');
});

// ============================================
// Navigation
// ============================================

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const pageToShow = btn.getAttribute('data-page');
    showContentPage(pageToShow);
  });
});

// ============================================
// Add Question
// ============================================

document.getElementById('addQuestionForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const question = document.getElementById('newQ').value.trim();
  const answer = document.getElementById('newA').value.trim();
  const category = document.getElementById('newCat').value.trim() || 'general';

  if (!question || !answer) {
    showAlert('Please fill in all required fields', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/admin/question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ question, answer, category })
    });

    const data = await response.json();

    if (data.success) {
      showAlert('✓ Question added successfully!', 'success');
      document.getElementById('addQuestionForm').reset();
      
      // Reload questions if already loaded
      if (allQuestions.length > 0) {
        loadQuestions();
      }
    } else {
      showAlert(`Error: ${data.error || 'Failed to add question'}`, 'error');
    }
  } catch (error) {
    showAlert('Connection error. Please try again.', 'error');
    console.error('Add question error:', error);
  }
});

function showAlert(message, type) {
  const alertEl = document.getElementById('addAlert');
  alertEl.textContent = message;
  alertEl.className = `alert ${type}`;
  alertEl.classList.remove('hidden');
  
  setTimeout(() => {
    alertEl.classList.add('hidden');
  }, 4000);
}

// ============================================
// View & Search Questions
// ============================================

async function loadQuestions() {
  const container = document.getElementById('questionsContainer');
  container.innerHTML = '<div class="loading">Loading questions...</div>';

  try {
    const response = await fetch(`${API_BASE}/admin/questions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();

    if (data.success) {
      allQuestions = data.questions || [];
      displayQuestions(allQuestions);
      updateQuestionCount();
    } else {
      container.innerHTML = '<div class="error-message">Failed to load questions</div>';
    }
  } catch (error) {
    container.innerHTML = '<div class="error-message">Connection error</div>';
    console.error('Load questions error:', error);
  }
}

function displayQuestions(questions) {
  const container = document.getElementById('questionsContainer');

  if (questions.length === 0) {
    container.innerHTML = '<div class="no-questions"><p>📭 No questions found</p></div>';
    return;
  }

  container.innerHTML = questions.map((q, index) => `
    <div class="question-card">
      <div class="card-header">
        <h3 class="question-text">${escapeHtml(q.question)}</h3>
        <span class="category-badge">${escapeHtml(q.category || 'general')}</span>
      </div>
      <div class="card-body">
        <p class="answer-text">${escapeHtml(q.answer)}</p>
      </div>
      <div class="card-footer">
        <small class="question-id">ID: ${q.id.substring(0, 8)}...</small>
      </div>
    </div>
  `).join('');

  updateQuestionCount();
}

function updateQuestionCount() {
  const badge = document.getElementById('questionCount');
  const count = allQuestions.length;
  badge.textContent = `${count} question${count !== 1 ? 's' : ''}`;
}

// Search functionality
document.getElementById('searchInput').addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();
  
  if (searchTerm.length === 0) {
    displayQuestions(allQuestions);
  } else {
    const filtered = allQuestions.filter(q => 
      q.question.toLowerCase().includes(searchTerm) ||
      q.answer.toLowerCase().includes(searchTerm) ||
      (q.category && q.category.toLowerCase().includes(searchTerm))
    );
    displayQuestions(filtered);
  }
});

// ============================================
// Utility Functions
// ============================================

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// Initialize
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Check if already logged in
  const savedToken = localStorage.getItem('authToken');
  if (savedToken) {
    authToken = savedToken;
    showPage('admin');
  } else {
    showPage('login');
  }
});
