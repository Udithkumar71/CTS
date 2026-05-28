/* script.js - Interactive behaviors for Local Community Event Portal */

// Debug logs for key events
console.log('Script loaded: initializing portal scripts');

let formSubmitted = false; // track registration submission for onbeforeunload

document.addEventListener('DOMContentLoaded', () => {
  // Preloader
  const pre = document.getElementById('preloader');
  setTimeout(()=>{ pre.style.display='none' }, 600);

  // Year in footer
  document.getElementById('curYear').textContent = new Date().getFullYear();

  // Nav toggle
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  navToggle.addEventListener('click', ()=> navLinks.classList.toggle('show'));

  // Smooth scroll for nav links
  document.querySelectorAll('.nav-link').forEach(a=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if(target) target.scrollIntoView({behavior:'smooth', block:'start'});
      if(navLinks.classList.contains('show')) navLinks.classList.remove('show');
    })
  })

  // To-top button
  const toTop = document.getElementById('toTop');
  window.addEventListener('scroll', ()=>{
    if(window.scrollY>300) toTop.style.display='block'; else toTop.style.display='none';
  });
  toTop.addEventListener('click', ()=> window.scrollTo({top:0,behavior:'smooth'}));

  // Gallery double-click to enlarge
  document.querySelectorAll('.gallery-item img').forEach(img=>{
    img.addEventListener('dblclick', ()=> openImageModal(img));
  });
  document.getElementById('modalClose').addEventListener('click', closeModal);

  // Registration form handlers
  const regForm = document.getElementById('regForm');
  regForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    // Basic validation
    const name = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const eventType = document.getElementById('eventType').value;
    if(!name || !email || !phone || !eventType){
      alert('Please complete required fields before submitting.');
      return;
    }
    // Calculate fee
    const feeText = document.getElementById('feeOutput').textContent;
    // Show confirmation in output and alert
    const out = document.getElementById('feeOutput');
    out.textContent = out.textContent + ' (Confirmed)';
    alert('Registration received. Thank you!');
    formSubmitted = true;
    console.log('Form submitted:', {name,email,phone,eventType,fee:feeText});
    regForm.reset();
    // reset fee
    document.getElementById('feeOutput').textContent = '₹0';
  });

  // Feedback submit
  document.getElementById('fbSubmit').addEventListener('click',(e)=>{
    e.preventDefault();
    const fb = document.getElementById('fbText').value.trim();
    const rating = document.getElementById('rating').value;
    if(!fb || !rating){ alert('Please provide feedback and rating.'); return }
    alert('Thank you for your feedback!');
    document.getElementById('fbText').value='';
    document.getElementById('charCount').textContent='0';
    document.getElementById('selectedRating').textContent = 'Rating: -';
    console.log('Feedback submitted', {rating, feedback:fb});
  });

  // Preferences: load saved
  loadPreferences();
  document.getElementById('savePref').addEventListener('click', savePreference);
  document.getElementById('clearPref').addEventListener('click', clearPreference);

  // Geolocation
  document.getElementById('findNear').addEventListener('click', ()=>{
    const status = document.getElementById('latlon');
    if(!navigator.geolocation){ status.textContent='Geolocation not supported'; return }
    status.textContent='Locating...';
    navigator.geolocation.getCurrentPosition((pos)=>{
      const lat = pos.coords.latitude.toFixed(5);
      const lon = pos.coords.longitude.toFixed(5);
      status.textContent = `${lat}, ${lon}`;
      console.log('Location fetched', pos.coords);
    }, (err)=>{
      console.log('Location error', err);
      if(err.code===1) status.textContent='Permission denied';
      else if(err.code===2) status.textContent='Position unavailable';
      else if(err.code===3) status.textContent='Timeout';
      else status.textContent='Error fetching location';
    }, {enableHighAccuracy:true, timeout:10000});
  });

  // Reveal animation using IntersectionObserver
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{ if(entry.isIntersecting) entry.target.classList.add('fade-in'); });
  }, {threshold:0.15});
  document.querySelectorAll('.section, .card').forEach(el=> obs.observe(el));
});

/* Phone validation onblur */
function validatePhone(){
  const phone = document.getElementById('phone').value.trim();
  const pattern = /^[6-9]\d{9}$/; // simple Indian phone check
  if(phone && !pattern.test(phone)){
    alert('Please enter a valid 10-digit phone number starting with 6-9.');
    console.log('Phone validation failed:', phone);
    return false;
  }
  console.log('Phone validated:', phone);
  return true;
}

/* Fee update on event type change */
function updateFee(){
  const type = document.getElementById('eventType').value;
  let fee = 0;
  switch(type){
    case 'Music': fee=100; break;
    case 'Sports': fee=150; break;
    case 'Workshop': fee=200; break;
    case 'Food Festival': fee=120; break;
    default: fee=0;
  }
  document.getElementById('feeOutput').textContent = fee?`₹${fee}`:'₹0';
  console.log('Fee updated for', type, fee);
}

/* Feedback helpers */
function updateCharCount(){
  const text = document.getElementById('fbText').value;
  const len = text.length;
  document.getElementById('charCount').textContent = len;
  if(len>500) document.getElementById('charCount').style.color='red'; else document.getElementById('charCount').style.color='';
}
function displayRating(){
  const r = document.getElementById('rating').value;
  document.getElementById('selectedRating').textContent = 'Rating: ' + (r || '-');
}
function validateFeedback(){
  const text = document.getElementById('fbText').value.trim();
  if(text.length>500) alert('Feedback too long (max 500 chars)');
}

/* Image modal */
function openImageModal(img){
  const modal = document.getElementById('imgModal');
  document.getElementById('modalImg').src = img.src;
  document.getElementById('modalCaption').textContent = img.dataset.caption || img.title || img.alt;
  modal.style.display='flex'; modal.setAttribute('aria-hidden','false');
  console.log('Opened image modal for', img.src);
}
function closeModal(){
  const modal = document.getElementById('imgModal');
  modal.style.display='none'; modal.setAttribute('aria-hidden','true');
  document.getElementById('modalImg').src='';
}

/* Video ready handler */
function videoReady(){
  document.getElementById('videoMsg').textContent = 'Video ready to play';
  console.log('Video canplay event fired');
}

/* Preferences using localStorage and sessionStorage */
function savePreference(){
  const pref = document.getElementById('prefEvent').value;
  if(!pref){ alert('Select a preference first'); return }
  localStorage.setItem('preferredEvent', pref);
  sessionStorage.setItem('preferredEventSession', pref);
  document.getElementById('prefMsg').textContent = 'Your preferred event has been saved.';
  console.log('Preference saved', pref);
}
function loadPreferences(){
  const saved = localStorage.getItem('preferredEvent') || sessionStorage.getItem('preferredEventSession');
  if(saved){
    document.getElementById('prefEvent').value = saved;
    document.getElementById('prefMsg').textContent = 'Your preferred event has been loaded.';
    console.log('Loaded preference', saved);
  }
}
function clearPreference(){
  localStorage.removeItem('preferredEvent');
  sessionStorage.removeItem('preferredEventSession');
  document.getElementById('prefEvent').value='';
  document.getElementById('prefMsg').textContent = 'Preferences cleared.';
  console.log('Preferences cleared');
}

/* Warn user before leaving if form not submitted */
window.onbeforeunload = function(e){
  if(!formSubmitted){
    const msg = 'You have unsaved changes. Are you sure you want to leave?';
    (e || window.event).returnValue = msg; // legacy
    return msg;
  }
}

/* Console logs for debugging on load */
console.log('Portal scripts initialized');
