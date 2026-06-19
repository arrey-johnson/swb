---
title: SaveWithBanks
subtitle: Product Guide for Stakeholders
---

<div class="cover">

# SaveWithBanks

## Product Guide

**A clear overview of how the platform works**

*Prepared for product owners and stakeholders*

*Version 1.0 — March 2026*

</div>

<div class="page-break"></div>

## 1. Executive Summary

**SaveWithBanks** is a mobile-friendly savings platform designed for users in Cameroon. It helps people save money toward personal goals with structure, discipline, and accountability.

Users lock money into **timed savings goals** (3, 6, or 12 months). Deposits are made via **Mobile Money** (manual transfer + screenshot proof). An **admin team** approves deposits and processes withdrawal payouts. The platform enforces rules such as a **minimum reserve balance**, **early-withdrawal penalties**, and a **discipline scoring** system to encourage consistent saving.

The product is delivered as a **Progressive Web App (PWA)** — users can install it on their phone like a native app and access it from any modern browser.

| | |
|---|---|
| **Currency** | Central African CFA franc (FCFA / XAF) |
| **Payment method** | Mobile Money (manual, human-verified) |
| **Primary users** | Individual savers |
| **Operations team** | Platform administrators |

---

## 2. What Problem Does It Solve?

Many people want to save but struggle with:

- **No clear target** — money sits in a wallet and gets spent
- **No lock-in** — easy to withdraw before the goal is reached
- **No accountability** — no record of progress or consequences for breaking commitments

SaveWithBanks addresses this by:

1. Letting users define **named savings goals** with a target amount and duration
2. **Locking deposited funds** into those goals until maturity or a penalized early withdrawal
3. Providing **visibility** through a dashboard, transaction history, and notifications
4. Giving operators **control** over deposit verification and payout processing

---

## 3. Who Uses the Platform?

### 3.1 Savers (Customers)

Individual users who register, create goals, deposit money, and withdraw when allowed. They use the main app experience: dashboard, goals, deposits, history, profile, help, and financial tips.

### 3.2 Administrators (Operations Team)

Trusted staff who run day-to-day platform operations:

- Approve or reject deposit requests
- Send withdrawal payouts via Mobile Money and mark them as paid
- Manage users (view details, suspend accounts, adjustments)
- Configure penalties and deposit instructions
- Publish financial tips, send notifications, export reports, and review audit logs

Admins use a **separate admin console** (`/admin`) with its own navigation and tools.

---

## 4. How Money Moves Through the Platform

```
┌─────────────┐     Mobile Money      ┌──────────────┐
│   Saver     │ ───────────────────►  │ Platform     │
│   (user)    │     + screenshot      │ Mobile Money │
└─────────────┘                       └──────┬───────┘
       ▲                                     │
       │                                     ▼
       │                              ┌──────────────┐
       │         Admin approves       │ Admin reviews│
       │         deposit              │ deposit queue│
       │                              └──────┬───────┘
       │                                     │
       │         Funds credited              ▼
       │         to goal          ┌──────────────────┐
       └──────────────────────────│ Saver's savings  │
                                  │ goal (locked)    │
                                  └────────┬─────────┘
                                           │
              Saver requests withdrawal    │
                                           ▼
                                  ┌──────────────────┐
                                  │ Admin sends MoMo │
                                  │ payout & marks   │
                                  │ as paid          │
                                  └──────────────────┘
```

**Important:** The platform does **not** automatically move money. Deposits and withdrawals rely on real Mobile Money transfers verified and executed by humans (savers and admins).

---

## 5. The Saver Journey (Step by Step)

### Step 1 — Registration & Login

Users sign up with email and password. They provide name and phone number.

### Step 2 — Onboarding

Before using the app fully, new users complete:

| Step | What happens |
|------|----------------|
| **Email verification** | User confirms their email address |
| **Terms acceptance** | User agrees to platform terms |
| **First goal** | User creates at least one savings goal |
| **First deposit prompt** | User is guided to fund their goal |

### Step 3 — Account Activation

New accounts start in a **Pending** state with **0 FCFA balance**. To activate:

