package org.AE.alliededge.config;

import org.AE.alliededge.service.CloudinaryService;
import org.AE.alliededge.service.FakeCloudinaryService;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

@TestConfiguration
public class TestCloudinaryConfig {

    @Bean
    @Primary
    public CloudinaryService cloudinaryService() {
        return new FakeCloudinaryService();
    }
}

