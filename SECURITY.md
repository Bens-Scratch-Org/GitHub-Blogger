# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Fixes

### 2026-03-13 - Update 2

#### All Code Scanning Alerts Resolved ✅

All code scanning security alerts have been fixed:

1. **Incomplete Script Tag Sanitization** (js/incomplete-multi-character-sanitization)
   - **Severity**: Warning
   - **Fixed in**: commit 656a5a3
   - Enhanced `stripHtml()` function with improved regex patterns
   - Now handles tags with whitespace (e.g., `</script >`)
   - Uses `[\s\S]*?` for proper multiline matching
   - Completely removes script and style tags before HTML stripping

2. **Bad Tag Filter** (js/bad-tag-filter)
   - **Severity**: Warning
   - **Fixed in**: commit 656a5a3
   - Improved regex to match all script tag variations including those with spaces before closing brackets

3. **Double-Escaping Issue** (js/double-escaping)
   - **Severity**: Warning
   - **Fixed in**: commit 63c287f
   - Reordered HTML entity decoding to process `&amp;` last
   - Prevents double-unescaping of content

4. **Missing Rate Limiting** (js/missing-rate-limiting)
   - **Severity**: Warning
   - **Fixed in**: commits 63c287f and 656a5a3
   - Added rate limiting to all API routes: 100 requests per 15 minutes
   - Added stricter rate limiting to refresh endpoint: 5 requests per 5 minutes
   - Added rate limiting to page routes: 30 requests per minute
   - Protects against abuse and DoS attacks

### 2026-03-13 - Initial Fixes

_Note: The following issues were initially addressed but required additional refinement (see Update 2 above for final fixes)_

1. **Incomplete Script Tag Sanitization** (js/incomplete-multi-character-sanitization)
   - **Severity**: Warning
   - **Initial fix in**: commit 63c287f
   - **Final fix in**: commit 656a5a3
   - Improved `stripHtml()` function to properly remove `<script>` and `<style>` tags with their content before stripping other HTML tags
   - This prevents potential HTML injection vulnerabilities

2. **Double-Escaping Issue** (js/double-escaping)
   - **Severity**: Warning
   - **Fixed in**: commit 63c287f
   - Reordered HTML entity decoding to process `&amp;` last, preventing double-unescaping
   - Ensures proper handling of encoded content

3. **Missing Rate Limiting** (js/missing-rate-limiting)
   - **Severity**: Warning
   - **Initial fix in**: commit 63c287f
   - **Complete fix in**: commit 656a5a3
   - Added rate limiting to all API routes: 100 requests per 15 minutes
   - Added stricter rate limiting to refresh endpoint: 5 requests per 5 minutes
   - Added page route rate limiting: 30 requests per minute
   - Protects against abuse and DoS attacks

#### Known Issues

1. **glib 0.18.5 Vulnerability** (GHSA-wrw7-89jp-8q8g)
   - **Severity**: Medium (CVSS: 0)
   - **Status**: Acknowledged, not exploitable in this application
   - **Details**: Transitive dependency from Tauri's gtk bindings
   - The vulnerable `VariantStrIter` code path is not used in this application
   - Will be resolved when Tauri updates to gtk 0.19+ / glib 0.20+
   - No action required from users

## Reporting a Vulnerability

If you discover a security vulnerability, please email the maintainer or create a private security advisory on GitHub.

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We aim to respond to security reports within 48 hours.
