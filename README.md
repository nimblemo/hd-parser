# Human Design Parser Pipeline

A toolset for scraping, parsing, and aggregating Human Design profile data into a unified database.

## Project Structure

- `scripts/` — JavaScript tools for data collection and processing.
- `data/` — Raw profile JSONs and reference metadata.
- `data/profiles/` — Raw data for 366 days (collected via scrapers).
- `data/gates_database.json` — **The final output database.**

## Prerequisites

- Node.js
- npm dependencies: `axios`, `cheerio`, `axios-cookiejar-support`, `tough-cookie`

Install dependencies:
```bash
npm install
```

## Sequence of Operations

Follow these steps to regenerate the database from scratch:

### 1. Synchronize Metadata (Optional)
Updates Zodiac signs and astronomical degrees in `data/gates_to_centers.json` based on the mapping in `data/gates.md`.
```bash
node scripts/sync_gate_metadata.js
```

### 2. Collect Profile Data
Scrapes all 366 possible profile configurations from the source website.
> [!NOTE]
> This takes significant time due to required delays between requests.
```bash
node scripts/collect_all_dates.js
```

### 3. Generate Unified Database
Merges all collected profile JSONs and reference data into a single structured file.
```bash
node scripts/merge_gates.js
```

The result will be saved to `data/gates_database.json`.
