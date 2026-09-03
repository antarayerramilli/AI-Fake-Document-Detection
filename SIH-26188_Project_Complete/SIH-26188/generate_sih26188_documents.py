"""Create clearly marked synthetic identity documents for SIH26188 demos.

This script creates five document types, two clean examples and one example
with a single deliberate issue for each type. The output is synthetic artwork,
not a reproduction of an official document.
"""

from __future__ import annotations

import argparse
import random
from datetime import date, timedelta
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 900, 650
RED = (190, 35, 35)
INK = (30, 42, 58)
MUTED = (95, 103, 112)
PAPER = (250, 250, 246)

NAMES = [
    "Rajesh Kumar", "Sita Devi", "Anita Sharma", "Bikash Thapa",
    "Pema Dorji", "Karma Wangchuk", "Nima Sherpa", "Priya Patel",
]
NEPAL_DISTRICTS = [
    "Kathmandu", "Lalitpur", "Bhaktapur", "Kaski", "Chitwan",
    "Morang", "Jhapa", "Rupandehi", "Banke", "Kailali",
]
BHUTAN_DZONGKHAGS = [
    "Thimphu", "Paro", "Punakha", "Chukha", "Mongar",
    "Bumthang", "Samtse", "Sarpang", "Trashigang", "Wangdue Phodrang",
]
CONSTITUENCIES = [
    "Delhi Sadar", "Mumbai South", "Bangalore North", "Chennai Central",
    "Kolkata East", "Pune", "Jaipur", "Lucknow",
]


