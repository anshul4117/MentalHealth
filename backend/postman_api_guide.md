# MindPulse API — Postman Guide

> **Base URL**: `http://localhost:4000`

---

## 🔐 1. AUTH ENDPOINTS

### 1.1 Register Student
| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{base_url}}/api/auth/register` |
| **Headers** | `Content-Type: application/json` |

**Body (raw JSON):**
```json
{
  "email": "student@example.com",
  "password": "test123",
  "course": "MCA"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful. Save your Unique ID — it's your anonymous identity.",
  "uniqueId": "MP-3558-T",
  "user": {
    "uniqueId": "MP-3558-T",
    "course": "MCA",
    "role": "student",
    "createdAt": "2026-03-21T08:38:38.260Z"
  },
  "token": "eyJhbGciOiJIUz..."
}
```

---

### 1.2 Register Counsellor
| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{base_url}}/api/auth/register` |
| **Headers** | `Content-Type: application/json` |

**Body (raw JSON):**
```json
{
  "email": "counsellor@college.edu",
  "password": "secure123",
  "course": "Psychology",
  "role": "counsellor"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful. Save your Unique ID — it's your anonymous identity.",
  "uniqueId": "MP-7291-K",
  "user": {
    "uniqueId": "MP-7291-K",
    "course": "Psychology",
    "role": "counsellor",
    "createdAt": "2026-03-21T08:45:00.000Z"
  },
  "token": "eyJhbGciOiJIUz..."
}
```

---

### 1.3 Login (Email OR UniqueID)
| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{base_url}}/api/auth/login` |
| **Headers** | `Content-Type: application/json` |

**Body — Login with Email:**
```json
{
  "identifier": "student@example.com",
  "password": "test123"
}
```

**Body — Login with UniqueID:**
```json
{
  "identifier": "MP-3558-T",
  "password": "test123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful.",
  "uniqueId": "MP-3558-T",
  "user": {
    "uniqueId": "MP-3558-T",
    "course": "MCA",
    "role": "student",
    "createdAt": "2026-03-21T08:38:38.260Z"
  },
  "token": "eyJhbGciOiJIUz..."
}
```

> ⚠️ **Save the `token` value** — needed for all subsequent requests as `Bearer` token.

---

### 1.4 Get Profile
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{base_url}}/api/auth/me` |
| **Headers** | `Authorization: Bearer {{student_token}}` |

**Response (200):**
```json
{
  "success": true,
  "user": {
    "uniqueId": "MP-3558-T",
    "course": "MCA",
    "role": "student",
    "createdAt": "2026-03-21T08:38:38.260Z"
  }
}
```

> 🔒 **Note**: No email is ever returned — privacy by design.

---

## 🎓 2. STUDENT ENDPOINTS (JWT Required)

> **Set Header for ALL student requests**: `Authorization: Bearer {{student_token}}`

### 2.1 Submit Mood Check-in
| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{base_url}}/api/checkin` |
| **Headers** | `Authorization: Bearer {{student_token}}`, `Content-Type: application/json` |

**Body (raw JSON):**
```json
{
  "mood": 2,
  "sleep": 4,
  "stress": 8,
  "note": "Exam stress, feeling overwhelmed",
  "department": "Computer Science"
}
```

**Field Rules:**
| Field | Type | Range | Required |
|-------|------|-------|----------|
| mood | number | 1–5 | ✅ |
| sleep | number | 0–12 | ✅ |
| stress | number | 0–10 | ✅ |
| note | string | max 500 chars | ❌ |
| department | string | see list below | ❌ |
| year | number | 1–6 | ❌ |

**Allowed departments:** `Computer Science`, `Engineering`, `Medicine`, `Law`, `Psychology`, `Business`, `General`

**Response (201):**
```json
{
  "success": true,
  "message": "Check-in recorded successfully",
  "checkin": {
    "uniqueId": "MP-3558-T",
    "mood": 2,
    "sleep": 4,
    "stress": 8,
    "note": "Exam stress, feeling overwhelmed",
    "department": "Computer Science",
    "createdAt": "2026-03-21T08:40:05.976Z"
  }
}
```

---

### 2.2 Get Survey History (No Filter)
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{base_url}}/api/checkin/history` |
| **Headers** | `Authorization: Bearer {{student_token}}` |

**Response (200):**
```json
{
  "success": true,
  "filter": "recent",
  "summary": {
    "totalCheckins": 2,
    "avgMood": 2.5,
    "avgStress": 6.5,
    "avgSleep": 5,
    "lastCheckin": "2026-03-21T08:40:06.046Z",
    "period": "recent"
  },
  "checkins": [
    {
      "tokenId": "MP-3558-T",
      "mood": 3,
      "sleep": 6,
      "stress": 5,
      "note": "",
      "department": "Computer Science",
      "year": 1,
      "createdAt": "2026-03-21T08:40:06.046Z"
    }
  ]
}
```

---

### 2.3 Get History — Monthly Filter
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{base_url}}/api/checkin/history?filter=monthly&month=3&year=2026` |
| **Headers** | `Authorization: Bearer {{student_token}}` |

---

### 2.4 Get History — Yearly Filter
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{base_url}}/api/checkin/history?filter=yearly&year=2026` |
| **Headers** | `Authorization: Bearer {{student_token}}` |

