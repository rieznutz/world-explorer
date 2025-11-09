//OOP CRUD + UI interactions
class ItineraryManager {
  constructor(storageKey = 'we_itineraries') {
    this.key = storageKey;
  }

  list() {
    try {
      return JSON.parse(localStorage.getItem(this.key) || '[]');
    } catch {
      return [];
    }
  }

  add(item) {
    const list = this.list();
    list.push(item);
    localStorage.setItem(this.key, JSON.stringify(list));
  }

  update(id, patch) {
    const list = this.list().map(i => (i.id === id ? { ...i, ...patch } : i));
    localStorage.setItem(this.key, JSON.stringify(list));
  }

  delete(id) {
    const list = this.list().filter(i => i.id !== id);
    localStorage.setItem(this.key, JSON.stringify(list));
  }

  clearAll() {
    localStorage.removeItem(this.key);
  }
}

// Modal Utility (universal)
class Modal {
  static show(message, options = {}) {
    return new Promise((resolve) => {
      const type = options.type || 'alert'; // alert | confirm | info
      const popup = document.createElement('div');
      popup.innerHTML = `
        <div style="
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999;">
          <div style="
            background: #fff; padding: 20px; border-radius: 10px;
            width: 320px; text-align: center; box-shadow: 0 0 10px rgba(0,0,0,0.3);">
            <p style="margin-bottom: 20px;">${message}</p>
            <div style="display: flex; justify-content: center; gap: 10px;">
              ${
                type === 'confirm'
                  ? `
                    <button id="modalCancel" style="padding:5px 10px;">Cancel</button>
                    <button id="modalOk" style="padding:5px 10px;background:#007bff;color:white;border:none;border-radius:4px;">OK</button>
                    `
                  : `<button id="modalOk" style="padding:5px 10px;background:#007bff;color:white;border:none;border-radius:4px;">OK</button>`
              }
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(popup);

      const okBtn = popup.querySelector('#modalOk');
      const cancelBtn = popup.querySelector('#modalCancel');

      okBtn.onclick = () => {
        popup.remove();
        resolve(true);
      };
      if (cancelBtn) {
        cancelBtn.onclick = () => {
          popup.remove();
          resolve(false);
        };
      }
    });
  }
}

class ItineraryUI {
  constructor() {

    this.listArea = document.getElementById('listArea');
    this.backHome = document.getElementById('backHome');
    this.manualCountry = document.getElementById('manualCountry');
    this.manualDate = document.getElementById('manualDate');
    this.manualStatus = document.getElementById('manualStatus');
    this.manualNote = document.getElementById('manualNote');
    this.manualAdd = document.getElementById('manualAdd');
    this.clearAllBtn = document.getElementById('clearAll');

    this.manager = new ItineraryManager();
    this.attach();
    this.load();
  }

  attach() {
    this.backHome.addEventListener('click', () => (window.location = 'index.html'));
    this.manualAdd.addEventListener('click', () => this.onManualAdd());
    this.clearAllBtn.addEventListener('click', () => this.onClearAll());

    this.listArea.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const id = Number(btn.dataset.id);
      if (btn.classList.contains('delete')) this.onDelete(id);
      if (btn.classList.contains('edit')) this.onEdit(id);
      if (btn.classList.contains('open')) this.onOpen(id);
      if (btn.classList.contains('openMaps')) this.onOpenMaps(id);
    });
  }

  load() {
    const list = this.manager.list();
    this.renderList(list);
  }

  renderList(list) {
    if (!list.length) {
      this.listArea.innerHTML = `<p class="muted">No itineraries yet. Save from Search or add manually.</p>`;
      return;
    }

    this.listArea.innerHTML = '';
    list.forEach(item => {
      const wrapper = document.createElement('div');
      wrapper.className = 'it-item';
      wrapper.innerHTML = `
        <div class="it-left">
          <img src="${item.flag || 'https://via.placeholder.com/80x50?text=No+Flag'}" alt="${item.country} flag" />
        </div>
        <div class="it-mid">
          <h3>${item.country}</h3>
          <p><strong>Capital:</strong> ${item.capital || '-'}</p>
          <p><strong>Date:</strong> <span class="date">${item.date || '-'}</span></p>
          <p><strong>Status:</strong> <span class="status">${item.status || '-'}</span></p>
          <p class="note"><strong>Note:</strong> ${item.note || '-'}</p>
        </div>
        <div class="it-right">
          <button class="btn edit" data-id="${item.id}">Edit</button>
          <button class="btn open" data-id="${item.id}">Open</button>
          <button class="btn danger delete" data-id="${item.id}">Delete</button>
          <button class="btn openMaps" data-id="${item.id}">Maps</button>
        </div>
      `;
      this.listArea.appendChild(wrapper);
    });
  }

  // Manual Add + Fetch Country Info
  async onManualAdd() {
    const country = this.manualCountry.value.trim();
    if (!country) return Modal.show('Enter country name.');

    let flag = '', capital = '', region = '', maps = '';
    try {
      const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(country)}?fullText=true`);
      if (res.ok) {
        const data = await res.json();
        const info = data[0];
        flag = info.flags?.png || '';
        capital = info.capital?.[0] || '';
        region = info.region || '';
        maps = info.maps?.googleMaps || '';
      }
    } catch (err) {
      console.warn('Could not fetch country info:', err);
    }

    const item = {
      id: Date.now(),
      country,
      capital,
      region,
      population: 0,
      flag,
      maps,
      note: this.manualNote.value.trim(),
      date: this.manualDate.value || '',
      status: this.manualStatus.value || 'Planned'
    };

    this.manager.add(item);
    this.manualCountry.value = '';
    this.manualDate.value = '';
    this.manualNote.value = '';
    this.load();
    Modal.show('Itinerary added successfully!');
  }

