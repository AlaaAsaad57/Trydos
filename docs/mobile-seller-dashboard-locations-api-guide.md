# Seller Dashboard — Locations, Mobile API Guide

The **Locations** section of the seller dashboard. A location is a shop's own
warehouse or pickup point. The product editor already lets a seller choose a
location for a product, so this screen is what fills that list.

Locations are not covered in the main Seller Dashboard mobile API guide. Read
this file next to it — auth, the response envelope and the permission call are
the same.

---

## Base URL and headers

Same setup as Products, Shop Info and Team.

| Item | Value |
|------|-------|
| Base URL | `{MARKET_API}` |
| Auth | `Authorization: Bearer <MARKET_TOKEN>` |
| Shop | `X-Seller-ID: <sellerId>` |
| Also send | `country` and `lang` headers |

**Envelope:** `{ success, message, data }`. Check `success` — do not trust the
HTTP status alone. Validation errors come back as **422** with
`detailed_error: [{ code, message }]`, where `code` is the field name.

---

## Permissions — gate the screen first

Read them from `GET {MARKET_API}/shop/auth/permissions`, the same call the rest
of the dashboard uses. Four permissions matter here. `SUPER_ADMIN` satisfies all
four.

| What the user may do | Permission | When it is missing |
|---|---|---|
| Open the tab and see the list | `READ_LOCATIONS` | hide the tab, unless another location permission is held |
| "Add location" | `CREATE_LOCATION` | hide the button |
| "Edit" | `UPDATE_LOCATION` | open the form read-only |
| Activate / deactivate | `CHANGE_LOCATION_STATUS` | hide the toggle |

---

## The six endpoints

There is **no delete endpoint**. A location can only be deactivated. Turning it
off does **not** remove it from products that already point at it.

| # | Call | Permission |
|---|---|---|
| 1 | `GET /shop/locations` | `READ_LOCATIONS` |
| 2 | `GET /shop/locations/lookups` | `CREATE_LOCATION` |
| 3 | `POST /shop/locations` | `CREATE_LOCATION` |
| 4 | `GET /shop/locations/{id}/edit` | `READ_LOCATIONS` \| `UPDATE_LOCATION` |
| 5 | `POST /shop/locations/{id}/update` | `UPDATE_LOCATION` |
| 6 | `POST /shop/locations/{id}/change-status` | `CHANGE_LOCATION_STATUS` |

---

### 1. List — `GET /shop/locations`

Query parameters, all optional:

| Name | Values | Note |
|------|--------|------|
| `status` | `1` active, `0` inactive | leave it out for "all" |
| `country_id` | a country id | |
| `page` | `2`, `3`, … | send it only when the page is above 1 |

Newest first. The page size comes from the shop's `pagination_limit` business
setting, not from the request.

```jsonc
{
  "success": true,
  "data": {
    "locations": [
      {
        "id": 12,
        "name": "Main warehouse",
        "address": "Mazzeh, Damascus",
        "latitude": "33.513805",
        "longitude": "36.276527",
        "status": 1,
        "country": { "id": 1, "name": "SYRIA", "nicename": "Syria" },
        "created_at": "2026-07-24T10:11:12.000000Z"
      }
    ],
    "meta": {
      "current_page": 1,
      "last_page": 3,
      "per_page": 10,
      "total": 24,
      "has_more_pages": true
    }
  }
}
```

`address`, `latitude`, `longitude` and `country` can each be `null`.

---

### 2. Create lookups — `GET /shop/locations/lookups`

Reference data for the create form: the active countries that have an active
shipping method.

```jsonc
{
  "success": true,
  "data": {
    "countries": [
      { "id": 1, "name": "SYRIA", "nicename": "Syria", "iso": "SY" }
    ]
  }
}
```

**Do not use this to build a filter list.** It needs `CREATE_LOCATION`, so a
read-only user gets 403. Call it only when the create form opens.

---

### 3. Create — `POST /shop/locations`

```jsonc
{
  "name": "Main warehouse",       // required, max 255
  "country_id": 1,                // required, number
  "address": "Mazzeh, Damascus",  // optional
  "latitude": 33.513805,          // optional, number, -90 .. 90
  "longitude": 36.276527          // optional, number, -180 .. 180
}
```

Rules:

- The owning shop always comes from `X-Seller-ID`. Any owner field in the body is
  ignored.
- A new location starts **active** (`status: 1`). You cannot set `status` here.
- `name` is unique **per shop, per country**. A duplicate returns 422 with
  `detailed_error[].code = "name"`.
- Send `address`, `latitude` and `longitude` only when the user filled them.
  Coordinates are optional — a location can be saved without a map point.

---

### 4. Load the edit form — `GET /shop/locations/{id}/edit`

One call gives the row **and** its country list, so a user who may only update
never has to call the lookups endpoint.

```jsonc
{
  "success": true,
  "data": {
    "location": {
      "id": 12,
      "name": "Main warehouse",
      "address": null,
      "latitude": "33.513805",
      "longitude": "36.276527",
      "status": 1,
      "country": { "id": 1, "nicename": "Syria" }
    },
    "lookups": {
      "countries": [ { "id": 1, "nicename": "Syria" } ]
    }
  }
}
```

A `404` means the location was deleted **or** it belongs to another shop. The two
cases look the same on purpose, so no other shop's data leaks. Close the form and
reload the list.

---

### 5. Update — `POST /shop/locations/{id}/update`

Note the method: **POST**, not PUT.

Same body and same rules as create. The unique-name check ignores this location
itself. **`status` cannot be changed here** — use call 6.

---

### 6. Change status — `POST /shop/locations/{id}/change-status`

```jsonc
// request
{ "status": 0 }        // 0 = inactive, 1 = active

// response
{ "success": true, "data": { "status": 0 } }
```

Use the `status` from the response as the new value of the row. There is no need
to reload the list after a toggle.

---

## Errors

| Status | Meaning | Suggested handling |
|--------|---------|--------------------|
| 403 | missing permission | a "no access" state on the list, an inline message on an action |
| 404 | unknown id, or another shop's id | close the form and reload the list |
| 422 | validation failed | bind `detailed_error[].code` to that form field |

Check before sending: `name` is required (max 255), `country_id` is required,
`latitude` is between −90 and 90, `longitude` is between −180 and 180.

---

## Four traps

1. **`latitude` and `longitude` come back as strings.** They are decimal columns
   in the database. Parse them before any maths, and before handing them to a
   map. Send them back as **numbers**.
2. **`status=0` is a real filter.** Test for "not set", not for "falsy". A falsy
   test drops the "inactive" filter with no error.
3. **Never build the country filter from `/lookups`.** That call is create-gated.
   Build the filter from the `country` objects on the locations you already
   loaded.
4. **The name clash is per country.** When 422 says `name`, changing either the
   name or the country clears it.

---

## How the website behaves today

Useful as a reference, not as a rule for mobile:

- The list filters by **status only**. The endpoint also accepts `country_id`, so
  a mobile screen may add that filter.
- There is no delete action anywhere, because there is no endpoint.
- The map is an aid, not a requirement. Latitude and longitude stay editable
  number fields under the map, and both may be left empty.

## Open point

The full backend field limits are not published in a contract document. Ask the
backend team if you need more than the checks listed above.
