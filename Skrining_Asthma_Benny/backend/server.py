from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash
import joblib
import json
import numpy as np
import os
from datetime import datetime, timedelta
from io import BytesIO
from functools import wraps

try:
    import jwt as pyjwt
except ImportError:
    pyjwt = None

try:
    import mysql.connector
    from mysql.connector import Error as MySQLError
except ImportError:
    mysql = None

    class MySQLError(Exception):
        pass


app = Flask(__name__)
CORS(app)

# Konfigurasi JWT dipakai oleh endpoint auth dan route privat aplikasi.

# ── JWT Configuration ─────────────────────────────────────────────────────────
JWT_SECRET = os.getenv("JWT_SECRET", "asthmascreen-secret-key-ganti-di-production")
JWT_EXPIRY_HOURS = int(os.getenv("JWT_EXPIRY_HOURS", "24"))

def generate_token(user_id, email):
    """Buat JWT token dengan expiry 24 jam (default)."""
    if not pyjwt:
        return None
    payload = {
        "sub": str(user_id),
        "email": email,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_token(token):
    """Decode dan validasi JWT token. Return payload atau raise exception."""
    if not pyjwt:
        raise RuntimeError("PyJWT belum terpasang. Install: pip install PyJWT")
    return pyjwt.decode(token, JWT_SECRET, algorithms=["HS256"])


def require_auth(f):
    """Decorator: pastikan request menyertakan Bearer token yang valid."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"success": False, "message": "Token tidak ditemukan. Silakan login kembali."}), 401
        token = auth_header.split(" ", 1)[1]
        try:
            payload = decode_token(token)
            request.current_user_id = int(payload["sub"])
            request.current_user_email = payload["email"]
        except Exception as exc:
            return jsonify({"success": False, "message": f"Token tidak valid atau sudah kadaluarsa: {exc}"}), 401
        return f(*args, **kwargs)
    return decorated

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
MODEL_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODEL_DIR, "model_best.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler_best.pkl")
METADATA_PATH = os.path.join(MODEL_DIR, "evaluation_metadata.json")


def load_env_file(file_path):
    """Muat file .env sederhana tanpa library tambahan."""
    if not os.path.exists(file_path):
        return

    with open(file_path, "r", encoding="utf-8") as env_file:
        for raw_line in env_file:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


load_env_file(os.path.join(PROJECT_ROOT, ".env"))
load_env_file(os.path.join(BASE_DIR, ".env"))

# Parameter koneksi database dibaca dari environment agar mudah dipindah antar mesin.

DB_CONFIG = {
    "host": os.getenv("MYSQL_HOST", "127.0.0.1"),
    "port": int(os.getenv("MYSQL_PORT", "3306")),
    "user": os.getenv("MYSQL_USER", "root"),
    "password": os.getenv("MYSQL_PASSWORD", ""),
    "database": os.getenv("MYSQL_DATABASE", "asthma_db"),
}

ASTHMA_FEATURES = [
    "Age",
    "Gender",
    "Ethnicity",
    "EducationLevel",
    "BMI",
    "Smoking",
    "PhysicalActivity",
    "DietQuality",
    "SleepQuality",
    "PollutionExposure",
    "PollenExposure",
    "DustExposure",
    "PetAllergy",
    "FamilyHistoryAsthma",
    "HistoryOfAllergies",
    "Eczema",
    "HayFever",
    "GastroesophagealReflux",
    "LungFunctionFEV1",
    "LungFunctionFVC",
    "Wheezing",
    "ShortnessOfBreath",
    "ChestTightness",
    "Coughing",
    "NighttimeSymptoms",
    "ExerciseInduced",
]

LOCAL_RISK_AND_SYMPTOM_FEATURES = [
    "Batuk",
    "pilek",
    "demam",
    "sesak",
    "mengi",
    "mual",
    "lemas",
    "nyeri dada",
    "nyeri uluh hati",
    "pusing",
    "dahak",
    "napas berat",
    "riwayat keluarga",
    "alergi",
    "penyakit bawaan",
    "dm",
    "penyakit_tb",
    "gerd",
    "merokok",
    "populasi udara",
    "tidur",
    "aktivitas",
    "mudah lelah",
]

LOCAL_INPUT_FEATURE_ORDER = [
    "umur",
    "tb",
    "bb",
    "jenis kelamin",
    "Batuk",
    "pilek",
    "demam",
    "sesak",
    "mengi",
    "mual",
    "lemas",
    "nyeri dada",
    "nyeri uluh hati",
    "pusing",
    "dahak",
    "napas berat",
    "riwayat keluarga",
    "alergi",
    "penyakit bawaan",
    "dm",
    "penyakit_tb",
    "gerd",
    "merokok",
    "populasi udara",
    "tidur",
    "aktivitas",
    "mudah lelah",
]

LOCAL_CORE_ASTHMA_FEATURES = [
    "Batuk",
    "sesak",
    "mengi",
    "nyeri dada",
    "napas berat",
    "riwayat keluarga",
    "alergi",
    "gerd",
    "populasi udara",
]

LOCAL_SINGLE_SYMPTOM_NEGATIVE_FEATURES = [
    "Batuk",
    "sesak",
    "dahak",
    "mudah lelah",
]

LOCAL_SMOKING_WITHOUT_ASTHMA_INDICATORS = [
    "Batuk",
    "sesak",
    "mengi",
    "nyeri dada",
    "dahak",
    "napas berat",
    "riwayat keluarga",
    "alergi",
    "penyakit bawaan",
    "gerd",
]

FEATURE_ALIASES = {
    "umur": ["Age", "age"],
    "Age": ["umur", "age"],
    "tb": ["Height", "height"],
    "bb": ["Weight", "weight"],
    "jenis kelamin": ["Gender", "gender"],
    "Gender": ["jenis kelamin", "gender"],
    "Batuk": ["Coughing", "coughing"],
    "Coughing": ["Batuk", "batuk", "coughing"],
    "sesak": ["ShortnessOfBreath", "shortness_of_breath"],
    "ShortnessOfBreath": ["sesak", "shortness_of_breath"],
    "mengi": ["Wheezing", "wheezing"],
    "Wheezing": ["mengi", "wheezing"],
    "nyeri dada": ["ChestTightness", "chest_tightness"],
    "ChestTightness": ["nyeri dada", "chest_tightness"],
    "riwayat keluarga": ["FamilyHistoryAsthma", "family_history_asthma"],
    "FamilyHistoryAsthma": ["riwayat keluarga", "family_history_asthma"],
    "alergi": ["HistoryOfAllergies", "PetAllergy", "history_of_allergies"],
    "HistoryOfAllergies": ["alergi", "history_of_allergies"],
    "PetAllergy": ["alergi", "pet_allergy"],
    "gerd": ["GastroesophagealReflux", "gastroesophageal_reflux"],
    "GastroesophagealReflux": ["gerd", "gastroesophageal_reflux"],
    "merokok": ["Smoking", "smoking"],
    "Smoking": ["merokok", "smoking"],
    "populasi udara": ["PollutionExposure", "pollution_exposure"],
    "PollutionExposure": ["populasi udara", "pollution_exposure"],
    "tidur": ["SleepQuality", "sleep_quality"],
    "SleepQuality": ["tidur", "sleep_quality"],
    "aktivitas": ["PhysicalActivity", "physical_activity"],
    "PhysicalActivity": ["aktivitas", "physical_activity"],
    "mudah lelah": ["ExerciseInduced", "exercise_induced"],
    "ExerciseInduced": ["mudah lelah", "exercise_induced"],
}


# SQL tabel disimpan di Python agar backend bisa memastikan skema dasar otomatis tersedia.
USERS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
"""

SCREENING_RESULTS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS screening_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    patient_name VARCHAR(160) NOT NULL,
    dataset_mode VARCHAR(40) NOT NULL,
    model_used VARCHAR(120) NOT NULL,
    prediction TINYINT NOT NULL,
    label VARCHAR(40) NOT NULL,
    probability_asma DECIMAL(6,2) NOT NULL,
    probability_sehat DECIMAL(6,2) NOT NULL,
    confidence_score DECIMAL(6,2) NOT NULL,
    threshold_value DECIMAL(8,4) NOT NULL,
    risk_factors JSON NULL,
    input_features JSON NOT NULL,
    result_payload JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_screening_user_created (user_id, created_at),
    CONSTRAINT fk_screening_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
)
"""


def mysql_available():
    """Cek apakah driver MySQL berhasil diimport."""
    return mysql is not None


def get_db_connection():
    """Buat koneksi database tunggal berdasarkan konfigurasi environment."""
    if not mysql_available():
        raise RuntimeError(
            "mysql-connector-python belum terpasang. Install dulu dengan "
            '"pip install mysql-connector-python".'
        )

    return mysql.connector.connect(**DB_CONFIG)


def ensure_database_tables():
    """Pastikan tabel users dan riwayat skrining ada sebelum dipakai endpoint."""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute(USERS_TABLE_SQL)
        cursor.execute(SCREENING_RESULTS_TABLE_SQL)
        connection.commit()
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


def ensure_users_table():
    """Wrapper kompatibilitas untuk memastikan tabel user sudah tersedia."""
    ensure_database_tables()


def check_mysql_health():
    """Dipakai health check untuk memberi tahu kesiapan fitur auth dan riwayat."""
    try:
        ensure_database_tables()
        return {"enabled": True, "message": "MySQL auth dan riwayat skrining siap digunakan."}
    except Exception as exc:
        return {"enabled": False, "message": str(exc)}


def sanitize_user(user_row):
    """Kirim hanya field user yang aman ke frontend."""
    return {
        "id": user_row["id"],
        "full_name": user_row["full_name"],
        "email": user_row["email"],
    }


def parse_json_field(value, fallback):
    """Normalisasi field JSON dari database agar aman dipakai ulang."""
    if value is None:
        return fallback
    if isinstance(value, (dict, list)):
        return value
    try:
        return json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return fallback


def serialize_screening(row, include_details=False):
    """Ubah baris database menjadi struktur respons JSON yang rapi."""
    item = {
        "id": row["id"],
        "user_id": row["user_id"],
        "patient_name": row["patient_name"],
        "dataset_mode": row["dataset_mode"],
        "model_used": row["model_used"],
        "prediction": row["prediction"],
        "label": row["label"],
        "probability_asma": float(row["probability_asma"]),
        "probability_sehat": float(row["probability_sehat"]),
        "confidence_score": float(row["confidence_score"]),
        "created_at": row["created_at"].isoformat() if hasattr(row["created_at"], "isoformat") else str(row["created_at"]),
    }
    if include_details:
        item.update({
            "threshold": float(row["threshold_value"]),
            "risk_factors": parse_json_field(row.get("risk_factors"), []),
            "input_features": parse_json_field(row.get("input_features"), {}),
            "result_payload": parse_json_field(row.get("result_payload"), {}),
        })
    return item


def save_screening_result(user_id, patient_name, dataset_mode, result_payload, input_features):
    """Simpan hasil prediksi yang berhasil agar bisa muncul di riwayat dan PDF."""
    connection = None
    cursor = None
    try:
        ensure_database_tables()
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO screening_results (
                user_id, patient_name, dataset_mode, model_used, prediction, label,
                probability_asma, probability_sehat, confidence_score, threshold_value,
                risk_factors, input_features, result_payload
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                user_id,
                patient_name,
                dataset_mode,
                result_payload["model_used"],
                result_payload["prediction"],
                result_payload["label"],
                result_payload["probability_asma"],
                result_payload["probability_sehat"],
                result_payload["confidence_score"],
                result_payload["threshold"],
                json.dumps(result_payload.get("risk_factors", []), ensure_ascii=False),
                json.dumps(input_features, ensure_ascii=False),
                json.dumps(result_payload, ensure_ascii=False),
            ),
        )
        connection.commit()
        return cursor.lastrowid, None
    except Exception as exc:
        return None, str(exc)
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


def pdf_safe_text(value):
    """Bersihkan karakter yang berpotensi bermasalah pada PDF sederhana buatan manual."""
    text = str(value)
    replacements = {
        "—": "-",
        "–": "-",
        "×": "x",
        "²": "2",
        "“": '"',
        "”": '"',
        "’": "'",
    }
    for source, target in replacements.items():
        text = text.replace(source, target)
    return "".join(char for char in text if ord(char) < 128).strip()


def pdf_escape(value):
    return pdf_safe_text(value).replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def pdf_text(content, x, y, text, size=10, font="F1", color=(31, 41, 55)):
    """Tambahkan instruksi teks PDF mentah ke stream halaman."""
    r, g, b = [component / 255 for component in color]
    content.extend([
        f"{r:.3f} {g:.3f} {b:.3f} rg",
        "BT",
        f"/{font} {size} Tf",
        f"1 0 0 1 {x} {y} Tm",
        f"({pdf_escape(text)}) Tj",
        "ET",
    ])


def pdf_rect(content, x, y, width, height, fill=(255, 255, 255), stroke=None):
    """Gambar kotak berwarna untuk kartu dan elemen layout PDF."""
    r, g, b = [component / 255 for component in fill]
    content.append(f"{r:.3f} {g:.3f} {b:.3f} rg")
    if stroke:
        sr, sg, sb = [component / 255 for component in stroke]
        content.append(f"{sr:.3f} {sg:.3f} {sb:.3f} RG")
        content.append(f"{x} {y} {width} {height} re B")
    else:
        content.append(f"{x} {y} {width} {height} re f")


def wrap_pdf_text(text, max_chars=64):
    """Pecah teks panjang menjadi beberapa baris sederhana berbasis jumlah karakter."""
    words = str(text).split()
    if not words:
        return [""]

    lines = []
    current = ""
    for word in words:
        if len(word) > max_chars:
            if current:
                lines.append(current)
                current = ""
            for index in range(0, len(word), max_chars):
                lines.append(word[index:index + max_chars])
            continue
        candidate = f"{current} {word}".strip()
        if len(candidate) > max_chars and current:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines


def build_screening_pdf(item):
    """Bangun file PDF hasil skrining tanpa dependency generator PDF eksternal."""
    is_asma = int(item["prediction"]) == 1
    status_color = (220, 53, 69) if is_asma else (22, 163, 74)
    status_bg = (255, 234, 234) if is_asma else (232, 255, 243)
    risk_factors = item["risk_factors"] or ["Tidak ada faktor risiko dominan."]
    input_features = item["input_features"] or {}
    result_payload = item.get("result_payload") or {}
    page_width = 595
    page_height = 842
    margin_x = 42
    content_width = page_width - (margin_x * 2)
    top_start_y = 744
    bottom_limit = 72
    page_streams = []
    content = []
    current_y = top_start_y

    pdf_feature_labels = {
        "bb": "Berat Badan",
        "tb": "Tinggi Badan",
        "dm": "Diabetes Militus",
        "umur": "Umur",
        "jenis kelamin": "Jenis Kelamin",
        "batuk": "Batuk",
        "pilek": "Pilek",
        "demam": "Demam",
        "sesak": "Sesak Napas",
        "mengi": "Mengi",
        "mual": "Mual",
        "lemas": "Lemas",
        "nyeri dada": "Nyeri Dada",
        "nyeri uluh hati": "Nyeri Ulu Hati",
        "pusing": "Pusing",
        "dahak": "Dahak",
        "napas berat": "Napas Berat",
        "riwayat keluarga": "Riwayat Penyakit Asma Keluarga",
        "alergi": "Riwayat Alergi",
        "penyakit bawaan": "Riwayat Penyakit Asma Sebelumnya",
        "penyakit_tb": "Riwayat Penyakit TBC",
        "gerd": "GERD",
        "merokok": "Kebiasaan Merokok",
        "populasi udara": "Paparan Polusi Udara",
        "tidur": "Kualitas Tidur",
        "aktivitas": "Aktivitas Fisik",
        "mudah lelah": "Mudah Lelah",
    }

    def start_page():
        nonlocal content, current_y
        content = []
        pdf_rect(content, 0, 770, page_width, 72, fill=(234, 247, 255))
        pdf_text(content, 42, 812, "AsthmaScreen", size=12, font="F2", color=(45, 156, 219))
        pdf_text(content, 42, 790, "Hasil Analisis Skrining Asma", size=22, font="F2", color=(17, 24, 39))
        pdf_text(content, 410, 794, f"ID #{item['id']}", size=10, font="F2", color=(107, 114, 128))
        current_y = top_start_y

    def finish_page():
        if content:
            page_streams.append("\n".join(content).encode("latin-1", errors="replace"))

    def ensure_space(required_height):
        nonlocal current_y
        if current_y - required_height < bottom_limit:
            finish_page()
            start_page()

    def draw_multiline_text(x, y, lines, size=10, font="F1", color=(31, 41, 55), line_gap=13):
        text_y = y
        for line in lines:
            pdf_text(content, x, text_y, line, size=size, font=font, color=color)
            text_y -= line_gap
        return text_y

    def draw_card_title(title):
        nonlocal current_y
        pdf_text(content, margin_x, current_y, title, size=13, font="F2")
        current_y -= 18

    start_page()

    result_desc = (
        "Terdeteksi indikasi asma berdasarkan data klinis yang dimasukkan."
        if is_asma
        else "Tidak terdeteksi indikasi asma berdasarkan data klinis saat ini."
    )
    desc_lines = wrap_pdf_text(result_desc, max_chars=76)
    result_card_height = 74 + (len(desc_lines) * 12)
    ensure_space(result_card_height)
    pdf_rect(content, margin_x, current_y - result_card_height, content_width, result_card_height, fill=status_bg, stroke=status_color)
    pdf_text(content, 62, current_y - 34, item["label"], size=28, font="F2", color=status_color)
    draw_multiline_text(62, current_y - 56, desc_lines, size=10, color=(75, 85, 99), line_gap=12)
    current_y -= result_card_height + 20

    detail_left_lines = [
        f"Tanggal: {item['created_at']}",
        f"Model: {item['model_used']}",
    ]
    detail_right_lines = [
        f"Prediksi: {item['label']}",
    ]
    if result_payload.get("clinical_rule_applied"):
        detail_right_lines.append("Rule klinis diterapkan")

    detail_card_height = max(72, 26 + (max(len(detail_left_lines), len(detail_right_lines)) * 16))
    ensure_space(detail_card_height)
    left_x = margin_x
    right_x = margin_x + 266
    card_width = 245

    pdf_rect(content, left_x, current_y - detail_card_height, card_width, detail_card_height, fill=(255, 255, 255), stroke=(214, 226, 235))
    pdf_text(content, left_x + 16, current_y - 18, "Detail Pemeriksaan", size=12, font="F2")
    draw_multiline_text(left_x + 16, current_y - 36, detail_left_lines, size=9, line_gap=16)

    pdf_rect(content, right_x, current_y - detail_card_height, card_width, detail_card_height, fill=(255, 255, 255), stroke=(214, 226, 235))
    pdf_text(content, right_x + 16, current_y - 18, "Keputusan Model", size=12, font="F2")
    detail_right_y = current_y - 36
    for index, line in enumerate(detail_right_lines):
        color = status_color if "Prediksi:" in line else (45, 156, 219) if "Rule klinis" in line else (31, 41, 55)
        pdf_text(content, right_x + 16, detail_right_y - (index * 16), line, size=9, color=color)
    current_y -= detail_card_height + 22

    draw_card_title("Faktor Risiko Terdeteksi")
    risk_lines = []
    for risk in risk_factors:
        risk_lines.extend(wrap_pdf_text(f"- {pdf_safe_text(risk)}", max_chars=78))

    risk_index = 0
    while risk_index < len(risk_lines):
        available_lines = max(1, int((current_y - bottom_limit - 20) / 14))
        lines_chunk = risk_lines[risk_index:risk_index + available_lines]
        block_height = 22 + (len(lines_chunk) * 14)
        ensure_space(block_height)
        pdf_rect(content, margin_x, current_y - block_height, content_width, block_height, fill=(255, 255, 255), stroke=(214, 226, 235))
        draw_multiline_text(54, current_y - 20, lines_chunk, size=9, line_gap=14)
        current_y -= block_height + 20
        risk_index += len(lines_chunk)
        if risk_index < len(risk_lines):
            draw_card_title("Faktor Risiko Terdeteksi (Lanjutan)")

    draw_card_title("Ringkasan Data Input")
    dataset_mode = str(item.get("dataset_mode", "local")).lower()
    preferred_order = ASTHMA_FEATURES if dataset_mode == "asthma" else LOCAL_INPUT_FEATURE_ORDER
    ordered_keys = [key for key in preferred_order if key in input_features]
    remaining_keys = [key for key in input_features.keys() if key not in ordered_keys]
    entries = [("patient_name", item.get("patient_name", "-"))]
    entries.extend((key, input_features[key]) for key in ordered_keys + remaining_keys)
    value_x = margin_x + 245
    row_top_padding = 12
    row_bottom_padding = 10

    row_specs = []
    for key, value in entries:
        label = "Nama Pasien" if str(key) == "patient_name" else pdf_feature_labels.get(str(key), str(key))
        value_text = pdf_safe_text(value)
        label_lines = wrap_pdf_text(label, max_chars=32)
        value_lines = wrap_pdf_text(value_text, max_chars=36)
        row_height = row_top_padding + row_bottom_padding + (max(len(label_lines), len(value_lines)) * 12)
        row_specs.append((label_lines, value_lines, row_height))

    row_index = 0
    while row_index < len(row_specs):
        table_top = current_y
        remaining_height = current_y - bottom_limit
        rows_in_page = []
        used_height = 0

        while row_index < len(row_specs):
            _, _, row_height = row_specs[row_index]
            if rows_in_page and used_height + row_height > remaining_height - 20:
                break
            if not rows_in_page and row_height > remaining_height - 20:
                ensure_space(row_height + 20)
                table_top = current_y
                remaining_height = current_y - bottom_limit
            rows_in_page.append(row_specs[row_index])
            used_height += row_height
            row_index += 1

        table_height = used_height
        ensure_space(table_height + 2)
        pdf_rect(content, margin_x, table_top - table_height, content_width, table_height, fill=(255, 255, 255), stroke=(214, 226, 235))

        draw_y = table_top
        for index, (label_lines, value_lines, row_height) in enumerate(rows_in_page):
            row_bottom = draw_y - row_height
            if index % 2 == 0:
                pdf_rect(content, margin_x + 1, row_bottom, content_width - 2, row_height, fill=(248, 250, 252))
            pdf_text(content, margin_x + 14, draw_y - row_top_padding, label_lines[0], size=8, font="F2", color=(75, 85, 99))
            if len(label_lines) > 1:
                draw_multiline_text(margin_x + 14, draw_y - row_top_padding - 12, label_lines[1:], size=8, color=(75, 85, 99), line_gap=12)
            draw_multiline_text(value_x, draw_y - row_top_padding, value_lines, size=8, font="F2", color=(17, 24, 39), line_gap=12)
            pdf_rect(content, margin_x + 225, row_bottom + 6, 1, row_height - 12, fill=(229, 231, 235))
            draw_y = row_bottom

        current_y = table_top - table_height - 20
        if row_index < len(row_specs):
            draw_card_title("Ringkasan Data Input (Lanjutan)")

    footer_note = (
        "Catatan: Terdeteksi indikasi asma. Diharapkan segera ke layanan kesehatan terdekat."
        if is_asma
        else "Catatan: Hasil ini adalah alat bantu skrining dan bukan pengganti diagnosis dokter."
    )
    footer_lines = wrap_pdf_text(footer_note, max_chars=84)
    footer_height = 18 + (len(footer_lines) * 11)
    ensure_space(footer_height)
    pdf_rect(content, margin_x, current_y - footer_height, content_width, footer_height, fill=(248, 250, 252), stroke=(214, 226, 235))
    draw_multiline_text(55, current_y - 14, footer_lines, size=8, color=(75, 85, 99), line_gap=11)

    finish_page()

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        None,
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    ]

    kids_refs = []
    next_object_number = len(objects) + 1
    for stream in page_streams:
        page_obj_number = next_object_number
        content_obj_number = next_object_number + 1
        kids_refs.append(f"{page_obj_number} 0 R")
        objects.append(
            (
                f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {page_width} {page_height}] "
                f"/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents {content_obj_number} 0 R >>"
            ).encode("ascii")
        )
        objects.append(
            b"<< /Length " + str(len(stream)).encode("ascii") + b" >>\nstream\n" + stream + b"\nendstream"
        )
        next_object_number += 2

    objects[1] = (
        f"<< /Type /Pages /Kids [{' '.join(kids_refs)}] /Count {len(page_streams)} >>"
    ).encode("ascii")

    output = BytesIO()
    output.write(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(output.tell())
        output.write(f"{index} 0 obj\n".encode("ascii"))
        output.write(obj)
        output.write(b"\nendobj\n")

    xref = output.tell()
    output.write(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    output.write(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        output.write(f"{offset:010d} 00000 n \n".encode("ascii"))
    output.write(
        f"trailer << /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF".encode("ascii")
    )
    output.seek(0)
    return output


def load_artifacts():
    """Muat model, scaler, metadata, dan opsi model lain dari folder artifacts."""
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model tidak ditemukan: {MODEL_PATH}")
    if not os.path.exists(SCALER_PATH):
        raise FileNotFoundError(f"Scaler tidak ditemukan: {SCALER_PATH}")
    if not os.path.exists(METADATA_PATH):
        raise FileNotFoundError(f"Metadata tidak ditemukan: {METADATA_PATH}")

    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)

    with open(METADATA_PATH, "r", encoding="utf-8") as file:
        metadata = json.load(file)

    feature_names = metadata.get("features", [])
    threshold = float(metadata.get("threshold", 0.5))
    best_model_name = metadata.get("best_model", "Model terbaik")
    best_dataset = metadata.get("best_dataset", "-")

    def result_for(dataset, algorithm=None):
        candidates = [
            item for item in metadata.get("all_results", [])
            if item.get("dataset") == dataset
        ]
        if algorithm:
            candidates = [
                item for item in candidates
                if item.get("label", "").strip().startswith(algorithm)
            ]
        if not candidates:
            return {}
        return sorted(candidates, key=lambda item: item.get("composite", 0), reverse=True)[0]

    def optional_models_for(dataset, model_files, default_threshold):
        optional_models = {}
        for key, filename in model_files.items():
            path = os.path.join(MODEL_DIR, filename)
            if os.path.exists(path):
                result_meta = result_for(dataset, key)
                optional_models[key] = {
                    "model": joblib.load(path),
                    "threshold": float(result_meta.get("threshold", default_threshold)),
                }
        return optional_models

    asthma_best = result_for("asthma")
    asthma_label = asthma_best.get("label", "LightGBM - Dataset A")
    asthma_threshold = float(asthma_best.get("threshold", 0.5))
    asthma_model_file = (
        "model_xgb_asthma.pkl"
        if asthma_label.strip().startswith("XGBoost")
        else "model_lgbm_asthma.pkl"
    )

    datasets = {
        "local": {
            "model": model,
            "scaler": scaler,
            "feature_names": feature_names,
            "threshold": threshold,
            "model_name": best_model_name,
            "dataset": "local",
            "optional_models": optional_models_for(
                "local",
                {
                    "LightGBM": "model_lgbm_local.pkl",
                    "XGBoost": "model_xgb_local.pkl",
                },
                threshold,
            ),
        },
    }

    asthma_model_path = os.path.join(MODEL_DIR, asthma_model_file)
    asthma_scaler_path = os.path.join(MODEL_DIR, "scaler_asthma.pkl")
    if os.path.exists(asthma_model_path) and os.path.exists(asthma_scaler_path):
        datasets["asthma"] = {
            "model": joblib.load(asthma_model_path),
            "scaler": joblib.load(asthma_scaler_path),
            "feature_names": ASTHMA_FEATURES,
            "threshold": asthma_threshold,
            "model_name": asthma_label,
            "dataset": "asthma",
            "optional_models": optional_models_for(
                "asthma",
                {
                    "LightGBM": "model_lgbm_asthma.pkl",
                    "XGBoost": "model_xgb_asthma.pkl",
                },
                asthma_threshold,
            ),
        }

    return {
        "model": model,
        "scaler": scaler,
        "metadata": metadata,
        "feature_names": feature_names,
        "threshold": threshold,
        "best_model_name": best_model_name,
        "best_dataset": best_dataset,
        "datasets": datasets,
        "optional_models": datasets.get(best_dataset, datasets["local"])["optional_models"],
    }


try:
    ARTIFACTS = load_artifacts()
    LOAD_ERROR = None
except Exception as exc:
    ARTIFACTS = None
    LOAD_ERROR = str(exc)


def first_present_value(data, keys, default=0):
    """Ambil nilai pertama yang tersedia dari beberapa nama field alias."""
    for key in keys:
        if key in data and data[key] not in (None, ""):
            return data[key]
    return default


def normalize_features(features_input, dataset_artifacts=None):
    """Samakan nama field input ke format fitur model yang sedang aktif."""
    dataset_artifacts = dataset_artifacts or ARTIFACTS
    feature_names = dataset_artifacts["feature_names"]
    normalized = {}
    missing = []

    for feature in feature_names:
        if feature in features_input and features_input[feature] not in (None, ""):
            raw_value = features_input[feature]
        elif feature == "BMI":
            weight = first_present_value(features_input, ["bb", "Weight", "weight"], default=0)
            height = first_present_value(features_input, ["tb", "Height", "height"], default=0)
            try:
                height_m = float(height) / 100
                raw_value = float(weight) / (height_m * height_m) if height_m > 0 else 0
            except (TypeError, ValueError, ZeroDivisionError):
                raw_value = 0
        else:
            raw_value = first_present_value(
                features_input,
                FEATURE_ALIASES.get(feature, []),
                default=0,
            )
            if raw_value == 0 and feature not in features_input:
                missing.append(feature)

        try:
            normalized[feature] = float(raw_value)
        except (TypeError, ValueError):
            raise ValueError(f'Nilai fitur "{feature}" tidak valid: {raw_value}')

    return normalized, missing


def make_feature_matrix(normalized_features, dataset_artifacts=None):
    """Susun urutan fitur lalu skalakan agar cocok dengan format input model."""
    dataset_artifacts = dataset_artifacts or ARTIFACTS
    raw = np.array(
        [[normalized_features[feature] for feature in dataset_artifacts["feature_names"]]],
        dtype=float,
    )
    return dataset_artifacts["scaler"].transform(raw)


def prediction_from_majority_probability(probability_asma, probability_sehat):
    """Tentukan label akhir dari probabilitas kelas yang lebih besar."""
    return 1 if float(probability_asma) > float(probability_sehat) else 0


def predict_with_majority_probability(model, feature_matrix):
    """Ambil probabilitas model lalu konversi ke prediksi biner sederhana."""
    probabilities = model.predict_proba(feature_matrix)[0]
    probability_asma = float(probabilities[1])
    probability_sehat = float(probabilities[0])
    prediction = prediction_from_majority_probability(probability_asma, probability_sehat)
    return prediction, probabilities


def pct(value):
    """Ubah angka probabilitas 0-1 menjadi persentase dua desimal."""
    return round(float(value) * 100, 2)


def detect_risk_factors(features):
    """Bangun daftar faktor risiko yang akan ditampilkan ke pengguna aplikasi."""
    risks = []

    # ── Gejala Inti Asma ────────────────────────────────────────────────────────
    if features.get("mengi", features.get("Wheezing", 0)) == 1:
        risks.append("🔴 Mengi (Wheezing) — bunyi napas ngik khas penyempitan saluran napas")
    if features.get("sesak", features.get("ShortnessOfBreath", 0)) == 1:
        risks.append("🔴 Sesak napas — kesulitan bernapas yang mengganggu aktivitas")
    if features.get("nyeri dada", features.get("ChestTightness", 0)) == 1:
        risks.append("🔴 Dada terasa berat/tertekan — tanda khas serangan asma")
    if features.get("Batuk", features.get("Coughing", 0)) == 1:
        risks.append("🟠 Batuk berulang — dapat memburuk malam atau pagi hari")
    if features.get("napas berat", 0) == 1:
        risks.append("🟠 Napas terasa berat — menandakan hambatan aliran udara")
    if features.get("NighttimeSymptoms", 0) == 1:
        risks.append("🟠 Gejala memburuk malam hari — tanda asma tidak terkontrol")

    # ── Faktor Risiko Utama ─────────────────────────────────────────────────────
    if features.get("riwayat keluarga", features.get("FamilyHistoryAsthma", 0)) == 1:
        risks.append("🧬 Riwayat penyakit asma keluarga — faktor genetik meningkatkan risiko 3–6×")
    if features.get("alergi", features.get("HistoryOfAllergies", 0)) == 1:
        risks.append("🌸 Riwayat alergi — kondisi atopik erat kaitannya dengan asma")
    if features.get("merokok", features.get("Smoking", 0)) == 1:
        risks.append("🚬 Merokok aktif — merusak epitel saluran napas dan memperparah peradangan")
    if features.get("gerd", features.get("GastroesophagealReflux", 0)) == 1:
        risks.append("🫀 GERD / refluks lambung — asam lambung dapat memicu bronkospasme")
    if features.get("PetAllergy", 0) == 1:
        risks.append("🐾 Alergi hewan peliharaan — alergen bulu/protein hewan memicu asma alergi")
    if features.get("Eczema", 0) == 1:
        risks.append("🩹 Riwayat eksim (atopic dermatitis) — bagian dari triad atopik bersama asma")
    if features.get("HayFever", 0) == 1:
        risks.append("🤧 Hay fever (rinitis alergi) — sangat berkorelasi dengan prevalensi asma")

    # ── Faktor Lingkungan ───────────────────────────────────────────────────────
    pollution = features.get("populasi udara", features.get("PollutionExposure", 0))
    if pollution == 1 or (isinstance(pollution, (int, float)) and float(pollution) >= 6.0):
        risks.append("🌫️ Paparan polusi udara tinggi — partikel PM2.5 memperparah inflamasi saluran napas")
    pollen = features.get("PollenExposure", 0)
    if isinstance(pollen, (int, float)) and float(pollen) >= 6.0:
        risks.append("🌼 Paparan serbuk sari tinggi — alergen udara utama pemicu serangan asma")
    dust = features.get("DustExposure", 0)
    if isinstance(dust, (int, float)) and float(dust) >= 6.0:
        risks.append("🌪️ Paparan debu tinggi — tungau debu adalah alergen dalam ruangan paling umum")

    # ── Faktor Fisik & Gaya Hidup ───────────────────────────────────────────────
    bmi = features.get("BMI", 0)
    if isinstance(bmi, (int, float)) and float(bmi) >= 28:
        risks.append(f"⚖️ BMI tinggi ({float(bmi):.1f} kg/m²) — obesitas meningkatkan beban mekanik paru dan peradangan sistemik")
    physical = features.get("PhysicalActivity", 10)
    if isinstance(physical, (int, float)) and float(physical) <= 3.0:
        risks.append("🏃 Aktivitas fisik sangat rendah — kurang gerak memperburuk kapasitas paru jangka panjang")
    sleep = features.get("SleepQuality", 10)
    if isinstance(sleep, (int, float)) and float(sleep) <= 4.0:
        risks.append("😴 Kualitas tidur buruk — gejala asma sering memburuk saat tidur malam")

    # ── Gejala Dataset Lokal Tambahan ───────────────────────────────────────────
    if features.get("dahak", 0) == 1:
        risks.append("💧 Ada dahak saat batuk — gejala pendukung akibat produksi lendir berlebih, bukan penanda utama asma")
    if features.get("ExerciseInduced", 0) == 1:
        risks.append("🏋️ Gejala dipicu olahraga (Exercise-Induced Bronchoconstriction)")
    if features.get("mudah lelah", 0) == 1:
        risks.append("😓 Mudah lelah — bisa mencerminkan penurunan kapasitas ventilasi")
    if features.get("penyakit bawaan", 0) == 1:
        risks.append("⚕️ Riwayat penyakit asma sebelumnya — riwayat asma dapat meningkatkan risiko kekambuhan")
    if features.get("penyakit_tb", 0) == 1:
        risks.append("🫁 Riwayat TB — dapat menyebabkan kerusakan jaringan paru permanen")
    if features.get("dm", 0) == 1:
        risks.append("🩸 Riwayat Diabetes Melitus — kondisi inflamasi kronis yang mempengaruhi fungsi paru")

    return risks


def should_apply_no_risk_local_rule(features, dataset_artifacts):
    """
    Rule Klinis #1 — TIDAK ASMA jika benar-benar semua atribut 0.
    Berlaku HANYA jika seluruh 23 fitur gejala+risiko bernilai 0, termasuk
    riwayat keluarga, alergi, merokok, dan paparan lingkungan.
    Divalidasi bersama dr. RSI Jakarta (lihat dokumentasi UAT).
    """
    if dataset_artifacts.get("dataset") != "local":
        return False

    return all(
        float(features.get(feature, 0)) == 0
        for feature in LOCAL_RISK_AND_SYMPTOM_FEATURES
    )


def should_apply_no_core_asthma_local_rule(features, dataset_artifacts):
    """
    Rule Klinis #2 — TIDAK ASMA jika tidak ada satupun gejala inti asma
    (sesak, mengi, nyeri dada, batuk, napas berat) DAN tidak ada
    faktor risiko utama pendukung (riwayat keluarga, alergi, GERD, polusi udara).
    Gejala pendukung/non-spesifik saja (termasuk dahak, pilek, demam, mual,
    pusing, lemas) tidak cukup
    untuk menegakkan asma.
    Divalidasi bersama dr. RSI Jakarta (lihat dokumentasi UAT).
    """
    if dataset_artifacts.get("dataset") != "local":
        return False

    return all(
        float(features.get(feature, 0)) == 0
        for feature in LOCAL_CORE_ASTHMA_FEATURES
    )


def should_apply_single_symptom_local_rule(features, dataset_artifacts):
    """
    Rule Klinis #3 — TIDAK ASMA jika HANYA satu gejala non-konfirmasi yang aktif
    (batuk saja, atau sesak saja, atau dahak saja, atau mudah lelah saja) tanpa gejala inti lain
    dan tanpa faktor risiko apapun.
    Catatan: rule ini TIDAK berlaku jika ada riwayat keluarga/alergi/GERD/dll.
    Divalidasi bersama dr. RSI Jakarta (lihat dokumentasi UAT).
    """
    if dataset_artifacts.get("dataset") != "local":
        return False

    active_features = [
        feature
        for feature in LOCAL_RISK_AND_SYMPTOM_FEATURES
        if float(features.get(feature, 0)) == 1
    ]
    return (
        len(active_features) == 1
        and active_features[0] in LOCAL_SINGLE_SYMPTOM_NEGATIVE_FEATURES
    )


def should_apply_smoking_without_asthma_indicator_rule(features, dataset_artifacts):
    """
    Rule Klinis #4 -- TIDAK ASMA jika pasien merokok aktif tetapi tidak ada
    gejala pernapasan inti (batuk, sesak, mengi, nyeri dada, napas berat)
    dan tidak ada riwayat asma/alergi pendukung (riwayat keluarga, alergi,
    penyakit bawaan, GERD). Dahak diperlakukan sebagai gejala pendukung,
    bukan indikator utama asma.
    Merokok meningkatkan risiko, tetapi tidak cukup untuk menetapkan hasil ASMA.
    """
    if dataset_artifacts.get("dataset") != "local":
        return False

    if float(features.get("merokok", 0)) != 1:
        return False

    return all(
        float(features.get(feature, 0)) == 0
        for feature in LOCAL_SMOKING_WITHOUT_ASTHMA_INDICATORS
    )


def resolve_dataset_artifacts(dataset_name):
    """Pilih pasangan model-scaler berdasarkan alias nama dataset dari frontend."""
    aliases = {
        "best": ARTIFACTS["best_dataset"],
        "dataset_b": "local",
        "local": "local",
        "dataset_a": "asthma",
        "asthma": "asthma",
    }
    key = aliases.get(str(dataset_name or "local").lower(), "local")
    datasets = ARTIFACTS.get("datasets", {})
    if key not in datasets:
        raise ValueError(f'Model dataset "{dataset_name}" tidak tersedia.')
    return datasets[key]


@app.route("/health", methods=["GET"])
def health():
    """Endpoint ringan untuk mengecek status model dan koneksi MySQL."""
    mysql_status = check_mysql_health()
    return jsonify({
        "status": "ok" if ARTIFACTS else "error",
        "message": None if ARTIFACTS else LOAD_ERROR,
        "model_loaded": ARTIFACTS is not None,
        "model_path": MODEL_PATH,
        "scaler_path": SCALER_PATH,
        "metadata_path": METADATA_PATH,
        "best_model": ARTIFACTS["best_model_name"] if ARTIFACTS else None,
        "best_dataset": ARTIFACTS["best_dataset"] if ARTIFACTS else None,
        "threshold": ARTIFACTS["threshold"] if ARTIFACTS else None,
        "features_count": len(ARTIFACTS["feature_names"]) if ARTIFACTS else 0,
        "available_datasets": list(ARTIFACTS.get("datasets", {}).keys()) if ARTIFACTS else [],
        "mysql_auth": mysql_status,
    })


@app.route("/model-info", methods=["GET"])
def model_info():
    """Kirim metadata model yang aktif dan ringkasan evaluasinya ke frontend."""
    if not ARTIFACTS:
        return jsonify({"success": False, "message": LOAD_ERROR}), 503

    metadata = ARTIFACTS["metadata"]
    best_result = next(
        (
            item for item in metadata.get("all_results", [])
            if item.get("label") == metadata.get("best_model")
        ),
        {},
    )

    # Kumpulkan peringatan per dataset berdasarkan metrik evaluasi
    dataset_warnings = {}
    for result in metadata.get("all_results", []):
        auc = result.get("test_metrics", {}).get("roc_auc", 1.0)
        ds = result.get("dataset", "")
        label = result.get("label", "")
        if auc < 0.6:
            dataset_warnings[label] = (
                f"ROC-AUC test sangat rendah ({auc:.4f} \u2248 0.5) pada {label}. "
                "Model tidak lebih baik dari tebakan acak pada data uji. "
                "Dataset ini TIDAK direkomendasikan untuk digunakan secara klinis. "
                "Kemungkinan penyebab: distribusi kelas tidak seimbang pada test set, "
                "atau threshold terlalu rendah sehingga hampir semua prediksi = positif."
            )

    return jsonify({
        "success": True,
        "model_name": ARTIFACTS["best_model_name"],
        "algorithm": ARTIFACTS["best_model_name"].split("-")[0].strip(),
        "dataset": ARTIFACTS["best_dataset"],
        "features": ARTIFACTS["feature_names"],
        "features_count": len(ARTIFACTS["feature_names"]),
        "threshold": ARTIFACTS["threshold"],
        "training_method": "ADASYN + Stratified K-Fold CV",
        "k_fold": best_result.get("k_fold"),
        "test_metrics": best_result.get("test_metrics"),
        "cv_summary": best_result.get("cv_summary"),
        "dataset_warnings": dataset_warnings if dataset_warnings else None,
        "available_datasets": {
            key: {
                "model_name": value["model_name"],
                "dataset": value["dataset"],
                "threshold": value["threshold"],
                "features_count": len(value["feature_names"]),
            }
            for key, value in ARTIFACTS.get("datasets", {}).items()
        },
    })


@app.route("/auth/register", methods=["POST"])
def register():
    """Buat akun baru dan simpan password dalam bentuk hash."""
    data = request.get_json(silent=True) or {}
    full_name = str(data.get("full_name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not full_name or not email or not password:
        return jsonify({
            "success": False,
            "message": "full_name, email, dan password wajib diisi.",
        }), 400

    if len(password) < 6:
        return jsonify({
            "success": False,
            "message": "Password minimal 6 karakter.",
        }), 400

    connection = None
    cursor = None

    try:
        ensure_users_table()
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        existing_user = cursor.fetchone()
        if existing_user:
            return jsonify({
                "success": False,
                "message": "Email sudah terdaftar. Silakan login.",
            }), 409

        password_hash = generate_password_hash(password)
        cursor.execute(
            """
            INSERT INTO users (full_name, email, password_hash)
            VALUES (%s, %s, %s)
            """,
            (full_name, email, password_hash),
        )
        connection.commit()

        return jsonify({
            "success": True,
            "message": "Registrasi berhasil.",
            "user_id": cursor.lastrowid,
        }), 201
    except (MySQLError, RuntimeError) as exc:
        return jsonify({
            "success": False,
            "message": f"Koneksi MySQL gagal: {exc}",
        }), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@app.route("/auth/login", methods=["POST"])
def login():
    """Autentikasi user dan kembalikan token JWT untuk dipakai frontend."""
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not email or not password:
        return jsonify({
            "success": False,
            "message": "Email dan password wajib diisi.",
        }), 400

    connection = None
    cursor = None

    try:
        ensure_users_table()
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT id, full_name, email, password_hash
            FROM users
            WHERE email = %s
            """,
            (email,),
        )
        user = cursor.fetchone()

        if not user or not check_password_hash(user["password_hash"], password):
            return jsonify({
                "success": False,
                "message": "Email atau password salah.",
            }), 401

        token = generate_token(user["id"], user["email"])
        return jsonify({
            "success": True,
            "message": "Login berhasil.",
            "user": sanitize_user(user),
            "token": token,
            "token_type": "Bearer",
            "expires_in_hours": JWT_EXPIRY_HOURS,
        })
    except (MySQLError, RuntimeError) as exc:
        return jsonify({
            "success": False,
            "message": f"Koneksi MySQL gagal: {exc}",
        }), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@app.route("/predict", methods=["POST"])
