/* main.js - JavaScript exercises for the Local Community Event Portal */

console.log('Welcome to the Community Portal');

let registrationCount = 0;
let eventSeats = 100;
let selectedEvents = [];
let allEvents = [];
let filteredEvents = [];
let formDirty = false;
let formSubmitted = false;

const API_URL = 'https://jsonplaceholder.typicode.com/posts';
const MOCK_API_DELAY = 1200;
const baseEvents = [
  { id: 1, title: 'Music Fest', category: 'music', location: 'central', date: '2026-06-20', seats: 40, description: 'Live performances and local bands.' },
  { id: 2, title: 'City Sports Day', category: 'sports', location: 'north', date: '2026-06-24', seats: 0, description: 'Community race and sports activities.' },
  { id: 3, title: 'Community Workshop', category: 'workshop', location: 'south', date: '2026-06-28', seats: 12, description: 'Learn practical local skills.' },
  { id: 4, title: 'Food Carnival', category: 'food', location: 'central', date: '2026-07-02', seats: 28, description: 'Taste food from local vendors.' }
];

class Event {
  constructor(name, seats, date, category, location, description = '') {
    this.name = name;
    this.seats = seats;
    this.date = date;
    this.category = category;
    this.location = location;
    this.description = description;
  }

  checkAvailability() {
    return this.seats > 0 ? 'Seats Available' : 'No Seats Available';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const pageLoader = document.getElementById('pageLoader');
  const spinner = document.getElementById('loadingSpinner');
  const eventsGrid = document.getElementById('eventsGrid');
  const eventsMessage = document.getElementById('eventsMessage');
  const categoryFilter = document.getElementById('categoryFilter');
  const locationFilter = document.getElementById('locationFilter');
  const searchInput = document.getElementById('searchInput');
  const loadApiEventsButton = document.getElementById('loadApiEvents');
  const regForm = document.getElementById('regForm');
  const savePrefButton = document.getElementById('savePref');
  const clearPrefButton = document.getElementById('clearPref');
  const findNearButton = document.getElementById('findNear');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('primaryNav');
  const toTop = document.getElementById('toTop');

  // Page load alert requirement
  window.addEventListener('load', () => {
    alert('Welcome to the Community Portal');
    if (pageLoader) {
      pageLoader.style.display = 'none';
    }
  });

  // Sticky nav toggle
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Smooth scrolling for internal anchors
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');
      const target = document.querySelector(targetId);
      if (!target) {
        return;
      }
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      navMenu.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Scroll-to-top button
  window.addEventListener('scroll', () => {
    if (window.scrollY > 350) {
      toTop.style.display = 'inline-flex';
    } else {
      toTop.style.display = 'none';
    }
  });
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Build event objects with constructor + Object.entries demo
  const eventObjects = baseEvents.map((eventItem) => new Event(
    eventItem.title,
    eventItem.seats,
    eventItem.date,
    eventItem.category,
    eventItem.location,
    eventItem.description,
  ));

  console.log('Event object entries sample:', Object.entries(eventObjects[0]));

  allEvents = [...eventObjects];
  selectedEvents = [...eventObjects];
  renderEvents(selectedEvents);

  // Arrays and methods: push, filter, map
  const workshopEvent = new Event('Workshop on Music', 16, '2026-07-12', 'music', 'central', 'A music learning session.');
  allEvents.push(workshopEvent);
  const musicEvents = allEvents.filter((eventItem) => eventItem.category === 'music');
  const formattedNames = musicEvents.map((eventItem) => `Workshop on ${eventItem.name.replace('Workshop on ', '')}`);
  console.log('Formatted names via map:', formattedNames);

  // Keep a copy for the initial view after the demonstration push/filter/map calls
  selectedEvents = [...allEvents];
  renderEvents(selectedEvents);

  // Filter changes
  categoryFilter.addEventListener('change', applyFilters);
  locationFilter.addEventListener('change', applyFilters);
  searchInput.addEventListener('keydown', () => {
    window.clearTimeout(window.__searchDelay);
    window.__searchDelay = window.setTimeout(applyFilters, 150);
  });

  // Event delegation for register buttons (onclick requirement)
  eventsGrid.addEventListener('click', (event) => {
    const registerButton = event.target.closest('[data-register]');
    const detailsButton = event.target.closest('[data-details]');

    if (registerButton) {
      const eventId = Number(registerButton.dataset.register);
      const selected = allEvents.find((entry) => entry.id === eventId);
      if (selected) {
        registerUser(selected);
      }
    }

    if (detailsButton) {
      const eventId = Number(detailsButton.dataset.details);
      const selected = allEvents.find((entry) => entry.id === eventId);
      if (selected) {
        alert(`${selected.title}: ${selected.description}`);
      }
    }
  });

  // Form submission and validation
  regForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    console.log('Form submission attempted');

    const formData = collectFormData();
    const errors = validateFormData(formData);

    if (errors.length > 0) {
      showFormErrors(errors);
      return;
    }

    clearFormErrors();
    await submitRegistration(formData);
    formDirty = false;
  });

  regForm.addEventListener('input', () => {
    formDirty = true;
  });

  regForm.addEventListener('reset', () => {
    clearFormErrors();
    document.getElementById('registrationOutput').textContent = '';
    updateFee();
    formDirty = false;
  });

  // Preference storage
  savePrefButton.addEventListener('click', savePreference);
  clearPrefButton.addEventListener('click', clearPreference);
  loadSavedPreference();

  // Geolocation
  findNearButton.addEventListener('click', findNearbyEvents);

  // Double-click image enlargement
  document.querySelectorAll('.gallery-item img').forEach((image) => {
    image.addEventListener('dblclick', () => enlargeImage(image));
  });

  // Feedback button
  document.getElementById('fbSubmit').addEventListener('click', submitFeedback);

  // Try/catch demo for upcoming events display
  try {
    renderEvents(selectedEvents);
  } catch (error) {
    console.error('Error rendering events', error);
    eventsMessage.textContent = 'Something went wrong while loading events.';
  }

  // Async load from API (fetch then/catch, plus async/await)
  loadApiEventsButton.addEventListener('click', () => {
    loadApiEvents();
  });

  // jQuery demo hook
  setupJQueryDemo();

  // Initialize fee
  updateFee();

  // Debug notes
  console.log('Community portal initialized with', allEvents.length, 'events');
});

