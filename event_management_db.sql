DROP DATABASE IF EXISTS event_management_db;
CREATE DATABASE event_management_db;
USE event_management_db;

-- =========================================================
-- Part 1 and Part 2: Database and table creation
-- =========================================================

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    city VARCHAR(100) NOT NULL,
    registration_date DATE NOT NULL
) ENGINE=InnoDB;

CREATE TABLE events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    `status` ENUM('upcoming', 'completed', 'cancelled') NOT NULL,
    organizer_id INT NOT NULL,
    CONSTRAINT fk_events_organizer
        FOREIGN KEY (organizer_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT chk_event_dates CHECK (end_date >= start_date)
) ENGINE=InnoDB;

CREATE TABLE sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    speaker_name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CONSTRAINT fk_sessions_event
        FOREIGN KEY (event_id) REFERENCES events(event_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT chk_session_times CHECK (end_time > start_time)
) ENGINE=InnoDB;

CREATE TABLE registrations (
    registration_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    registration_date DATE NOT NULL,
    CONSTRAINT fk_registrations_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_registrations_event
        FOREIGN KEY (event_id) REFERENCES events(event_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    rating INT NOT NULL,
    comments VARCHAR(255) NOT NULL,
    feedback_date DATE NOT NULL,
    CONSTRAINT fk_feedback_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_feedback_event
        FOREIGN KEY (event_id) REFERENCES events(event_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT chk_feedback_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

CREATE TABLE resources (
    resource_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    resource_type ENUM('pdf', 'image', 'link') NOT NULL,
    resource_url VARCHAR(255) NOT NULL,
    uploaded_at DATETIME NOT NULL,
    CONSTRAINT fk_resources_event
        FOREIGN KEY (event_id) REFERENCES events(event_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- Part 3: Sample data
-- =========================================================

INSERT INTO users (full_name, email, city, registration_date) VALUES
('Alice Johnson', 'alice.johnson@example.com', 'New York', '2026-05-01'),
('Bob Smith', 'bob.smith@example.com', 'Chicago', '2026-02-15'),
('Charlie Lee', 'charlie.lee@example.com', 'San Francisco', '2026-04-18'),
('Diana King', 'diana.king@example.com', 'New York', '2026-05-28'),
('Ethan Hunt', 'ethan.hunt@example.com', 'Boston', '2026-01-10');

INSERT INTO events (title, description, city, start_date, end_date, `status`, organizer_id) VALUES
('Tech Innovators Meetup', 'Networking and talks on innovation and digital products.', 'New York', '2026-06-20', '2026-06-20', 'upcoming', 1),
('AI & ML Conference', 'Applied AI and machine learning sessions for professionals.', 'Chicago', '2026-05-10', '2026-05-12', 'completed', 2),
('Frontend Development Bootcamp', 'Modern frontend fundamentals and hands-on labs.', 'San Francisco', '2026-06-05', '2026-06-06', 'upcoming', 3);

INSERT INTO sessions (event_id, title, speaker_name, start_time, end_time) VALUES
(1, 'Opening Keynote', 'Jordan Miles', '10:00:00', '11:00:00'),
(1, 'Future of Web Dev', 'Jordan Miles', '10:30:00', '11:30:00'),
(1, 'Intro to HTML5', 'Nina Patel', '11:15:00', '12:15:00'),
(2, 'AI in Healthcare', 'Dr. Aisha Khan', '14:00:00', '15:00:00');

INSERT INTO registrations (user_id, event_id, registration_date) VALUES
(1, 1, '2026-05-01'),
(2, 2, '2026-02-01'),
(3, 3, '2026-05-10'),
(5, 3, '2026-05-11'),
(1, 2, '2026-05-20'),
(3, 2, '2026-05-21'),
(5, 2, '2026-05-22'),
(1, 1, '2026-05-23'),
(3, 1, '2026-05-24');

INSERT INTO feedback (user_id, event_id, rating, comments, feedback_date) VALUES
(1, 1, 5, 'Great networking and practical sessions.', '2026-06-01'),
(2, 2, 2, 'Too advanced for beginners.', '2026-05-15'),
(3, 2, 4, 'Strong demos and useful takeaways.', '2026-05-16'),
(5, 2, 5, 'Excellent speaker lineup.', '2026-05-17');

INSERT INTO resources (event_id, resource_type, resource_url, uploaded_at) VALUES
(1, 'pdf', 'https://example.com/resources/tech-agenda.pdf', '2026-06-01 09:00:00'),
(1, 'image', 'https://example.com/resources/tech-banner.png', '2026-06-01 09:15:00'),
(1, 'link', 'https://example.com/resources/tech-playlist', '2026-06-01 09:30:00'),
(2, 'pdf', 'https://example.com/resources/ai-handout.pdf', '2026-05-14 10:00:00'),
(2, 'link', 'https://example.com/resources/ai-slides', '2026-05-14 10:10:00');

-- =========================================================
-- Part 4: Query solutions
-- =========================================================

-- Exercise 1: User Upcoming Events
-- Show all upcoming events a user registered for in their city.
SELECT
    u.full_name,
    u.city AS user_city,
    e.title AS event_title,
    e.city AS event_city,
    r.registration_date
FROM users u
JOIN registrations r ON r.user_id = u.user_id
JOIN events e ON e.event_id = r.event_id
WHERE e.`status` = 'upcoming'
  AND u.city = e.city
ORDER BY u.full_name, e.title;

-- Exercise 2: Top Rated Events
-- Find highest-rated events with average ratings.
SELECT
    e.event_id,
    e.title,
    ROUND(AVG(f.rating), 2) AS average_rating,
    COUNT(f.feedback_id) AS feedback_count
FROM events e
JOIN feedback f ON f.event_id = e.event_id
GROUP BY e.event_id, e.title
ORDER BY average_rating DESC, feedback_count DESC, e.title
LIMIT 5;

-- Exercise 3: Inactive Users
-- Users not registered in the last 90 days.
SELECT
    u.user_id,
    u.full_name,
    u.email,
    u.city
FROM users u
WHERE NOT EXISTS (
    SELECT 1
    FROM registrations r
    WHERE r.user_id = u.user_id
      AND r.registration_date >= CURDATE() - INTERVAL 90 DAY
)
ORDER BY u.full_name;

-- Exercise 4: Peak Session Hours
-- Count sessions scheduled between 10 AM and 12 PM.
SELECT COUNT(*) AS sessions_between_10_am_and_12_pm
FROM sessions
WHERE start_time >= '10:00:00'
  AND start_time <= '12:00:00';

-- Exercise 5: Most Active Cities
-- Top 5 cities with highest registrations.
SELECT
    u.city,
    COUNT(*) AS registration_count
FROM registrations r
JOIN users u ON u.user_id = r.user_id
GROUP BY u.city
ORDER BY registration_count DESC, u.city
LIMIT 5;

-- Exercise 6: Event Resource Summary
-- Count PDFs, Images, and Links per event.
SELECT
    e.event_id,
    e.title,
    SUM(CASE WHEN rs.resource_type = 'pdf' THEN 1 ELSE 0 END) AS pdf_count,
    SUM(CASE WHEN rs.resource_type = 'image' THEN 1 ELSE 0 END) AS image_count,
    SUM(CASE WHEN rs.resource_type = 'link' THEN 1 ELSE 0 END) AS link_count
FROM events e
LEFT JOIN resources rs ON rs.event_id = e.event_id
GROUP BY e.event_id, e.title
ORDER BY e.title;

-- Exercise 7: Low Feedback Alerts
-- List ratings below 3 with comments.
SELECT
    f.feedback_id,
    u.full_name,
    e.title AS event_title,
    f.rating,
    f.comments,
    f.feedback_date
FROM feedback f
JOIN users u ON u.user_id = f.user_id
JOIN events e ON e.event_id = f.event_id
WHERE f.rating < 3
ORDER BY f.rating, f.feedback_date;

-- Exercise 8: Sessions per Upcoming Event
-- Display upcoming events with session counts.
SELECT
    e.event_id,
    e.title,
    COUNT(s.session_id) AS session_count
FROM events e
LEFT JOIN sessions s ON s.event_id = e.event_id
WHERE e.`status` = 'upcoming'
GROUP BY e.event_id, e.title
ORDER BY session_count DESC, e.title;

-- Exercise 9: Organizer Event Summary
-- Show organizer name, event count, and status.
SELECT
    u.full_name AS organizer_name,
    e.`status`,
    COUNT(*) AS event_count
FROM events e
JOIN users u ON u.user_id = e.organizer_id
GROUP BY u.full_name, e.`status`
ORDER BY u.full_name, e.`status`;

-- Exercise 10: Feedback Gap
-- Events having registrations but no feedback.
SELECT
    e.event_id,
    e.title,
    COUNT(DISTINCT r.registration_id) AS registration_count
FROM events e
LEFT JOIN registrations r ON r.event_id = e.event_id
LEFT JOIN feedback f ON f.event_id = e.event_id
GROUP BY e.event_id, e.title
HAVING COUNT(DISTINCT r.registration_id) > 0
   AND COUNT(DISTINCT f.feedback_id) = 0
ORDER BY e.title;

-- Exercise 11: Daily New User Count
-- Number of users registered each day.
SELECT
    registration_date,
    COUNT(*) AS new_user_count
FROM users
GROUP BY registration_date
ORDER BY registration_date;

-- Exercise 12: Event with Maximum Sessions
-- Find event(s) having the highest session count.
WITH session_counts AS (
    SELECT
        e.event_id,
        e.title,
        COUNT(s.session_id) AS session_count
    FROM events e
    LEFT JOIN sessions s ON s.event_id = e.event_id
    GROUP BY e.event_id, e.title
)
SELECT
    event_id,
    title,
    session_count
FROM session_counts
WHERE session_count = (SELECT MAX(session_count) FROM session_counts);

-- Exercise 13: Average Rating per City
-- Calculate city-wise average ratings.
SELECT
    e.city,
    ROUND(AVG(f.rating), 2) AS average_rating
FROM feedback f
JOIN events e ON e.event_id = f.event_id
GROUP BY e.city
ORDER BY e.city;

-- Exercise 14: Most Registered Events
-- Top 3 events by registrations.
SELECT
    e.event_id,
    e.title,
    COUNT(r.registration_id) AS registration_count
FROM events e
LEFT JOIN registrations r ON r.event_id = e.event_id
GROUP BY e.event_id, e.title
ORDER BY registration_count DESC, e.title
LIMIT 3;

-- Exercise 15: Event Session Time Conflict
-- Find overlapping sessions.
SELECT
    e.title AS event_title,
    s1.title AS session_1,
    s1.start_time AS session_1_start,
    s1.end_time AS session_1_end,
    s2.title AS session_2,
    s2.start_time AS session_2_start,
    s2.end_time AS session_2_end
FROM sessions s1
JOIN sessions s2
    ON s1.event_id = s2.event_id
   AND s1.session_id < s2.session_id
   AND s1.start_time < s2.end_time
   AND s1.end_time > s2.start_time
JOIN events e ON e.event_id = s1.event_id
ORDER BY e.title, s1.start_time, s2.start_time;

-- Exercise 16: Unregistered Active Users
-- Recent users with no registrations.
SELECT
    u.user_id,
    u.full_name,
    u.email,
    u.registration_date
FROM users u
WHERE u.registration_date >= CURDATE() - INTERVAL 90 DAY
  AND NOT EXISTS (
      SELECT 1
      FROM registrations r
      WHERE r.user_id = u.user_id
  )
ORDER BY u.registration_date DESC, u.full_name;

-- Exercise 17: Multi-Session Speakers
-- Speakers conducting multiple sessions.
SELECT
    speaker_name,
    COUNT(*) AS session_count
FROM sessions
GROUP BY speaker_name
HAVING COUNT(*) > 1
ORDER BY session_count DESC, speaker_name;

-- Exercise 18: Resource Availability Check
-- Events without resources.
SELECT
    e.event_id,
    e.title,
    e.`status`
FROM events e
LEFT JOIN resources r ON r.event_id = e.event_id
WHERE r.resource_id IS NULL
ORDER BY e.title;

-- Exercise 19: Completed Events with Feedback Summary
-- Show registrations and average rating.
WITH registration_summary AS (
    SELECT event_id, COUNT(*) AS registration_count
    FROM registrations
    GROUP BY event_id
),
feedback_summary AS (
    SELECT event_id, COUNT(*) AS feedback_count, ROUND(AVG(rating), 2) AS average_rating
    FROM feedback
    GROUP BY event_id
)
SELECT
    e.event_id,
    e.title,
    COALESCE(rs.registration_count, 0) AS registration_count,
    COALESCE(fs.feedback_count, 0) AS feedback_count,
    fs.average_rating
FROM events e
LEFT JOIN registration_summary rs ON rs.event_id = e.event_id
LEFT JOIN feedback_summary fs ON fs.event_id = e.event_id
WHERE e.`status` = 'completed'
ORDER BY e.title;

-- Exercise 20: User Engagement Index
-- For every user calculate events attended and feedback submitted.
SELECT
    u.user_id,
    u.full_name,
    COUNT(DISTINCT r.event_id) AS events_attended,
    COUNT(DISTINCT f.event_id) AS feedback_submitted
FROM users u
LEFT JOIN registrations r ON r.user_id = u.user_id
LEFT JOIN feedback f ON f.user_id = u.user_id
GROUP BY u.user_id, u.full_name
ORDER BY u.full_name;

-- Exercise 21: Top Feedback Providers
-- Top 5 users by feedback count.
SELECT
    u.user_id,
    u.full_name,
    COUNT(f.feedback_id) AS feedback_count
FROM users u
JOIN feedback f ON f.user_id = u.user_id
GROUP BY u.user_id, u.full_name
ORDER BY feedback_count DESC, u.full_name
LIMIT 5;

-- Exercise 22: Duplicate Registrations Check
-- Find duplicate registrations.
SELECT
    user_id,
    event_id,
    COUNT(*) AS duplicate_count
FROM registrations
GROUP BY user_id, event_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, user_id, event_id;

-- Exercise 23: Registration Trends
-- Month-wise registration trend.
SELECT
    DATE_FORMAT(registration_date, '%Y-%m') AS registration_month,
    COUNT(*) AS registration_count
FROM registrations
GROUP BY DATE_FORMAT(registration_date, '%Y-%m')
ORDER BY registration_month;

-- Exercise 24: Average Session Duration per Event
-- Calculate average duration in minutes.
SELECT
    e.event_id,
    e.title,
    ROUND(AVG(TIME_TO_SEC(TIMEDIFF(s.end_time, s.start_time)) / 60), 2) AS average_session_duration_minutes
FROM events e
LEFT JOIN sessions s ON s.event_id = e.event_id
GROUP BY e.event_id, e.title
ORDER BY e.title;

-- Exercise 25: Events Without Sessions
-- Find events that have no sessions.
SELECT
    e.event_id,
    e.title,
    e.city,
    e.`status`
FROM events e
LEFT JOIN sessions s ON s.event_id = e.event_id
WHERE s.session_id IS NULL
ORDER BY e.title;