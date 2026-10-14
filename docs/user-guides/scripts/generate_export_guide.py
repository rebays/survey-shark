import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from guide_common import (
    build_styles, make_doc, cover_block, callout, numbered_steps, bullet_list, screenshot,
    INK, SUBINK, LINE, PAPER, MARGIN, PAGE_W,
)
from reportlab.platypus import Paragraph, Spacer, Table, TableStyle, KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "..", "assets", "screenshots")
OUT = os.path.join(HERE, "..", "Survey-Shark-Download-Responses-Guide.pdf")
styles = build_styles()
doc = make_doc(OUT, "Downloading Your Responses")
COL_W = PAGE_W - 2 * MARGIN
# Never leave a heading stranded at the bottom of a page.
styles["H1"].keepWithNext = True
styles["H2"].keepWithNext = True

story = []


def menu(*parts):
    """Renders an Excel menu path like  Data › From Text/CSV  in bold."""
    return " › ".join(f"<b>{p}</b>" for p in parts)


def two_col_table(header, rows, first_w=2.1 * inch):
    data = [[Paragraph(header[0], styles["TableHeader"]), Paragraph(header[1], styles["TableHeader"])]]
    data += [[Paragraph(a, styles["Body"]), Paragraph(b, styles["Body"])] for a, b in rows]
    t = Table(data, colWidths=[first_w, COL_W - first_w], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("BOX", (0, 0), (-1, -1), 0.75, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.75, LINE),
        ("TOPPADDING", (0, 0), (-1, -1), 5.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5.5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PAPER]),
    ]))
    return t


cell = ParagraphStyle("Cell", parent=styles["Body"], fontSize=7.4, leading=9, spaceAfter=0)
cell_head = ParagraphStyle("CellHead", parent=cell, fontName="Helvetica-Bold")
grid_label = ParagraphStyle("GridLabel", parent=cell, textColor=SUBINK, alignment=1)


def example_sheet():
    """A mock Excel grid (with made-up sample data) showing what the file looks like."""
    headers = [
        "Response ID", "Survey version", "Status", "Terminated at question", "Submitted at (UTC)",
        "ADMIN_PARTICIPANT_CODE: Participant code", "B1: What is your age group?",
    ]
    rows = [
        ["301", "1.0.0", "completed", "", "2026-10-02T00:27:52.046Z", "SAMPLE-P01", "25–34"],
        ["317", "1.0.0", "completed", "", "2026-10-02T03:10:05.512Z", "SAMPLE-P02", "18–24"],
        ["342", "1.0.0", "screened_out", "A2", "2026-10-03T01:44:19.003Z", "SAMPLE-P03", ""],
    ]
    letters = ["", "A", "B", "C", "D", "E", "F", "G"]
    data = [[Paragraph(l, grid_label) for l in letters]]
    data.append([Paragraph("1", grid_label)] + [Paragraph(h, cell_head) for h in headers])
    for i, r in enumerate(rows, start=2):
        data.append([Paragraph(str(i), grid_label)] + [Paragraph(v, cell) for v in r])
    widths = [0.28 * inch, 0.62 * inch, 0.5 * inch, 0.82 * inch, 0.62 * inch, 1.5 * inch, 1.2 * inch]
    widths.append(COL_W - sum(widths))
    t = Table(data, colWidths=widths)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e5e7eb")),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#e5e7eb")),
        ("BACKGROUND", (1, 1), (-1, 1), colors.HexColor("#f1f5f9")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ]))
    return KeepTogether([
        t, Spacer(1, 5),
        Paragraph("Example only — made-up sample data. Your real file has one column for every question "
                  "(about 180 columns) and one row for every participant you submitted.", styles["Caption"]),
    ])


# --- Cover -------------------------------------------------------------
story += cover_block(
    styles,
    "Downloading Your Responses",
    "How to save the survey responses you collected and open them in Microsoft Excel",
    [
        "For student researchers who collected data with Survey Shark.",
        "You'll need: your Student Researcher ID, the access code, and an internet connection.",
    ],
)