function renderEvents(events = []) {
  const eventsGrid = document.getElementById('eventsGrid');
  const eventsMessage = document.getElementById('eventsMessage');
  const today = new Date().toISOString().slice(0, 10);

  eventsGrid.innerHTML = '';
  filteredEvents = [...events];

  if (events.length === 0) {
    eventsMessage.textContent = 'No events match your search criteria.';
    return;
  }

  eventsMessage.textContent = '';

  events.forEach((eventItem) => {
    try {
      const eventDateOkay = eventItem.date >= today;
      const hasSeats = eventItem.seats > 0;
      const displayTitle = eventItem.title || eventItem.name || 'Untitled Event';

      if (!eventDateOkay || !hasSeats) {
        const emptyCard = document.createElement('article');
        emptyCard.className = 'event-card event-card--muted';
        emptyCard.innerHTML = `
          <h3>${displayTitle}</h3>
          <p>${eventItem.description}</p>
          <p><strong>${hasSeats ? '' : 'No Seats Available'}</strong></p>
        `;
        eventsGrid.appendChild(emptyCard);
        return;
      }

      const card = document.createElement('article');
      card.className = 'event-card section-reveal';
      card.dataset.category = eventItem.category;
      card.dataset.location = eventItem.location;
      card.dataset.title = displayTitle.toLowerCase();

      card.innerHTML = `
        <div class="event-card__badge">${eventItem.category}</div>
        <h3>${displayTitle}</h3>
        <p>${eventItem.description}</p>
        <p><strong>Date:</strong> ${eventItem.date}</p>
        <p><strong>Seats:</strong> <span class="seat-count">${eventItem.seats}</span></p>
        <p><strong>Status:</strong> ${eventItem.checkAvailability()}</p>
        <div class="event-card__actions">
          <button type="button" class="btn btn--primary" data-register="${eventItem.id}">Register</button>
          <button type="button" class="btn btn--ghost" data-details="${eventItem.id}">View Details</button>
        </div>
      `;

      eventsGrid.appendChild(card);
    } catch (error) {
      console.error('Error while rendering an event card:', error);
    }
  });
}

