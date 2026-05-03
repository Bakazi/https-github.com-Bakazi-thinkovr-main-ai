# Thinkovr — Test Tracking

## Testing Protocol
- Backend: use `deep_testing_backend_nextjs`. Never curl-test from main agent.
- Frontend: only test with explicit user permission via `ask_human`.
- Never modify this protocol section.

## User Problem Statement
Advisory app. User submits a Wish + parameters; The Thinkovr Engine produces tier-specific collectible blueprints (PDF). Admin reviews/edits/dispatches. Capitec EFT payment. Tiers: Spark $47, Ignite $197, Blaze $497, Blueprint $750.

## This iteration — enhancements shipped
- [x] Fresh Groq key swapped in (gsk_8Uz7nWq...)
- [x] Admin password changed to `$@ZMAN%@` (both zalemocke@ and zmanschoeman@)
- [x] **API Keys admin tab** — full vault UI with: link to provider console for each key (Groq, Gemini x3, OpenRouter, Resend, email_from); password-type input with show/hide; active-source indicator (database/env/none); DB override takes priority over .env values. Both LLM chain and Resend dispatch now consult DB first, fall back to env.
- [x] **Zoom parallax section** — 7 moody images zoom out as user scrolls, with "Capital. Time. Skill. Geography. Fear." caption. Uses framer-motion useScroll + useTransform.
- [x] **Professional animated footer** — brand letters fly in (rotateX + y + stagger); brand tagline, nav links with arrow reveal, support email (zmanschoeman@gmail.com), social icons, live-status dot.
- [x] **Word-fade / materialize animations** via `/app/components/animated-text.jsx` (FadeWords, FadeChars, FadeUp)
- [x] **Hero line entrance** — CSS keyframe fade-in-up-blur with staggered delays on the H1 lines
- [x] **Tier-differentiated PDFs v3** — Spark (minimal hairlines), Ignite (double border + hatch pattern + chevrons + copper), Blaze (wax-seal 8-point star + diamond corners + burgundy), Blueprint (triple frame + circular emblem with dot crown + corner medallions + navy-gold + signature page). Each tier has distinct cover composition, typography, body bullet marks, and closing page.
- [x] **Mobile polish** — CSS media query adjustments for btn, cards, KPIs, h1 letter spacing
- [x] **Support email** — zmanschoeman@gmail.com in footer with mailto:

## Environment
- ADMIN_EMAILS = zalemocke@gmail.com,zmanschoeman@gmail.com
- Admin password = $@ZMAN%@
- GROQ_API_KEY = fresh (gsk_8Uz7nWq...)
- GEMINI_API_KEY (+2,+3) set
- RESEND_API_KEY set (still limited to hokethach@gmail.com until domain verified)

## Manual verification
- Both admin accounts login with new password ✓
- GET /api/admin/keys shows masked env values + source attribution ✓
- PDF generation for all 4 tiers working with distinct cover designs ✓
- Hero animation plays on page load ✓
- Admin page renders ✓
- Dashboard page renders ✓

## Incorporate User Feedback
- Supabase migration deferred (keys saved)
- Resend domain — still pending user's domain purchase

## Test agent communication

### Testing Agent - 2026-05-01 01:47:12
**Status**: ✅ ALL BACKEND TESTS PASSED (32/32 - 100%)

**Test Results Summary**:

1. ✅ **New Admin Credentials (4/4 tests passed)**
   - Both admin emails (zalemocke@gmail.com, zmanschoeman@gmail.com) login successfully with NEW password ($@ZMAN%@)
   - Both return admin:true
   - OLD password (WonderwerkeBYdieWeesHuis@#) correctly FAILS with 401

2. ✅ **Admin API Keys Endpoint (12/12 tests passed)**
   - GET /api/admin/keys returns all 7 expected keys with correct structure
   - Each key shows: value, env_set, db_set, masked, source
   - PUT /api/admin/keys successfully sets/clears overrides
   - Source attribution works: "database" when override set, "env" when cleared
   - Regular users correctly get 403 on both GET and PUT

3. ✅ **Fresh Groq Key Works (7/7 tests passed)**
   - Wish submission successful
   - User GET /wish does NOT leak groq_output (security ✓)
   - Admin can see groq_output (4565 chars)
   - groq_output STARTS with "## [ASSUMPTIONS I AM MAKING]" ✅
   - All preamble sections present: [ASSUMPTIONS I AM MAKING], [WHY THIS MIGHT BE WRONG], [LEAST VIABLE ATTEMPT]

4. ✅ **Regression Tests (9/9 tests passed)**
   - Free mode toggle works (enable/disable)
   - PDF download returns valid PDF (Content-Type: application/pdf, starts with %PDF, 13048 bytes)
   - Dispatch endpoint works (returns success, status changes to "delivered")
   - Banking endpoints work (GET and PUT /admin/banking)

**Note**: Dispatch shows `mocked: false` (using real Resend API) but email fails with domain validation error for "example.com" - this is expected until domain is verified. The dispatch functionality itself works correctly (wish status changes to "delivered").