@require_auth
def predict():
    """Terima fitur pasien, jalankan model, lalu kembalikan hasil skrining."""
    if not ARTIFACTS:
        return jsonify({
            "success": False,
            "message": f"Model belum dimuat: {LOAD_ERROR}",
        }), 503

    data = request.get_json(silent=True)
    if not data or "features" not in data:
        return jsonify({
            "success": False,
            "message": 'Data tidak valid. Kirim JSON dengan field "features".',
        }), 400

    features_input = data["features"]
    if not isinstance(features_input, dict):
        return jsonify({
            "success": False,
            "message": 'Field "features" harus berupa object/dictionary.',
        }), 400

    try:
        dataset_artifacts = resolve_dataset_artifacts(data.get("dataset", "local"))
        normalized_features, missing_features = normalize_features(features_input, dataset_artifacts)
        feature_matrix = make_feature_matrix(normalized_features, dataset_artifacts)

        model_prediction, probabilities = predict_with_majority_probability(
            dataset_artifacts["model"],
            feature_matrix,
        )
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400
    except Exception as exc:
        return jsonify({"success": False, "message": f"Prediksi gagal: {exc}"}), 500

    probability_sehat = float(probabilities[0])
    probability_asma = float(probabilities[1])
    prediction = model_prediction
    clinical_rule_applied = None

    if should_apply_no_risk_local_rule(normalized_features, dataset_artifacts):
        prediction = 0
        clinical_rule_applied = {
            "name": "NO_RISK_OR_SYMPTOM_LOCAL",
            "message": (
                "Semua gejala, riwayat, dan faktor risiko lokal bernilai 0; "
                "hasil akhir skrining ditetapkan TIDAK ASMA."
            ),
            "model_prediction": model_prediction,
            "model_label": "ASMA" if model_prediction == 1 else "TIDAK ASMA",
            "model_probability_asma": pct(probability_asma),
            "model_probability_sehat": pct(probability_sehat),
        }
        probability_sehat = 1.0
        probability_asma = 0.0
    elif should_apply_single_symptom_local_rule(normalized_features, dataset_artifacts):
        prediction = 0
        clinical_rule_applied = {
            "name": "SINGLE_LOCAL_SYMPTOM",
            "message": (
                "Hanya satu gejala lokal non-konfirmasi yang aktif; "
                "hasil akhir skrining ditetapkan TIDAK ASMA."
            ),
            "model_prediction": model_prediction,
            "model_label": "ASMA" if model_prediction == 1 else "TIDAK ASMA",
            "model_probability_asma": pct(probability_asma),
            "model_probability_sehat": pct(probability_sehat),
        }
        probability_sehat = 1.0
        probability_asma = 0.0
    elif should_apply_no_core_asthma_local_rule(normalized_features, dataset_artifacts):
        prediction = 0
        clinical_rule_applied = {
            "name": "NO_CORE_ASTHMA_INDICATOR_LOCAL",
            "message": (
                "Tidak ada gejala inti atau faktor risiko utama pendukung asma lokal; "
                "gejala non-spesifik atau kebiasaan merokok saja tidak menetapkan hasil akhir ASMA."
            ),
            "model_prediction": model_prediction,
            "model_label": "ASMA" if model_prediction == 1 else "TIDAK ASMA",
            "model_probability_asma": pct(probability_asma),
            "model_probability_sehat": pct(probability_sehat),
        }
        probability_sehat = 1.0
        probability_asma = 0.0
    elif should_apply_smoking_without_asthma_indicator_rule(normalized_features, dataset_artifacts):
        prediction = 0
        clinical_rule_applied = {
            "name": "SMOKING_WITHOUT_ASTHMA_INDICATOR_LOCAL",
            "message": (
                "Status merokok tanpa sesak, batuk, mengi, atau riwayat asma pendukung "
                "tidak menetapkan hasil akhir ASMA."
            ),
            "model_prediction": model_prediction,
            "model_label": "ASMA" if model_prediction == 1 else "TIDAK ASMA",
            "model_probability_asma": pct(probability_asma),
            "model_probability_sehat": pct(probability_sehat),
        }
        probability_sehat = 1.0
        probability_asma = 0.0

    confidence = max(probability_sehat, probability_asma)

    comparison = {}
    for name, config in dataset_artifacts["optional_models"].items():
        try:
            _, model_probabilities = predict_with_majority_probability(
                config["model"],
                feature_matrix,
            )
            comparison[name] = {
                "prediction": prediction_from_majority_probability(
                    model_probabilities[1],
                    model_probabilities[0],
                ),
                "probability_asma": pct(model_probabilities[1]),
                "probability_sehat": pct(model_probabilities[0]),
                "threshold": 0.5,
            }
        except Exception:
            comparison[name] = None

    result_payload = {
        "success": True,
        "prediction": prediction,
        "label": "ASMA" if prediction == 1 else "TIDAK ASMA",
        "probability_asma": pct(probability_asma),
        "probability_sehat": pct(probability_sehat),
        "confidence_score": pct(confidence),
        "threshold": 0.5,
        "model_used": dataset_artifacts["model_name"],
        "dataset_used": dataset_artifacts["dataset"],
        "risk_factors": detect_risk_factors(normalized_features),
        "features_used": normalized_features,
        "missing_features_defaulted_to_zero": missing_features,
        "comparison": comparison,
        "clinical_rule_applied": clinical_rule_applied,
    }

    user_id = data.get("user_id")
    patient_name = str(data.get("patient_name", "")).strip()
    # Penyimpanan riwayat hanya dilakukan jika data identitas pasien ikut dikirim.
    if user_id and patient_name:
        screening_id, save_error = save_screening_result(
            user_id=user_id,
            patient_name=patient_name,
            dataset_mode=dataset_artifacts["dataset"],
            result_payload=result_payload,
            input_features=features_input,
        )
        result_payload["screening_id"] = screening_id
        if save_error:
            result_payload["save_warning"] = f"Hasil prediksi berhasil, tetapi gagal menyimpan riwayat: {save_error}"

    return jsonify(result_payload)