function applyFilters() {
  const category = document.getElementById('categoryFilter').value;
  const location = document.getElementById('locationFilter').value;
  const query = document.getElementById('searchInput').value.trim().toLowerCase();

  try {
    const filtered = allEvents.filter((eventItem) => {
      const categoryMatch = category === 'all' || eventItem.category === category;
      const locationMatch = location === 'all' || eventItem.location === location;
      const queryMatch = !query || eventItem.title.toLowerCase().includes(query) || eventItem.category.toLowerCase().includes(query);
      return categoryMatch && locationMatch && queryMatch;
    });

    renderEvents(filtered);
  } catch (error) {
    console.error('Filter error', error);
    document.getElementById('eventsMessage').textContent = 'Could not filter events right now.';
  }
}

function addEvent(eventData = {}) {
  const {
    title = 'Untitled Event',
    seats = 0,
    date = '2026-01-01',
    category = 'general',
    location = 'central',
    description = 'Community event details are pending.',
  } = eventData;

  const newEvent = new Event(title, seats, date, category, location, description);
  allEvents = [...allEvents, newEvent];
  console.log('Event added using default parameters and destructuring:', newEvent);
  renderEvents(allEvents);
}

function registerUser(eventItem, callback) {
  const onRegister = callback || (() => {
    alert(`Registered for ${eventItem.name || eventItem.title}`);
  });

  const closureCounter = createRegistrationCounter(eventItem.category);
  closureCounter.increment();
  closureCounter.increment();
  console.log(`Registrations for ${eventItem.category}: ${closureCounter.getCount()}`);

  if (eventSeats > 0) {
    eventSeats--;
  }
  registrationCount++;
  onRegister(eventItem);
  console.log('Registration count:', registrationCount, 'Remaining seats:', eventSeats);

  const registrationOutput = document.getElementById('registrationOutput');
  registrationOutput.textContent = `Successfully registered for ${eventItem.title || eventItem.name}.`;
}

function createRegistrationCounter(category) {
  let count = 0;
  return {
    increment() {
      count++;
      return count;
    },
    getCount() {
      return count;
    },
    category,
  };
}

function filterEventsByCategory(category, callback) {
  const filterFn = callback || ((entry) => entry.category === category);
  return allEvents.filter(filterFn);
}

function collectFormData() {
  const formData = {
    name: document.getElementById('fullName').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    date: document.getElementById('eventDate').value,
    eventType: document.getElementById('eventType').value,
    participants: Number(document.getElementById('participants').value),
    address: document.getElementById('address').value.trim(),
    comments: document.getElementById('comments').value.trim(),
  };

  console.log('Captured form data:', formData);
  return formData;
}

function validateFormData(formData) {
  const errors = [];
  if (!formData.name) errors.push('Name is required.');
  if (!formData.email || !formData.email.includes('@')) errors.push('A valid email is required.');
  if (!formData.phone || !/^[6-9]\d{9}$/.test(formData.phone)) errors.push('Phone number must be a valid 10-digit number.');
  if (!formData.eventType) errors.push('Select an event type.');
  if (!formData.date) errors.push('Choose an event date.');
  if (!formData.address) errors.push('Address is required.');
  return errors;
}

function showFormErrors(errors) {
  const registrationOutput = document.getElementById('registrationOutput');
  registrationOutput.innerHTML = errors.map((message) => `<div class="inline-error">${message}</div>`).join('');
}

