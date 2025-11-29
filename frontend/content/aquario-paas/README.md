# PAAS Local Data

This directory contains local backup JSON files for PAAS (calendar) data.

## Usage

When the external PAAS API (https://sa.ci.ufpb.br/api/paas/center) is unavailable, the application will automatically fall back to using the local JSON file from this directory.

## File Location

Place your downloaded PAAS JSON file here:

- `frontend/content/aquario-paas/paas-data.json` (or any `.json` file)

The file should contain the raw JSON response from the PAAS API endpoint:

```
GET https://sa.ci.ufpb.br/api/paas/center?id=CI
```

## How It Works

1. The application always tries to fetch from the external API first
2. If the API request fails, it automatically falls back to the local JSON file
3. If both fail, an error is shown to the user

## Updating the Local File

Download the latest data weekly and replace the JSON file in this directory to keep the fallback data up to date.