def load_font(size: int, bold: bool = False, mono: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    """Load a broadly available font, including a Windows Devanagari fallback."""
    names = []
    if bold:
        names.extend(["C:/Windows/Fonts/arialbd.ttf", "C:/Windows/Fonts/NirmalaB.ttf"])
    else:
        names.extend(["C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/Nirmala.ttf"])
    if mono:
        names.insert(0, "C:/Windows/Fonts/consolab.ttf")
    names.extend([
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    ])
    for name in names:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


FONT_TITLE = load_font(34, bold=True)
FONT_SUBTITLE = load_font(22, bold=True)
FONT_LABEL = load_font(20, bold=True)
FONT_VALUE = load_font(23)
FONT_SMALL = load_font(17)
FONT_MRZ = load_font(22, mono=True)


def text_width(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont) -> int:
    return draw.textbbox((0, 0), text, font=font)[2]


def add_frame(draw: ImageDraw.ImageDraw, title: str, subtitle: str, colors: tuple, nepali=False) -> None:
    draw.rectangle((0, 0, WIDTH - 1, HEIGHT - 1), fill=PAPER, outline=RED, width=12)
    draw.rectangle((16, 16, WIDTH - 17, HEIGHT - 17), outline=colors[0], width=5)
    draw.rectangle((30, 30, WIDTH - 31, 122), fill=colors[1])
    if nepali:
        draw.text((50, 42), "नेपाल सरकार", font=FONT_TITLE, fill=colors[2])
        draw.text((50, 82), title, font=FONT_SUBTITLE, fill=colors[2])
    else:
        draw.text((50, 44), title, font=FONT_TITLE, fill=colors[2])
        draw.text((50, 87), subtitle, font=FONT_SUBTITLE, fill=colors[2])
    banner = "SYNTHETIC DEMO DOCUMENT"
    draw.text((WIDTH - 50 - text_width(draw, banner, FONT_SMALL), 46), banner, font=FONT_SMALL, fill=RED)


def add_photo_placeholder(draw: ImageDraw.ImageDraw, x: int = 65, y: int = 170, size: int = 190) -> None:
    draw.rectangle((x, y, x + size, y + size), fill=(220, 223, 224), outline=(90, 96, 100), width=3)
    draw.text((x + 45, y + 12), "PHOTO", font=FONT_SMALL, fill=MUTED)
    cx, cy = x + size // 2, y + size // 2 + 14
    draw.ellipse((cx - 42, cy - 55, cx + 42, cy + 29), fill=(177, 184, 188), outline=(80, 87, 92), width=2)
    draw.ellipse((cx - 82, cy + 18, cx + 82, cy + 142), fill=(153, 161, 166), outline=(80, 87, 92), width=2)
    draw.ellipse((cx - 22, cy - 18, cx - 12, cy - 8), fill=INK)
    draw.ellipse((cx + 12, cy - 18, cx + 22, cy - 8), fill=INK)
    draw.arc((cx - 28, cy - 2, cx + 28, cy + 30), 0, 180, fill=INK, width=3)


def add_fields(draw: ImageDraw.ImageDraw, fields: Iterable[tuple[str, str]], start_y: int = 170, value_x: int = 500) -> None:
    y = start_y
    for label, value in fields:
        draw.text((310, y), f"{label}:", font=FONT_LABEL, fill=INK)
        draw.text((value_x, y), value, font=FONT_VALUE, fill=(21, 70, 120))
        y += 48


def add_footer(draw: ImageDraw.ImageDraw, note: str) -> None:
    draw.line((45, 565, WIDTH - 45, 565), fill=(190, 195, 198), width=2)
    draw.text((50, 585), note, font=FONT_SMALL, fill=MUTED)
    draw.text((WIDTH - 300, 585), "FOR DEMONSTRATION ONLY", font=FONT_SMALL, fill=RED)


def add_watermark(image: Image.Image) -> Image.Image:
    overlay = Image.new("RGBA", image.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)
    watermark = "DEMO - NOT REAL"
    font = load_font(58, bold=True)
    box = draw.textbbox((0, 0), watermark, font=font)
    text_layer = Image.new("RGBA", (box[2] - box[0] + 40, box[3] - box[1] + 40), (255, 255, 255, 0))
    text_draw = ImageDraw.Draw(text_layer)
    text_draw.text((20, 20), watermark, font=font, fill=(205, 25, 25, 150), stroke_width=2, stroke_fill=(255, 255, 255, 130))
    text_layer = text_layer.rotate(18, expand=True, resample=Image.Resampling.BICUBIC)
    overlay.alpha_composite(text_layer, ((WIDTH - text_layer.width) // 2, (HEIGHT - text_layer.height) // 2))
    return Image.alpha_composite(image.convert("RGBA"), overlay).convert("RGB")


def save_document(image: Image.Image, output: Path, filename: str) -> Path:
    output.mkdir(parents=True, exist_ok=True)
    path = output / filename
    add_watermark(image).save(path, format="PNG")
    return path


def random_date(years_ago: int = 30) -> date:
    today = date.today()
    return today - timedelta(days=365 * years_ago + random.randint(0, 364))


def format_dmy(value: date) -> str:
    return value.strftime("%d/%m/%Y")


def generate_nepal(output: Path, status: str, index: int) -> Path:
    image = Image.new("RGB", (WIDTH, HEIGHT), (255, 253, 247))
    draw = ImageDraw.Draw(image)
    add_frame(draw, "Nepal Citizenship Certificate", "Citizenship Certificate", ((31, 112, 73), (255, 246, 221), (150, 71, 30)), nepali=True)
    add_photo_placeholder(draw)
    name = NAMES[(index + 1) % len(NAMES)]
    father = NAMES[(index + 3) % len(NAMES)]
    district = "District 88" if status == "tampered" else NEPAL_DISTRICTS[index % len(NEPAL_DISTRICTS)]
    fields = [
        ("Citizenship No", f"{4100 + index:04d}-{12345670 + index:08d}"),
        ("Name", name),
        ("Father's Name", father),
        ("District", district),
        ("Date of Birth", format_dmy(random_date(28))),
        ("Date of Issue", format_dmy(date.today() - timedelta(days=300 + index))),
    ]
    add_fields(draw, fields)
    draw.rectangle((45, 540, 855, 552), fill=(237, 151, 54))
    add_footer(draw, "Synthetic Nepal identity record | Saffron, white and green theme")
    return save_document(image, output / "nepal", f"nepal_citizenship_{status}_{index}.png")


def generate_bhutan(output: Path, status: str, index: int) -> Path:
    image = Image.new("RGB", (WIDTH, HEIGHT), (255, 249, 229))
    draw = ImageDraw.Draw(image)
    add_frame(draw, "Royal Government of Bhutan", "Citizen Identity Card (CID)", ((176, 96, 24), (255, 225, 126), (116, 55, 16)))
    add_photo_placeholder(draw)
    dzongkhag = "FakeDzong" if status == "tampered" else BHUTAN_DZONGKHAGS[index % len(BHUTAN_DZONGKHAGS)]
    fields = [
        ("CID Number", f"1070{index:02d}{2345678 + index:07d}"),
        ("Name", NAMES[(index + 4) % len(NAMES)]),
        ("Dzongkhag", dzongkhag),
        ("Date of Issue", format_dmy(date.today() - timedelta(days=500 + index))),
        ("Nationality", "BHUTANESE"),
    ]
    add_fields(draw, fields)
    add_footer(draw, "Synthetic Bhutan CID record | Orange and yellow theme")
    return save_document(image, output / "bhutan", f"bhutan_cid_{status}_{index}.png")


def generate_epic(output: Path, status: str, index: int) -> Path:
    image = Image.new("RGB", (WIDTH, HEIGHT), (248, 251, 255))
    draw = ImageDraw.Draw(image)
    add_frame(draw, "Election Commission of India", "Electors Photo Identity Card (EPIC)", ((25, 75, 140), (232, 241, 255), (19, 57, 112)))
    add_photo_placeholder(draw)
    epic = f"ABC{1234560 + index}" if status != "tampered" else "INVALID-EPIC"
    fields = [
        ("EPIC Number", epic),
        ("Name", NAMES[(index + 2) % len(NAMES)]),
        ("Father's Name", NAMES[(index + 5) % len(NAMES)]),
        ("Date of Birth", format_dmy(random_date(35))),
        ("Constituency", CONSTITUENCIES[index % len(CONSTITUENCIES)]),
    ]
    add_fields(draw, fields)
    add_footer(draw, "Synthetic Indian voter record | Blue and white theme")
    return save_document(image, output / "india_epic", f"india_epic_{status}_{index}.png")


def mrz_value(value: str) -> str:
    return value.upper().replace(" ", "<").replace("-", "<")


def mrz_check(value: str) -> str:
    values = {"<": 0}
    values.update({str(number): number for number in range(10)})
    values.update({chr(ord("A") + i): 10 + i for i in range(26)})
    total = sum(values[char] * (7, 3, 1)[index % 3] for index, char in enumerate(value))
    return str(total % 10)


def make_td3_mrz(passport: str, nationality: str, surname: str, given: str, dob: str, expiry: str, sex: str) -> tuple[str, str]:
    names = mrz_value(f"{surname}<<{given}").ljust(39, "<")[:39]
    line1 = f"P<{nationality}{names}"
    passport_field = mrz_value(passport).ljust(9, "<")[:9]
    personal = f"{passport_field}{mrz_check(passport_field)}{nationality}{dob}{mrz_check(dob)}{sex}{expiry}{mrz_check(expiry)}"
    optional = "<" * 15
    line2_without_composite = personal + optional
    composite = mrz_check(passport_field + mrz_check(passport_field) + nationality + dob + mrz_check(dob) + sex + expiry + mrz_check(expiry) + optional)
    return line1[:44], (line2_without_composite + composite)[:44]


def generate_indian_passport(output: Path, status: str, index: int) -> Path:
    image = Image.new("RGB", (WIDTH, HEIGHT), (247, 250, 255))
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, WIDTH, 122), fill=(18, 49, 94))
    draw.rectangle((0, 0, WIDTH - 1, HEIGHT - 1), outline=RED, width=12)
    draw.rectangle((16, 16, WIDTH - 17, HEIGHT - 17), outline=(18, 49, 94), width=5)
    draw.text((50, 42), "REPUBLIC OF INDIA", font=FONT_TITLE, fill="white")
    draw.text((50, 87), "PASSPORT", font=FONT_SUBTITLE, fill=(221, 232, 247))
    draw.text((WIDTH - 315, 48), "SYNTHETIC DEMO DOCUMENT", font=FONT_SMALL, fill=(255, 190, 190))
    add_photo_placeholder(draw, 65, 160, 175)
    surname = ["Sharma", "Kumar", "Patel", "Singh"][index % 4]
    given = ["Rajesh", "Anita", "Vikram", "Priya"][index % 4]
    passport = f"A{1234560 + index}"
    dob_date = random_date(32)
    issue_date = date.today() - timedelta(days=400 + index)
    expiry_date = date.today() - timedelta(days=100 + index) if status == "tampered" else date.today() + timedelta(days=1200 + index)
    sex = "M" if index % 2 == 0 else "F"
    dob = dob_date.strftime("%y%m%d")
    expiry = expiry_date.strftime("%y%m%d")
    fields = [
        ("Passport Number", passport), ("Name", f"{given} {surname}"),
        ("Surname", surname), ("Nationality", "IND"),
        ("DOB", format_dmy(dob_date)), ("Date of Issue", format_dmy(issue_date)),
        ("Date of Expiry", format_dmy(expiry_date)), ("Place of Birth", "Kathmandu"),
        ("Authority", "Passport Seva"),
    ]
    y = 150
    for label, value in fields:
        draw.text((300, y), f"{label}:", font=FONT_LABEL, fill=INK)
        draw.text((505, y), value, font=FONT_VALUE, fill=(21, 70, 120))
        y += 35
    line1, line2 = make_td3_mrz(passport, "IND", surname, given, dob, expiry, sex)
    draw.rectangle((45, 485, 855, 555), fill=(224, 235, 224), outline=(70, 90, 70), width=2)
    draw.text((58, 495), line1, font=FONT_MRZ, fill=(15, 15, 15))
    draw.text((58, 528), line2, font=FONT_MRZ, fill=(15, 15, 15))
    add_footer(draw, "Synthetic Indian passport record | TD3-style MRZ shown for demo parsing")
    return save_document(image, output / "india_passport", f"india_passport_{status}_{index}.png")


def generate_foreign(output: Path, status: str, index: int) -> Path:
    image = Image.new("RGB", (WIDTH, HEIGHT), (252, 250, 246))
    draw = ImageDraw.Draw(image)
    add_frame(draw, "FOREIGN PASSPORT + INDIAN VISA", "Synthetic travel document sample", ((79, 85, 99), (232, 235, 239), (38, 45, 59)))
    draw.line((450, 145, 450, 555), fill=(170, 175, 180), width=3)
    add_photo_placeholder(draw, 55, 170, 170)
    nationality = ["USA", "GBR", "PAK", "BGD"][index % 4]
    dob = random_date(31)
    expiry = date.today() + timedelta(days=900 + index)
    passport_fields = [
        ("Passport Number", f"X{765430 + index}"), ("Name", NAMES[(index + 6) % len(NAMES)]),
        ("Nationality", nationality), ("DOB", format_dmy(dob)), ("Expiry", format_dmy(expiry)),
    ]
    y = 165
    for label, value in passport_fields:
        draw.text((250, y), f"{label}:", font=FONT_LABEL, fill=INK)
        draw.text((365, y), value, font=FONT_SMALL, fill=(21, 70, 120))
        y += 43
    draw.rounded_rectangle((490, 160, 835, 500), radius=18, fill=(255, 247, 221), outline=(169, 111, 39), width=4)
    draw.text((550, 185), "INDIAN VISA", font=FONT_SUBTITLE, fill=(128, 62, 20))
    visa_fields = [
        ("Visa Number", f"VISA{4800 + index}" if status != "tampered" else "FAKE-VISA"),
        ("Type", "Tourist" if status != "tampered" else "INVALID"),
        ("Issue Date", format_dmy(date.today() - timedelta(days=30 + index))),
        ("Expiry Date", format_dmy(date.today() + timedelta(days=300 + index))),
    ]
    y = 260
    for label, value in visa_fields:
        draw.text((515, y), f"{label}:", font=FONT_LABEL, fill=INK)
        draw.text((665, y), value, font=FONT_SMALL, fill=RED if status == "tampered" else (21, 70, 120))
        y += 48
    draw.ellipse((620, 410, 770, 485), outline=RED, width=5)
    draw.text((650, 435), "VISA STAMP", font=FONT_SMALL, fill=RED)
    add_footer(draw, "Synthetic foreign travel record | Visa area is illustrative only")
    return save_document(image, output / "foreign", f"foreign_passport_visa_{status}_{index}.png")


def generate_all(output: Path) -> list[Path]:
    random.seed(26188)
    generated = []
    for index in (1, 2):
        generated.append(generate_nepal(output, "clean", index))
        generated.append(generate_bhutan(output, "clean", index))
        generated.append(generate_epic(output, "clean", index))
        generated.append(generate_indian_passport(output, "clean", index))
        generated.append(generate_foreign(output, "clean", index))
    generated.extend([
        generate_nepal(output, "tampered", 3),
        generate_bhutan(output, "tampered", 3),
        generate_epic(output, "tampered", 3),
        generate_indian_passport(output, "tampered", 3),
        generate_foreign(output, "tampered", 3),
    ])
    return generated


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate SIH26188 synthetic identity documents.")
    parser.add_argument("--output", type=Path, default=Path("data"), help="Output root directory (default: data)")
    args = parser.parse_args()
    generated = generate_all(args.output)
    print(f"Generated {len(generated)} synthetic PNG documents in {args.output.resolve()}")
    for path in generated:
        print(path)


if __name__ == "__main__":
    main()
