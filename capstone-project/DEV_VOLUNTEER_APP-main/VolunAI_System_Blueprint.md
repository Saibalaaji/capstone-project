# VolunAI_System_Blueprint

## 1. Tech Stack & Architecture Overview

**Frontend:**
- **Core:** React 19 (`react` & `react-dom` @19.2.0), Vite (`vite` @7.3.1).
- **Styling:** TailwindCSS 4, Lucide-React for iconography. Components use extensive raw CSS in `index.css` defining custom tokens and utilities (e.g. `var(--coral)`, `var(--bg-page)`).
- **Routing:** `react-router-dom` v7. Main router configured in `src/App.jsx`.
- **State Management:** React Context API for global state (`src/context/AuthContext.jsx`). Local component state handled via standard `useState` and `useEffect` hooks. No Redux or MobX.
- **HTTP/API Client:** Axios (configured in `src/services/api.js` with an interceptor to auto-attach the JWT token), though a legacy fetch-based service exists (`src/services/authService.js`).

**Backend:**
- **Core Framework:** Python 3 with Flask 3.1.0.
- **Database & ORM:** SQLite (via `sqlite:///volunai.db`) accessed via Flask-SQLAlchemy 3.1.1. Data schema models are centralized in `models.py`. In production, config falls back to PostgreSQL via `DATABASE_URL` environment variable.
- **Authentication:** Flask-JWT-Extended 4.7.1 is used to generate & verify JSON Web Tokens. Passwords are encrypted using Werkzeug security handlers.
- **WebSockets / Real-Time:** Flask-SocketIO 5.5.1 with Eventlet for real-time chat and push notifications. WebSockets connect through `socket_events.py`.
- **ML / AI Engine:** `scikit-learn` and `numpy` used for Natural Language Processing rule inference (Service type, urgency, location extraction) and Volunteer matching generation (TF-IDF ranking).

## 2. Database Models & Schema

The entire ORM is mapped out in `models.py`. Below is the complete listing of tables, exact columns, types, and logic:

### Model: `User` (`users` table)
| Field | Type | Description / Modifiers |
|---|---|---|
| `id` | Integer | PK, Autoincrement |
| `name` | String(120) | Not Null |
| `email` | String(120) | Unique, Not Null |
| `password_hash` | String(256) | Not Null |
| `contact_number` | String(30) | Nullable |
| `location` | String(120) | Nullable |
| `role` | String(20) | Not Null, Default: "user". ENUM: user, admin, volunteer |
| `created_at` | DateTime | Default: `datetime.utcnow` |
| `is_verified` | Boolean | Default: False |
| `verification_status` | String(20) | Default: "PENDING". ENUM: PENDING, VERIFIED, REJECTED |
| `id_proof_url` | String(255) | Nullable. Path to the uploaded ID proof file |
| `rejection_reason` | Text | Nullable |

### Model: `Volunteer` (`volunteers` table)
| Field | Type | Description / Modifiers |
|---|---|---|
| `id` | Integer | PK, Autoincrement |
| `name` | String(120) | Not Null |
| `email` | String(120) | Not Null |
| `phone` | String(30) | Nullable |
| `location` | String(120) | Nullable |
| `available_days` | Text | Default: "[]" (JSON serialized array inside string) |
| `service_type` | Text | Default: "[]" (JSON serialized array inside string) |
| `rating` | Float | Default: 0.0 |
| `active` | Boolean | Default: True |
| `availability_status` | String(20) | Default: "AVAILABLE". ENUM: AVAILABLE, BUSY, INACTIVE |
| `completed_tasks` | Integer | Default: 0 |
| `acceptance_rate` | Float | Default: 1.0 |
| `reliability_score` | Float | Default: 1.0 |
| `is_verified` | Boolean | Default: False |
| `verification_status` | String(20) | Default: "PENDING" |
| `id_proof_url` | String(255) | Nullable |
| `rejection_reason` | Text | Nullable |
| `latitude` | Float | Nullable |
| `longitude` | Float | Nullable |

### Model: `AssistanceRequest` (`assistance_requests` table)
| Field | Type | Description / Modifiers |
|---|---|---|
| `id` | Integer | PK, Autoincrement |
| `requester_name` | String(120) | Not Null |
| `requester_contact` | String(120) | Not Null |
| `location` | String(120) | Not Null |
| `service_type` | String(120) | Not Null |
| `description` | Text | Nullable |
| `urgency_level` | String(20) | Not Null, Default: "MEDIUM" |
| `status` | String(20) | Not Null, Default: "PENDING". ENUM: PENDING, ASSIGNED, COMPLETED |
| `assigned_volunteer_id` | Integer | **Foreign Key** (`volunteers.id`), Nullable |

