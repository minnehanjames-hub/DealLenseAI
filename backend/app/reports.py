from __future__ import annotations

from io import BytesIO
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def _money(value: float | int | None) -> str:
    if value is None or float(value) == 0:
        return "n/a"
    return f"${float(value):,.0f}M"


def _multiple(value: float | int | None) -> str:
    if value is None or float(value) == 0:
        return "n/a"
    return f"{float(value):.1f}x"


def build_sector_report_pdf(
    sector: str,
    snapshot: dict[str, Any],
    commentary: dict[str, Any],
) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.55 * inch,
        leftMargin=0.55 * inch,
        topMargin=0.45 * inch,
        bottomMargin=0.45 * inch,
    )
    styles = getSampleStyleSheet()
    title = ParagraphStyle(
        "DealTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=20,
        textColor=colors.HexColor("#111827"),
        spaceAfter=8,
    )
    section = ParagraphStyle(
        "DealSection",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11,
        textColor=colors.HexColor("#0f766e"),
        spaceBefore=8,
        spaceAfter=4,
    )
    body = ParagraphStyle(
        "DealBody",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#1f2937"),
    )

    story: list[Any] = [
        Paragraph(f"DealLenseAI Sector Snapshot: {sector}", title),
        Paragraph("Public-source records and clearly labeled synthetic demo data. Verify source documents before investment use.", body),
        Spacer(1, 0.1 * inch),
    ]

    metric_table = Table(
        [
            ["Deal Count", "Median EV/Revenue", "Median EV/EBITDA", "Disclosed Value"],
            [
                snapshot.get("deal_count", 0),
                _multiple(snapshot.get("median_ev_revenue")),
                _multiple(snapshot.get("median_ev_ebitda")),
                _money(snapshot.get("total_value_musd")),
            ],
        ],
        colWidths=[1.45 * inch] * 4,
    )
    metric_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#f3f4f6")),
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#d1d5db")),
                ("PADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    story.append(metric_table)

    story.append(Paragraph("AI Market Commentary", section))
    for bullet in commentary.get("commentary", [])[:4]:
        story.append(Paragraph(f"- {bullet}", body))

    story.append(Paragraph("Most Active Buyers", section))
    top_buyers = snapshot.get("top_acquirers", [])[:5]
    buyer_rows = [["Acquirer", "Deals", "Value", "Median EV/EBITDA"]]
    buyer_rows.extend(
        [
            [
                buyer["acquirer"],
                buyer["deals"],
                _money(buyer.get("total_value_musd")),
                _multiple(buyer.get("median_ev_ebitda")),
            ]
            for buyer in top_buyers
        ]
    )
    story.append(_styled_table(buyer_rows, [2.4 * inch, 0.8 * inch, 1.2 * inch, 1.4 * inch]))

    story.append(Paragraph("Recent Notable Deals", section))
    deal_rows = [["Target", "Acquirer", "Date", "Value", "EV/EBITDA"]]
    deal_rows.extend(
        [
            [
                deal["target_company"],
                deal["acquirer"],
                deal["announcement_date"],
                _money(deal.get("deal_value_musd")),
                _multiple(deal.get("ev_ebitda_multiple")),
            ]
            for deal in snapshot.get("recent_deals", [])[:6]
        ]
    )
    story.append(_styled_table(deal_rows, [1.5 * inch, 1.7 * inch, 0.9 * inch, 0.8 * inch, 0.9 * inch]))

    story.append(Paragraph("Key Risks / Watchpoints", section))
    for point in commentary.get("watchpoints", [])[:3]:
        story.append(Paragraph(f"- {point}", body))

    story.append(Paragraph("Why This Sector May Attract PE Interest", section))
    story.append(
        Paragraph(
            "The sector screens for platform-and-add-on potential where repeatable revenue, fragmented ownership, "
            "operating leverage, and strategic exit paths can support sponsor underwriting. DealLenseAI highlights "
            "where those conditions coincide with valuation discipline and recent buyer activity.",
            body,
        )
    )

    doc.build(story)
    return buffer.getvalue()


def _styled_table(rows: list[list[Any]], widths: list[float]) -> Table:
    table = Table(rows, colWidths=widths, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e5e7eb")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#111827")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 7.5),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#d1d5db")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("PADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return table
