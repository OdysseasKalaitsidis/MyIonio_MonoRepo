# StudentOS — Ionian University Informatics Pilot

## Project Status

This repository is an **existing project undergoing a product and architecture pivot**.

The product is **WEB APP FIRST**.

The initial production client will be a modern responsive web application optimized for:

- mobile browsers,
- desktop browsers,
- tablets,
- installable PWA behavior where useful.

A native mobile application may be added later, but the architecture must not require one.

Do **not** treat the current implementation, database schema, UI structure, naming conventions, routes, or business logic as permanent requirements.

Existing code should be:

- reused when it fits the new architecture,
- refactored when reasonable,
- replaced when it conflicts with the new product direction,
- never preserved only for backward compatibility unless explicitly required.

This README is the new product and engineering source of truth.

---

# 1. Product Vision

StudentOS is a **web-first university companion platform**.

Initial pilot:

**Ionian University → Department of Informatics → Corfu**

The application should solve everyday student problems:

- What class do I have now?
- What do I have next?
- Where is the classroom?
- Who teaches this course?
- What is each professor teaching?
- Where is the professor's office?
- What is today's restaurant menu?
- When are my exams?
- What electives should I explore?
- What should a first-year student do?
- What is happening around Corfu?
- What Erasmus / ESN activities are available?

The long-term goal is **not** an app hardcoded for Ionian University.

Ionian Informatics is the first pilot tenant of a reusable platform.

```text
StudentOS
│
├── University
│    └── Department
│         └── Academic Year
│              └── Semester
│
└── Future universities
```

All architecture decisions must support this.

---

# 2. Platform Strategy

## 2.1 Web first

The first production interface is a responsive web application.

Primary targets:

```text
Mobile browser
Desktop browser
Tablet
PWA
```

The mobile web experience is especially important because most students will access the product from their phone.

The application should be usable from a URL without requiring an App Store installation.

Example future deployment:

```text
app.studentos.gr
```

or equivalent.

---

## 2.2 PWA-ready

Where practical, the web app should support Progressive Web App capabilities.

Potential capabilities:

```text
Add to Home Screen
app-like navigation
offline shell
cached timetable
cached selected courses
push notifications where supported
background refresh where supported
```

Do not depend on PWA-only functionality for critical flows.

The app must still work as a normal website.

---

## 2.3 Native mobile is future scope

Do not build native iOS / Android clients during the initial pivot unless explicitly requested.

However, business logic and backend APIs should remain client-independent so that future clients could include:

```text
Web
iOS
Android
Admin dashboard
Partner dashboard
```

---

# 3. Core Product Principles

## 3.1 Student-first UX

The application should not feel like a university administration portal.

When a student opens StudentOS, they should immediately understand:

```text
What do I have now?

What do I have next?

Where do I need to go?

What changed?

What matters today?
```

---

## 3.2 Structured data, not PDFs

Official university information may originate from:

- webpages,
- PDFs,
- announcements,
- spreadsheets,
- manually verified sources.

StudentOS must not become a PDF directory.

Bad:

```text
exam_schedule_final_v2.pdf
```

Good:

```text
Exam {
    courseId
    date
    startTime
    roomIds
    examPeriod
    sourceId
    version
}
```

The original official document should remain linked as the authoritative source.

---

## 3.3 Official sources remain authoritative

StudentOS is a companion product.

It does not replace the university's official systems.

Relevant academic information must be traceable.

Store where appropriate:

```text
sourceUrl
sourceName
sourcePublishedAt
sourceFetchedAt
lastVerifiedAt
version
verificationStatus
```

The UI should support:

```text
Source: Department of Informatics
Last verified: 03 Oct 2026

[View official source]
```

Critical information such as examinations must always link back to the official source.

---

## 3.4 Never hardcode university data

Do not hardcode:

```text
professors
courses
rooms
buildings
semesters
departments
academic years
schedules
```

inside frontend components or business logic.

Everything must be data-driven.

---

## 3.5 Privacy by design

The first version should collect very little personal information.

Do not require:

```text
legal name
student registration number
official grades
university password
Moodle password
institutional credentials
```

The application should initially work with data similar to:

```text
anonymousUserId
universityId
departmentId
semesterId
selectedCourseIds
interests
notificationPreferences
onboardingState
```

Where appropriate, preferences may remain in browser/local storage.

---

# 4. Initial MVP

The initial production release should focus on:

1. Home
2. Class Schedule
3. Exams
4. Professors
5. Rooms / Buildings
6. Restaurant
7. Semester Onboarding
8. Freshman Onboarding

After these are reliable:

9. Corfu Hot Spots
10. Erasmus / ESN
11. Course Ratings

Do not prioritize social networking or generic AI functionality before the core academic experience works reliably.

---

# 5. Main Web Application

Recommended routes conceptually:

```text
/
 /schedule
 /courses
 /courses/:id
 /professors
 /professors/:id
 /rooms
 /rooms/:id
 /exams
 /restaurant
 /onboarding
 /corfu
 /erasmus
 /profile
```

Actual route naming may follow the existing framework conventions.

---

# 6. Home

The home page is the most important screen.

On mobile it should behave like an app dashboard.

Example:

```text
Good morning 👋

NEXT CLASS

10:00 – 12:00
Databases

Professor X
Room A2

Starts in 37 min

[Room]
[Professor]
```

Additional contextual cards:

```text
Today's schedule
Upcoming exam
Restaurant menu
Important change
Semester onboarding
ESN event
```

Do not fill the home page with every possible feature.

Prioritize immediate usefulness.

---

# 7. Class Schedule

Students should be able to browse the timetable.

Required information:

```text
Course
Course code
Professor(s)
Day
Start time
End time
Room
Building
Semester
Academic year
Course type
Source
```

Views should include:

```text
Today
Week
By semester
By course
By professor
```

Students should be able to choose which courses they follow.

After selection, `My Schedule` should primarily show those courses.

---

# 8. Professor Schedule

Professor profiles should derive teaching schedules from the same academic dataset.

Example:

```text
Professor Name

Department
Academic position

Office
Institutional email
Official university profile

TEACHING THIS SEMESTER

Monday
10:00 — Databases

Wednesday
13:00 — Advanced Databases
```

Do not maintain a separate manual timetable for professors.

The professor schedule should be generated from:

```text
CourseOffering
+
ScheduleEntry
```

---

# 9. Professors

Professor entities may contain:

```text
id
name
title
departmentId
institutionalEmail
office
officeBuildingId
officialProfileUrl
academicInterests
sourceId
```

Avoid unnecessary personal information.

Do not automatically mirror profile photos unless their usage rights are clear.

The UI should include:

```text
Report outdated information
```

---

# 10. Rooms and Buildings

Rooms are first-class entities.

```text
Building {
    id
    universityId
    name
    address
    latitude?
    longitude?
}
```

```text
Room {
    id
    buildingId
    name
    code
    floor?
    notes?
}
```

Room page example:

```text
Room A2

Building X
2nd Floor

NOW
Databases

NEXT
12:00 — Operating Systems
```

Future indoor navigation is possible but not required.

---

# 11. Restaurant

Provide university restaurant information.

Data model:

```text
Restaurant
RestaurantMenu
RestaurantMenuItem
```

Example:

```text
TODAY

Main
Chicken with rice

Alternative
Pasta

Vegetarian
...

Lunch
12:00 – 16:00
```

Menus should include:

```text
date
mealType
items
sourceId
lastVerifiedAt
```

Do not assume the university will always publish the menu in the same format.

---

# 12. Examination Schedule

Exams are critical data.

```text
Exam {
    id
    courseId
    academicYearId
    examPeriod
    date
    startTime
    endTime?
    roomIds[]
    notes?
    sourceId
    version
    status
}
```

The system must support corrected schedules.

```text
Official schedule V1
        ↓
Corrected schedule published
        ↓
Change detected
        ↓
Admin reviews diff
        ↓
Version 2 published
        ↓
Affected users notified
```

Example:

```text
Exam changed

Computer Networks

Previous:
22 Jan · 09:00

New:
23 Jan · 12:00

[Official source]
```

Never silently overwrite critical academic data without maintaining history.

---

# 13. Semester Onboarding

