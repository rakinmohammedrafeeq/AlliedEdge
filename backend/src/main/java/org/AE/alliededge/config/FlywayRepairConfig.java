package org.AE.alliededge.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;

/**
 * Repairs Flyway schema history (useful after editing an already applied migration)
 * BEFORE running migrate, preventing checksum mismatch failures at startup.
 *
 * NOTE: Remove this class once the repair has executed successfully (one-time fix).
 */
@Configuration
public class FlywayRepairConfig {
    private static final Logger log = LoggerFactory.getLogger(FlywayRepairConfig.class);

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            try {
                log.warn("[FlywayRepair] Executing flyway.repair() prior to migrate to resolve checksum mismatches.");
                flyway.repair();
                log.info("[FlywayRepair] Repair completed. Proceeding with migrate...");
                flyway.migrate();
                log.info("[FlywayRepair] Migrate completed successfully.");
            } catch (Exception ex) {
                log.error("[FlywayRepair] Failed during Flyway repair/migrate sequence", ex);
                throw ex; // propagate so startup still fails if unrecoverable
            }
        };
    }
}

