/* Community Event Portal interactivity and form logic. */

let formSubmitted = false;

const feeMap = {
    Music: 100,
    Sports: 150,
    Workshop: 200,
    "Food Festival": 120,
};

function updateFeeDisplay() {
    const eventType = document.getElementById('eventType').value;
    const fee = feeMap[eventType] || 0;
    document.getElementById('feeOutput').textContent = `₹${fee}`;
}

function validatePhoneField() {
    const phoneInput = document.getElementById('phone');
    const phoneFeedback = document.getElementById('phoneFeedback');
    const value = phoneInput.value.trim();
    const phonePattern = /^[0-9]{10}$/;

    if (!value) {
        phoneFeedback.textContent = 'Phone number is required.';
        phoneInput.setCustomValidity('Phone number is required.');
        return false;
    }

    if (!phonePattern.test(value)) {
        phoneFeedback.textContent = 'Enter a valid 10-digit phone number.';
        phoneInput.setCustomValidity('Enter a valid 10-digit phone number.');
        console.log('Phone validation failed');
        return false;
    }

    phoneFeedback.textContent = 'Phone number looks valid.';
    phoneInput.setCustomValidity('');
    return true;
}

function handleEventTypeChange() {
    updateFeeDisplay();
    const selectedType = document.getElementById('eventType').value;
    sessionStorage.setItem('latestEventType', selectedType);
    console.log('Event type changed:', selectedType);
}

function updateCharacterCount() {
    const feedbackText = document.getElementById('feedbackText').value;
    document.getElementById('characterCount').textContent = feedbackText.length;
}

function updateRatingPreview() {
    const rating = document.getElementById('ratingSelect').value;
    document.getElementById('ratingPreview').textContent = rating ? `Selected rating: ${rating}` : 'No rating selected yet.';
    document.getElementById('ratingPreview').dataset.rating = rating;
}

function validateFeedbackFields() {
    const rating = document.getElementById('ratingSelect').value;
    const message = document.getElementById('feedbackText').value.trim();
    if (!rating || !message) {
        document.getElementById('feedbackOutput').textContent = 'Please choose a rating and enter feedback.';
        return false;
    }
    document.getElementById('feedbackOutput').textContent = '';
    return true;
}

function submitFeedback() {
    console.log('Feedback submit clicked');
    if (!validateFeedbackFields()) {
        return;
    }

    const rating = document.getElementById('ratingSelect').value;
    document.getElementById('feedbackOutput').textContent = `Thank you for your ${rating.toLowerCase()} feedback.`;
    alert('Thank you for your feedback!');
}

function videoReadyMessage() {
    document.getElementById('videoStatus').textContent = 'Video ready to play';
    console.log('Video load complete');
}

function setupPromoVideo() {
    const video = document.getElementById('promoVideo');
    const status = document.getElementById('videoStatus');

    if (!('captureStream' in HTMLCanvasElement.prototype) || typeof MediaRecorder === 'undefined') {
        status.textContent = 'Video preview is not supported in this browser.';
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 540;
    const context = canvas.getContext('2d');
    const stream = canvas.captureStream(24);
    const options = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? { mimeType: 'video/webm;codecs=vp9' }
        : { mimeType: 'video/webm;codecs=vp8' };

    const recordedChunks = [];
    const recorder = new MediaRecorder(stream, options);

    recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    recorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: recorder.mimeType });
        video.src = URL.createObjectURL(blob);
        video.load();
    };

    function drawFrame(timestamp) {
        const progress = (timestamp % 4000) / 4000;
        context.clearRect(0, 0, canvas.width, canvas.height);

        const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#0a4ea3');
        gradient.addColorStop(1, '#155fc7');
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = 'rgba(255, 255, 255, 0.14)';
        context.beginPath();
        context.arc(180 + progress * 120, 140, 88, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.arc(760 - progress * 150, 360, 130, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = 'rgba(255, 255, 255, 0.92)';
        context.fillRect(150, 310, 660, 90);
        context.fillStyle = '#0a4ea3';
        context.font = 'bold 52px Segoe UI, sans-serif';
        context.fillText('Community Events in Motion', 190, 370);

        context.fillStyle = '#dceaff';
        context.font = '28px Segoe UI, sans-serif';
        context.fillText('Workshops, festivals, and resident gatherings', 190, 418);

        context.fillStyle = '#ffcf66';
        context.beginPath();
        context.moveTo(420, 185);
        context.lineTo(560, 270);
        context.lineTo(420, 355);
        context.closePath();
        context.fill();

        if (performance.now() - startTime < 2800) {
            requestAnimationFrame(drawFrame);
        } else {
            recorder.stop();
        }
    }

    const startTime = performance.now();
    recorder.start();
    requestAnimationFrame(drawFrame);
}

function savePreference() {
    const preferenceSelect = document.getElementById('preferenceSelect');
    const preferenceMessage = document.getElementById('preferenceMessage');
    const selectedPreference = preferenceSelect.value;

    if (!selectedPreference) {
        preferenceMessage.textContent = 'Please select an event type before saving.';
        return;
    }

    localStorage.setItem('preferredEventType', selectedPreference);
    sessionStorage.setItem('preferredEventTypeSession', selectedPreference);
    preferenceMessage.textContent = 'Your preferred event has been saved.';
    console.log('Preference saved:', selectedPreference);

    const eventTypeSelect = document.getElementById('eventType');
    eventTypeSelect.value = selectedPreference;
    updateFeeDisplay();
}

function clearPreferences() {
    localStorage.removeItem('preferredEventType');
    sessionStorage.removeItem('preferredEventTypeSession');
    document.getElementById('preferenceSelect').value = '';
    document.getElementById('eventType').value = '';
    updateFeeDisplay();
    document.getElementById('preferenceMessage').textContent = 'Preferences cleared.';
}

function findNearbyEvents() {
    const status = document.getElementById('locationStatus');
    console.log('Location fetch requested');

    if (!navigator.geolocation) {
        status.textContent = 'Geolocation is not supported in this browser.';
        return;
    }

    status.textContent = 'Fetching location...';

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            document.getElementById('latitudeValue').textContent = latitude.toFixed(6);
            document.getElementById('longitudeValue').textContent = longitude.toFixed(6);
            status.textContent = 'Location detected successfully.';
            console.log('Location fetched:', latitude, longitude);
        },
        (error) => {
            if (error.code === error.PERMISSION_DENIED) {
                status.textContent = 'Location access was denied. Please enable permission and try again.';
            } else if (error.code === error.TIMEOUT) {
                status.textContent = 'Location request timed out. Please try again.';
            } else {
                status.textContent = 'Location unavailable at the moment.';
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        }
    );
}