@app.route("/screenings", methods=["GET"])
@require_auth
def get_screenings():
    """Ambil seluruh riwayat skrining milik user yang sedang login."""
    user_id = request.current_user_id

    connection = None
    cursor = None
    try:
        ensure_database_tables()
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT id, user_id, patient_name, dataset_mode, model_used, prediction, label,
                   probability_asma, probability_sehat, confidence_score, created_at
            FROM screening_results
            WHERE user_id = %s
            ORDER BY created_at DESC
            """,
            (user_id,),
        )
        rows = cursor.fetchall()
        return jsonify({
            "success": True,
            "items": [serialize_screening(row) for row in rows],
        })
    except (MySQLError, RuntimeError) as exc:
        return jsonify({"success": False, "message": f"Koneksi MySQL gagal: {exc}"}), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@app.route("/screenings/stats", methods=["GET"])
@require_auth
def get_screening_stats():
    """Kirim ringkasan total hasil serta grafik mini per hari untuk profil."""
    user_id = request.current_user_id

    connection = None
    cursor = None
    try:
        ensure_database_tables()
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN prediction = 1 THEN 1 ELSE 0 END) AS asma_count,
                SUM(CASE WHEN prediction = 0 THEN 1 ELSE 0 END) AS non_asma_count
            FROM screening_results
            WHERE user_id = %s
            """,
            (user_id,),
        )
        totals = cursor.fetchone() or {}
        cursor.execute(
            """
            SELECT DATE(created_at) AS day, COUNT(*) AS total
            FROM screening_results
            WHERE user_id = %s
            GROUP BY DATE(created_at)
            ORDER BY day DESC
            LIMIT 7
            """,
            (user_id,),
        )
        daily_rows = cursor.fetchall()
        return jsonify({
            "success": True,
            "total": int(totals.get("total") or 0),
            "asma_count": int(totals.get("asma_count") or 0),
            "non_asma_count": int(totals.get("non_asma_count") or 0),
            "daily": [
                {
                    "day": row["day"].isoformat() if hasattr(row["day"], "isoformat") else str(row["day"]),
                    "total": int(row["total"] or 0),
                }
                for row in reversed(daily_rows)
            ],
        })
    except (MySQLError, RuntimeError) as exc:
        return jsonify({"success": False, "message": f"Koneksi MySQL gagal: {exc}"}), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@app.route("/screenings/<int:screening_id>", methods=["GET"])
