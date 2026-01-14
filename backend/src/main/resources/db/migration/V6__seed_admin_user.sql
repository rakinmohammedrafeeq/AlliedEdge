-- Seed admin user if not exists
INSERT INTO users (username, password, role)
SELECT 'admin', '$2a$10$FQ8FGRCher7X4Lmjt8DENUJLG7I8qrfN8BZ52BpNr44/Xo8XdKF3C', 'ROLE_ADMIN'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');
-- Password plaintext: password
