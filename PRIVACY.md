# Privacy Policy — Cleaner Pro+

**Last Updated:** 2025-06-28

## Overview

Cleaner Pro+ is a browser extension that removes UI elements (buttons, links, etc.) from web pages based on user-defined keywords. This extension is designed with privacy as a priority.

## Data Collection

**Cleaner Pro+ does NOT collect, store, or transmit any personal data.**

Specifically, this extension does **not** collect:

- Personal identity information (name, email, address, etc.)
- Health, financial, or authentication information
- Location or IP address data
- Browsing history or web activity
- Keyboard input, mouse movements, clicks, or scrolling behavior
- Website content (text, images, videos, etc.)

## Local Storage Only

The extension uses `chrome.storage.sync` to save the following **user-configured settings only**:

| Data | Purpose |
|------|---------|
| Keyword list | Words that trigger element removal |
| Domain whitelist | Sites excluded from cleaning |
| Enabled/disabled state | The on/off toggle |

This data is stored locally in the browser and synced via the user's Chrome profile. It is never sent to any external server.

## No Remote Code

All extension code runs locally in the browser. No external scripts, APIs, analytics, or tracking services are loaded or contacted.

## No Third-Party Sharing

No data of any kind is sold, transferred, or shared with any third party.

## Permissions

| Permission | Purpose |
|------------|---------|
| `storage` | Save user settings (keywords, whitelist, on/off state) |
| `activeTab` | Communicate between popup and the active tab |
| `tabs` | Query active tab to send/receive messages |
| `scripting` | Inject the content script that removes matched elements |
| `content_scripts (all URLs)` | Run the cleaner on any website the user visits |

## Changes to This Policy

If this privacy policy is updated, the changes will be reflected in this document with an updated date.

## Contact

If you have any questions about this privacy policy, please open an issue on the [GitHub repository](https://github.com/zjrcome/cleaner-pro-plus).