@require_auth
def get_screening_detail(screening_id):
    """Ambil satu riwayat skrining lengkap untuk dibuka kembali di Result screen."""
    user_id = request.current_user_id

    connection = None
    cursor = None
    try:
        ensure_database_tables()
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT *
            FROM screening_results
            WHERE id = %s AND user_id = %s
            """,
            (screening_id, user_id),
        )
        row = cursor.fetchone()
        if not row:
            return jsonify({"success": False, "message": "Data skrining tidak ditemukan."}), 404

        item = serialize_screening(row, include_details=True)
        result_payload = item.pop("result_payload", {}) or {}
        result_payload.update({
            "screening_id": item["id"],
            "patient_name": item["patient_name"],
            "dataset_used": item["dataset_mode"],
            "model_used": item["model_used"],
            "prediction": item["prediction"],
            "label": item["label"],
            "probability_asma": item["probability_asma"],
            "probability_sehat": item["probability_sehat"],
            "confidence_score": item["confidence_score"],
            "threshold": item["threshold"],
            "risk_factors": item["risk_factors"],
        })

        return jsonify({
            "success": True,
            "item": item,
            "result": result_payload,
            "input_features": item["input_features"],
        })
    except (MySQLError, RuntimeError) as exc:
        return jsonify({"success": False, "message": f"Koneksi MySQL gagal: {exc}"}), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@app.route("/screenings/<int:screening_id>/pdf", methods=["GET"])
def export_screening_pdf(screening_id):
    """Ekspor satu hasil skrining ke PDF yang bisa diunduh pengguna."""
    # PDF dibuka langsung di browser (Linking.openURL), tidak bisa kirim header.
    # Validasi token dari query param sebagai alternatif aman.
    token = request.args.get("token", "")
    if not token:
        return jsonify({"success": False, "message": "Token tidak ditemukan."}), 401
    try:
        payload = decode_token(token)
        user_id = int(payload["sub"])
    except Exception as exc:
        return jsonify({"success": False, "message": f"Token tidak valid: {exc}"}), 401

    connection = None
    cursor = None
    try:
        ensure_database_tables()
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT *
            FROM screening_results
            WHERE id = %s AND user_id = %s
            """,
            (screening_id, user_id),
        )
        row = cursor.fetchone()
        if not row:
            return jsonify({"success": False, "message": "Data skrining tidak ditemukan."}), 404

        item = serialize_screening(row, include_details=True)
        pdf = build_screening_pdf(item)
        filename = f"hasil-skrining-{screening_id}.pdf"
        return send_file(pdf, mimetype="application/pdf", as_attachment=True, download_name=filename)
    except (MySQLError, RuntimeError) as exc:
        return jsonify({"success": False, "message": f"Koneksi MySQL gagal: {exc}"}), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


if __name__ == "__main__":
    mysql_status = check_mysql_health()
    print("=" * 60)
    print("  AsthmaScreen - Flask Backend")
    if ARTIFACTS:
        print(f"  Model terbaik : {ARTIFACTS['best_model_name']}")
        print(f"  Dataset       : {ARTIFACTS['best_dataset']}")
        print(f"  Threshold     : {ARTIFACTS['threshold']}")
        print(f"  Fitur         : {len(ARTIFACTS['feature_names'])} atribut")
    else:
        print(f"  Model gagal dimuat: {LOAD_ERROR}")
    print(f"  MySQL Auth    : {mysql_status['message']}")
    print("  Server        : http://0.0.0.0:5000")
    print("=" * 60)
    app.run(host="0.0.0.0", port=5000, debug=True)