At the beginning of a semester, students should be able to discover available courses.

Example:

```text
Welcome to Semester 5

What are you interested in?

AI & Data
Cybersecurity
Software Engineering
Networks
Business
Bioinformatics
```

The app may consider:

```text
semester
interests
curriculum
major/minor
ECTS
prerequisites
course categories
previous selections
```

The initial recommendation system should be rule-based and explainable.

Avoid ML until there is enough real usage data.

Example:

```text
Machine Learning

Why you may like it:

• related to AI & Data
• available this semester
• compatible with your curriculum path

[View course]
```

Clearly state that course suggestions are informational.

Official university requirements remain authoritative.

---

# 14. Freshman Onboarding

First-year experience should have its own flow.

Example checklist:

```text
Welcome to Ionian University

□ Activate institutional account
□ Understand course registration
□ Find the department secretary
□ Learn eClass / Moodle
□ Apply for academic ID
□ Learn how textbooks work
□ Learn restaurant access
□ Explore university buildings
□ Select your courses in StudentOS
□ Discover useful student organizations
```

Each step should contain:

```text
short explanation
official link
completion state
optional reminder
```

Prefer short summaries and official links over copying large sections of university webpages.

---

# 15. Course Ratings

Course ratings are Phase 2/3, not initial MVP.

Initial rating dimensions:

```text
difficulty
workload
organization
practicalValue
contentQuality
```

Example:

```text
Difficulty        4.1 / 5
Workload          3.8 / 5
Organization      4.0 / 5
Practical value   4.5 / 5
```

Prefer aggregate anonymous ratings.

Do not initially implement unrestricted free-text reviews of professors.

Free-text user-generated content requires intentional moderation and reporting infrastructure.

---

# 16. Corfu Hot Spots

The application should eventually include a Corfu student guide.

Categories:

```text
Coffee
Food
Bars
Nightlife
Study Spots
Beaches
Gyms
Pharmacies
Supermarkets
Student Services
```

Entity:

```text
Place {
    id
    cityId
    provider
    providerPlaceId
    category
    internalMetadata?
}
```

Provider-controlled information should be loaded according to provider terms.

Do not scrape and permanently mirror Google Places data.

---

# 17. Maps, Traffic and Navigation

Possible UX:

```text
Ionian University

8 min away

Traffic: Moderate

[Directions]
```

Routing and traffic should come from an external maps provider.

Create an abstraction:

```text
MapsProvider
```

Example:

```text
GoogleMapsProvider
```

Business logic must not depend directly on Google-specific response structures.

---

# 18. Erasmus

Support:

```text
Incoming students
Outgoing students
```

Academic content:

```text
available Erasmus courses
English-taught courses
department contacts
important deadlines
official Erasmus resources
```

Community features may be developed with ESN.

Future partner dashboard:

```text
Create Event
Edit Event
Publish Event
Cancel Event
```

Event:

```text
title
description
date
location
registrationUrl
coverImage
eventType
partnerId
```

Partner-created data must remain clearly distinguishable from official university content.

---

# 19. Domain Model

Core hierarchy:

```text
University
│
├── Department
│   │
│   ├── Professor
│   ├── Course
│   ├── Curriculum
│   │
│   ├── AcademicYear
│   │    └── Semester
│   │         └── CourseOffering
│   │              ├── Professor
│   │              └── ScheduleEntry
│   │
│   └── Exam
│
├── Building
│   └── Room
│
├── Restaurant
│   └── RestaurantMenu
│
└── OfficialSource
```

Platform entities:

```text
User
UserPreference
SelectedCourse
Notification
Partner
PartnerEvent
City
Place
Rating
DataImport
DataChange
```

---

# 20. Course vs CourseOffering

This distinction is important.

Course:

```text
CS305
Databases
6 ECTS
```

CourseOffering:

```text
Databases

Academic Year:
2026–2027

Semester:
Winter

Professor:
Professor X
```

ScheduleEntry:

```text
Monday
10:00–12:00
Room A2
```

This allows teaching assignments and schedules to change between academic years without destroying historical data.

---

# 21. Source Provenance

Academic records should point back to their source.

