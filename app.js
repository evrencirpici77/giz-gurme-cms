'use strict';

/*
  GİZ GURME CMS
  Supabase tablo adı: products

  Beklenen sütunlar:
  id          uuid / bigint
  name        text
  category    text
  price       numeric
  description text
  recipe      text
  image_url   text
  active      boolean
  sort_order  integer
  created_at  timestamptz
*/

(() => {
  const CONFIG = {
    table: 'products',
    title: 'GİZ GURME',
    currency: 'TRY',
    locale: 'tr-TR',
    pageSize: 500
  };

  const state = {
    products: [],
    categories: [],
    selectedCategory: 'Tümü',
    search: '',
    view: 'admin',
    editingId: null,
    loading: false
  };

  let supabaseClient = null;
  let root = null;

  const escapeHTML = (value = '') =>
    String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');

  const formatPrice = value => {
    const number = Number(value || 0);

    return new Intl.NumberFormat(CONFIG.locale, {
      style: 'currency',
      currency: CONFIG.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(number);
  };

  const normalizeText = value =>
    String(value || '')
      .toLocaleLowerCase('tr-TR')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const generateId = () => {
    if (crypto?.randomUUID) return crypto.randomUUID();

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  function findSupabaseClient() {
    if (window.supabaseClient?.from) {
      return window.supabaseClient;
    }

    if (window.supabase?.from) {
      return window.supabase;
    }

    if (window.gizSupabase?.from) {
      return window.gizSupabase;
    }

    const url =
      window.SUPABASE_URL ||
      document.querySelector('meta[name="supabase-url"]')?.content ||
      localStorage.getItem('SUPABASE_URL');

    const anonKey =
      window.SUPABASE_ANON_KEY ||
      document.querySelector('meta[name="supabase-anon-key"]')?.content ||
      localStorage.getItem('SUPABASE_ANON_KEY');

    if (window.supabase?.createClient && url && anonKey) {
      return window.supabase.createClient(url, anonKey);
    }

    throw new Error(
      'Supabase istemcisi bulunamadı. window.supabaseClient değişkenini tanımlayın.'
    );
  }

  function injectStyles() {
    if (document.getElementById('giz-cms-styles')) return;

    const style = document.createElement('style');
    style.id = 'giz-cms-styles';

    style.textContent = `
      :root {
        --giz-bg: #0b0b0b;
        --giz-panel: #151515;
        --giz-panel-2: #1e1e1e;
        --giz-border: #333;
        --giz-gold: #d7ad50;
        --giz-gold-light: #f1d58a;
        --giz-text: #f6f2e9;
        --giz-muted: #aaa;
        --giz-danger: #d95c5c;
        --giz-success: #56a875;
        --giz-radius: 16px;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background:
          radial-gradient(circle at top right, rgba(215,173,80,.09), transparent 35%),
          var(--giz-bg);
        color: var(--giz-text);
        font-family: Inter, Arial, Helvetica, sans-serif;
      }

      button,
      input,
      select,
      textarea {
        font: inherit;
      }

      button {
        cursor: pointer;
      }

      .giz-app {
        min-height: 100vh;
      }

      .giz-header {
        position: sticky;
        top: 0;
        z-index: 50;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 16px 22px;
        border-bottom: 1px solid var(--giz-border);
        background: rgba(11,11,11,.94);
        backdrop-filter: blur(14px);
      }

      .giz-brand {
        display: flex;
        align-items: center;
        gap: 13px;
      }

      .giz-logo {
        width: 46px;
        height: 46px;
        display: grid;
        place-items: center;
        border: 1px solid var(--giz-gold);
        border-radius: 50%;
        color: var(--giz-gold);
        font-family: Georgia, serif;
        font-size: 28px;
        font-style: italic;
        box-shadow: 0 0 22px rgba(215,173,80,.12);
      }

      .giz-brand h1 {
        margin: 0;
        color: var(--giz-gold-light);
        font-family: Georgia, serif;
        font-size: 21px;
        letter-spacing: 2px;
      }

      .giz-brand small {
        display: block;
        margin-top: 3px;
        color: var(--giz-muted);
        letter-spacing: .8px;
      }

      .giz-header-actions {
        display: flex;
        align-items: center;
        gap: 9px;
        flex-wrap: wrap;
      }

      .giz-container {
        width: min(1450px, 100%);
        margin: 0 auto;
        padding: 22px;
      }

      .giz-toolbar {
        display: grid;
        grid-template-columns: minmax(220px, 1fr) minmax(180px, 280px) auto;
        gap: 12px;
        margin-bottom: 18px;
      }

      .giz-input,
      .giz-select,
      .giz-textarea {
        width: 100%;
        border: 1px solid var(--giz-border);
        border-radius: 11px;
        outline: none;
        background: var(--giz-panel);
        color: var(--giz-text);
        padding: 12px 13px;
        transition: border-color .2s, box-shadow .2s;
      }

      .giz-input:focus,
      .giz-select:focus,
      .giz-textarea:focus {
        border-color: var(--giz-gold);
        box-shadow: 0 0 0 3px rgba(215,173,80,.12);
      }

      .giz-textarea {
        min-height: 120px;
        resize: vertical;
        line-height: 1.5;
      }

      .giz-btn {
        border: 1px solid var(--giz-border);
        border-radius: 11px;
        background: var(--giz-panel-2);
        color: var(--giz-text);
        padding: 11px 15px;
        font-weight: 700;
        transition: transform .15s, border-color .2s, background .2s;
      }

      .giz-btn:hover {
        border-color: var(--giz-gold);
        transform: translateY(-1px);
      }

      .giz-btn-primary {
        border-color: var(--giz-gold);
        background: var(--giz-gold);
        color: #111;
      }

      .giz-btn-danger {
        border-color: rgba(217,92,92,.6);
        color: #ffb6b6;
      }

      .giz-btn-success {
        border-color: rgba(86,168,117,.7);
        color: #a9e6bd;
      }

      .giz-btn-small {
        padding: 8px 10px;
        font-size: 13px;
      }

      .giz-stats {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 18px;
      }

      .giz-stat {
        min-width: 150px;
        padding: 13px 16px;
        border: 1px solid var(--giz-border);
        border-radius: 13px;
        background: var(--giz-panel);
      }

      .giz-stat strong {
        display: block;
        margin-bottom: 3px;
        color: var(--giz-gold-light);
        font-size: 20px;
      }

      .giz-stat span {
        color: var(--giz-muted);
        font-size: 13px;
      }

      .giz-table-wrap {
        overflow: auto;
        border: 1px solid var(--giz-border);
        border-radius: var(--giz-radius);
        background: var(--giz-panel);
      }

      .giz-table {
        width: 100%;
        min-width: 1050px;
        border-collapse: collapse;
      }

      .giz-table th,
      .giz-table td {
        padding: 13px 12px;
        border-bottom: 1px solid var(--giz-border);
        text-align: left;
        vertical-align: middle;
      }

      .giz-table th {
        position: sticky;
        top: 0;
        z-index: 2;
        background: #191919;
        color: var(--giz-gold-light);
        font-size: 13px;
        letter-spacing: .4px;
      }

      .giz-table tr:last-child td {
        border-bottom: 0;
      }

      .giz-table tbody tr:hover {
        background: rgba(255,255,255,.025);
      }

      .giz-thumb {
        width: 64px;
        height: 52px;
        object-fit: cover;
        border: 1px solid var(--giz-border);
        border-radius: 9px;
        background: #090909;
      }

      .giz-placeholder {
        width: 64px;
        height: 52px;
        display: grid;
        place-items: center;
        border: 1px dashed #444;
        border-radius: 9px;
        color: #777;
        font-size: 19px;
      }

      .giz-badge {
        display: inline-flex;
        align-items: center;
        border: 1px solid var(--giz-border);
        border-radius: 999px;
        padding: 5px 9px;
        background: var(--giz-panel-2);
        color: var(--giz-muted);
        font-size: 12px;
      }

      .giz-badge-active {
        border-color: rgba(86,168,117,.45);
        color: #a9e6bd;
      }

      .giz-badge-passive {
        border-color: rgba(217,92,92,.45);
        color: #ffb6b6;
      }

      .giz-actions {
        display: flex;
        gap: 7px;
        flex-wrap: wrap;
      }

      .giz-menu-category {
        margin-bottom: 32px;
      }

      .giz-menu-category-title {
        display: flex;
        align-items: center;
        gap: 13px;
        margin: 0 0 16px;
        color: var(--giz-gold-light);
        font-family: Georgia, serif;
        font-size: 25px;
        letter-spacing: 1px;
      }

      .giz-menu-category-title::after {
        content: "";
        flex: 1;
        height: 1px;
        background: linear-gradient(to right, var(--giz-gold), transparent);
      }

      .giz-menu-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 15px;
      }

      .giz-menu-card {
        overflow: hidden;
        border: 1px solid var(--giz-border);
        border-radius: var(--giz-radius);
        background: linear-gradient(145deg, #181818, #111);
        transition: transform .2s, border-color .2s;
      }

      .giz-menu-card:hover {
        transform: translateY(-3px);
        border-color: rgba(215,173,80,.65);
      }

      .giz-menu-image {
        width: 100%;
        height: 185px;
        display: block;
        object-fit: cover;
        background: #090909;
      }

      .giz-menu-image-empty {
        width: 100%;
        height: 185px;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle, rgba(215,173,80,.1), transparent 55%),
          #0d0d0d;
        color: rgba(215,173,80,.55);
        font-family: Georgia, serif;
        font-size: 44px;
        font-style: italic;
      }

      .giz-menu-card-body {
        padding: 15px;
      }

      .giz-menu-card-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }

      .giz-menu-card h3 {
        margin: 0;
        font-family: Georgia, serif;
        font-size: 19px;
        line-height: 1.3;
      }

      .giz-menu-price {
        flex: 0 0 auto;
        color: var(--giz-gold-light);
        font-weight: 800;
        white-space: nowrap;
      }

      .giz-menu-description {
        margin: 10px 0 0;
        color: var(--giz-muted);
        font-size: 14px;
        line-height: 1.5;
      }

      .giz-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: grid;
        place-items: center;
        padding: 16px;
        background: rgba(0,0,0,.78);
        backdrop-filter: blur(5px);
      }

      .giz-modal {
        width: min(820px, 100%);
        max-height: 94vh;
        overflow-y: auto;
        border: 1px solid #444;
        border-radius: 18px;
        background: #131313;
        box-shadow: 0 30px 90px rgba(0,0,0,.6);
      }

      .giz-modal-header {
        position: sticky;
        top: 0;
        z-index: 3;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 17px 19px;
        border-bottom: 1px solid var(--giz-border);
        background: #131313;
      }

      .giz-modal-header h2 {
        margin: 0;
        color: var(--giz-gold-light);
        font-family: Georgia, serif;
        font-size: 21px;
      }

      .giz-modal-body {
        padding: 19px;
      }

      .giz-form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
      }

      .giz-form-field {
        display: flex;
        flex-direction: column;
        gap: 7px;
      }

      .giz-form-field-full {
        grid-column: 1 / -1;
      }

      .giz-form-field label {
        color: #ddd;
        font-size: 13px;
        font-weight: 700;
      }

      .giz-checkbox {
        display: flex;
        align-items: center;
        gap: 9px;
        min-height: 44px;
      }

      .giz-checkbox input {
        width: 19px;
        height: 19px;
        accent-color: var(--giz-gold);
      }

      .giz-modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 16px 19px;
        border-top: 1px solid var(--giz-border);
      }

      .giz-recipe-box {
        padding: 17px;
        border: 1px solid var(--giz-border);
        border-radius: 13px;
        background: #0c0c0c;
        white-space: pre-wrap;
        line-height: 1.65;
      }

      .giz-empty,
      .giz-loading,
      .giz-error {
        padding: 40px 20px;
        border: 1px solid var(--giz-border);
        border-radius: var(--giz-radius);
        background: var(--giz-panel);
        text-align: center;
        color: var(--giz-muted);
      }

      .giz-error {
        border-color: rgba(217,92,92,.55);
        color: #ffb6b6;
      }

      .giz-toast-container {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 2000;
        display: flex;
        flex-direction: column;
        gap: 9px;
      }

      .giz-toast {
        max-width: min(390px, calc(100vw - 36px));
        padding: 13px 15px;
        border: 1px solid var(--giz-border);
        border-radius: 12px;
        background: #1e1e1e;
        color: var(--giz-text);
        box-shadow: 0 14px 50px rgba(0,0,0,.45);
        animation: gizToastIn .22s ease-out;
      }

      .giz-toast-success {
        border-color: rgba(86,168,117,.65);
      }

      .giz-toast-error {
        border-color: rgba(217,92,92,.65);
      }

      @keyframes gizToastIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }

        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (max-width: 760px) {
        .giz-header {
          align-items: flex-start;
          padding: 13px;
        }

        .giz-brand h1 {
          font-size: 18px;
        }

        .giz-brand small {
          display: none;
        }

        .giz-container {
          padding: 13px;
        }

        .giz-toolbar {
          grid-template-columns: 1fr;
        }

        .giz-form-grid {
          grid-template-columns: 1fr;
        }

        .giz-form-field-full {
          grid-column: auto;
        }

        .giz-menu-grid {
          grid-template-columns: 1fr;
        }

        .giz-menu-image,
        .giz-menu-image-empty {
          height: 210px;
        }

        .giz-header-actions .giz-btn {
          padding: 9px 10px;
          font-size: 12px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function createRoot() {
    root =
      document.getElementById('app') ||
      document.getElementById('root') ||
      document.getElementById('giz-app');

    if (!root) {
      root = document.createElement('div');
      root.id = 'app';
      document.body.appendChild(root);
    }

    root.className = 'giz-app';
  }

  function ensureToastContainer() {
    let container = document.querySelector('.giz-toast-container');

    if (!container) {
      container = document.createElement('div');
      container.className = 'giz-toast-container';
      document.body.appendChild(container);
    }

    return container;
  }

  function toast(message, type = 'success') {
    const container = ensureToastContainer();
    const element = document.createElement('div');

    element.className = `giz-toast giz-toast-${type}`;
    element.textContent = message;

    container.appendChild(element);

    setTimeout(() => {
      element.remove();
    }, 3500);
  }

  function updateCategories() {
    state.categories = [
      ...new Set(
        state.products
          .map(product => String(product.category || '').trim())
          .filter(Boolean)
      )
    ].sort((a, b) => a.localeCompare(b, 'tr'));
  }

  function getFilteredProducts({ customerOnly = false } = {}) {
    const search = normalizeText(state.search);

    return state.products
      .filter(product => {
        if (customerOnly && product.active === false) return false;

        const categoryMatch =
          state.selectedCategory === 'Tümü' ||
          product.category === state.selectedCategory;

        const haystack = normalizeText(
          [
            product.name,
            product.category,
            product.description,
            customerOnly ? '' : product.recipe
          ].join(' ')
        );

        return categoryMatch && (!search || haystack.includes(search));
      })
      .sort((a, b) => {
        const orderA = Number(a.sort_order ?? 999999);
        const orderB = Number(b.sort_order ?? 999999);

        if (orderA !== orderB) return orderA - orderB;

        return String(a.name || '').localeCompare(String(b.name || ''), 'tr');
      });
  }

  async function loadProducts() {
    state.loading = true;
    render();

    try {
      const { data, error } = await supabaseClient
        .from(CONFIG.table)
        .select('*')
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true })
        .limit(CONFIG.pageSize);

      if (error) throw error;

      state.products = Array.isArray(data) ? data : [];
      updateCategories();
    } catch (error) {
      console.error(error);
      toast(error.message || 'Ürünler yüklenemedi.', 'error');
    } finally {
      state.loading = false;
      render();
    }
  }

  async function saveProduct(form) {
    const formData = new FormData(form);

    const payload = {
      name: String(formData.get('name') || '').trim(),
      category: String(formData.get('category') || '').trim(),
      price: Number(formData.get('price') || 0),
      description: String(formData.get('description') || '').trim(),
      recipe: String(formData.get('recipe') || '').trim(),
      image_url: String(formData.get('image_url') || '').trim(),
      active: formData.get('active') === 'on',
      sort_order: Number(formData.get('sort_order') || 0)
    };

    if (!payload.name) {
      toast('Ürün adı zorunludur.', 'error');
      return;
    }

    if (!payload.category) {
      toast('Kategori zorunludur.', 'error');
      return;
    }

    const submitButton = form.querySelector('[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Kaydediliyor...';

    try {
      if (state.editingId !== null) {
        const { error } = await supabaseClient
          .from(CONFIG.table)
          .update(payload)
          .eq('id', state.editingId);

        if (error) throw error;

        toast('Ürün güncellendi.');
      } else {
        const { error } = await supabaseClient
          .from(CONFIG.table)
          .insert({
            ...payload,
            id: generateId()
          });

        if (error) {
          const { error: retryError } = await supabaseClient
            .from(CONFIG.table)
            .insert(payload);

          if (retryError) throw retryError;
        }

        toast('Ürün eklendi.');
      }

      closeModal();
      await loadProducts();
    } catch (error) {
      console.error(error);
      toast(error.message || 'Ürün kaydedilemedi.', 'error');
      submitButton.disabled = false;
      submitButton.textContent = 'Kaydet';
    }
  }

  async function deleteProduct(id) {
    const product = state.products.find(item => String(item.id) === String(id));

    const approved = window.confirm(
      `"${product?.name || 'Bu ürün'}" kalıcı olarak silinsin mi?`
    );

    if (!approved) return;

    try {
      const { error } = await supabaseClient
        .from(CONFIG.table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast('Ürün silindi.');
      await loadProducts();
    } catch (error) {
      console.error(error);
      toast(error.message || 'Ürün silinemedi.', 'error');
    }
  }

  async function toggleProduct(id) {
    const product = state.products.find(item => String(item.id) === String(id));

    if (!product) return;

    try {
      const { error } = await supabaseClient
        .from(CONFIG.table)
        .update({ active: product.active === false })
        .eq('id', id);

      if (error) throw error;

      toast(product.active === false ? 'Ürün yayına alındı.' : 'Ürün gizlendi.');
      await loadProducts();
    } catch (error) {
      console.error(error);
      toast(error.message || 'Ürün durumu değiştirilemedi.', 'error');
    }
  }

  function categoryOptions() {
    return ['Tümü', ...state.categories]
      .map(
        category => `
          <option
            value="${escapeHTML(category)}"
            ${category === state.selectedCategory ? 'selected' : ''}
          >
            ${escapeHTML(category)}
          </option>
        `
      )
      .join('');
  }

  function renderHeader() {
    return `
      <header class="giz-header">
        <div class="giz-brand">
          <div class="giz-logo">G</div>

          <div>
            <h1>${escapeHTML(CONFIG.title)}</h1>
            <small>
              ${state.view === 'admin' ? 'İçerik Yönetim Sistemi' : 'Müşteri Menüsü'}
            </small>
          </div>
        </div>

        <div class="giz-header-actions">
          <button
            class="giz-btn ${state.view === 'admin' ? 'giz-btn-primary' : ''}"
            data-action="admin-view"
            type="button"
          >
            Yönetim
          </button>

          <button
            class="giz-btn ${state.view === 'customer' ? 'giz-btn-primary' : ''}"
            data-action="customer-view"
            type="button"
          >
            Müşteri Menüsü
          </button>

          ${
            state.view === 'admin'
              ? `
                <button
                  class="giz-btn giz-btn-primary"
                  data-action="add"
                  type="button"
                >
                  + Ürün Ekle
                </button>
              `
              : ''
          }
        </div>
      </header>
    `;
  }

  function renderToolbar() {
    return `
      <div class="giz-toolbar">
        <input
          id="giz-search"
          class="giz-input"
          type="search"
          placeholder="${
            state.view === 'admin'
              ? 'Ürün, kategori veya reçete ara...'
              : 'Menüde ara...'
          }"
          value="${escapeHTML(state.search)}"
          autocomplete="off"
        >

        <select id="giz-category-filter" class="giz-select">
          ${categoryOptions()}
        </select>

        <button class="giz-btn" data-action="refresh" type="button">
          Yenile
        </button>
      </div>
    `;
  }

  function renderStats() {
    const activeCount = state.products.filter(
      product => product.active !== false
    ).length;

    return `
      <div class="giz-stats">
        <div class="giz-stat">
          <strong>${state.products.length}</strong>
          <span>Toplam ürün</span>
        </div>

        <div class="giz-stat">
          <strong>${activeCount}</strong>
          <span>Yayındaki ürün</span>
        </div>

        <div class="giz-stat">
          <strong>${state.categories.length}</strong>
          <span>Kategori</span>
        </div>
      </div>
    `;
  }

  function renderAdmin() {
    const products = getFilteredProducts();

    if (!products.length) {
      return `
        ${renderStats()}
        <div class="giz-empty">Arama ölçütlerine uygun ürün bulunamadı.</div>
      `;
    }

    return `
      ${renderStats()}

      <div class="giz-table-wrap">
        <table class="giz-table">
          <thead>
            <tr>
              <th>Görsel</th>
              <th>Sıra</th>
              <th>Ürün</th>
              <th>Kategori</th>
              <th>Fiyat</th>
              <th>Durum</th>
              <th>Reçete</th>
              <th>İşlemler</th>
            </tr>
          </thead>

          <tbody>
            ${products
              .map(
                product => `
                  <tr>
                    <td>
                      ${
                        product.image_url
                          ? `
                            <img
                              class="giz-thumb"
                              src="${escapeHTML(product.image_url)}"
                              alt="${escapeHTML(product.name)}"
                              loading="lazy"
                              onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';"
                            >
                            <div class="giz-placeholder" style="display:none">G</div>
                          `
                          : '<div class="giz-placeholder">G</div>'
                      }
                    </td>

                    <td>${escapeHTML(product.sort_order ?? 0)}</td>

                    <td>
                      <strong>${escapeHTML(product.name)}</strong>

                      ${
                        product.description
                          ? `
                            <div style="margin-top:5px;color:#999;font-size:12px;max-width:290px">
                              ${escapeHTML(product.description)}
                            </div>
                          `
                          : ''
                      }
                    </td>

                    <td>
                      <span class="giz-badge">
                        ${escapeHTML(product.category || 'Kategorisiz')}
                      </span>
                    </td>

                    <td>
                      <strong>${formatPrice(product.price)}</strong>
                    </td>

                    <td>
                      <span class="giz-badge ${
                        product.active === false
                          ? 'giz-badge-passive'
                          : 'giz-badge-active'
                      }">
                        ${product.active === false ? 'Gizli' : 'Yayında'}
                      </span>
                    </td>

                    <td>
                      ${
                        product.recipe
                          ? `
                            <button
                              class="giz-btn giz-btn-small"
                              data-action="recipe"
                              data-id="${escapeHTML(product.id)}"
                              type="button"
                            >
                              Gör
                            </button>
                          `
                          : '<span style="color:#777">Yok</span>'
                      }
                    </td>

                    <td>
                      <div class="giz-actions">
                        <button
                          class="giz-btn giz-btn-small"
                          data-action="edit"
                          data-id="${escapeHTML(product.id)}"
                          type="button"
                        >
                          Düzenle
                        </button>

                        <button
                          class="giz-btn giz-btn-small giz-btn-success"
                          data-action="toggle"
                          data-id="${escapeHTML(product.id)}"
                          type="button"
                        >
                          ${product.active === false ? 'Yayınla' : 'Gizle'}
                        </button>

                        <button
                          class="giz-btn giz-btn-small giz-btn-danger"
                          data-action="delete"
                          data-id="${escapeHTML(product.id)}"
                          type="button"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderCustomer() {
    const products = getFilteredProducts({ customerOnly: true });

    if (!products.length) {
      return '<div class="giz-empty">Menüde uygun ürün bulunamadı.</div>';
    }

    const groups = products.reduce((accumulator, product) => {
      const category = product.category || 'Diğer';

      if (!accumulator[category]) {
        accumulator[category] = [];
      }

      accumulator[category].push(product);
      return accumulator;
    }, {});

    return Object.entries(groups)
      .map(
        ([category, categoryProducts]) => `
          <section class="giz-menu-category">
            <h2 class="giz-menu-category-title">
              ${escapeHTML(category)}
            </h2>

            <div class="giz-menu-grid">
              ${categoryProducts
                .map(
                  product => `
                    <article class="giz-menu-card">
                      ${
                        product.image_url
                          ? `
                            <img
                              class="giz-menu-image"
                              src="${escapeHTML(product.image_url)}"
                              alt="${escapeHTML(product.name)}"
                              loading="lazy"
                              onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';"
                            >
                            <div class="giz-menu-image-empty" style="display:none">G</div>
                          `
                          : '<div class="giz-menu-image-empty">G</div>'
                      }

                      <div class="giz-menu-card-body">
                        <div class="giz-menu-card-top">
                          <h3>${escapeHTML(product.name)}</h3>

                          <div class="giz-menu-price">
                            ${formatPrice(product.price)}
                          </div>
                        </div>

                        ${
                          product.description
                            ? `
                              <p class="giz-menu-description">
                                ${escapeHTML(product.description)}
                              </p>
                            `
                            : ''
                        }
                      </div>
                    </article>
                  `
                )
                .join('')}
            </div>
          </section>
        `
      )
      .join('');
  }

  function render() {
    if (!root) return;

    root.innerHTML = `
      ${renderHeader()}

      <main class="giz-container">
        ${renderToolbar()}

        ${
          state.loading
            ? '<div class="giz-loading">Yükleniyor...</div>'
            : state.view === 'admin'
              ? renderAdmin()
              : renderCustomer()
        }
      </main>
    `;

    bindMainEvents();
  }

  function openProductModal(product = null) {
    state.editingId = product?.id ?? null;

    const modal = document.createElement('div');
    modal.className = 'giz-modal-backdrop';
    modal.id = 'giz-modal-backdrop';

    modal.innerHTML = `
      <div class="giz-modal" role="dialog" aria-modal="true">
        <form id="giz-product-form">
          <div class="giz-modal-header">
            <h2>${product ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</h2>

            <button
              class="giz-btn giz-btn-small"
              data-modal-close
              type="button"
            >
              ✕
            </button>
          </div>

          <div class="giz-modal-body">
            <div class="giz-form-grid">
              <div class="giz-form-field">
                <label for="product-name">Ürün Adı *</label>
                <input
                  id="product-name"
                  class="giz-input"
                  name="name"
                  type="text"
                  value="${escapeHTML(product?.name || '')}"
                  required
                >
              </div>

              <div class="giz-form-field">
                <label for="product-category">Kategori *</label>
                <input
                  id="product-category"
                  class="giz-input"
                  name="category"
                  type="text"
                  list="giz-category-list"
                  value="${escapeHTML(product?.category || '')}"
                  required
                >

                <datalist id="giz-category-list">
                  ${state.categories
                    .map(
                      category =>
                        `<option value="${escapeHTML(category)}"></option>`
                    )
                    .join('')}
                </datalist>
              </div>

              <div class="giz-form-field">
                <label for="product-price">Fiyat</label>
                <input
                  id="product-price"
                  class="giz-input"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value="${escapeHTML(product?.price ?? 0)}"
                >
              </div>

              <div class="giz-form-field">
                <label for="product-sort">Sıralama</label>
                <input
                  id="product-sort"
                  class="giz-input"
                  name="sort_order"
                  type="number"
                  step="1"
                  value="${escapeHTML(product?.sort_order ?? 0)}"
                >
              </div>

              <div class="giz-form-field giz-form-field-full">
                <label for="product-image">Görsel URL</label>
                <input
                  id="product-image"
                  class="giz-input"
                  name="image_url"
                  type="url"
                  value="${escapeHTML(product?.image_url || '')}"
                  placeholder="https://..."
                >
              </div>

              <div class="giz-form-field giz-form-field-full">
                <label for="product-description">
                  Müşteri Menüsü Açıklaması
                </label>

                <textarea
                  id="product-description"
                  class="giz-textarea"
                  name="description"
                  placeholder="Müşterinin göreceği kısa açıklama..."
                >${escapeHTML(product?.description || '')}</textarea>
              </div>

              <div class="giz-form-field giz-form-field-full">
                <label for="product-recipe">
                  Gizli Reçete
                </label>

                <textarea
                  id="product-recipe"
                  class="giz-textarea"
                  name="recipe"
                  style="min-height:220px"
                  placeholder="Malzemeler, miktarlar, hazırlık ve servis bilgileri..."
                >${escapeHTML(product?.recipe || '')}</textarea>
              </div>

              <div class="giz-form-field giz-form-field-full">
                <label class="giz-checkbox">
                  <input
                    name="active"
                    type="checkbox"
                    ${
                      product
                        ? product.active === false
                          ? ''
                          : 'checked'
                        : 'checked'
                    }
                  >
                  Müşteri menüsünde yayınla
                </label>
              </div>
            </div>
          </div>

          <div class="giz-modal-footer">
            <button
              class="giz-btn"
              data-modal-close
              type="button"
            >
              İptal
            </button>

            <button
              class="giz-btn giz-btn-primary"
              type="submit"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal
      .querySelectorAll('[data-modal-close]')
      .forEach(button => button.addEventListener('click', closeModal));

    modal.addEventListener('click', event => {
      if (event.target === modal) closeModal();
    });

    modal
      .querySelector('#giz-product-form')
      .addEventListener('submit', event => {
        event.preventDefault();
        saveProduct(event.currentTarget);
      });

    setTimeout(() => {
      modal.querySelector('[name="name"]')?.focus();
    }, 0);
  }

  function openRecipeModal(product) {
    const modal = document.createElement('div');
    modal.className = 'giz-modal-backdrop';
    modal.id = 'giz-modal-backdrop';

    modal.innerHTML = `
      <div class="giz-modal" role="dialog" aria-modal="true">
        <div class="giz-modal-header">
          <h2>${escapeHTML(product.name)} Reçetesi</h2>

          <button
            class="giz-btn giz-btn-small"
            data-modal-close
            type="button"
          >
            ✕
          </button>
        </div>

        <div class="giz-modal-body">
          <div class="giz-recipe-box">
            ${escapeHTML(product.recipe || 'Bu ürün için reçete girilmemiş.')}
          </div>
        </div>

        <div class="giz-modal-footer">
          <button
            class="giz-btn"
            data-modal-close
            type="button"
          >
            Kapat
          </button>

          <button
            class="giz-btn giz-btn-primary"
            data-recipe-edit
            type="button"
          >
            Düzenle
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal
      .querySelectorAll('[data-modal-close]')
      .forEach(button => button.addEventListener('click', closeModal));

    modal
      .querySelector('[data-recipe-edit]')
      .addEventListener('click', () => {
        closeModal();
        openProductModal(product);
      });

    modal.addEventListener('click', event => {
      if (event.target === modal) closeModal();
    });
  }

  function closeModal() {
    document.getElementById('giz-modal-backdrop')?.remove();
    state.editingId = null;
  }

  function bindMainEvents() {
    root.querySelector('[data-action="admin-view"]')?.addEventListener(
      'click',
      () => {
        state.view = 'admin';
        render();
      }
    );

    root.querySelector('[data-action="customer-view"]')?.addEventListener(
      'click',
      () => {
        state.view = 'customer';
        render();
      }
    );

    root.querySelector('[data-action="add"]')?.addEventListener('click', () => {
      openProductModal();
    });

    root
      .querySelector('[data-action="refresh"]')
      ?.addEventListener('click', loadProducts);

    const searchInput = root.querySelector('#giz-search');

    searchInput?.addEventListener('input', event => {
      state.search = event.target.value;

      const cursorPosition = event.target.selectionStart;
      render();

      const nextInput = root.querySelector('#giz-search');
      nextInput?.focus();
      nextInput?.setSelectionRange(cursorPosition, cursorPosition);
    });

    root
      .querySelector('#giz-category-filter')
      ?.addEventListener('change', event => {
        state.selectedCategory = event.target.value;
        render();
      });

    root.querySelectorAll('[data-action="edit"]').forEach(button => {
      button.addEventListener('click', () => {
        const product = state.products.find(
          item => String(item.id) === String(button.dataset.id)
        );

        if (product) openProductModal(product);
      });
    });

    root.querySelectorAll('[data-action="recipe"]').forEach(button => {
      button.addEventListener('click', () => {
        const product = state.products.find(
          item => String(item.id) === String(button.dataset.id)
        );

        if (product) openRecipeModal(product);
      });
    });

    root.querySelectorAll('[data-action="delete"]').forEach(button => {
      button.addEventListener('click', () => {
        deleteProduct(button.dataset.id);
      });
    });

    root.querySelectorAll('[data-action="toggle"]').forEach(button => {
      button.addEventListener('click', () => {
        toggleProduct(button.dataset.id);
      });
    });
  }

  function bindKeyboardEvents() {
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closeModal();
      }

      if (
        state.view === 'admin' &&
        event.ctrlKey &&
        event.key.toLocaleLowerCase('tr-TR') === 'n'
      ) {
        event.preventDefault();
        openProductModal();
      }
    });
  }

  async function initialize() {
    injectStyles();
    createRoot();
    bindKeyboardEvents();

    try {
      supabaseClient = findSupabaseClient();
      await loadProducts();
    } catch (error) {
      console.error(error);

      root.innerHTML = `
        ${renderHeader()}

        <main class="giz-container">
          <div class="giz-error">
            ${escapeHTML(error.message)}
          </div>
        </main>
      `;
    }
  }

  window.GizGurmeCMS = {
    reload: loadProducts,
    openNewProduct: () => openProductModal(),
    showAdmin: () => {
      state.view = 'admin';
      render();
    },
    showCustomerMenu: () => {
      state.view = 'customer';
      render();
    },
    getProducts: () => [...state.products]
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