function clearFormErrors() {
  document.getElementById('registrationOutput').textContent = '';
}

function updateFee() {
  const eventType = document.getElementById('eventType').value;
  let fee = 0;

  if (eventType === 'Music') {
    fee = 100;
  } else if (eventType === 'Sports') {
    fee = 150;
  } else if (eventType === 'Workshop') {
    fee = 200;
  } else if (eventType === 'Food Festival') {
    fee = 120;
  }

  document.getElementById('feeOutput').textContent = `₹${fee}`;
  console.log(`Fee updated for ${eventType}: ${fee}`);
}

function validatePhone() {
  const phoneInput = document.getElementById('phone');
  const value = phoneInput.value.trim();

  if (!value) {
    return;
  }

  if (!/^[6-9]\d{9}$/.test(value)) {
    phoneInput.setCustomValidity('Enter a valid 10-digit phone number.');
    phoneInput.reportValidity();
  } else {
    phoneInput.setCustomValidity('');
  }
}

function submitFeedback() {
  const feedback = document.getElementById('fbText').value.trim();
  const rating = document.getElementById('rating').value;

  if (!feedback || !rating) {
    alert('Please complete the rating and feedback before submitting.');
    return;
  }

  console.log('Feedback submitted:', { rating, feedback });
  document.getElementById('fbText').value = '';
  document.getElementById('rating').value = '';
  document.getElementById('charCount').textContent = '0';
  document.getElementById('selectedRating').textContent = 'Rating: -';
  alert(`Thank you for your feedback! Selected rating: ${rating}`);
}

function updateCharCount() {
  const feedback = document.getElementById('fbText').value;
  const characterCount = feedback.length;
  document.getElementById('charCount').textContent = characterCount;
}

function displayRating() {
  const rating = document.getElementById('rating').value || '-';
  document.getElementById('selectedRating').textContent = `Rating: ${rating}`;
}

function enlargeImage(image) {
  const modal = document.getElementById('imgModal');
  const modalImage = document.getElementById('modalImg');
  const modalCaption = document.getElementById('modalCaption');

  modalImage.src = image.src;
  modalCaption.textContent = image.dataset.caption || image.title || image.alt;
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
}

function closeImageModal() {
  const modal = document.getElementById('imgModal');
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
}

document.getElementById('modalClose').addEventListener('click', closeImageModal);
document.getElementById('imgModal').addEventListener('click', (event) => {
  if (event.target.id === 'imgModal') {
    closeImageModal();
  }
});

function videoReady() {
  document.getElementById('videoMsg').textContent = 'Video ready to play';
  console.log('Video load event: video ready');
}

function savePreference() {
  const prefEvent = document.getElementById('prefEvent').value;
  if (!prefEvent) {
    alert('Select an event preference first.');
    return;
  }

  localStorage.setItem('preferredEvent', prefEvent);
  sessionStorage.setItem('preferredEventSession', prefEvent);
  document.getElementById('prefMsg').textContent = 'Your preferred event has been saved.';
  console.log('Preference saving:', prefEvent);
}

function loadSavedPreference() {
  const savedPref = localStorage.getItem('preferredEvent') || sessionStorage.getItem('preferredEventSession');
  if (savedPref) {
    document.getElementById('prefEvent').value = savedPref;
    document.getElementById('prefMsg').textContent = 'Your preferred event has been loaded.';
  }
}

function clearPreference() {
  localStorage.removeItem('preferredEvent');
  sessionStorage.removeItem('preferredEventSession');
  document.getElementById('prefEvent').value = '';
  document.getElementById('prefMsg').textContent = 'Preferences cleared.';
}

function findNearbyEvents() {
  const output = document.getElementById('latlon');
  console.log('Location fetch started');

  if (!navigator.geolocation) {
    output.textContent = 'Geolocation not supported';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      output.textContent = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      console.log('Location fetch success', position.coords);
    },
    (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        output.textContent = 'Permission denied';
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        output.textContent = 'Location unavailable';
      } else if (error.code === error.TIMEOUT) {
        output.textContent = 'Location timeout';
      } else {
        output.textContent = 'Unable to fetch location';
      }
      console.log('Location fetch error', error);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
  );
}