story.append(Paragraph("What you'll do", styles["H2"]))
overview = [
    ["1", "Download your file from <b>My progress</b> in Survey Shark", "Section 2"],
    ["2", "Find the downloaded file on your phone or computer", "Section 3"],
    ["3", "Open it in Excel (two methods)", "Section 4"],
    ["4", "Save it as a proper Excel workbook (.xlsx)", "Section 5"],
    ["5", "Make it easy to read: freeze headers, filter, tidy columns", "Section 6"],
]
ov = Table([[Paragraph(a, styles["TocEntry"]), Paragraph(b, styles["Body"]), Paragraph(c, styles["BodyMuted"])]
            for a, b, c in overview], colWidths=[0.35 * inch, COL_W - 1.25 * inch, 0.9 * inch])
ov.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), PAPER),
    ("BOX", (0, 0), (-1, -1), 0.75, LINE),
    ("LINEBELOW", (0, 0), (-1, -2), 0.75, LINE),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ("LEFTPADDING", (0, 0), (-1, -1), 10),
]))
story.append(ov)
story.append(Spacer(1, 10))
story.append(callout(
    styles, "Easiest route: use a laptop or desktop computer",
    "Excel works best on a computer. You can open Survey Shark in any web browser on a laptop (it doesn't "
    "have to be the phone you collected on) — enter the same access code and Student Researcher ID, and "
    "the download will include every response you submitted from any device. The file is saved straight "
    "into your computer's <b>Downloads</b> folder, ready to open in Excel.",
    "tip",
))

# --- 1. Before you start ---------------------------------------------------
story.append(Paragraph("1. Before you start", styles["H1"]))
story.append(bullet_list(styles, [
    "<b>Make sure everything has synced.</b> The download only includes responses that have reached the "
    "server. On the phone you collected with, open Survey Shark while you have signal and check the bar at "
    "the top says <b>“0 waiting to sync”</b>. If not, tap <b>Sync now</b> and wait for it to reach 0.",
    "<b>Have internet or mobile data.</b> Downloading needs a connection — it won't work offline.",
    "<b>Have your codes ready</b> if you're using a new device: the web address, access code, and your "
    "Student Researcher ID (see the front page of your Field Collector Guide).",
]))
story.append(callout(
    styles, "Keep this file private",
    "Your file contains participants' answers. Treat it like your paper questionnaires: do not post it on "
    "Facebook, WhatsApp groups or other social media, don't share it with anyone outside your research "
    "team, and delete it from shared or public computers (e.g. internet cafés, library PCs) when you're done.",
    "dont",
))

# --- 2. Download -------------------------------------------------------
story.append(Paragraph("2. Download your responses", styles["H1"]))
story.append(numbered_steps(styles, [
    "Open your browser (Chrome, Safari, Edge…) and go to the Survey Shark web address your supervisor gave you.",
    "Tap or click the survey you collected for (e.g. <i>The State of Facebook Use in Honiara 2026</i>).",
    "If asked, enter the <b>Access code</b> and your <b>Student Researcher ID</b> and tap <b>Continue</b>. "
    "(On the phone you used for fieldwork you're usually already signed in.)",
    "Tap <b>My progress</b> (top of the survey screen) to open your dashboard. If the survey has closed, "
    "you can also go straight to the web address followed by <b>/dashboard</b>, for example "
    "<font face='Courier'>…/collect/facebook-honiara-2026/dashboard</font>.",
    "Find the <b>Download my responses</b> box and tap <b>Download (Excel / CSV)</b>.",
    "Wait a few seconds while it says <b>Preparing…</b> — your file then downloads automatically.",
]))
story.append(screenshot(
    styles, os.path.join(ASSETS, "dashboard-download-button.jpg"),
    "The “Download my responses” box on your My progress dashboard (sample data shown).",
    width_fraction=0.42,
))
story.append(Paragraph(
    "The file is named like <font face='Courier'>facebook-honiara-2026-<i>YOUR-ID</i>-responses.csv</font>. "
    "It contains <b>only your own</b> responses — both completed and screened-out participants.",
    styles["Body"],
))
story.append(Paragraph("If you see an error message", styles["H2"]))
story.append(screenshot(
    styles, os.path.join(ASSETS, "download-offline-error.jpg"),
    "This appears when there's no connection. Move to an area with signal or wifi and tap Download again.",
    width_fraction=0.5,
))

