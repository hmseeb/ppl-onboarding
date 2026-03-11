Build a multi-step onboarding web app for BadAAAS's pay-per-lead referral network. This is for MCA/SBA/equipment funding brokers who just purchased their first batch of exclusive referrals. The app should feel premium, fast, and no-nonsense — these are sales professionals, not tech people.

**How it works end-to-end:** When a broker pays and we move them to "Deal Won" in our CRM (GoHighLevel), a webhook fires and sends their data to this app. The app receives that data, stores it, and generates a unique personalized onboarding link for that specific broker. That link gets returned in the webhook response (or available via an API endpoint) so we can send it to the broker via SMS/email from GHL. When the broker clicks their link, the app already knows who they are — their name, email, phone, vertical, batch size, everything we collected on the sales call. They see a personalized experience and only need to fill in the gaps we don't already have.

**Technical requirements — Webhook \+ Data Layer:**

The app needs an API endpoint (POST /api/onboarding/create) that accepts a webhook payload from GoHighLevel with the following fields:

* first\_name  
* last\_name  
* email  
* phone  
* company\_name  
* state (their market area)  
* primary\_vertical (MCA, SBA, Equipment Finance, Working Capital, Lines of Credit, Other)  
* secondary\_vertical (same options or null)  
* batch\_size (number of referrals purchased, e.g. 5, 10, 20\)  
* deal\_amount (total dollar amount paid)  
* ghl\_contact\_id (so we can reference them back in GHL if needed)

When the webhook hits, the app should:

1. Store the broker's data in a database (Supabase or whatever Lovable supports natively)  
2. Generate a unique onboarding token/ID for that broker  
3. Create a personalized onboarding URL like: app-url.com/onboard/\[unique-token\]  
4. Return that URL in the webhook response as JSON: { "onboarding\_url": "[https://app-url.com/onboard/abc123](https://app-url.com/onboard/abc123)", "broker\_name": "John Smith", "status": "created" }

That URL is what we send to the broker from GHL in their confirmation SMS/email.

The app also needs a simple GET endpoint (GET /api/onboarding/\[token\]) that returns the broker's stored data and onboarding status (not started, in progress, completed) so we can check on it from GHL or Zapier if needed.

**When the broker clicks their personalized link:** The app loads their stored data and pre-fills everything we already know. Their name is in the headline. Their verticals are pre-selected. Their batch size shows in the summary. They only interact with fields we don't have data for yet (like delivery preferences and CRM webhook URL). This should feel like we already know them — because we do.

**Brand:** BadAAAS / QuietFunding. Use a dark theme with clean modern typography. Accent color: Red (convey money/action). No fluff — every screen should feel like it's getting them closer to closing their first deal.

**Flow (step-by-step screens):**

**Step 1 — Welcome (Personalized)** Headline: "Welcome to the BadAAAS Network, {{first\_name}}." Subtext: "You're locked in with {{batch\_size}} exclusive referrals. Let's get you set up so they start hitting your phone." Pre-filled summary card showing: their name, company, email, phone, vertical(s), batch size — all pulled from the webhook data. Below the card: "Everything look right? If anything needs updating, tap to edit." Allow inline editing on any pre-filled field in case something is wrong. CTA button: "Looks Good — Let's Go"

**Step 2 — Referral Delivery Preferences** Headline: "How do you want to receive referrals, {{first\_name}}?" Options (checkboxes, can select multiple): SMS, Email, CRM webhook (with URL field if selected). Field: Best hours to receive referrals (dropdown: business hours only, anytime, custom time window). Toggle: "Pause referrals on weekends?" (yes/no). CTA: "Next"

**Step 3 — How Referrals Work (Education Screen)** Headline: "Here's How This Works" Visual timeline or card layout showing:

1. "A business owner requests funding through our sites"  
2. "They go through a soft pull to verify their business and funding need"  
3. "Unqualified or fake requests get filtered out — you never see them"  
4. "Qualified referrals get sent to ONE broker — you"  
5. "You get their name, phone, email, funding amount, what it's for, and any notes from the qualification process" Callout box: "Every referral is someone who actively requested funding. Your job is to reach them, build the relationship, and close the deal." CTA: "Next"

**Step 4 — Setting Expectations** Headline: "Let's Set You Up for Success" Display as clean cards or sections:

Section — "How Referrals Work": "Every referral is a real business owner who submitted a funding request and went through a soft pull. They've been verified as someone with a real business and a real funding need. Some will have spoken with our team, some won't have — but all of them requested capital."

Section — "Your Close Rate": "Brokers on our network close between 5% and 15% depending on skill, speed, and follow-up. That means if you buy 20 referrals, you should expect to fund 1-3 deals. At $65 per referral, that's a cost of $650-$1,300 per funded deal — and if your average commission is $3,000-$5,000+, the math works fast."

