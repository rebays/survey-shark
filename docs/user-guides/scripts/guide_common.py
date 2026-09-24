"""Shared styling/helpers for Survey Shark PDF user guides."""
import os
from PIL import Image as PILImage
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
    ListFlowable, ListItem, HRFlowable, NextPageTemplate, PageBreak, KeepTogether, Image,
)
from reportlab.pdfgen import canvas

LOGO_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "sinu-logo.png")
LOGO_ASPECT = 58 / 151  # native sinu-logo.png height/width

INK = colors.HexColor("#0f172a")       # slate-900
SUBINK = colors.HexColor("#475569")    # slate-600
MUTED = colors.HexColor("#94a3b8")     # slate-400
LINE = colors.HexColor("#e2e8f0")      # slate-200
PAPER = colors.HexColor("#f8fafc")     # slate-50
TIP_BG = colors.HexColor("#eff6ff")    # blue-50
TIP_BORDER = colors.HexColor("#3b82f6")  # blue-500
WARN_BG = colors.HexColor("#fffbeb")   # amber-50
WARN_BORDER = colors.HexColor("#d97706")  # amber-600
DONT_BG = colors.HexColor("#fef2f2")   # red-50
DONT_BORDER = colors.HexColor("#dc2626")  # red-600

PAGE_W, PAGE_H = LETTER
MARGIN = 0.85 * inch


def build_styles():
    ss = getSampleStyleSheet()
    styles = {}
    styles["CoverTitle"] = ParagraphStyle(
        "CoverTitle", parent=ss["Title"], fontName="Helvetica-Bold", fontSize=28,
        leading=32, textColor=INK, spaceAfter=6, alignment=TA_LEFT,
    )
    styles["CoverSubtitle"] = ParagraphStyle(
        "CoverSubtitle", parent=ss["Normal"], fontName="Helvetica", fontSize=14,
        leading=19, textColor=SUBINK, spaceAfter=4,
    )
    styles["CoverMeta"] = ParagraphStyle(
        "CoverMeta", parent=ss["Normal"], fontName="Helvetica", fontSize=10,
        leading=14, textColor=MUTED,
    )
    styles["H1"] = ParagraphStyle(
        "H1", parent=ss["Heading1"], fontName="Helvetica-Bold", fontSize=16,
        leading=20, textColor=INK, spaceBefore=18, spaceAfter=8,
    )
    styles["H2"] = ParagraphStyle(
        "H2", parent=ss["Heading2"], fontName="Helvetica-Bold", fontSize=12.5,
        leading=16, textColor=INK, spaceBefore=10, spaceAfter=4,
    )
    styles["Body"] = ParagraphStyle(
        "Body", parent=ss["Normal"], fontName="Helvetica", fontSize=10.3,
        leading=15, textColor=INK, spaceAfter=6,
    )
    styles["BodyMuted"] = ParagraphStyle(
        "BodyMuted", parent=styles["Body"], textColor=SUBINK, fontSize=9.7,
    )
    styles["Step"] = ParagraphStyle(
        "Step", parent=styles["Body"], leftIndent=0, spaceAfter=5,
    )
    styles["CalloutLabel"] = ParagraphStyle(
        "CalloutLabel", parent=styles["Body"], fontName="Helvetica-Bold",
        fontSize=9.5, spaceAfter=2, textColor=INK,
    )
    styles["Callout"] = ParagraphStyle(
        "Callout", parent=styles["Body"], fontSize=9.7, leading=13.5, spaceAfter=0,
    )
    styles["TocEntry"] = ParagraphStyle(
        "TocEntry", parent=styles["Body"], fontName="Helvetica-Bold", fontSize=10.6,
        textColor=INK, spaceAfter=3,
    )
    styles["Small"] = ParagraphStyle(
        "Small", parent=styles["Body"], fontSize=8.5, textColor=MUTED, leading=12,
    )
    styles["TableHeader"] = ParagraphStyle(
        "TableHeader", parent=styles["Body"], fontName="Helvetica-Bold", fontSize=9.7,
        textColor=colors.white, spaceAfter=0,
    )
    styles["Caption"] = ParagraphStyle(
        "Caption", parent=styles["Body"], fontSize=8.7, textColor=MUTED, spaceAfter=14,
        alignment=TA_CENTER, fontName="Helvetica-Oblique",
    )
    return styles


