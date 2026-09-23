import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from guide_common import (
    build_styles, make_doc, cover_block, callout, numbered_steps, bullet_list, hr,
    INK, LINE, PAPER, MARGIN, PAGE_W,
)
from reportlab.platypus import Paragraph, Spacer, Table, TableStyle, KeepTogether, PageBreak
from reportlab.lib.units import inch
from reportlab.lib import colors

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "Survey-Shark-Field-Collector-Guide.pdf")
styles = build_styles()
doc = make_doc(OUT, "Field Collector Guide")

story = []

story += cover_block(
    styles,
    "Field Collector Guide",
    "For student researchers collecting survey responses",
    [
        "For students collecting data for a research unit fieldwork exercise.",
        "Keep this guide with you (or saved on your phone) during data collection.",
    ],
)

# --- Your codes box -----------------------------------------------------
your_codes_rows = [
    [Paragraph("Web address to open", styles["Body"]), ""],
    [Paragraph("Access code", styles["Body"]), ""],
    [Paragraph("My Student Researcher ID", styles["Body"]), ""],
    [Paragraph("Supervisor contact", styles["Body"]), ""],
]
codes_table = Table(your_codes_rows, colWidths=[2.1 * inch, PAGE_W - 2 * MARGIN - 2.1 * inch])
codes_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), PAPER),
    ("BOX", (0, 0), (-1, -1), 0.75, LINE),
    ("INNERGRID", (0, 0), (-1, -1), 0.75, LINE),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
]))
story.append(Paragraph("Fill this in before you go to the field", styles["H2"]))
story.append(codes_table)
story.append(Spacer(1, 4))
story.append(Paragraph("Ask your supervisor for these before your first day of fieldwork.", styles["Small"]))

# --- 1. What is this app -------------------------------------------------
story.append(Paragraph("1. What is Survey Shark?", styles["H1"]))
story.append(Paragraph(
    "Survey Shark is the app you'll use on your phone to enter each participant's survey answers "
    "while you're out doing fieldwork. It replaces a paper questionnaire — it asks the same questions, "
    "in the same order, and works even when you have no internet signal.",
    styles["Body"],
))
story.append(callout(
    styles, "Why it works without signal",
    "Once you've opened the app one time with data or wifi, it keeps working with no signal at all. "
    "Answers you enter are saved on your phone first, then sent to the research team automatically the "
    "next time you have a connection — you don't need to do anything for this to happen.",
    "tip",
))

# --- 2. Before you go out -------------------------------------------------
story.append(Paragraph("2. Before you go out", styles["H1"]))
story.append(Paragraph("Make sure you have:", styles["Body"]))
story.append(bullet_list(styles, [
    "Your <b>Student Researcher ID</b> (given to you by your supervisor)",
    "The <b>Access Code</b> for the study (given to you by your supervisor)",
    "A phone with a web browser (Chrome or Safari) and, just for the very first setup, mobile data or wifi",
    "Signed paper consent forms and Participant Information Sheets, as per your normal fieldwork procedure",
]))
story.append(callout(
    styles, "Privacy reminder",
    "Do not type a participant's name, phone number, Facebook username, profile link, password, private "
    "messages, or exact home address into the app at any point. The questionnaire is designed to need none "
    "of this — if a question ever seems to ask for it, skip it and continue.",
    "dont",
))

# --- 3. One-time setup -------------------------------------------------
story.append(Paragraph("3. One-time setup (needs internet)", styles["H1"]))
story.append(Paragraph(
    "Do this once per phone, before your first day of fieldwork — you won't need to repeat it.",
    styles["Body"],
))
story.append(numbered_steps(styles, [
    "Open your browser and go to the web address your supervisor gave you.",
    "Tap the survey you'll be collecting for.",
    "Enter the <b>Access Code</b> and your <b>Student Researcher ID</b> exactly as given to you, then tap "
    "<b>Continue</b>.",
    "Recommended: use your browser's “Add to Home Screen” option so the app opens like a normal app "
    "and reminds you it's there.",
]))
story.append(callout(
    styles, "“Student researcher ID not recognised”",
    "Double-check spelling and capitalisation with your supervisor — IDs are matched exactly. If it still "
    "doesn't work, contact your supervisor before continuing.",
    "warn",
))

