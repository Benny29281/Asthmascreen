-- Buat database utama aplikasi jika belum tersedia.
CREATE DATABASE IF NOT EXISTS asthma_db;
USE asthma_db;

-- Tabel users menyimpan akun yang bisa login ke aplikasi mobile.
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel screening_results menyimpan riwayat hasil skrining per pengguna.
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
);