# --- 3. Find the file -------------------------------------------------------
story.append(Paragraph("3. Find the downloaded file", styles["H1"]))
story.append(two_col_table(
    ["Device", "Where your file goes"],
    [
        ["<b>Windows laptop/PC</b>",
         "Your <b>Downloads</b> folder. Open <b>File Explorer</b> (yellow folder icon) › <b>Downloads</b>. "
         "Chrome and Edge also show the file at the top-right of the browser — click it to open."],
        ["<b>Mac</b>",
         "The <b>Downloads</b> folder (in the Dock or in Finder's sidebar)."],
        ["<b>Android phone</b> (Chrome)",
         "A “Download complete” message appears at the bottom — tap <b>Open</b>. Later, find it in the "
         "<b>Files</b> (or <b>My Files</b>) app › <b>Downloads</b>."],
        ["<b>iPhone</b> (Safari)",
         "Tap the <b>download arrow</b> in the address bar › <b>Downloads</b>. Later, open the <b>Files</b> "
         "app › <b>On My iPhone</b> (or iCloud Drive) › <b>Downloads</b>."],
    ],
    first_w=1.6 * inch,
))
story.append(Spacer(1, 8))
story.append(Paragraph("Moving the file from your phone to a computer", styles["H2"]))
story.append(Paragraph(
    "The simplest option is to repeat Section 2 on the computer instead. If you can't, send the file to "
    "yourself: in your phone's Files app, tap and hold the file › <b>Share</b> › choose <b>Gmail/Email</b> "
    "(send to your own address) or <b>Google Drive / OneDrive</b>. Then download it on the computer. "
    "Only send it to yourself — see the privacy note in Section 1.",
    styles["Body"],
))
story.append(callout(
    styles, "Only have a phone?",
    "You can open the file in the free <b>Microsoft Excel</b> app (Android/iPhone) or <b>Google Sheets</b>: "
    "open the app, choose <b>Open</b> / <b>Browse</b>, and pick the file from Downloads. Reading and "
    "filtering works, but sections 4–6 are much easier on a computer.",
    "tip",
))

# --- 4. Open in Excel -------------------------------------------------------
story.append(Paragraph("4. Open the file in Excel", styles["H1"]))
story.append(Paragraph(
    "Your file is a <b>CSV</b> (comma-separated values) file — a plain spreadsheet format that Excel, Google "
    "Sheets and SPSS can all open. There are two ways to open it.",
    styles["Body"],
))
story.append(Paragraph("Method A — double-click (quickest)", styles["H2"]))
story.append(numbered_steps(styles, [
    "Go to your <b>Downloads</b> folder.",
    "Double-click the <font face='Courier'>…-responses.csv</font> file. It opens in Excel with each "
    "question in its own column.",
    "If Windows asks which app to use, choose <b>Excel</b> and tick <b>Always use this app</b>.",
]))
story.append(Paragraph("Method B — Import with “From Text/CSV” (use if Method A looks wrong)", styles["H2"]))
story.append(Paragraph(
    "Use this if everything appears squashed into column A, or you see odd characters like "
    "<font face='Courier'>â€”</font> instead of dashes.",
    styles["Body"],
))
story.append(numbered_steps(styles, [
    "Open Excel and create a <b>Blank workbook</b>.",
    f"Click the {menu('Data')} tab on the ribbon at the top.",
    f"Click {menu('From Text/CSV')} (in the <i>Get &amp; Transform Data</i> group, at the far left). "
    "On older Excel versions it's " + menu("Data", "Get External Data", "From Text") + ".",
    "Select your <font face='Courier'>…-responses.csv</font> file and click <b>Import</b>.",
    "In the preview window set <b>File Origin</b> to <b>65001: Unicode (UTF-8)</b> and <b>Delimiter</b> "
    "to <b>Comma</b>. The preview should show proper columns.",
    "Click <b>Load</b>. Your responses appear in a new sheet as a formatted table.",
]))
story.append(Paragraph("What you should see", styles["H2"]))
story.append(example_sheet())

