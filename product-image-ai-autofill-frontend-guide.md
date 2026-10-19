# Fill Product Info from a Photo with AI — How It Works

This note explains the "Fill with AI" scenario on the add-product page. It
describes the flow, what we send to the AI, what comes back, and which model we
use. It does not describe any code, so you can decide how to build the
front-end side yourself.

## 1. What the feature does

The user uploads a product photo, then clicks a **"Fill with AI"** button. The
AI looks at the photo and suggests:

- the product **name** (title)
- a short **description**
- the **brand**
- the **category**, the **sub-category** and the **sub-sub-category**

The AI only **suggests** values. It never saves anything. The user checks the
values, edits them if needed, and then submits the normal product form.

## 2. Where it is used today

- Admin panel: the "Add new product" page.
- Seller panel: the "Add new product" page.

Edit pages, bulk import and other product screens do not have it.

## 3. The AI model

| Item | Value |
|---|---|
| Provider | Google Gemini |
| Model | `gemini-2.5-flash` |
| Output | Structured output (a fixed set of fields, not free text) |
| Output language | Always English, whatever text appears in the photo |

## 4. The scenario, step by step

### Step 1 — The user uploads a photo

The user uploads the product images with the normal image uploader. The images
go to our **media server**. The **first image** is the main image, and it is
the one the AI reads.

### Step 2 — The user clicks "Fill with AI"

The AI never runs by itself. It only runs when the user clicks the button.

Before the call, the page checks two things:

1. **Is there an image?** If no image has been uploaded yet, the page shows an
   error message and stops.
2. **Will something be overwritten?** If the user has already filled any of
   these fields: name, description, brand, category, sub-category or
   sub-sub-category, the page asks for one confirmation that lists every field
   that will be replaced. If the user cancels, nothing happens.

### Step 3 — The page sends the image to the backend

The page sends **only one value**: the main image, as it was stored by the
media server (the file name, or the full media-server link).

The page does **not** send the brand or category lists. The backend builds
them itself.

While the request runs, the button is disabled and a loading spinner is shown.

### Step 4 — The backend checks the image

- The image must be on **our media server**. A link to any other website is
  refused (the user gets a "the image must be uploaded to the media server"
  error).
- The backend turns the stored file name into the full public link of the
  image.

### Step 5 — The backend prepares the lists for the AI

The backend loads, from the database:

- all **active brands** (id + name)
- all **active categories**, split into three levels:
  - top categories: id + name, for example `Clothes`
  - sub-categories: id + full path, for example `Clothes > Men`
  - sub-sub-categories: id + full path, for example `Clothes > Men > T-Shirts`

The full path helps the AI understand which child belongs to which parent.

### Step 6 — The backend sends everything to Gemini

**What we send to Gemini:**

1. **The photo**, as a public link to the image on our media server, with its
   image type (JPEG, PNG or WebP). Gemini downloads the photo from that link.
2. **The instructions**, which tell Gemini to:
   - write a short, marketable **title** (at most 100 characters)
   - write a short, factual **description** (2 to 4 sentences)
   - always write in **English**
   - describe only what is **visible** in the photo, and never invent sizes,
     materials, specifications or prices
   - choose the brand and the categories **only from the lists we send**
   - keep the category levels consistent: the sub-category must be under the
     chosen category, and the sub-sub-category must be under the chosen
     sub-category
   - return "nothing" (empty) for any field it cannot match, instead of
     guessing
3. **The brand list** and the **three category lists** from Step 5.
4. **The answer format**: Gemini must reply with exactly these six fields, and
   every id it returns must be one of the ids in the lists.

**What we do not send:** no user data, no seller data, no prices, no stock, and
no other product information. Only the photo and the lists of brands and
categories.

### Step 7 — The backend double-checks the AI answer

The AI can still make mistakes, so the backend checks the answer before it goes
back to the page:

- A brand or category id that is not in the lists → removed (empty).
- No category chosen → sub-category and sub-sub-category are also emptied.
- A sub-category that is not under the chosen category → emptied.
- A sub-sub-category that is not under the chosen sub-category → emptied.
- The title is cut to 255 characters (the limit of the product name field).
- Empty text → returned as empty.

So the page can trust that every id it receives is a real, active option and
that the three category levels fit together.

### Step 8 — The backend replies to the page

The reply has six fields. Any of them can be empty when the AI could not
decide:

| Field | Meaning |
|---|---|
| title | Suggested product name |
| description | Suggested description (plain text) |
| brand_id | Id of the suggested brand |
| category_id | Id of the top category |
| sub_category_id | Id of the sub-category (under `category_id`) |
| sub_sub_category_id | Id of the sub-sub-category (under `sub_category_id`) |

### Step 9 — The page fills the form

1. Put the title in the **name** field.
2. Put the description in the **description** editor.
3. Select the **brand**.
4. Fill the categories **in order, one level at a time**:
   1. Select the top category.
   2. Load the sub-categories of that category (the same way the form already
      loads them when the user picks a category by hand), then select the
      sub-category.
   3. Load the sub-sub-categories of that sub-category, then select the
      sub-sub-category.

   The order matters: a level's options must be loaded before you can select
   a value in it. Take care that loading the next level does not clear the
   value you just selected.
5. Scroll to the name field and show a success message.

The user can now change any value and then save the product as usual.

### Step 10 — When something goes wrong

The button is always enabled again and the spinner hidden, whether the call
worked or failed.

| Situation | What the backend returns | What the user sees |
|---|---|---|
| No image sent | Validation error (422) | Error message |
| Image is not on our media server | Error (422) | "The image must be uploaded to the media server" |
| Gemini is overloaded | Service busy (503) | "The AI service is busy right now. Please try again in a moment." |
| Any other AI failure (photo not reachable, AI error, ...) | Server error (500) | "AI analysis failed" |
| Too many clicks | Too many requests (429) | Error message |

## 5. Limits and things to know

- **Rate limit:** each user can call the AI at most **10 times per minute**.
- **The photo must be public:** Gemini downloads the photo from our media
  server, so the image must be uploaded there first.
- **Only the main image** (the first one) is analysed.
- **Region:** the Gemini API refuses calls from some countries. In some places
  the backend must run behind a VPN or proxy for the feature to work.
- **Quality:** the AI may still choose a category that is odd for the product.
  The backend only guarantees that the ids are valid and fit together, not
  that the choice is perfect. That is why the user always reviews the values
  before saving.
- **Language:** the text is always in English. There is no automatic
  translation into other languages.
- **Access:** today the feature is part of the admin and seller web panels,
  and it uses their logged-in session. If the React app needs it, it will need
  its own endpoint on the API side. Ask the backend team for it.