async function loadApiEvents() {
  const spinner = document.getElementById('loadingSpinner');
  const message = document.getElementById('eventsMessage');
  spinner.hidden = false;
  message.textContent = 'Loading event data from API...';

  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    // Convert the returned API posts into portal event cards
    const apiEvents = data.slice(0, 4).map((item, index) => ({
      id: 100 + index,
      title: item.title.slice(0, 25),
      category: index % 2 === 0 ? 'music' : 'workshop',
      location: index % 2 === 0 ? 'central' : 'north',
      date: '2026-07-15',
      seats: 8 + index,
      description: item.body.slice(0, 80),
    }));

    setTimeout(() => {
      allEvents = [...apiEvents, ...baseEvents.map((eventItem) => ({ ...eventItem }))];
      renderEvents(allEvents);
      message.textContent = 'API events loaded successfully.';
      spinner.hidden = true;
    }, MOCK_API_DELAY);
  } catch (error) {
    console.log('API fetch failed', error);
    message.textContent = 'API request failed. Showing local events instead.';
    renderEvents(allEvents);
    spinner.hidden = true;
  }
}

async function submitRegistration(formData) {
  const output = document.getElementById('registrationOutput');
  output.textContent = 'Submitting registration...';

  const payload = {
    ...formData,
    id: Date.now(),
  };

  console.log('Submitting registration payload', payload);

  // Simulate backend delay using setTimeout as requested
  await new Promise((resolve) => setTimeout(resolve, MOCK_API_DELAY));

  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    output.textContent = `Registration successful! Reference ID: ${result.id || payload.id}`;
    alert('Registration submitted successfully!');
    formSubmitted = true;
    console.log('API response for form submission', result);
  } catch (error) {
    output.textContent = 'Registration saved locally, but server submission failed.';
    console.log('Registration submission failed', error);
    alert('Registration completed locally. Server submission failed.');
  }
}

function setupJQueryDemo() {
  if (!window.jQuery) {
    return;
  }

  const $ = window.jQuery;
  const cards = $('.event-card');
  const demoButton = $('<button class="btn btn--ghost" type="button" style="margin:1rem 0;">Fade Event Cards</button>');
  $('.section-heading').first().append(demoButton);

  demoButton.on('click', function onDemoClick() {
    cards.fadeOut(180).fadeIn(180);
  });

  // click() use example
  demoButton.click(() => console.log('jQuery click() demo triggered'));
}

function submitFeedback() {
  const feedback = document.getElementById('fbText').value.trim();
  const rating = document.getElementById('rating').value;

  if (!feedback || !rating) {
    alert('Please complete the rating and feedback before submitting.');
    return;
  }

  console.log('Feedback submitted:', { rating, feedback });
  document.getElementById('fbText').value = '';
  document.getElementById('rating').value = '';
  document.getElementById('charCount').textContent = '0';
  document.getElementById('selectedRating').textContent = 'Rating: -';
  alert(`Thank you for your feedback! Selected rating: ${rating}`);
}

// Additional public helpers for console testing and debugging
window.addEvent = addEvent;
window.registerUser = registerUser;
window.filterEventsByCategory = filterEventsByCategory;
window.updateFee = updateFee;
window.validatePhone = validatePhone;
window.displayRating = displayRating;
window.updateCharCount = updateCharCount;
window.validateFeedback = function validateFeedback() {
  const feedback = document.getElementById('fbText').value.trim();
  if (feedback.length > 500) {
    alert('Feedback must be 500 characters or less.');
  }
};
window.videoReady = videoReady;

// Warn users before leaving if the form was not submitted
window.onbeforeunload = function onBeforeUnload(event) {
  if (formDirty && !formSubmitted) {
    const warning = 'You have unsaved registration changes.';
    event.returnValue = warning;
    return warning;
  }
  return undefined;
};
