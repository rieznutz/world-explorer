class CountryAPI {
  static base = 'https://restcountries.com/v3.1';

  static async searchByName(name) {
    const url = `${this.base}/name/${encodeURIComponent(name)}?fullText=true`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Not found (${res.status})`);
    const data = await res.json();
    return data[0];
  }
}

class ItineraryManager {
  constructor(key = 'we_itineraries') {
    this.key = key;
  }
  list() {
    try {
      return JSON.parse(localStorage.getItem(this.key)) || [];
    } catch {
      return [];
    }
  }
  save(item) {
    const list = this.list();
    list.push(item);
    localStorage.setItem(this.key, JSON.stringify(list));
  }
}

class UIHandler {
  constructor() {
    this.inputName = document.getElementById('inputName');
    this.btnSearch = document.getElementById('btnSearch');
    this.goItinerary = document.getElementById('goItinerary');
    this.result = document.getElementById('result');
    this.errorBox = document.getElementById('error');

    this.flagImg = document.getElementById('flag');
    this.countryName = document.getElementById('countryName');
    this.capital = document.getElementById('capital');
    this.continent = document.getElementById('continent');
    this.areaEl = document.getElementById('area');
    this.timezones = document.getElementById('timezones');
    this.languages = document.getElementById('languages');
    this.regionBadge = document.getElementById('regionBadge');
    this.populationBadge = document.getElementById('populationBadge');
    this.mapsLink = document.getElementById('mapsLink');
    this.saveItinerary = document.getElementById('saveItinerary');

    this.lastCountry = null;
    this.itinerary = new ItineraryManager();

    this.bindEvents();
    this.hideResult();
    this.hideError();
  }

  bindEvents() {
    this.btnSearch.addEventListener('click', () => this.onSearch());
    this.inputName.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.onSearch();
    });
    this.goItinerary.addEventListener('click', () => {
      window.location = 'itinerary.html';
    });
    this.saveItinerary.addEventListener('click', () => this.onSaveToItinerary());
  }

  showError(msg) {
    this.errorBox.textContent = msg;
    this.errorBox.style.display = 'block';
    this.errorBox.style.background = 'rgba(239,68,68,0.1)';
    this.errorBox.style.color = '#ef4444';
    this.hideResult();
  }

  hideError() {
    this.errorBox.style.display = 'none';
    this.errorBox.textContent = '';
  }

  showResult() {
    this.result.style.display = 'flex';
    this.result.style.opacity = '1';
  }

  hideResult() {
    this.result.style.display = 'none';
    this.result.style.opacity = '0';
  }

  async onSearch() {
    const name = this.inputName.value.trim();
    if (!name) {
      this.showError('Please enter a country name.');
      return;
    }
    this.hideError();
    this.hideResult();

    try {
      const country = await CountryAPI.searchByName(name);
      this.renderCountry(country);
    } catch (err) {
      console.error(err);
      this.showError('Country not found. Please check spelling and try again.');
    }
  }

  renderCountry(country) {
    const common = country?.name?.common || '';
    const flag = country?.flags?.png || country?.flags?.svg || '';
    const capital = (country?.capital && country.capital[0]) || '—';
    const region = country?.region || '—';
    const continent = (country?.continents && country.continents[0]) || '—';
    const population = country?.population?.toLocaleString() || '—';
    const area = country?.area?.toLocaleString() || '—';
    const tz = (country?.timezones || []).join(', ') || '—';
    const langs = country?.languages ? Object.values(country.languages).join(', ') : '—';
    const maps = country?.maps?.googleMaps || country?.maps?.openStreetMaps || '#';

    this.flagImg.src = flag;
    this.flagImg.alt = `${common} flag`;
    this.countryName.textContent = common;
    this.capital.textContent = capital;
    this.continent.textContent = continent;
    this.areaEl.textContent = area;
    this.timezones.textContent = tz;
    this.languages.textContent = langs;
    this.regionBadge.textContent = region;
    this.populationBadge.textContent = `Population: ${population}`;
    this.mapsLink.href = maps;

    this.lastCountry = {
      id: Date.now(),
      country: common,
      capital,
      region,
      population: country?.population || 0,
      flag,
      maps,
      note: '',
      date: '',
      status: 'Planned'
    };

    this.showResult();
  }

  onSaveToItinerary() {
    if (!this.lastCountry || !this.lastCountry.country) {
      this.showError('No country selected. Please search first.');
      return;
    }
    const item = { ...this.lastCountry, id: Date.now() };
    this.itinerary.save(item);
    this.showFlash('Saved to itinerary ✓', 'success');
  }

  showFlash(msg, type = 'success') {
    const color = type === 'success' ? '#16a34a' : '#dc2626';
    this.errorBox.textContent = msg;
    this.errorBox.style.display = 'block';
    this.errorBox.style.background = 'rgba(22,163,74,0.1)';
    this.errorBox.style.color = color;

    setTimeout(() => this.hideError(), 1800);
  }
}

// init
document.addEventListener('DOMContentLoaded', () => {
  new UIHandler();
});