def callout(styles, label, text, kind="tip"):
    bg, border = {
        "tip": (TIP_BG, TIP_BORDER),
        "warn": (WARN_BG, WARN_BORDER),
        "dont": (DONT_BG, DONT_BORDER),
    }[kind]
    inner = [Paragraph(label, styles["CalloutLabel"]), Paragraph(text, styles["Callout"])]
    t = Table([[inner]], colWidths=[PAGE_W - 2 * MARGIN])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 3, border),
        ("BOX", (0, 0), (-1, -1), 0, bg),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ]))
    return t


def numbered_steps(styles, steps):
    items = [ListItem(Paragraph(s, styles["Step"]), leftIndent=6, spaceAfter=6) for s in steps]
    return ListFlowable(
        items, bulletType="1", start="1", bulletFontName="Helvetica-Bold",
        bulletFontSize=10, bulletColor=INK, leftIndent=20,
    )


def bullet_list(styles, items, style_name="Step"):
    lis = [ListItem(Paragraph(s, styles[style_name]), leftIndent=4, spaceAfter=4) for s in items]
    return ListFlowable(lis, bulletType="bullet", start="•", leftIndent=16, bulletFontSize=8)


def hr():
    return HRFlowable(width="100%", thickness=0.75, color=LINE, spaceBefore=4, spaceAfter=10)


def screenshot(styles, path, caption=None, width_fraction=1.0):
    """A bordered app screenshot, scaled to the text column width, with an
    optional centered caption underneath. Kept together so it never splits
    across a page break."""
    max_width = (PAGE_W - 2 * MARGIN) * width_fraction
    with PILImage.open(path) as im:
        src_w, src_h = im.size
    img_w = max_width
    img_h = img_w * (src_h / src_w)
    img = Image(path, width=img_w, height=img_h)
    framed = Table([[img]], colWidths=[img_w])
    framed.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 1, LINE),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    flow = [framed]
    if caption:
        flow.append(Spacer(1, 5))
        flow.append(Paragraph(caption, styles["Caption"]))
    else:
        flow.append(Spacer(1, 12))
    return KeepTogether(flow)


def make_doc(filename, title_for_footer):
    doc = BaseDocTemplate(filename, pagesize=LETTER, title=title_for_footer,
                           leftMargin=MARGIN, rightMargin=MARGIN, topMargin=MARGIN, bottomMargin=0.75 * inch)

    frame = Frame(MARGIN, 0.75 * inch, PAGE_W - 2 * MARGIN, PAGE_H - MARGIN - 0.9 * inch, id="body")

    def on_page(c: canvas.Canvas, _doc):
        c.saveState()
        c.setStrokeColor(LINE)
        c.setLineWidth(0.75)
        c.line(MARGIN, 0.62 * inch, PAGE_W - MARGIN, 0.62 * inch)
        logo_h = 0.16 * inch
        logo_w = logo_h / LOGO_ASPECT
        if os.path.exists(LOGO_PATH):
            c.drawImage(LOGO_PATH, MARGIN, 0.40 * inch, width=logo_w, height=logo_h,
                        preserveAspectRatio=True, mask="auto")
        c.setFont("Helvetica", 8.5)
        c.setFillColor(MUTED)
        c.drawString(MARGIN + logo_w + 8, 0.46 * inch, "Survey Shark — " + title_for_footer)
        c.drawRightString(PAGE_W - MARGIN, 0.46 * inch, f"Page {_doc.page}")
        c.restoreState()

    template = PageTemplate(id="normal", frames=[frame], onPage=on_page)
    doc.addPageTemplates([template])
    return doc


def cover_block(styles, title, subtitle, meta_lines):
    flow = []
    if os.path.exists(LOGO_PATH):
        logo_w = 1.5 * inch
        logo_h = logo_w * LOGO_ASPECT
        logo = Image(LOGO_PATH, width=logo_w, height=logo_h)
        logo.hAlign = "LEFT"
        flow.append(logo)
        flow.append(Spacer(1, 10))
    flow.append(Paragraph("SURVEY SHARK", ParagraphStyle(
        "Brand", parent=styles["Body"], fontName="Helvetica-Bold", fontSize=10.5,
        textColor=MUTED, spaceAfter=14,
    )))
    flow.append(Paragraph(title, styles["CoverTitle"]))
    flow.append(Paragraph(subtitle, styles["CoverSubtitle"]))
    flow.append(Spacer(1, 10))
    for m in meta_lines:
        flow.append(Paragraph(m, styles["CoverMeta"]))
    flow.append(Spacer(1, 16))
    flow.append(HRFlowable(width="100%", thickness=1.5, color=INK, spaceAfter=16))
    return flow
