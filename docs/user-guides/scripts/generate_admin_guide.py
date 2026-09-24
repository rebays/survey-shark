import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from guide_common import (
    build_styles, make_doc, cover_block, callout, numbered_steps, bullet_list, hr,
    INK, LINE, PAPER, MARGIN, PAGE_W,
)
from reportlab.platypus import Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.units import inch
from reportlab.lib import colors

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "Survey-Shark-Researcher-Admin-Guide.pdf")
styles = build_styles()
doc = make_doc(OUT, "Researcher Admin Guide")

story = []

story += cover_block(
    styles,
    "Researcher Admin Guide",
    "For the researcher managing fieldwork and data",
    [
        "Covers logging in, preparing for fieldwork, monitoring students, and exporting data.",
        "Your login password and web address are provided to you separately — keep them private.",
    ],
)

story.append(Paragraph("1. What the admin dashboard does", styles["H1"]))
story.append(Paragraph(
    "The admin dashboard is where you manage data collection for your survey(s): control which student "
    "IDs are accepted, watch progress toward your response target in real time, and export the data you've "
    "collected as a spreadsheet at any point — including partway through fieldwork.",
    styles["Body"],
))
story.append(callout(
    styles, "You don't need to do anything for responses to arrive",
    "Every response a student submits (including ones that were saved offline and synced later) appears in "
    "the dashboard automatically. There is nothing to import or trigger manually.",
    "tip",
))

story.append(Paragraph("2. Logging in", styles["H1"]))
story.append(numbered_steps(styles, [
    "Go to the admin web address you were given (it ends in <b>/admin/login</b>).",
    "Enter your password and tap <b>Sign in</b>.",
    "You'll stay signed in on that device/browser for about two weeks, or until you tap <b>Sign out</b>.",
]))
story.append(callout(
    styles, "Keep your password private",
    "This password is the only thing protecting your response data and dashboard from outside access. "
    "Don't share it with students — they only ever need the separate, low-security “access code” "
    "described in their own guide. If you suspect it's been seen by someone else, ask whoever set up the "
    "platform to change it.",
    "warn",
))

story.append(Paragraph("3. Preparing for fieldwork", styles["H1"]))
story.append(Paragraph("Before your students start collecting data:", styles["Body"]))
story.append(bullet_list(styles, [
    "Give every student the collection web address and the shared <b>access code</b> for the survey.",
    "Give every student their own <b>Student Researcher ID</b> (this is how their responses are attributed "
    "to them for progress tracking).",
    "Optionally, load a roster of valid Student Researcher IDs into the dashboard (see below) so only your "
    "students can use the app.",
]))

story.append(Paragraph("Loading the student roster (optional)", styles["H2"]))
story.append(Paragraph(
    "By default, the app accepts any Student Researcher ID, which lets fieldwork start immediately. If you "
    "want to restrict access to your class only:",
    styles["Body"],
))
story.append(numbered_steps(styles, [
    "On the dashboard, find the <b>Student roster</b> section.",
    "Paste one Student Researcher ID per line into the box (e.g. one per student, matching exactly what "
    "you gave them).",
    "Tap <b>Save roster</b>. From then on, only IDs on this list will be accepted — anyone else sees "
    "“Student researcher ID not recognised.”",
    "To go back to accepting any ID, tap <b>Clear roster</b>.",
]))

story.append(Paragraph("4. Monitoring fieldwork", styles["H1"]))
story.append(Paragraph("The dashboard shows, updated live as responses come in:", styles["Body"]))
story.append(bullet_list(styles, [
    "An <b>overall progress bar</b> toward your total target (student count × responses per student).",
    "Per-survey totals: how many <b>completed</b> responses and how many were <b>screened out</b> "
    "(participants who weren't eligible — this is expected and not a problem).",
    "A <b>per-student table</b>, sorted so students with the fewest responses appear first, with a "
    "“Target met” or “X to go” badge for each.",
]))
story.append(Paragraph(
    "Students can also check their own count from their phone — a <b>My progress</b> link is always visible "
    "while they're collecting data, showing their own completed/screened-out totals and letting them re-open "
    "any of their own past responses to double-check what they recorded. This should cut down on “how many "
    "have I done?” questions during fieldwork.",
    styles["Body"],
))
story.append(callout(
    styles, "A student shows 0 or fewer responses than expected",
    "Most often this means their device hasn't had a chance to sync yet (they may still be in the field "
    "with no signal), or their Student Researcher ID doesn't exactly match what's on the roster / what you "
    "gave them. Ask them to check the sync status bar in their own app, or check spelling of their ID.",
    "warn",
))

story.append(Paragraph("5. Exporting data", styles["H1"]))
story.append(numbered_steps(styles, [
    "Find the survey in the <b>Surveys</b> section of the dashboard.",
    "Tap <b>Export CSV</b>. A spreadsheet file downloads with one row per response.",
    "Open it in Excel, Google Sheets, or import it into SPSS/R for analysis.",
]))
story.append(Paragraph(
    "Each question becomes its own column (or several, for multi-select and matrix/Likert questions), "
    "labelled with the question code and text — for example, a “select all that apply” question "
    "produces one 1/0 column per option, ready for statistical analysis without further cleaning. A "
    "<b>Status</b> column marks whether each row is a completed response or a screened-out attempt, so you "
    "can filter those out if your analysis should only include completed interviews.",
    styles["Body"],
))
story.append(callout(
    styles, "Export as often as you like",
    "Exporting doesn't remove or lock the data — you can re-export at any time during fieldwork to check "
    "progress or start preliminary analysis, and again at the end for your final dataset.",
    "tip",
))

story.append(Paragraph("6. Adding a future survey", styles["H1"]))
story.append(Paragraph(
    "This platform was built so it can run more surveys later without being rebuilt from scratch. Adding a "
    "new survey is a small task for whoever set up the platform for you (it is not something you do from "
    "the dashboard itself) — send them the new questionnaire and they can add it, after which it appears "
    "as its own entry on this dashboard with its own export, automatically.",
    styles["Body"],
))

story.append(Paragraph("7. Troubleshooting", styles["H1"]))
trouble_rows = [
    [Paragraph("Problem", styles["TableHeader"]), Paragraph("What to do", styles["TableHeader"])],
    [Paragraph("Forgot your password", styles["Body"]),
     Paragraph("Ask whoever set up the platform to reset it for you — it's stored securely and can't be "
                "recovered by you directly.", styles["Body"])],
    [Paragraph("Export file looks empty", styles["Body"]),
     Paragraph("Check you exported the right survey, and that fieldwork has actually started — an empty "
                "export usually just means no responses have synced yet.", styles["Body"])],
    [Paragraph("A student can't get past the entry screen", styles["Body"]),
     Paragraph("Confirm they have the correct access code and that their exact Student Researcher ID is on "
                "your roster (if you've loaded one).", styles["Body"])],
    [Paragraph("Numbers on the dashboard seem out of date", styles["Body"]),
     Paragraph("Responses only appear once a student's device has synced them, which needs that device to "
                "have internet at some point — refresh the page after checking with the student.", styles["Body"])],
]
trouble_table = Table(trouble_rows, colWidths=[2.3 * inch, PAGE_W - 2 * MARGIN - 2.3 * inch])
trouble_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), INK),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("BOX", (0, 0), (-1, -1), 0.75, LINE),
    ("INNERGRID", (0, 0), (-1, -1), 0.75, LINE),
    ("TOPPADDING", (0, 0), (-1, -1), 5.5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5.5),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PAPER]),
]))
story.append(trouble_table)

doc.build(story)
print("wrote", OUT)
