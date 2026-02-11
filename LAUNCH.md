# SnapType Launch Playbook

## Budget Breakdown ($100)

| Item                          | Cost    |
|-------------------------------|---------|
| Chrome Web Store developer fee| $5      |
| Domain (snaptype.app or similar)| $12   |
| Lemon Squeezy (payment)      | Free    |
| Netlify hosting (website)     | Free    |
| Total setup cost              | ~$17    |
| Remaining for marketing       | ~$83    |

## Step 1: Setup (30 min)

### Chrome Web Store
1. Go to https://chrome.google.com/webstore/devconsole
2. Register as developer ($5 one-time fee)
3. Run `bash package.sh` to create ZIP
4. Upload ZIP as new extension
5. Fill listing from `store-listing.md`
6. Take 2-3 screenshots of the popup in action
7. Submit for review (takes 1-3 business days)

### Payment (Lemon Squeezy)
1. Sign up at https://lemonsqueezy.com (free)
2. Create store "SnapType"
3. Create product: "SnapType Pro" - $4.99/mo subscription
4. Enable "License keys" in product settings
5. Copy your checkout URL into `license.js`
6. Copy your store slug into `license.js`

### Website
1. Create GitHub repo, push code
2. Connect `website/` folder to Netlify (free)
3. Buy domain (Namecheap, ~$12/year)
4. Point domain to Netlify

## Step 2: Launch Marketing (Week 1)

### Free channels (do all of these):

**Reddit** (Day 1-2)
- r/SideProject - "I built a text expander Chrome extension"
- r/Productivity - Help post about typing productivity
- r/Entrepreneur - Build in public story
- r/Chrome - Extension showcase
- r/InternetIsBeautiful - If the landing page is polished

**Product Hunt** (Day 3)
- Create maker profile
- Schedule launch for Tuesday or Wednesday
- Prepare tagline: "Type less, do more — Free text expander for Chrome"
- Get 5+ friends to upvote + comment in the first hour

**Twitter/X** (Ongoing)
- Build-in-public thread about making the extension
- Share GIFs of the extension in action
- Engage with productivity and indie hacker communities
- Tag @ProductHunt on launch day

**Indie Hackers** (Day 1)
- Post in the products section
- Share revenue milestones
- Engage in the community

**Hacker News** (Day 4-5)
- Show HN post if Product Hunt goes well
- Focus on the technical build story

### Paid marketing ($83 budget):

**Option A: Reddit Ads ($50)**
- Target r/productivity, r/customerservice, r/sales
- $1-2 CPC, expect 25-50 clicks
- Use compelling ad: "Stop typing the same emails. SnapType expands text shortcuts instantly."

**Option B: Google Ads ($50)**
- Target "text expander chrome", "snippet manager", "canned responses chrome"
- These keywords have commercial intent

**Option C: Influencer ($30-50)**
- Find small productivity YouTubers (1K-10K subs)
- Offer $30 + free Pro for a review

Save $33 as reserve for week 2 optimization based on what works.

## Step 3: Growth (Week 2+)

### Conversion optimization
- Track which free users hit the 10-snippet limit
- A/B test pricing ($3.99 vs $4.99 vs $6.99)
- Add a "streak" feature to increase engagement

### Content marketing (free)
- Write 3-5 SEO blog posts for the website:
  - "Best Text Expanders for Chrome in 2026"
  - "How to Save 2 Hours/Week with Text Shortcuts"
  - "Customer Support Templates: 50 Canned Responses"
  - "Text Expansion for Developers: Boost Your Workflow"
- These rank for long-tail keywords and drive organic installs

### Referral loop
- Add "Shared via SnapType" footer option to expanded text
- Offer 1 extra free snippet for each referral

## Revenue Projections

| Month | Free Users | Pro Users | MRR     |
|-------|-----------|-----------|---------|
| 1     | 50-100    | 2-5       | $10-25  |
| 2     | 200-400   | 8-15      | $40-75  |
| 3     | 500-1000  | 20-40     | $100-200|
| 6     | 2000+     | 80-150    | $400-750|

Conservative estimates. Text expanders have proven demand.
The key metric is free→Pro conversion rate (target: 3-5%).

## Key Success Metrics
- Install rate from store page (target: >30%)
- Day-7 retention (target: >40%)
- Free→Pro conversion (target: 3-5%)
- Monthly churn (target: <8%)