---

### 2.5 Get History — Custom Date Range
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{base_url}}/api/checkin/history?filter=custom&from=2026-03-01&to=2026-03-21` |
| **Headers** | `Authorization: Bearer {{student_token}}` |

---

### 2.6 Get Counsellor Messages
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{base_url}}/api/checkin/messages` |
| **Headers** | `Authorization: Bearer {{student_token}}` |

**Response (200):**
```json
{
  "success": true,
  "unreadCount": 1,
  "messages": [
    {
      "_id": "...",
      "tokenId": "MP-3558-T",
      "content": "We noticed you've been stressed. Our counselling center is open Mon-Fri.",
      "fromCounsellor": true,
      "read": false,
      "createdAt": "2026-03-21T09:00:00.000Z"
    }
  ]
}
```

---

### 2.7 Delete All My Data
| | |
|---|---|
| **Method** | `DELETE` |
| **URL** | `{{base_url}}/api/checkin/data` |
| **Headers** | `Authorization: Bearer {{student_token}}` |

**Response (200):**
```json
{
  "success": true,
  "message": "All your data has been permanently deleted.",
  "deleted": {
    "checkins": 5,
    "alerts": 1,
    "messages": 2
  }
}
```

---

## 👨‍⚕️ 3. COUNSELLOR ENDPOINTS (JWT + Counsellor Role Required)

> **Set Header for ALL counsellor requests**: `Authorization: Bearer {{counsellor_token}}`
>
> 🚫 Student tokens will get `403 Forbidden` on these routes.

### 3.1 Get Dashboard
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{base_url}}/api/dashboard` |
| **Headers** | `Authorization: Bearer {{counsellor_token}}` |

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalCheckins": 15,
    "atRiskCount": 2,
    "avgMood": 3.2,
    "interventions": 1
  },
  "recentCheckins": [
    {
      "tokenId": "MP-3558-T",
      "department": "Computer Science",
      "mood": 2,
      "stress": 8,
      "sleep": 4,
      "createdAt": "2026-03-21T08:40:05.976Z"
    }
  ],
  "alerts": [
    {
      "tokenId": "MP-3558-T",
      "department": "Computer Science",
      "severity": "high",
      "reason": "Critical: Avg mood 1.8, 3 consecutive low days",
      "avgMood": 1.8,
      "createdAt": "2026-03-21T08:45:00.000Z"
    }
  ],
  "moodTrend": [
    {
      "date": "8 Mar",
      "mood": 3.5,
      "stress": 5.2,
      "sleep": 6.1,
      "checkins": 4,
      "threshold": 2.5
    }
  ]
}
```

> 🔒 **Counsellor sees only `tokenId` (UniqueID)** — never email or personal info.

---

### 3.2 Send Message to Student
| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{base_url}}/api/dashboard/message` |
| **Headers** | `Authorization: Bearer {{counsellor_token}}`, `Content-Type: application/json` |

**Body (raw JSON):**
```json
{
  "tokenId": "MP-3558-T",
  "message": "We noticed you've been stressed. Our counselling center is open Mon-Fri 10am-4pm.",
  "urgent": false
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Anonymous message sent to student.",
  "data": {
    "tokenId": "MP-3558-T",
    "content": "We noticed you've been stressed...",
    "createdAt": "2026-03-21T09:00:00.000Z"
  }
}
```

---

### 3.3 Resolve Alert
| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{base_url}}/api/dashboard/resolve/{{alertId}}` |
| **Headers** | `Authorization: Bearer {{counsellor_token}}` |

**Response (200):**
```json
{
  "success": true,
  "message": "Alert resolved successfully."
}
```

---

### 3.4 Get Analytics
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{base_url}}/api/dashboard/analytics` |
| **Headers** | `Authorization: Bearer {{counsellor_token}}` |

**Response (200):**
```json
{
  "success": true,
  "moodByDept": [
    {
      "department": "Computer Science",
      "avgMood": 2.5,
      "avgStress": 6.5,
      "avgSleep": 5,
      "checkins": 10
    }
  ],
  "totalCheckins": 25,
  "totalResolved": 3
}
```

---

## ❌ ERROR RESPONSES

| Status | Meaning | Example |
|--------|---------|---------|
| `400` | Bad request / validation error | `{"success": false, "error": "mood must be between 1 and 5."}` |
| `401` | Not authenticated | `{"success": false, "error": "Not authorized. Please login to access this resource."}` |
| `403` | Wrong role | `{"success": false, "error": "Access denied. Required role: counsellor."}` |
| `404` | Not found | `{"success": false, "error": "Alert not found."}` |
| `409` | Duplicate entry | `{"success": false, "error": "An account with this email already exists."}` |
| `429` | Rate limited | `{"success": false, "error": "Too many requests. Please try again after 15 minutes."}` |

---

## ⚙️ POSTMAN SETUP

1. Create a **Variable** called `base_url` = `http://localhost:4000`
2. Register a student → copy `token` → save as **Variable** `student_token`
3. Register a counsellor → copy `token` → save as **Variable** `counsellor_token`
4. For all auth-required requests, add Header: `Authorization: Bearer {{student_token}}` or `{{counsellor_token}}`