- The user must make an approved deposit of at least **1,000 FCFA**
- This 1,000 FCFA becomes a **permanent reserve** that cannot be withdrawn
- Once activated, the account status becomes **Active**

### Step 4 — Ongoing Use

- Create additional goals (3, 6, or 12 months)
- Deposit into goals via Mobile Money
- Track progress on the dashboard
- Withdraw (with penalties if early) when needed
- Receive notifications for key events
- Read financial tips in the feed (via Help section)

---

## 6. Savings Goals Explained

Each goal is a separate savings bucket with:

| Field | Description |
|-------|-------------|
| **Title & description** | What the user is saving for (e.g. "School fees", "Emergency fund") |
| **Target amount** | How much they aim to save (in FCFA) |
| **Duration** | 3, 6, or 12 months |
| **Maturity date** | Automatically calculated from start date + duration |
| **Current amount** | How much has been deposited and approved into this goal |

### Goal Statuses

| Status | Meaning |
|--------|---------|
| **Active** | Goal is running; user can deposit and withdraw (subject to rules) |
| **Matured** | Duration has ended; user can withdraw without early penalty |
| **Completed** | User formally marked the goal as complete after maturity |
| **Withdrawn early** | User took money out before maturity (penalty applied) |
| **Cancelled** | Goal was cancelled (only if empty and still active) |

When a goal reaches its maturity date, the system automatically updates it to **Matured** and notifies the user.

---

## 7. Deposits — How Users Add Money

### User steps

1. Open a goal and choose **Deposit**
2. See platform **Mobile Money instructions** (phone number and account name)
3. Send payment from their Mobile Money account
4. Upload a **screenshot** of the payment confirmation
5. Submit the deposit request

### What happens next

- Request appears in the **admin deposit queue** as **Pending**
- Admin reviews the screenshot and either **approves** or **rejects**
- On approval: funds are added to the goal and account balance; user is notified
- On rejection: user is notified with a reason; no money is credited

**Rule:** Only **one pending deposit** per goal at a time.

---

## 8. Withdrawals & Penalties

### When can users withdraw?

- From **active** goals at any time (may incur penalty if before maturity)
- From **matured** goals without early-withdrawal penalty

### Early withdrawal penalties

If a user withdraws before the goal matures, a percentage of the withdrawal amount is kept as a penalty:

| Goal duration | Default penalty rate |
|---------------|---------------------|
| 3 months | 5% |
| 6 months | 7% |
| 12 months | 10% |

*Admins can adjust these rates in the admin console.*

### Withdrawal process

1. User enters amount and sees a **penalty preview**
2. User must have a **payout phone number** in their profile
3. System deducts amount (+ penalty if applicable) from goal and account
4. Withdrawal enters **Pending Payout** status
5. Admin sends Mobile Money to the user's payout phone
6. Admin marks withdrawal as **Paid** (optionally records transaction reference)
7. User is notified

### Reserve balance rule

Every active account must keep **1,000 FCFA** in reserve. Users cannot withdraw below this floor.

---

## 9. Discipline Scoring

SaveWithBanks rewards consistent saving behavior with a points-based **discipline score**:

| Action | Points |
|--------|--------|
| First deposit in a calendar month | +20 |
| Completing a matured goal | +100 |
| Early withdrawal | −50 |

### Levels

| Level | Purpose |
|-------|---------|
| Bronze | Starting level |
| Silver | Progress milestone |
| Gold | Strong saver |
| Platinum | Top discipline |

Levels are displayed on the user's profile. Perks (badges, support tiers) are **informational** — they do not change financial rules.

---

## 10. Notifications & Engagement

### In-app notifications

Users receive notifications for events such as:

- Deposit approved or rejected
- Withdrawal processing and payout sent
- Goal matured
- Account status changes
- Admin messages

Notifications can include links to relevant pages (e.g. withdrawal history).

### Finance feed

Admins publish **financial tips** (short articles). Savers can read, like, comment on, and save tips. Access is via the Help section.

---

## 11. Admin Console Overview