function setLoadingState() {
    const loader = document.getElementById('pageLoader');
    window.setTimeout(() => {
        loader.classList.add('is-hidden');
    }, 650);
}

function setupSectionReveal() {
    const reveals = document.querySelectorAll('.section-reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    reveals.forEach((section) => observer.observe(section));
}

function setupNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('primaryNav');

    navToggle.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('is-open');
        navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navMenu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 860) {
                navMenu.classList.remove('is-open');
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });
    });
}

function setupScrollTop() {
    const button = document.getElementById('scrollTopBtn');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            button.classList.add('is-visible');
        } else {
            button.classList.remove('is-visible');
        }
    });

    button.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function setupGallery() {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');

    document.querySelectorAll('.gallery-image').forEach((image) => {
        image.addEventListener('dblclick', () => {
            modalImage.src = image.src;
            modalImage.alt = image.alt;
            modal.classList.add('is-open');
            image.classList.toggle('is-enlarged');
        });
    });

    modal.addEventListener('click', () => {
        modal.classList.remove('is-open');
        modalImage.removeAttribute('src');
    });
}

function setupRegistrationForm() {
    const form = document.getElementById('registrationForm');

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        console.log('Form submission triggered');

        const validPhone = validatePhoneField();
        if (!form.checkValidity() || !validPhone) {
            form.reportValidity();
            document.getElementById('registrationOutput').textContent = 'Please complete all required fields.';
            return;
        }

        const name = document.getElementById('fullName').value.trim();
        const eventType = document.getElementById('eventType').value;
        document.getElementById('registrationOutput').textContent = `Registration confirmed for ${name} (${eventType}).`;
        alert('Your registration has been submitted successfully.');
        formSubmitted = true;
        window.onbeforeunload = null;
        form.reset();
        document.getElementById('feeOutput').textContent = '₹0';
        document.getElementById('phoneFeedback').textContent = '';
    });
}

function loadSavedPreferences() {
    const savedPreference = localStorage.getItem('preferredEventType') || sessionStorage.getItem('preferredEventTypeSession');
    if (savedPreference) {
        document.getElementById('preferenceSelect').value = savedPreference;
        document.getElementById('eventType').value = savedPreference;
        document.getElementById('preferenceMessage').textContent = 'Your preferred event has been saved.';
        sessionStorage.setItem('preferredEventTypeSession', savedPreference);
        updateFeeDisplay();
    }
}

window.onbeforeunload = function () {
    if (!formSubmitted) {
        return 'You have unsaved changes on this page. Are you sure you want to leave?';
    }
    return undefined;
};

document.addEventListener('DOMContentLoaded', () => {
    setLoadingState();
    setupSectionReveal();
    setupNavigation();
    setupScrollTop();
    setupGallery();
    setupRegistrationForm();
    setupPromoVideo();
    loadSavedPreferences();
    updateFeeDisplay();
    updateCharacterCount();
    updateRatingPreview();

    document.getElementById('eventType').addEventListener('change', updateFeeDisplay);
    document.getElementById('feedbackText').addEventListener('keyup', updateCharacterCount);
});