# --- 4. Collecting a response -------------------------------------------------
story.append(Paragraph("4. Collecting a response", styles["H1"]))
story.append(Paragraph("Repeat this for every participant you interview:", styles["Body"]))
story.append(numbered_steps(styles, [
    "Confirm the participant has read the Participant Information Sheet and signed the paper consent form, "
    "as per your normal fieldwork procedure.",
    "Open the survey in the app and work through each section, tapping the answer that best matches what "
    "the participant tells you.",
    "Tap <b>Next</b> to move to the next section. Required questions are marked with a red asterisk (*) and "
    "must be answered before you can continue.",
    "On the last section, tap <b>Submit</b>.",
    "Tap <b>Start next participant</b> to reset the form and begin the next interview.",
]))
story.append(callout(
    styles, "A participant may be screened out — this is normal",
    "The first few questions check whether someone is eligible (18+, uses Facebook, lives/works/studies in "
    "Honiara, and has agreed to take part). If they answer “No” to any of these, the app will end the "
    "survey automatically and show a thank-you message. This is expected — simply thank the person and "
    "move on to your next participant. It still counts as a recorded attempt.",
    "tip",
))

# --- 5. Working without signal -------------------------------------------------
story.append(Paragraph("5. Working without signal", styles["H1"]))
story.append(Paragraph(
    "A small bar at the top of the screen shows your connection status and how many completed responses "
    "are still waiting to be sent:",
    styles["Body"],
))
story.append(bullet_list(styles, [
    "<b>Online</b> (green dot) — responses are sending automatically.",
    "<b>Offline — saving locally</b> (amber dot) — keep working normally. Nothing is lost; it will send "
    "itself once you're back in signal.",
    "A number like <b>“3 waiting to sync”</b> means 3 completed responses are stored on your phone, "
    "ready to send.",
]))
story.append(callout(
    styles, "At the end of each day",
    "Open the app once while you have signal (e.g. back at your accommodation) and check the status bar "
    "shows “0 waiting to sync” before you close it for the night. You can also tap <b>Sync now</b> to "
    "force it to try immediately.",
    "tip",
))

# --- 6. Your target -------------------------------------------------
story.append(Paragraph("6. Your target", styles["H1"]))
story.append(Paragraph(
    "You are asked to collect <b>10 completed responses</b>. Keep your own tally (paper or phone notes) as "
    "you go — your supervisor can also see your progress on their dashboard, but it may take a moment to "
    "update after you sync.",
    styles["Body"],
))

# --- 7. Troubleshooting -------------------------------------------------
story.append(Paragraph("7. Troubleshooting", styles["H1"]))
trouble_rows = [
    [Paragraph("Problem", styles["TableHeader"]), Paragraph("What to do", styles["TableHeader"])],
    [Paragraph("“Incorrect access code”", styles["Body"]),
     Paragraph("Re-check the code with your supervisor — it is case-sensitive.", styles["Body"])],
    [Paragraph("“Student researcher ID not recognised”", styles["Body"]),
     Paragraph("Confirm the exact spelling/format of your ID with your supervisor.", styles["Body"])],
    [Paragraph("App looks blank or stuck", styles["Body"]),
     Paragraph("Close and reopen the browser tab. You only need signal for the very first setup, not for "
                "collecting responses.", styles["Body"])],
    [Paragraph("Accidentally closed the app mid-survey", styles["Body"]),
     Paragraph("The in-progress (unsubmitted) response is lost. Start that participant again from the "
                "beginning — already-submitted responses are unaffected.", styles["Body"])],
    [Paragraph("Not sure if a response actually saved", styles["Body"]),
     Paragraph("Check the sync status bar at the top of the screen — it shows how many are waiting or "
                "already synced.", styles["Body"])],
    [Paragraph("Anything else", styles["Body"]),
     Paragraph("Contact your supervisor using the details on the front page of this guide.", styles["Body"])],
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

story.append(Spacer(1, 8))
story.append(Paragraph(
    "Tagio tumas — thank you for helping with this research.", styles["BodyMuted"],
))

doc.build(story)
print("wrote", OUT)
