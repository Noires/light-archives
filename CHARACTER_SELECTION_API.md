# Character Selection API - Quick Reference

## Overview

All content creation endpoints now accept `characterId` for character selection.

## Endpoints

### Create Event
```http
POST /api/internal/events
Content-Type: application/json
Authorization: Bearer <token>

{
  "characterId": 123,
  "title": "My Event",
  "details": "Event details...",
  "startDateTime": 1234567890,
  ...
}
```

**Legacy (still supported):**
```http
POST /api/internal/events?characterId=123
```

### Create Venue
```http
POST /api/internal/venues
Content-Type: application/json
Authorization: Bearer <token>

{
  "characterId": 123,
  "name": "My Venue",
  "description": "Venue description...",
  "server": "Odin",
  ...
}
```

**Legacy (still supported):**
```json
{
  "owner": "Character Name",
  "ownerServer": "Odin",
  "name": "My Venue",
  ...
}
```

### Create Noticeboard Item
```http
POST /api/internal/noticeboard
Content-Type: application/json
Authorization: Bearer <token>

{
  "characterId": 123,
  "title": "Looking for RP",
  "content": "Content here...",
  "location": "LIMSA_LOMINSA"
}
```

**Legacy (still supported):**
```json
{
  "author": "Character Name",
  "authorServer": "Odin",
  ...
}
```

### Create Story
```http
POST /api/internal/stories
Content-Type: application/json
Authorization: Bearer <token>

{
  "characterId": 123,
  "title": "My Story",
  "content": "Story content...",
  "type": "STORY",
  "tags": ["adventure", "drama"]
}
```

**Legacy (still supported):**
```json
{
  "author": "Character Name",
  "authorServer": "Odin",
  ...
}
```

### Create Community
```http
POST /api/internal/communities
Content-Type: application/json
Authorization: Bearer <token>

{
  "characterId": 123,
  "name": "My Community",
  "description": "Community description...",
  "goal": "Community goals...",
  ...
}
```

**Legacy (still supported):**
```json
{
  "owner": "Character Name",
  "ownerServer": "Odin",
  ...
}
```

### Create Free Company
```http
POST /api/internal/free-companies
Content-Type: application/json
Authorization: Bearer <token>

{
  "characterId": 123,
  "name": "My FC",
  ...
}
```

### Upload Image
```http
POST /api/internal/images/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

characterId: 123
file: <binary data>
...
```

## Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| `200` / `201` | Success | Content created |
| `400` | Bad Request | Check characterId and other required fields |
| `401` | Unauthorized | Login required |
| `403` | Forbidden | Character doesn't belong to user |
| `404` | Not Found | Resource not found |

## Common Error Messages

```json
// Missing characterId
{
  "statusCode": 400,
  "message": "characterId is required (in body or query)"
}

// Character not verified or doesn't exist
{
  "statusCode": 400,
  "message": "Invalid character ID or character not verified"
}

// Character doesn't belong to authenticated user
{
  "statusCode": 403,
  "message": "Invalid character id"
}
```

## Getting Character ID

Character IDs are available from the `/api/internal/user` endpoint:

```http
GET /api/internal/user
Authorization: Bearer <token>
```

```json
{
  "id": 456,
  "username": "username",
  "characters": [
    {
      "id": 123,
      "name": "Character Name",
      "server": {
        "id": 1,
        "name": "Odin"
      },
      "verified": true,
      "verifiedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

Use `characters[].id` for the `characterId` field.

## Validation Rules

- ✅ Character must exist
- ✅ Character must belong to authenticated user
- ✅ Character must be verified (`verified: true`)
- ✅ User must be authenticated

## Notes

- **Backward compatible:** Legacy name-based fields still work
- **Recommended:** Use `characterId` for new implementations
- **Character renames:** ID-based approach is immune to character renames
- **Performance:** ID-based lookups are faster than name+server lookups
- **Type safety:** `characterId` is a number, not a string
