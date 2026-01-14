package org.AE.alliededge.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {
    @Override
    public void run(String... args) {
        // Admin seeding handled by Flyway migration V6__seed_admin_user.sql
    }
}