# --- 5. Save as xlsx -------------------------------------------------------
story.append(Paragraph("5. Save it as an Excel workbook (.xlsx)", styles["H1"]))
story.append(Paragraph(
    "A CSV file can't store formatting, column widths, filters, extra sheets or charts. Save a proper "
    "Excel copy before you start working on it:",
    styles["Body"],
))
story.append(numbered_steps(styles, [
    f"Click {menu('File', 'Save As')} (or press <b>F12</b>).",
    "Choose where to save it, e.g. <b>Documents</b> or your OneDrive folder.",
    "Give it a clear name, e.g. <font face='Courier'>My survey responses - 700012345.xlsx</font>.",
    "In <b>Save as type</b>, choose <b>Excel Workbook (*.xlsx)</b>.",
    "Click <b>Save</b>. From now on, open and work in this .xlsx file, not the CSV.",
]))
story.append(callout(
    styles, "“Some features might be lost” warning",
    "If Excel shows a yellow bar or a pop-up about the CSV format losing features, it means you are still "
    "saving as CSV. Use <b>Save As</b> and pick <b>Excel Workbook (*.xlsx)</b> as described above.",
    "warn",
))

# --- 6. Make it readable -------------------------------------------------------
story.append(Paragraph("6. Make it easy to read", styles["H1"]))
story.append(Paragraph(
    "Your sheet is very wide (one column per question). These steps make it much easier to work with.",
    styles["Body"],
))
story.append(Paragraph("Keep the question headings visible while scrolling", styles["H2"]))
story.append(numbered_steps(styles, [
    f"Click the {menu('View')} tab.",
    f"Click {menu('Freeze Panes', 'Freeze Top Row')}. Row 1 (the questions) now stays on screen when you scroll down.",
    "Optional: click cell <b>F2</b>, then " + menu("Freeze Panes", "Freeze Panes") + " to also keep "
    "columns A–E (Response ID to Submitted at) visible when you scroll right.",
]))
story.append(Paragraph("Show only completed responses (filter)", styles["H2"]))
story.append(numbered_steps(styles, [
    f"Click any cell in row 1, then click {menu('Data', 'Filter')} (skip this if you used Method B — "
    "filters are already on). Small arrows appear in each heading.",
    "Click the arrow on the <b>Status</b> column.",
    "Untick <b>screened_out</b> so only <b>completed</b> is ticked, then click <b>OK</b>.",
    f"To show everything again: click the arrow › <b>Clear Filter</b>.",
]))
story.append(Paragraph("Tidy the columns", styles["H2"]))
story.append(bullet_list(styles, [
    "<b>Readable headings:</b> click the row number <b>1</b> to select the heading row, then "
    + menu("Home", "Wrap Text") + ".",
    "<b>Fit column widths:</b> click the triangle in the top-left corner of the grid to select everything, "
    "then " + menu("Home", "Format", "AutoFit Column Width") + ".",
    "<b>Count answers quickly:</b> select a column — Excel shows the <b>Count</b> at the bottom-right of the "
    "window. For a full breakdown use " + menu("Insert", "PivotTable") + ".",
]))