Visual: Simple ROI graphic personalized to their actual purchase showing: {{batch\_size}} referrals × $65 \= {{deal\_amount}} At 5% close rate \= \[calculated\] funded deal(s) Average commission \= $3,000-$5,000 ROI: \[calculated\]x on your first batch Use their real batch\_size and deal\_amount from the webhook data to make this specific to them.

Section — "Not Every Referral Will Pick Up": "These are business owners, not people sitting by the phone waiting for your call. Some will answer on the first dial. Some will take 3-5 follow-ups. Some won't convert at all. That's the game. The brokers who win on this network are the ones who work every single referral with a real follow-up sequence — not the ones who call once and move on."

Section — "This Is a Numbers Game": "Don't judge the network off 2 or 3 referrals. Give it a real sample — work all {{batch\_size}} properly, and then evaluate. Every experienced broker knows that closing is about volume and consistency." CTA: "Next"

**Step 5 — Best Practices for Closing** Headline: "Brokers Who Close Follow These Rules" Display as numbered cards:

1. Speed matters. "When a referral hits your phone, call within minutes — not hours. The faster you reach out, the more likely they remember submitting the request and the warmer the conversation starts."  
2. Lead with what you know. "Say something like: 'Hey \[Name\], I'm reaching out about your funding request — I see you're looking for \[amount\] for \[purpose\]. Let's talk about getting that done.' You already have the details. Use them."  
3. Follow up at least 5 times. "If they don't pick up, text immediately. Call again in a few hours. Then next morning. Then next afternoon. Then day 3\. Most funded deals come from follow-up 2-4, not the first attempt."  
4. Don't pitch — match and move. "They already have a funding need. Your job is to confirm the details, match them to the right product, and get docs moving. Keep it tight and efficient."  
5. Track your results. "Let us know which referrals funded so we can optimize your lead quality over time. The more feedback we get, the better your referrals become." CTA: "Next"

**Step 6 — Referral Replacement Policy** Headline: "Our Guarantee" Content: "If you receive a referral with a disconnected number, fake information, or someone who clearly never requested funding — we replace it. No questions asked. Just flag it in your dashboard or text your rep. We don't make money on bad leads. We make money when you close and keep coming back." Checkbox: "I understand the referral replacement policy" CTA: "Next"

**Step 7 — Confirmation \+ Let's Go** Headline: "You're All Set, {{first\_name}}. Go Fund Some Deals." Summary card showing: their name, company, vertical(s), delivery method, batch size purchased — combining webhook data and their onboarding selections. Subtext: "Your {{batch\_size}} referrals are on the way. Watch your \[display their selected delivery method\] — and remember, speed to lead wins." CTA button: "Go to Dashboard" (can link to a placeholder URL). Secondary link: "Questions? Text Daniel at \[phone number\]"

When Step 7 is completed:

* Update the broker's status in the database to "completed"  
* Store all their delivery preferences and any edits they made  
* Optionally fire a webhook back to GHL (POST to a configurable URL) with: { ghl\_contact\_id, onboarding\_status: "completed", delivery\_preferences, updated\_fields } so we can trigger the next automation in GHL (like starting referral delivery or tagging them as onboarded).

**Admin view (simple):** Build a basic /admin page (can be password-protected with a simple hardcoded password for now) that shows:

* List of all brokers who received onboarding links  
* Their status: not started, in progress, completed  
* Date the webhook was received  
* Date onboarding was completed  
* Quick view of their delivery preferences  
* Ability to copy their onboarding link (in case we need to resend it)

**Additional requirements:**

* Progress bar at the top showing which step they're on (Steps 1-7)  
* Mobile-first responsive design (most brokers will open this on their phone right after the sales call)  
* Smooth transitions between steps with subtle animations  
* All personalized data (first\_name, batch\_size, deal\_amount, verticals) should be dynamically pulled from the stored webhook data throughout the entire flow  
* Include a BadAAAS logo placeholder at the top of every screen  
* All copy should feel direct, confident, and money-motivated — no corporate fluff, no jargon, talk like a closer talks to another closer  
* Dark background, light text, accent color for CTAs and key numbers  
* The ROI graphic on Step 4 should be visually impactful and personalized to their actual purchase — make the numbers pop so brokers immediately see the math works in their favor  
* If someone visits an onboarding link that's already been completed, show a "You're already onboarded" screen with a link to the dashboard and Daniel's contact info  
* If someone visits an invalid token, show a clean error page: "This link isn't valid. Text Daniel at \[phone number\] if you need help."