```text
OfficialSource {
    id
    universityId
    departmentId?
    type
    name
    url
    owner
}
```

```text
DataImport {
    id
    sourceId
    fetchedAt
    sourcePublishedAt?
    checksum?
    parserVersion
    status
}
```

```text
DataChange {
    id
    importId
    entityType
    entityId
    changeType
    before
    after
    reviewedBy?
    approvedAt?
}
```

Statuses:

```text
detected
parsed
needs_review
approved
published
rejected
failed
```

---

# 22. Data Ingestion

Target architecture:

```text
University source
       ↓
Source Fetcher
       ↓
Parser
       ↓
Normalization
       ↓
Validation
       ↓
Change Detection
       ↓
Admin Review
       ↓
Production Database
       ↓
API
       ↓
Web App
```

A parsing error must never automatically corrupt production academic data.

Important changes should normally pass through verification.

Especially:

```text
exam changes
class schedule changes
room changes
class cancellations
```

---

# 23. Admin Web Application

Because StudentOS itself is web-first, the platform should contain at least two web experiences:

```text
Student Web App
Admin Web App
```

The admin app is not optional long-term.

Admins should manage:

```text
universities
departments
academic years
semesters
courses
professors
buildings
rooms
schedules
exams
restaurant menus
onboarding
official sources
partners
events
imports
reported errors
```

Example workflow:

```text
New source detected

14 changes

+ 3 new
~ 9 changed
- 2 removed

[Review Changes]

↓

[Approve & Publish]
```

Production data should not require direct database edits.

---

# 24. User Accounts

Do not force authentication for public information.

Preferred:

```text
Anonymous visitor
       ↓
Local preferences
       ↓
Optional account
       ↓
Cloud sync
```

A student should be able to visit StudentOS and immediately browse:

```text
schedule
courses
professors
rooms
restaurant
exams
onboarding
```

without registering.

An account becomes useful for:

```text
saved courses
synced timetable
notifications
ratings
cross-device preferences
```

---

# 25. Local Storage

For anonymous users, browser storage may initially store:

```text
selectedDepartment
selectedSemester
selectedCourses
interests
onboardingProgress
preferences
```

Validate all values loaded from browser storage.

Do not treat client-side data as trusted authorization state.

---

# 26. Authentication

Authentication may be added for optional personalization.

Do not require university authentication for the initial product.

Never request or store:

```text
university password
Moodle password
eClass password
```

Future institutional authentication must use an approved university integration.

---

# 27. Notifications

Because the product is web-first, notifications should be designed with progressive enhancement.

Possible mechanisms:

```text
in-app notifications
email notifications
web push notifications
future native push notifications
```

Core triggers:

```text
exam changed
class changed
room changed
class cancelled
new official timetable
onboarding deadline
saved event reminder
```

Users must control preferences.

---

# 28. SEO and Public Pages

Because this is a web app, selected public pages may be indexable where useful.

Potential public routes:

```text
/courses/:id
/professors/:id
/rooms/:id
/erasmus
```

However:

- user-specific schedules must not be indexed,
- account pages must not be indexed,
- private data must never appear in public metadata.

Use appropriate:

```text
robots
canonical URLs
metadata
Open Graph
```

only where relevant.

---

# 29. Performance

The web application must remain fast on mobile connections.

Prioritize:

```text
fast initial load
code splitting
server-side caching
API caching
image optimization
limited JavaScript
skeleton states
good Core Web Vitals
```

Avoid shipping large map or analytics libraries on routes where they are not needed.

---

# 30. Accessibility

The web application should target WCAG-friendly behavior.

At minimum:

```text
keyboard navigation
semantic HTML
form labels
visible focus states
sufficient contrast
accessible dialogs
ARIA only where necessary
screen reader friendly navigation
```

Do not build important interactions that only work with hover.

---

# 31. Responsive Design

Design mobile-first.

Recommended conceptual breakpoints:

```text
mobile
tablet
desktop
wide desktop
```

Do not create separate mobile and desktop applications.

Use one responsive interface unless a specific workflow genuinely requires otherwise.

---

# 32. Offline Behavior

Full offline support is not required initially.

