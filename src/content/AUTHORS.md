# Adding places and events (no code required)

Editors can add or change listings by creating or editing **Markdown** files in this folder.

## Places

Put each place in `places/` as a `.md` file. The **filename** becomes the URL slug (e.g. `cadillac-ranch.md` → `/places/cadillac-ranch`).

Start the file with YAML between `---` lines, then the article body in Markdown.

**Required fields**

- `title`, display name  
- `city`  
- `region`, must be one of: Panhandle, West Texas, Hill Country, Central Texas, DFW, East Texas, Gulf Coast, South Texas, Big Bend  
- `lat` / `lng`, decimal coordinates (look them up in Google Maps → right‑click → coordinates)

**Optional fields**

- `tags`, list in square brackets, e.g. `[art, roadside]`  
- `featured`, `true` to show on the home page  
- `teaser`, one-line blurb for cards  
- `address`, street or directions string  

## Events

Same idea in `events/`, with these **required** fields:

- `title`, `city`, `region`, `lat`, `lng`  
- `starts`, start date as `YYYY-MM-DD`  
- `ends`, optional end date (same format) for multi-day events  

Optional: `tags`, `featured`, `teaser`.

## After saving

If the site is deployed from Git, commit your new `.md` file and push; the build will pick it up. For local preview, run `npm run dev` from the project root.