### Model: `Assignment` (`assignments` table)
| Field | Type | Description / Modifiers |
|---|---|---|
| `id` | Integer | PK, Autoincrement |
| `request_id` | Integer | **Foreign Key** (`assistance_requests.id`), Not Null |
| `volunteer_id` | Integer | **Foreign Key** (`volunteers.id`), Not Null |
| `match_score` | Float | Default: 0.0 (Calculated by `matching_engine.py`) |
| `acceptance_probability` | Float | Default: 0.0 |
| `status` | String(20) | Default: "SUGGESTED". ENUM: SUGGESTED, ACCEPTED, DECLINED, COMPLETED |
| `assigned_by` | String(20) | Default: "SYSTEM". ENUM: ADMIN, VOLUNTEER, SYSTEM |
| `timestamp` | DateTime | Default: `datetime.utcnow` |
| `assigned_at` | DateTime | Default: `datetime.utcnow` |
| `completed_at` | DateTime | Nullable |

### Model: `Message` (`messages` table)
| Field | Type | Description / Modifiers |
|---|---|---|
| `id` | Integer | PK, Autoincrement |
| `sender_id` | Integer | **Foreign Key** (`users.id`), Not Null |
| `receiver_id` | Integer | **Foreign Key** (`users.id`), Not Null |
| `request_id` | Integer | **Foreign Key** (`assistance_requests.id`), Nullable |
| `message_text` | Text | Not Null |
| `timestamp` | DateTime | Default: `datetime.utcnow` |
| `read` | Boolean | Default: False |

### Model: `Notification` (`notifications` table)
| Field | Type | Description / Modifiers |
|---|---|---|
| `id` | Integer | PK, Autoincrement |
| `user_id` | Integer | **Foreign Key** (`users.id`), Not Null |
| `message` | Text | Not Null |
| `notification_type` | String(50) | Not Null (NEW_REQUEST, NEW_MESSAGE, SYSTEM, etc.) |
| `related_id` | Integer | Nullable. Points to Request ID or Message ID |
| `status` | String(20) | Default: "unread" |
| `timestamp` | DateTime | Default: `datetime.utcnow` |

### Model: `VolunteerRating` (`volunteer_ratings` table)
| Field | Type | Description / Modifiers |
|---|---|---|
| `id` | Integer | PK, Autoincrement |
| `volunteer_id` | Integer | **Foreign Key** (`volunteers.id`), Not Null |
| `user_id` | Integer | **Foreign Key** (`users.id`), Not Null |
| `request_id` | Integer | **Foreign Key** (`assistance_requests.id`), Nullable |
| `rating` | Float | Not Null. (1.0 to 5.0) |
| `comment` | Text | Nullable |
| `timestamp` | DateTime | Default: `datetime.utcnow` |


## 3. Frontend UI, Dashboards, & Forms Flow

### A. Auth Flow (`LoginPage.jsx` & `RegisterPage.jsx`)
- **Login:** Users trigger `login()` from `AuthContext.jsx`. The Payload `{ email, password }` is POSTed via Axios to `/api/auth/login`. Response extracts `{ user, token }`. LocalStorage sets `cvas_token` and `cvas_user`. State updates in context.
- **Registration:** Handled securely via a 3-step wizard in `RegisterPage.jsx`.
    - **Step 1:** Users define role via state (`role`='user' or 'volunteer').
    - **Step 2:** Profile inputs: Name, Email, Password, ConfirmPassword, Phone, Location.
    - **Step 3 (Forms & Upload):** Form utilizes `FormData` via web standard to bundle fields and file uploads contextually (`idProof` file object). Volunteers append custom logic for parsing JSON Arrays for `skills` and `availableDays`.
    - Submit calls `/api/auth/register` (multipart/form-data). The generated token is stashed in Global Context, bypassing pending verification flow logically in state but marking them server-side.

### B. Dashboard Topologies

1. **`AdminDashboard.jsx`:**
   - Primary shell renders `<AppLayout />` rendering sub-components conditionally via state `activeTab`.
   - Views include: `AdminOverview` (General stat cards), `AdminRequests`, `AdminVolunteers`, `AdminUsers`, `AdminMatching`, `AdminAnalytics`, `AdminVerification`, and `AdminCreateRequest`.
   - Admin Data queries are bundled using `Promise.all([getVolunteers(), getRequests(), getPendingVerifications()])` on mount to reduce load waterfalls.

2. **`UserDashboard.jsx` (Community Member view):**
   - Active Tabs: `CommunityNewRequest` & `CommunityMyRequests`.
   - Handles localized validation for new requests and hits `createRequest(form)` via `services/api.js`.

3. **`VolunteerDashboard.jsx`:**
   - Tabs: `VolunteerTasks` (renders pending requests and lets them Accept/Decline), `VolunteerProfile` (Editable forms for location, days, service limits), `VolunteerHistory`, and `VolunteerAnalytics`.
   - Displays prominent contextual badges indicating their ID Verification state at the top of the interface by checking `volunteer?.verification_status`.

### C. Explicit Form & Action Flows (Critical Paths)