However, selected information may be cached:

```text
today's timetable
selected courses
recent exam schedule
basic room information
```

Clearly distinguish cached data from newly verified data.

Critical academic information should show its last update timestamp.

---

# 33. Privacy and GDPR

Principles:

```text
collect minimum data
store only what is necessary
separate public and personal data
support deletion
define retention
secure APIs
log admin operations
```

Initial scope explicitly excludes private academic records such as:

```text
official grades
student registry number
official course declarations
private Moodle information
institutional identity
```

unless an official university integration is created later.

---

# 34. Analytics

Useful events:

```text
schedule_opened
exam_opened
professor_opened
room_opened
course_selected
onboarding_started
onboarding_completed
recommendation_opened
restaurant_opened
event_opened
```

Do not send unnecessary PII to analytics services.

---

# 35. API Boundary

The web frontend must not communicate directly with the database.

Use a stable API/service layer.

Possible endpoints:

```text
GET /universities
GET /universities/:id/departments

GET /departments/:id/courses
GET /departments/:id/professors

GET /semesters/:id/schedule
GET /semesters/:id/exams

GET /professors/:id
GET /professors/:id/schedule

GET /rooms/:id

GET /restaurants/:id/menu/today

GET /onboarding/:departmentId

GET /cities/:cityId/places

GET /partners/:partnerId/events
```

The exact architecture may use REST, RPC, GraphQL or server actions depending on the existing stack.

The important rule is:

**domain logic must not live exclusively inside UI components.**

---

# 36. Repository Architecture

Codex must inspect the existing repository before restructuring.

A possible target:

```text
/apps
    /web
    /admin

/services
    /api
    /ingestion
    /notifications

/packages
    /domain
    /database
    /ui
    /validation
    /config
    /maps
```

If the existing project is a single modern full-stack web application, do not create microservices simply to match this diagram.

Prefer simplicity.

Separation of concerns is required.

Microservices are not.

---

# 37. Architecture Principle

Prefer a **modular monolith** for the initial product unless the existing infrastructure gives a strong reason not to.

StudentOS does not initially need distributed systems complexity.

The architecture should separate:

```text
presentation
domain
data access
external providers
ingestion
background jobs
```

while remaining easy for a small team to operate.

---

# 38. External Provider Abstractions

Create adapters for external vendors.

Examples:

```text
MapsProvider
AnalyticsProvider
NotificationProvider
StorageProvider
AuthProvider
```

Do not spread Google-specific logic throughout the codebase.

---

# 39. Environments

Support:

```text
development
staging
production
```

Do not use production infrastructure for normal development.

Secrets must never be committed.

Environment configuration may include:

```text
DATABASE_URL
APP_URL
GOOGLE_MAPS_API_KEY
ANALYTICS_KEY
EMAIL_PROVIDER_KEY
STORAGE_CONFIG
```

---

# 40. Security

At minimum:

```text
HTTPS
validated inputs
server-side authorization
protected admin routes
rate limiting where appropriate
secure cookies
CSRF protection where applicable
secure headers
secret management
database backups
admin audit logs
dependency updates
```

Never trust roles or permissions supplied only by the browser.

---

# 41. Data Quality

Academic information must be trustworthy.

Where relevant:

```text
verified
lastVerifiedAt
sourceId
sourceVersion
```

If information is stale, say so.

Example:

```text
⚠ This timetable has not yet been verified for the current semester.
```

Do not fabricate missing information.

---

# 42. Localization

Initial languages:

```text
Greek
English
```

Do not scatter Greek/English strings directly throughout UI components.

Use a localization system.

Content models should support translated content where practical.

---

# 43. Search

Global search should eventually cover:

```text
courses
professors
rooms
buildings
events
places
```

Example:

```text
Search: database

Databases
COURSE

Professor X
PROFESSOR

Database Laboratory
ROOM
```

---

# 44. Scalability

Never assume:

```text
one university
one department
one campus
one city
one restaurant
one language
one academic year
```

Architecture should naturally support multiple tenants.

Ionian University Informatics is only the initial dataset.

---

# 45. Explicitly Out of Scope for Initial MVP

Do not prioritize:

