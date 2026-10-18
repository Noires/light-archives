# Frontend Migration Guide - Unified Character Selection

## Overview

The backend API has been updated to support a unified character selection approach using `characterId`. This guide helps frontend developers migrate from the legacy name-based approach to the new ID-based approach.

## What Changed

### Before (Legacy - Still Works)

Different content types used different fields:

```typescript
// Events - query parameter
POST /api/internal/events?characterId=123
{
  "title": "My Event",
  ...
}

// Venues - owner/ownerServer
POST /api/internal/venues
{
  "owner": "Character Name",
  "ownerServer": "Odin",
  "name": "My Venue",
  ...
}

// Stories - author/authorServer
POST /api/internal/stories
{
  "author": "Character Name",
  "authorServer": "Odin",
  "title": "My Story",
  ...
}
```

### After (Recommended)

All content types use `characterId` in the request body:

```typescript
// Events
POST /api/internal/events
{
  "characterId": 123,
  "title": "My Event",
  ...
}

// Venues
POST /api/internal/venues
{
  "characterId": 123,
  "name": "My Venue",
  ...
}

// Stories
POST /api/internal/stories
{
  "characterId": 123,
  "title": "My Story",
  ...
}
```

## Migration Steps

### 1. Identify Character Selection in Your Code

Find all places where users select a character for content creation:
- Event creation forms
- Venue creation forms
- Noticeboard item creation
- Story creation
- Community creation
- Free company creation
- Image uploads

### 2. Update TypeScript Interfaces

Update your DTO interfaces to include `characterId`:

```typescript
// Before
interface VenueCreateDto {
  owner: string;
  ownerServer: string;
  name: string;
  // ... other fields
}

// After (both fields optional during transition)
interface VenueCreateDto {
  characterId?: number;  // Add this
  owner?: string;        // Make optional
  ownerServer?: string;  // Make optional
  name: string;
  // ... other fields
}
```

### 3. Update API Calls

#### Option A: Gradual Migration (Recommended)

Add `characterId` while keeping legacy fields:

```typescript
// Vuex action or API service
async createVenue({ commit }, venueData) {
  const payload = {
    ...venueData,
    characterId: this.selectedCharacter.id,  // Add this
    // Keep legacy fields for now
    owner: this.selectedCharacter.name,
    ownerServer: this.selectedCharacter.server.name,
  };
  
  const response = await axios.post('/api/internal/venues', payload);
  commit('ADD_VENUE', response.data);
}
```

#### Option B: Clean Migration

Remove legacy fields entirely:

```typescript
async createVenue({ commit }, venueData) {
  const payload = {
    ...venueData,
    characterId: this.selectedCharacter.id,  // Use this
    // Remove: owner, ownerServer
  };
  
  const response = await axios.post('/api/internal/venues', payload);
  commit('ADD_VENUE', response.data);
}
```

### 4. Get Character ID from User Context

Character IDs are available in the user's JWT token and character list:

```typescript
// From Vuex store
const characterId = this.$store.state.user.characters[0].id;

// From component data
computed: {
  selectedCharacterId(): number {
    return this.selectedCharacter?.id || this.user.characters[0]?.id;
  }
}

// From character selection
<select v-model="selectedCharacterId">
  <option 
    v-for="char in user.characters" 
    :key="char.id" 
    :value="char.id"
  >
    {{ char.name }} ({{ char.server.name }})
  </option>
</select>
```

## Content Type Reference

| Content Type | Endpoint | Old Fields | New Field | Status |
|--------------|----------|------------|-----------|---------|
| **Events** | `POST /api/internal/events` | Query param | `characterId` in body | Both supported |
| **Venues** | `POST /api/internal/venues` | `owner`, `ownerServer` | `characterId` | Both supported |
| **Noticeboard** | `POST /api/internal/noticeboard` | `author`, `authorServer` | `characterId` | Both supported |
| **Stories** | `POST /api/internal/stories` | `author`, `authorServer` | `characterId` | Both supported |
| **Communities** | `POST /api/internal/communities` | `owner`, `ownerServer` | `characterId` | Both supported |
| **Free Companies** | `POST /api/internal/free-companies` | `characterId` | `characterId` | Already correct |
| **Images** | `POST /api/internal/images/upload` | `characterId` | `characterId` | Already correct |

## Error Handling

### New Error Messages

```typescript
// 400 Bad Request
{
  "statusCode": 400,
  "message": "characterId is required (in body or query)"
}

// 400 Bad Request - Invalid character
{
  "statusCode": 400,
  "message": "Invalid character ID or character not verified"
}

// 403 Forbidden - Not your character
{
  "statusCode": 403,
  "message": "Invalid character id"
}
```

### Update Error Handling

```typescript
try {
  await createVenue(venueData);
} catch (error) {
  if (error.response?.status === 400) {
    // Handle validation errors
    if (error.response.data.message.includes('characterId')) {
      this.showError('Please select a character');
    } else if (error.response.data.message.includes('not verified')) {
      this.showError('This character is not verified');
    }
  } else if (error.response?.status === 403) {
    this.showError('You do not own this character');
  }
}
```

## Testing Checklist

After migration, test:

- [ ] Create event with characterId
- [ ] Create venue with characterId
- [ ] Create noticeboard item with characterId
- [ ] Create story with characterId
- [ ] Create community with characterId
- [ ] Upload image with characterId
- [ ] Create free company with characterId
- [ ] Error handling for unverified character
- [ ] Error handling for character not owned by user
- [ ] Character selection dropdown works
- [ ] Default character selection works

## Example: Complete Component Migration

### Before:

```vue
<script>
export default {
  data() {
    return {
      venueForm: {
        owner: '',
        ownerServer: '',
        name: '',
        description: '',
      }
    };
  },
  methods: {
    async createVenue() {
      this.venueForm.owner = this.selectedCharacter.name;
      this.venueForm.ownerServer = this.selectedCharacter.server.name;
      
      await this.$axios.post('/api/internal/venues', this.venueForm);
    }
  }
}
</script>
```

### After:

```vue
<script>
export default {
  data() {
    return {
      selectedCharacterId: null,
      venueForm: {
        name: '',
        description: '',
      }
    };
  },
  mounted() {
    // Select first character by default
    if (this.user.characters.length > 0) {
      this.selectedCharacterId = this.user.characters[0].id;
    }
  },
  methods: {
    async createVenue() {
      const payload = {
        ...this.venueForm,
        characterId: this.selectedCharacterId,
      };
      
      await this.$axios.post('/api/internal/venues', payload);
    }
  }
}
</script>
```

## Benefits of Migration

- ✅ **Immune to renames** - Character IDs don't change when names change
- ✅ **More efficient** - Faster database lookups
- ✅ **Type-safe** - Numbers vs strings
- ✅ **Consistent** - Same pattern across all content types
- ✅ **Simpler** - One field instead of two (name + server)

## Rollback

If issues arise:
1. **Backend supports legacy fields** - no urgency to revert
2. **Revert frontend changes** - switch back to name/server fields
3. **Backend remains backward compatible** - both approaches work

## Questions?

See [`IMPLEMENTATION_SUMMARY.md`](./IMPLEMENTATION_SUMMARY.md) for complete backend implementation details.