#### Creating a Help Request (`AdminCreateRequest.jsx` & User Dashboard)
- Defines state payload matching the Empty Form: `{ requesterName: '', requesterContact: '', location: '', serviceType: '', description: '', urgencyLevel: 'MEDIUM' }`.
- **Intelligent Field Mapping:** As the admin types in `description`, an onChange event listens. If chars exceed `>15`, it hotwires a GET call to frontend-driven stub `interpretRequest()` or hits `/api/ai/interpret_request`. Result dynamically auto-fills `serviceType`, `location`, and `<Badge>` indicators UI.
- On success (`createRequest` api), it automatically triggers `rankVolunteers()` passing the active volunteers array against NLP heuristics, displaying suggested assignment matched cards inline with match % confidence bars.

#### Volunteer Profile Updation
- Volunteer clicks Edit on their Profile. Fields toggle to `<input>` tags. Selected skills map to a CSS grid chip-group. Submitting hits `PUT /api/volunteers/<vid>`, serializing standard JSON payload.


## 4. Backend API Routes & Core Logic

### Route Blueprints (`app.py` register configurations)
Requests map logically to sub-modules via blueprints. Key interactions:

**A. Authentication (`routes/auth.py`)** 
- `POST /api/auth/register`: Dual-purpose receiver that handles JSON arrays natively, yet manually tries to parse JSON strings encoded via Multipart Form-Data if a file (`idProof`) is attached.
- **NOTE:** User instances are populated with `is_verified=True` uniformly via Python code forcing auto-verification on creation (overriding default DB schema models on pending). Verified profiles populate a secondary duplicate row into `Volunteer` if the role matches `volunteer`. Welcome push Notification attached.

**B. Core Assistance Requests (`routes/requests.py`)** 
- `POST /api/requests`: Validates creation. Default assigns status `PENDING`. Leaves `suggestedVolunteers` empty internally.
- `GET /api/requests`: Returns paginated assistance requests. Automatically merges the assigned Volunteer's name via explicit sub-query resolving.
- `POST /api/requests/<id>/assign/<vid>`: Core logical assignment triggered primarily by Admin matching. Verifies Volunteer is active and isn't logically `BUSY`. Patches AR `status="ASSIGNED"`, Assignment Table created with `match_score=0.95`, Volunteer mutated to `availability="BUSY"`.
- `POST /api/requests/<id>/accept`: Volunteer-initiated assignment. Mirrors admin logic but Assignment status marks `ACCEPTED` and sets `assigned_by="VOLUNTEER"`.
- `POST /api/requests/<id>/complete`: Resolves task. Updates `availability="AVAILABLE"`, increases integer `completed_tasks`, slightly boosts `reliability_score`. Records timestamp.

**C. Artificial Intelligence Inference (`routes/ai.py`)**
- `POST /api/ai/interpret_request`: Receives plain-text, triggers `nlp_service.interpret_request(description)` to extract logical JSON data.
- `GET /api/ai/enhanced/match_volunteers/<id>`: Pulls all active volunteers. Exposes `matching_engine.rank_volunteers(req_dict, vol_dicts, limit=5)` yielding structured predictive heuristic metrics.

**D. WebSockets / Interaction (`socket_events.py`)**
- JWT enabled via `decode_token()`. Handlers include `join_request_room` emitting explicitly to `room: request_{id}` for isolated peer chat. Socket map stores UserID hash references for generic notification drops.


## 5. Current Known Gaps / Incomplete Code

1. **Dual Frontend Service Patterns:**
   - The React frontend has overlapping HTTP configurations. `src/services/api.js` employs a sophisticated, interceptor-driven Axios instance. In juxtaposition, `src/services/authService.js` actively utilizes primitive vanilla `fetch` requests with manual JSON stringification. Cross-contamination between older components querying the `authService` vs native `api` endpoints might trigger subtle race conditions lacking auto-attached JWT headers.
2. **Auto-Verification Override in Auth Route:**
   - In `auth.py`, on creating a user, the backend currently contains hardcoded patches explicitly bypassing verification flows:
     ```python
     user.is_verified = True
     user.verification_status = "VERIFIED"
     ```
     This completely negates the `PendingVerification.jsx` modal and logical frontend admin approval flows, auto-approving any newly uploaded government IDs.
3. **Data Parity between User Dashboard and AI inference:**
   - `UserDashboard.jsx` does NOT exhibit the active AI ranking NLP mapping component exposed flawlessly in `AdminCreateRequest.jsx`. Standard users are forced to manually delineate their service types.
4. **AssistanceRequest Status Enum Integrity:**
   - The API dynamically shifts conditions from `PENDING` -> `ASSIGNED` -> `COMPLETED`, but `Assignment` statuses operate on an isolated plane (`SUGGESTED`, `ACCEPTED`, `DECLINED`). There is theoretical drift between an `AssistanceRequest` reading as PENDING but `Assignments` existing as DECLINED.
5. **No Built-in Websocket Failure Retries:**
   - `SocketIO` initialization exists globally but doesn't handle connection caching or failure fallbacks internally on the React layer if the python eventlet server silently restarts.
6. **Hardcoded Testing Variables Present:**
   - If `AssistanceRequest` data is missing in the `ai.py` matching block, the system silently yields a mock payload ("Sample Requester" in New York). This will crash/fail silently during edge-case orphaned Request searches.
