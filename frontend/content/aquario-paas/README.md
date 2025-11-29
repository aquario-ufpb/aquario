# PAAS Local Data

This directory contains local backup JSON files for PAAS (calendar) data.

## Usage

When the external PAAS API (https://sa.ci.ufpb.br/api/paas/center) is unavailable, the application will automatically fall back to using the local JSON file from this directory.

## File Location

The local PAAS data file is located at:

- `frontend/content/aquario-paas/saci.json`

The file contains the raw JSON response from the PAAS API endpoint:

```
GET https://sa.ci.ufpb.br/api/paas/center?id=CI
```

## How It Works

1. The application always tries to fetch from the external API first
2. If the API request fails (or times out after 5 seconds), it automatically falls back to the local JSON file
3. If both fail, an error is shown to the user

## Automatic Updates

The local PAAS data file (`saci.json`) is **automatically updated weekly** by a GitHub Actions workflow:

- **Schedule**: Runs every Monday at 2 AM UTC
- **Manual trigger**: Can also be triggered manually from the GitHub Actions tab
- **Workflow**: `.github/workflows/update-paas-data.yml`

The workflow downloads the latest data from the external API and commits it if there are changes. If the API is unavailable, the workflow gracefully skips the update without failing.

## Manual Updates

If you need to manually update the file:

1. Download the latest data from: `https://sa.ci.ufpb.br/api/paas/center?id=CI`
2. Save it as `saci.json` in this directory
3. Commit and push the changes

Or trigger the GitHub Actions workflow manually from the Actions tab.
