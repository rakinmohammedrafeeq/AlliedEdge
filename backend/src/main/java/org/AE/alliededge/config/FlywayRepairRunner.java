package org.AE.alliededge.config;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Temporary runner to automatically repair Flyway schema history on startup
 * in order to fix checksum mismatches (e.g. for migration version 12).
 *
 * IMPORTANT: Remove this class once the repair has successfully run once
 * and the application starts cleanly.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@ConditionalOnProperty(value = "flyway.repair.enabled", havingValue = "true")
@ConditionalOnBean(Flyway.class)
public class FlywayRepairRunner implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(FlywayRepairRunner.class);

    private final Flyway flyway;

    public FlywayRepairRunner(Flyway flyway) {
        this.flyway = flyway;
    }

    @Override
    public void run(String... args) {
        logger.warn("Running Flyway.repair() at startup to fix migration metadata issues (temporary runner)");
        try {
            flyway.repair();
            logger.info("Flyway schema repair executed successfully.");
        } catch (Exception ex) {
            logger.error("Flyway repair failed", ex);
        }
    }
}