```text
official grades
student registry integration
university SSO
private Moodle access
student chat
social feed
marketplace
AI chatbot
free-text professor reviews
complex machine-learning recommendations
native iOS app
native Android app
AR indoor navigation
```

---

# 46. Recommended Delivery Phases

## Phase 1 — Pivot foundation

Refactor/create:

```text
University
Department
AcademicYear
Semester
Course
CourseOffering
Professor
Building
Room
ScheduleEntry
OfficialSource
```

---

## Phase 2 — Core Web App

Implement:

```text
responsive shell
home
today view
weekly schedule
course page
professor page
room page
course selection
```

---

## Phase 3 — Exams + Restaurant

Implement:

```text
exam schedule
exam versioning
restaurant menu
important change notifications
```

---

## Phase 4 — Onboarding

Implement:

```text
freshman onboarding
semester onboarding
elective discovery
interests
```

---

## Phase 5 — PWA

Add where valuable:

```text
installable manifest
service worker
basic offline support
web push
cached schedule
```

Do this only after the core web experience is stable.

---

## Phase 6 — Corfu

Implement:

```text
places
maps
directions
traffic-aware routing
```

---

## Phase 7 — Erasmus

Implement:

```text
Erasmus guide
incoming onboarding
ESN integration
partner events
```

---

## Phase 8 — Ratings

Implement:

```text
course ratings
aggregate results
anti-abuse
moderation
```

---

# 47. Success Metrics

For the Informatics pilot:

```text
weekly active students
returning users
selected-course adoption
schedule opens
exam page usage
onboarding completion
30-day retention
PWA installs
successfully communicated academic changes
```

The strongest early signal:

> Are students repeatedly opening StudentOS instead of searching university pages and PDFs?

---

# 48. Engineering Rules for Codex

When working on this repository:

1. Read this README completely.
2. Inspect the current codebase before editing.
3. Treat the product as web-first.
4. Do not build native mobile clients.
5. Prefer responsive web patterns.
6. Prefer a modular monolith unless complexity requires otherwise.
7. Identify reusable existing code.
8. Do not rewrite working infrastructure without a reason.
9. Do not hardcode Ionian-specific domain data.
10. Keep domain logic separate from React/UI components.
11. Maintain type safety.
12. Use database migrations.
13. Validate imported data.
14. Add tests for critical academic logic.
15. Treat exam and timetable changes as critical.
16. Keep providers behind adapters.
17. Never fabricate academic data.
18. Represent stale/unverified data explicitly.
19. Preserve source provenance.
20. Document major architectural decisions.

---

# 49. First Task for Codex

Before modifying production code, audit the current repository.

Create:

```text
CURRENT_ARCHITECTURE.md
```

Include:

```text
current framework and stack
package manager
repository structure
frontend architecture
backend architecture
database
schema
authentication
APIs
existing routes
existing UI
state management
third-party integrations
deployment setup
reusable modules
technical debt
security concerns
areas conflicting with this README
```

Then create:

```text
PIVOT_PLAN.md
```

Include:

```text
what stays
what should be refactored
what should be removed
new domain model
database migration strategy
route changes
API changes
frontend migration plan
admin architecture
data ingestion strategy
implementation order
risks
```

Do **not** perform a large rewrite before producing these documents.

---

# 50. Immediate Product Target

The first strong production build should allow a student to:

```text
visit StudentOS from their browser

↓

choose Ionian University
Department of Informatics
semester

↓

select courses

↓

see today's classes

↓

see what comes next

↓

see professor and room

↓

open weekly timetable

↓

browse professor information

↓

find rooms

↓

view restaurant menu

↓

view exam schedule

↓

see important changes

↓

complete useful onboarding
```

This flow must work extremely well on a phone browser.

---

# 51. North Star

StudentOS should become:

> The interface between university life and the student.

Not another university website.

Not another PDF viewer.

Not another generic calendar.

StudentOS should transform fragmented university information into structured, verified, personalized and immediately useful information.

**Web first. Mobile-friendly. PWA-ready. Multi-university by design.**

Ionian University Department of Informatics is the pilot.

The platform is designed for everything that comes after it.