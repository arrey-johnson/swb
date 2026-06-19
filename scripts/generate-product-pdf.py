#!/usr/bin/env python3
"""Generate SaveWithBanks Product Guide PDF for non-technical stakeholders."""

from fpdf import FPDF
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "docs" / "SaveWithBanks-Product-Guide.pdf"


def t(s: str) -> str:
    """Normalize text for Helvetica (latin-1)."""
    return (
        s.replace("\u2014", "-")
        .replace("\u2013", "-")
        .replace("\u2019", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
        .replace("\u2022", "-")
        .replace("\u2192", "->")
    )

# Brand colors
PURPLE = (109, 40, 217)      # #6D28D9
DARK = (30, 27, 75)          # #1E1B4B
TEXT = (30, 41, 59)          # #1E293B
MUTED = (100, 116, 139)      # #64748B
LIGHT_BG = (248, 250, 252)   # #F8FAFC


class ProductGuidePDF(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=20)

    def footer(self):
        if self.page_no() == 1:
            return
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(*MUTED)
        self.cell(0, 10, f"SaveWithBanks Product Guide  |  Page {self.page_no()}", align="C")

    def cover_page(self):
        self.add_page()
        self.set_fill_color(*DARK)
        self.rect(0, 0, 210, 297, "F")
        # Accent band
        self.set_fill_color(*PURPLE)
        self.rect(0, 120, 210, 4, "F")

        self.set_y(70)
        self.set_font("Helvetica", "B", 36)
        self.set_text_color(255, 255, 255)
        self.cell(0, 16, t("SaveWithBanks"), align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 18)
        self.set_text_color(233, 213, 255)
        self.cell(0, 12, "Product Guide", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(8)
        self.set_font("Helvetica", "", 11)
        self.set_text_color(196, 181, 253)
        self.cell(0, 8, "A clear overview of how the platform works", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(4)
        self.cell(0, 8, "Prepared for product owners and stakeholders", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(20)
        self.set_font("Helvetica", "I", 10)
        self.set_text_color(167, 139, 250)
        self.cell(0, 8, "Version 1.0  |  March 2026", align="C")

    def section_title(self, num: str, title: str):
        self.ln(4)
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(*PURPLE)
        self.cell(0, 10, t(f"{num}. {title}"), new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(*PURPLE)
        self.set_line_width(0.6)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(6)

    def sub_title(self, title: str):
        self.ln(2)
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(51, 65, 85)
        self.cell(0, 8, t(title), new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def body(self, text: str):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*TEXT)
        self.multi_cell(0, 5.5, t(text))
        self.ln(2)

    def bullet(self, text: str):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*TEXT)
        x = self.get_x()
        self.cell(6, 5.5, "-")
        self.multi_cell(0, 5.5, t(text))
        self.set_x(x)

    def table(self, headers: list, rows: list, col_widths: list = None):
        if col_widths is None:
            w = 190 / len(headers)
            col_widths = [w] * len(headers)
        self.set_font("Helvetica", "B", 9)
        self.set_fill_color(*PURPLE)
        self.set_text_color(255, 255, 255)
        for i, h in enumerate(headers):
            self.cell(col_widths[i], 8, t(h), border=1, fill=True)
        self.ln()
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*TEXT)
        fill = False
        for row in rows:
            if fill:
                self.set_fill_color(*LIGHT_BG)
            else:
                self.set_fill_color(255, 255, 255)
            max_h = 8
            # Simple row — single line cells
            y0 = self.get_y()
            x0 = self.get_x()
            for i, cell in enumerate(row):
                self.set_xy(x0 + sum(col_widths[:i]), y0)
                self.multi_cell(col_widths[i], 6, t(str(cell)), border=1, fill=True)
            self.set_y(y0 + max(8, self.get_y() - y0))
            if self.get_y() > 270:
                self.add_page()
            fill = not fill
        self.ln(4)

    def diagram_box(self, lines: list):
        self.set_fill_color(241, 245, 249)
        self.set_draw_color(*PURPLE)
        self.set_font("Courier", "", 8)
        self.set_text_color(51, 65, 85)
        y0 = self.get_y()
        h = len(lines) * 4.5 + 8
        if y0 + h > 275:
            self.add_page()
            y0 = self.get_y()
        self.rect(10, y0, 190, h, "DF")
        self.set_xy(14, y0 + 4)
        for line in lines:
            self.cell(0, 4.5, t(line), new_x="LMARGIN", new_y="NEXT")
            self.set_x(14)
        self.set_y(y0 + h + 4)


def build():
    pdf = ProductGuidePDF()
    pdf.set_margins(10, 15, 10)
    pdf.cover_page()

    # --- 1 Executive Summary ---
    pdf.add_page()
    pdf.section_title("1", "Executive Summary")
    pdf.body(
        "SaveWithBanks is a mobile-friendly savings platform designed for users in Cameroon. "
        "It helps people save money toward personal goals with structure, discipline, and accountability."
    )
    pdf.body(
        "Users lock money into timed savings goals (3, 6, or 12 months). Deposits are made via "
        "Mobile Money with screenshot proof. An admin team approves deposits and processes withdrawal "
        "payouts. The platform enforces a minimum reserve balance, early-withdrawal penalties, and "
        "a discipline scoring system."
    )
    pdf.body("The product is delivered as a Progressive Web App (PWA) — installable on phones like a native app.")
    pdf.table(
        ["", ""],
        [
            ["Currency", "Central African CFA franc (FCFA / XAF)"],
            ["Payment method", "Mobile Money (manual, human-verified)"],
            ["Primary users", "Individual savers"],
            ["Operations team", "Platform administrators"],
        ],
        [45, 145],
    )

    # --- 2 Problem ---
    pdf.section_title("2", "What Problem Does It Solve?")
    pdf.body("Many people want to save but struggle with:")
    for b in [
        "No clear target — money sits in a wallet and gets spent",
        "No lock-in — easy to withdraw before the goal is reached",
        "No accountability — no record of progress or consequences",
    ]:
        pdf.bullet(b)
    pdf.ln(2)
    pdf.sub_title("How SaveWithBanks helps")
    for b in [
        "Named savings goals with target amount and duration",
        "Funds locked into goals until maturity or penalized early withdrawal",
        "Dashboard, transaction history, and notifications for visibility",
        "Admin control over deposit verification and payout processing",
    ]:
        pdf.bullet(b)

    # --- 3 Users ---
    pdf.section_title("3", "Who Uses the Platform?")
    pdf.sub_title("3.1 Savers (Customers)")
    pdf.body(
        "Individual users who register, create goals, deposit money, and withdraw when allowed. "
        "They use the main app: dashboard, goals, deposits, history, profile, help, and financial tips."
    )
    pdf.sub_title("3.2 Administrators (Operations Team)")
    pdf.body("Trusted staff who run day-to-day operations:")
    for b in [
        "Approve or reject deposit requests",
        "Send withdrawal payouts via Mobile Money and mark as paid",
        "Manage users (view details, suspend accounts, adjustments)",
        "Configure penalties and deposit instructions",
        "Publish tips, send notifications, export reports, review audit logs",
    ]:
        pdf.bullet(b)
    pdf.body("Admins use a separate admin console with its own navigation and tools.")

    # --- 4 Money flow ---
    pdf.section_title("4", "How Money Moves Through the Platform")
    pdf.diagram_box([
        "Saver  --[Mobile Money + screenshot]-->  Platform Mobile Money account",
        "                    |",
        "                    v",
        "            Admin reviews deposit queue",
        "                    |",
        "                    v",
        "            Funds credited to saver's goal (locked)",
        "                    |",
        "         Saver requests withdrawal",
        "                    v",
        "            Admin sends MoMo payout & marks paid",
    ])
    pdf.body(
        "Important: The platform does NOT automatically move money. Deposits and withdrawals "
        "rely on real Mobile Money transfers verified and executed by humans."
    )

    # --- 5 Saver journey ---
    pdf.section_title("5", "The Saver Journey")
    pdf.sub_title("Step 1 — Registration & Login")
    pdf.body("Users sign up with email and password, providing name and phone number.")
    pdf.sub_title("Step 2 — Onboarding")
    pdf.table(
        ["Step", "What happens"],
        [
            ["Email verification", "User confirms their email address"],
            ["Terms acceptance", "User agrees to platform terms"],
            ["First goal", "User creates at least one savings goal"],
            ["First deposit", "User is guided to fund their goal"],
        ],
        [50, 140],
    )
    pdf.sub_title("Step 3 — Account Activation")
    pdf.body(
        "New accounts start Pending with 0 FCFA balance. To activate, the user needs an approved "
        "deposit of at least 1,000 FCFA. This becomes a permanent reserve that cannot be withdrawn. "
        "Account status then becomes Active."
    )
    pdf.sub_title("Step 4 — Ongoing Use")
    for b in [
        "Create additional goals (3, 6, or 12 months)",
        "Deposit via Mobile Money; track progress on dashboard",
        "Withdraw when allowed; receive notifications",
        "Read financial tips via the Help section",
    ]:
        pdf.bullet(b)

    # --- 6 Goals ---
    pdf.section_title("6", "Savings Goals Explained")
    pdf.table(
        ["Field", "Description"],
        [
            ["Title & description", "What the user is saving for"],
            ["Target amount", "Goal amount in FCFA"],
            ["Duration", "3, 6, or 12 months"],
            ["Maturity date", "Start date + duration (auto-calculated)"],
            ["Current amount", "Approved deposits in this goal"],
        ],
        [55, 135],
    )
    pdf.sub_title("Goal Statuses")
    pdf.table(
        ["Status", "Meaning"],
        [
            ["Active", "Running; user can deposit and withdraw (subject to rules)"],
            ["Matured", "Duration ended; withdraw without early penalty"],
            ["Completed", "User marked goal complete after maturity"],
            ["Withdrawn early", "Money taken before maturity; penalty applied"],
            ["Cancelled", "Cancelled only if empty and still active"],
        ],
        [45, 145],
    )
    pdf.body("When maturity date is reached, the system updates the goal to Matured and notifies the user (daily check).")

    # --- 7 Deposits ---
    pdf.section_title("7", "Deposits — How Users Add Money")
    pdf.sub_title("User steps")
    for i, b in enumerate([
        "Open a goal and choose Deposit",
        "See platform Mobile Money instructions (phone + account name)",
        "Send payment from their Mobile Money",
        "Upload screenshot of payment confirmation",
        "Submit the deposit request",
    ], 1):
        pdf.bullet(f"{i}. {b}")
    pdf.sub_title("What happens next")
    for b in [
        "Request appears in admin queue as Pending",
        "Admin approves or rejects after reviewing screenshot",
        "Approval: funds added to goal; user notified",
        "Rejection: user notified with reason; no credit",
        "Rule: only one pending deposit per goal at a time",
    ]:
        pdf.bullet(b)

    # --- 8 Withdrawals ---
    pdf.section_title("8", "Withdrawals & Penalties")
    pdf.sub_title("When can users withdraw?")
    pdf.bullet("From active goals anytime (penalty if before maturity)")
    pdf.bullet("From matured goals without early-withdrawal penalty")
    pdf.ln(2)
    pdf.sub_title("Early withdrawal penalties (defaults)")
    pdf.table(
        ["Goal duration", "Penalty rate"],
        [["3 months", "5%"], ["6 months", "7%"], ["12 months", "10%"]],
        [95, 95],
    )
    pdf.body("Admins can adjust these rates in the admin console.")
    pdf.sub_title("Withdrawal process")
    for i, b in enumerate([
        "User enters amount and sees penalty preview",
        "Payout phone required in profile",
        "Amount (+ penalty) deducted from goal and account",
        "Status: Pending Payout",
        "Admin sends Mobile Money to payout phone",
        "Admin marks Paid (optional transaction reference)",
        "User notified",
    ], 1):
        pdf.bullet(f"{i}. {b}")
    pdf.body("Reserve rule: every active account must keep 1,000 FCFA that cannot be withdrawn.")

    # --- 9 Discipline ---
    pdf.section_title("9", "Discipline Scoring")
    pdf.table(
        ["Action", "Points"],
        [
            ["First deposit in a calendar month", "+20"],
            ["Completing a matured goal", "+100"],
            ["Early withdrawal", "-50"],
        ],
        [120, 70],
    )
    pdf.sub_title("Levels: Bronze, Silver, Gold, Platinum")
    pdf.body("Displayed on profile. Perks are informational — they do not change financial rules.")

    # --- 10 Notifications ---
    pdf.section_title("10", "Notifications & Engagement")
    pdf.sub_title("In-app notifications")
    for b in [
        "Deposit approved or rejected",
        "Withdrawal processing and payout sent",
        "Goal matured; account status changes",
        "Direct admin messages",
    ]:
        pdf.bullet(b)
    pdf.sub_title("Finance feed")
    pdf.body(
        "Admins publish financial tips. Savers can read, like, comment, and save tips. "
        "Access via the Help section."
    )

    # --- 11 Admin ---
    pdf.add_page()
    pdf.section_title("11", "Admin Console Overview")
    pdf.table(
        ["Section", "Purpose"],
        [
            ["Dashboard", "KPIs, pending alerts, weekly trends"],
            ["Deposits", "Review queue: pending / approved / rejected"],
            ["Payouts", "Process withdrawals; record references"],
            ["Users", "Search savers; full account detail"],
            ["Finance Feed", "Tips CMS; comment moderation"],
            ["Penalties", "Early-withdrawal percentages"],
            ["Reports", "CSV export: transactions, withdrawals, deposits, users"],
            ["Settings", "Mobile Money deposit instructions"],
            ["Audit Log", "Admin action accountability"],
            ["Notifications", "Message individual users"],
            ["Team", "Promote or remove admins"],
        ],
        [45, 145],
    )
    pdf.sub_title("Admin actions on users")
    for b in [
        "View balance, goals, transactions, discipline score",
        "Suspend, reactivate, or close accounts",
        "Credit/refund or debit balances (reason required)",
        "Mark phone verified; send notifications",
    ]:
        pdf.bullet(b)
    pdf.body("Sensitive actions are recorded in the audit trail.")

    # --- 12 Account statuses ---
    pdf.section_title("12", "Account Statuses")
    pdf.table(
        ["Status", "Meaning"],
        [
            ["Pending", "New account; needs 1,000 FCFA approved deposit"],
            ["Active", "Fully operational"],
            ["Suspended", "Deposits and withdrawals blocked"],
            ["Closed", "No further activity"],
        ],
        [40, 150],
    )

    # --- 13 Rules ---
    pdf.section_title("13", "Key Business Rules")
    pdf.table(
        ["Rule", "Detail"],
        [
            ["Currency", "FCFA (XAF)"],
            ["Activation", "Min 1,000 FCFA deposit (permanent reserve)"],
            ["Reserve", "1,000 FCFA cannot be withdrawn"],
            ["Goal durations", "3, 6, or 12 months only"],
            ["Deposits", "Manual MoMo + admin approval"],
            ["Withdrawals", "Manual MoMo payout + admin marks paid"],
            ["Pending deposits", "One per goal at a time"],
            ["Early withdrawal", "Penalty % by duration"],
            ["Group savings", "Not supported"],
            ["Auto payouts", "Not supported"],
        ],
        [50, 140],
    )

    # --- 14 Security ---
    pdf.section_title("14", "Security & Trust")
    for b in [
        "Email + password login; email verification required",
        "Users see only their own financial data",
        "Admin access gated by admin role",
        "Deposit proofs stored securely",
        "Admin money actions audited",
        "Admins can enable two-factor authentication (MFA)",
    ]:
        pdf.bullet(b)

    # --- 15 Scope ---
    pdf.section_title("15", "What the Platform Does Not Do")
    for b in [
        "No automatic Mobile Money integration — transfers are manual",
        "No group / joint / tontine savings",
        "No bank card payments",
        "No automated fraud detection on screenshots — human review",
        "No App Store native apps — PWA via browser (installable)",
    ]:
        pdf.bullet(b)

    # --- 16 Glossary ---
    pdf.section_title("16", "Glossary")
    pdf.table(
        ["Term", "Definition"],
        [
            ["FCFA / XAF", "Central African CFA franc"],
            ["Mobile Money", "Phone-based transfer (MTN MoMo, Orange Money, etc.)"],
            ["Goal", "Named savings target with amount and duration"],
            ["Reserve", "1,000 FCFA minimum non-withdrawable balance"],
            ["Maturity", "Date when goal lock period ends"],
            ["Penalty", "Fee for withdrawing before maturity"],
            ["PWA", "Web app installable on a phone"],
            ["Admin", "Operations staff with admin console access"],
            ["Audit log", "Record of admin actions"],
        ],
        [40, 150],
    )

    # --- 17 Summary ---
    pdf.section_title("17", "Summary")
    pdf.body(
        "SaveWithBanks is a disciplined personal savings platform for the Cameroon market. "
        "Savers commit to goals, deposit via Mobile Money, and build habits through structure "
        "and scoring. Operators maintain trust by verifying deposits, processing payouts, and "
        "managing the platform through the admin console."
    )
    pdf.ln(6)
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(*MUTED)
    pdf.cell(0, 6, t("SaveWithBanks - Product documentation for internal stakeholders."), align="C")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(OUT))
    print(f"Generated: {OUT}")


if __name__ == "__main__":
    build()
