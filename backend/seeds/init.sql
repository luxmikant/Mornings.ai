-- Agentic PR Manager — Database Initialization
-- Runs automatically on first docker compose up

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════
-- Cultural Verses (Shloka Knowledge Base) with vector embeddings
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS cultural_verses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verse_text TEXT NOT NULL,
    transliteration TEXT,
    meaning_hi TEXT,
    meaning_en TEXT,
    deity VARCHAR(100),
    occasion TEXT[],             -- Array of occasions this verse fits
    language VARCHAR(10) DEFAULT 'sa_IN',
    source VARCHAR(300),        -- e.g., 'Rigveda 1.89.1'
    embedding vector(1024),     -- Bedrock Titan Embed v2 dimension
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_cultural_verses_embedding
    ON cultural_verses USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 10);

-- Index for deity filtering
CREATE INDEX IF NOT EXISTS idx_cultural_verses_deity
    ON cultural_verses (deity);

-- ═══════════════════════════════════════════════════════════
-- Seed: Sample Cultural Events for 2026
-- ═══════════════════════════════════════════════════════════
INSERT INTO cultural_events (id, canonical_name, display_title, event_type, event_date, significance_summary, presiding_deity, auspicious_muhurta, lookahead_days)
VALUES
    (uuid_generate_v4(), 'MAKAR_SANKRANTI', 'मकर संक्रांति', 'SOLAR_FESTIVAL', '2026-01-14',
     'Sun transitions into Capricorn (Makar Rashi). Marks the beginning of Uttarayan. Devotees take holy dips and offer til-gur.',
     'SURYA', '06:15 to 12:30 IST', 1),

    (uuid_generate_v4(), 'BASANT_PANCHAMI', 'बसंत पंचमी — सरस्वती पूजा', 'PANCHANG_TITHI', '2026-02-01',
     'Celebrates the arrival of spring and honors Goddess Saraswati, the deity of knowledge, music, and arts.',
     'SARASWATI', '07:00 to 12:15 IST', 1),

    (uuid_generate_v4(), 'MAHA_SHIVRATRI', 'महा शिवरात्रि', 'PANCHANG_TITHI', '2026-02-15',
     'The great night of Lord Shiva. Devotees observe fasting and night-long vigil. Shiva Lingas are bathed with milk and honey.',
     'SHIVA', '00:00 to 06:00 IST (Night vigil)', 2),

    (uuid_generate_v4(), 'HOLI', 'होली — रंगों का त्योहार', 'SOLAR_FESTIVAL', '2026-03-17',
     'Festival of colors celebrating the victory of good over evil. Associated with the legend of Prahlad and Holika.',
     'VISHNU', 'Evening: Holika Dahan; Morning: Rang Panchami', 2),

    (uuid_generate_v4(), 'RAM_NAVAMI', 'राम नवमी', 'PANCHANG_TITHI', '2026-04-04',
     'Celebrates the birth of Lord Rama, seventh avatar of Vishnu. Devotees recite Ramayana and visit temples.',
     'RAMA', '11:00 to 13:30 IST', 1),

    (uuid_generate_v4(), 'HANUMAN_JAYANTI', 'हनुमान जयंती', 'PANCHANG_TITHI', '2026-04-14',
     'Celebrates the birth of Lord Hanuman, the devoted servant of Lord Rama. Devotees recite Hanuman Chalisa.',
     'HANUMAN', '05:30 to 08:00 IST', 1),

    (uuid_generate_v4(), 'INDEPENDENCE_DAY', 'स्वतंत्रता दिवस', 'NATIONAL_HOLIDAY', '2026-08-15',
     'India''s Independence Day. Celebrates freedom from British colonial rule in 1947. The national flag is hoisted.',
     NULL, NULL, 3),

    (uuid_generate_v4(), 'GANESH_CHATURTHI', 'गणेश चतुर्थी', 'PANCHANG_TITHI', '2026-08-22',
     'Birth of Lord Ganesha, the remover of obstacles. Clay idols are installed and worshipped for 10 days.',
     'GANESHA', '11:00 to 13:30 IST', 3),

    (uuid_generate_v4(), 'JANMASHTAMI', 'श्री कृष्ण जन्माष्टमी', 'PANCHANG_TITHI', '2026-09-04',
     'Celebrates the birth of Lord Krishna, eighth avatar of Vishnu. Midnight celebrations with bhajans and dahi handi.',
     'KRISHNA', '00:00 to 02:00 IST (Midnight)', 2),

    (uuid_generate_v4(), 'NAVRATRI_START', 'शारदीय नवरात्रि', 'PANCHANG_TITHI', '2026-10-08',
     'Nine nights dedicated to Goddess Durga. Each day worships a different form of the divine feminine.',
     'DURGA', '06:00 to 08:00 IST', 9),

    (uuid_generate_v4(), 'DUSSEHRA', 'दशहरा — विजयादशमी', 'PANCHANG_TITHI', '2026-10-17',
     'Celebrates Lord Rama''s victory over Ravana. Effigies of Ravana are burnt. Marks triumph of good over evil.',
     'RAMA', '14:00 to 16:30 IST (Vijay Muhurat)', 2),

    (uuid_generate_v4(), 'DIWALI', 'दीपावली — दीपों का त्योहार', 'SOLAR_FESTIVAL', '2026-11-05',
     'Festival of lights celebrating Lord Rama''s return to Ayodhya. Homes are decorated with diyas and rangoli. Lakshmi Puja is performed.',
     'LAKSHMI', '17:30 to 20:00 IST (Pradosh Kaal)', 7),

    (uuid_generate_v4(), 'DEV_DEEPAWALI', 'देव दीपावली एवं कार्तिक पूर्णिमा', 'PANCHANG_TITHI', '2026-11-24',
     'Celebration of Lord Shiva''s victory over Tripurasura. Gods descend to earth and light lamps on the ghats of Varanasi.',
     'SHIVA', '17:15 to 19:45 IST', 1),

    (uuid_generate_v4(), 'REPUBLIC_DAY', 'गणतंत्र दिवस', 'NATIONAL_HOLIDAY', '2026-01-26',
     'Commemorates the adoption of the Constitution of India in 1950. Grand parade at Rajpath, New Delhi.',
     NULL, NULL, 3),

    (uuid_generate_v4(), 'GANDHI_JAYANTI', 'गांधी जयंती', 'NATIONAL_HOLIDAY', '2026-10-02',
     'Birth anniversary of Mahatma Gandhi, Father of the Nation. A day to reflect on truth and non-violence.',
     NULL, NULL, 1),

    (uuid_generate_v4(), 'GURU_PURNIMA', 'गुरु पूर्णिमा', 'PANCHANG_TITHI', '2026-07-11',
     'Day to honor and express gratitude towards teachers and spiritual guides. Dedicated to sage Ved Vyasa.',
     NULL, '07:00 to 10:00 IST', 1),

    (uuid_generate_v4(), 'RAKSHA_BANDHAN', 'रक्षा बंधन', 'PANCHANG_TITHI', '2026-08-11',
     'Celebrates the bond between brothers and sisters. Sisters tie a protective thread (rakhi) on brothers'' wrists.',
     NULL, '06:00 to 17:30 IST', 2)
ON CONFLICT DO NOTHING;