  async onDelete(id) {
    const confirmDelete = await Modal.show('Delete this itinerary?', { type: 'confirm' });
    if (!confirmDelete) return;
    this.manager.delete(id);
    this.load();
    Modal.show('Deleted successfully.');
  }

  onEdit(id) {
    const list = this.manager.list();
    const item = list.find(i => i.id === id);
    if (!item) return Modal.show('Item not found.');

    const popup = document.createElement('div');
    popup.innerHTML = `
      <div style="
        position: fixed; inset: 0; background: rgba(0,0,0,0.6);
        display: flex; align-items: center; justify-content: center; z-index: 9999;">
        <div style="
          background: white; padding: 20px; border-radius: 10px; width: 320px;
          box-shadow: 0 0 10px rgba(0,0,0,0.3);">
          <h3>Edit Itinerary</h3>
          <label>Date:</label>
          <input id="editDate" type="date" value="${item.date || ''}" style="width:100%;margin-bottom:10px;">
          <label>Status:</label>
          <select id="editStatus" style="width:100%;margin-bottom:10px;">
            <option ${item.status === 'Planned' ? 'selected' : ''}>Planned</option>
            <option ${item.status === 'Booked' ? 'selected' : ''}>Booked</option>
            <option ${item.status === 'Completed' ? 'selected' : ''}>Completed</option>
          </select>
          <label>Note:</label>
          <textarea id="editNote" style="width:100%;height:60px;margin-bottom:10px;">${item.note || ''}</textarea>
          <div style="display:flex;justify-content:flex-end;gap:10px;">
            <button id="cancelEdit">Cancel</button>
            <button id="saveEdit" style="background:#007bff;color:white;border:none;padding:5px 10px;border-radius:4px;">Save</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(popup);

    popup.querySelector('#cancelEdit').onclick = () => popup.remove();
    popup.querySelector('#saveEdit').onclick = () => {
      const newDate = popup.querySelector('#editDate').value;
      const newStatus = popup.querySelector('#editStatus').value;
      const newNote = popup.querySelector('#editNote').value;

      this.manager.update(id, { date: newDate, status: newStatus, note: newNote });
      this.load();
      popup.remove();
      Modal.show('Changes saved.');
    };
  }

  onOpen(id) {
    const list = this.manager.list();
    const item = list.find(i => i.id === id);
    if (!item) return Modal.show('Item not found.');
    Modal.show(`
      📍 <b>${item.country}</b><br>
      🗓️ ${item.date || '-'}<br>
      📌 ${item.status || '-'}<br>
      📝 ${item.note || '-'}
    `);
  }

  async onClearAll() {
    const confirmClear = await Modal.show('Clear ALL itineraries?', { type: 'confirm' });
    if (!confirmClear) return;
    this.manager.clearAll();
    this.load();
    Modal.show('All itineraries cleared.');
  }

  onOpenMaps(id) {
    const list = this.manager.list();
    const item = list.find(i => i.id === id);
    if (!item || !item.maps) return Modal.show('No maps link saved for this itinerary.');
    window.open(item.maps, '_blank', 'noopener');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.itUI = new ItineraryUI();
});