The admin console is the operations hub. Key sections:

| Section | Purpose |
|---------|---------|
| **Dashboard** | Platform KPIs, pending deposit/payout alerts, weekly trends |
| **Deposits** | Review queue (pending / approved / rejected) |
| **Payouts** | Process withdrawal payouts, record references |
| **Users** | Search savers, view full account detail |
| **Finance Feed** | Create, edit, publish tips; moderate comments |
| **Penalties** | Configure early-withdrawal percentages |
| **Reports** | Export transactions, withdrawals, deposits, users (CSV) |
| **Settings** | Edit Mobile Money deposit instructions |
| **Audit Log** | Review admin actions for accountability |
| **Notifications** | Send messages to individual users |
| **Team** | Promote or remove admin access |

### Admin actions on users

- View balance, goals, transactions, discipline score
- **Suspend** or **reactivate** accounts
- **Close** accounts (only when no withdrawable balance remains)
- **Credit/refund** or **debit** balances (with mandatory reason)
- Mark phone as verified
- Send direct notifications

All sensitive admin actions are logged in the **audit trail**.

---

## 12. Account Statuses

| Status | Meaning for the saver |
|--------|----------------------|
| **Pending** | New account; needs first 1,000 FCFA approved deposit to activate |
| **Active** | Fully operational; can deposit and withdraw |
| **Suspended** | Deposits and withdrawals blocked; contact support |
| **Closed** | Account closed; no further activity |

---

## 13. Key Business Rules (Quick Reference)

| Rule | Detail |
|------|--------|
| Currency | FCFA (XAF) |
| Activation deposit | Minimum 1,000 FCFA (becomes permanent reserve) |
| Reserve | 1,000 FCFA cannot be withdrawn |
| Goal durations | 3, 6, or 12 months only |
| Deposits | Manual Mobile Money + admin approval |
| Withdrawals | Manual Mobile Money payout + admin marks paid |
| One pending deposit | Per goal at a time |
| Early withdrawal | Penalty % based on goal duration |
| Maturity | Auto-detected daily; goal status → Matured |
| Group savings | **Not supported** — individual savers only |
| Automated payouts | **Not supported** — admin processes manually |

---

## 14. Security & Trust (Non-Technical)

- Users sign in with **email and password**; email verification required
- Each user sees **only their own** financial data
- Admins have broader access, gated by **admin role**
- Deposit proofs stored securely; only user and admins can view
- Admin actions on money and accounts require **authorized roles** and are **audited**
- Admins can enable **two-factor authentication (MFA)** for extra account security

---

## 15. What the Platform Does Not Do (Today)

Understanding scope helps set expectations:

- **No automatic Mobile Money integration** — all transfers are manual
- **No group / joint / tontine savings** — individual accounts only
- **No bank card payments** — Mobile Money only
- **No automated fraud detection** on deposit screenshots — human review
- **No native iOS/Android app store apps** — PWA via browser (installable)

---

## 16. Glossary

| Term | Definition |
|------|------------|
| **FCFA / XAF** | Central African CFA franc, the platform currency |
| **Mobile Money** | Phone-based money transfer (e.g. MTN MoMo, Orange Money) |
| **Goal** | A named savings target with amount and duration |
| **Reserve** | 1,000 FCFA minimum balance that cannot be withdrawn |
| **Maturity** | Date when a goal's lock period ends |
| **Penalty** | Fee charged for withdrawing before maturity |
| **PWA** | Progressive Web App — website that can be installed on a phone |
| **Admin** | Operations staff with access to the admin console |
| **Audit log** | Record of who did what in the admin system |

---

## 17. Summary

SaveWithBanks is a **disciplined personal savings platform** built for the Cameroon market. Savers commit to goals, deposit via Mobile Money, and build habits through structure and scoring. Operators maintain trust by manually verifying deposits, processing payouts, and managing the platform through a full admin console.

For technical deployment details, see the separate Deployment Guide. For day-to-day operations, admins should use the in-app admin console at `/admin`.

---

*© SaveWithBanks — Product documentation for internal stakeholders.*