# --- 7. Understanding the columns -------------------------------------------------------
story.append(Paragraph("7. Understanding the columns", styles["H1"]))
story.append(Paragraph(
    "Each <b>row</b> is one participant. Each <b>column</b> heading starts with the question code from "
    "the questionnaire (e.g. <b>B1</b>) followed by the question text.",
    styles["Body"],
))
story.append(two_col_table(
    ["Column", "What it means"],
    [
        ["Response ID", "The server's reference number for this response. Quote it if you ask your "
                        "supervisor about a particular response."],
        ["Survey version", "Which version of the questionnaire was used (normally the same for everyone)."],
        ["Status", "<b>completed</b> — full interview. <b>screened_out</b> — the participant was not "
                   "eligible and the survey ended early."],
        ["Terminated at question", "For screened-out participants, the screening question that ended "
                                   "the survey (e.g. A1). Blank for completed responses."],
        ["Submitted at (UTC)", "When the response reached the server, in UTC time — e.g. "
                               "<font face='Courier'>2026-10-02T00:27:52Z</font>. "
                               "Add <b>11 hours</b> for Solomon Islands time (that example is 11:27am on 2 Oct)."],
        ["ADMIN_… columns", "The collection details you entered: participant code, your Student ID, "
                            "date, area and mode of completion."],
        ["Single-answer questions", "One column showing the answer chosen, e.g. <b>B1</b> = "
                                    "<i>25–34</i>."],
        ["“Tick all that apply” questions", "One column <b>per option</b> (heading ends with "
                                            "“— <i>option</i>”). <b>1</b> = ticked; blank = not ticked."],
        ["Grid / rating questions", "One column per row of the grid, showing the rating chosen for that row."],
        ["“Other (specify)” columns", "The text you typed when the participant chose “Other”."],
        ["Blank cells", "Not asked or not answered — e.g. questions skipped, or everything after the "
                        "screening questions for a screened-out participant."],
    ],
))
story.append(callout(
    styles, "Don't edit the original data",
    "Keep an untouched copy of the downloaded file. Do any cleaning, charts or calculations in your .xlsx "
    "copy (or on a new sheet), so you can always go back to the original if something goes wrong.",
    "tip",
))

# --- 8. Troubleshooting -------------------------------------------------------
story.append(Paragraph("8. Troubleshooting", styles["H1"]))
story.append(two_col_table(
    ["Problem", "What to do"],
    [
        ["“Couldn't download right now — you need signal”",
         "You're offline. Connect to wifi or mobile data and tap <b>Download</b> again."],
        ["Some of my responses are missing",
         "They probably haven't synced yet. On the phone you collected with, open Survey Shark with signal, "
         "wait for <b>“0 waiting to sync”</b> (or tap <b>Sync now</b>), then download again."],
        ["The file only has a heading row",
         "No synced responses were found for the ID you entered. Check you typed your Student Researcher ID "
         "exactly as on the roster, then contact your supervisor."],
        ["Everything is in column A",
         "Open it with <b>Method B</b> (Section 4) and choose <b>Delimiter: Comma</b>."],
        ["Strange characters (e.g. <font face='Courier'>â€”</font>)",
         "Open it with <b>Method B</b> and set <b>File Origin</b> to <b>65001: Unicode (UTF-8)</b>."],
        ["Nothing happens when I tap Download (iPhone)",
         "Wait for <b>Preparing…</b> to finish, then check the download arrow in Safari's address bar. "
         "If it still fails, try from a computer."],
        ["Can't find the file", "Look in <b>Downloads</b> (Section 3), or search your device for "
                                "<font face='Courier'>responses.csv</font>."],
        ["Anything else", "Contact your supervisor."],
    ],
    first_w=2.2 * inch,
))
story.append(Spacer(1, 8))
story.append(Paragraph("Tagio tumas — thank you for your hard work collecting this data.", styles["BodyMuted"]))

doc.build(story)
print("wrote", OUT)
