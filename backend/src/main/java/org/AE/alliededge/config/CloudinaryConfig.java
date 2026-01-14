package org.AE.alliededge.config;

import com.cloudinary.Cloudinary;
import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class CloudinaryConfig {

    @Bean
    public Cloudinary cloudinary() {
        // Load from environment or .env file (dotenv will also see real env vars)
        Dotenv dotenv = Dotenv.configure()
                .ignoreIfMissing()
                .load();

        String cloudName = getenvOrDefault("CLOUDINARY_CLOUD_NAME", dotenv);
        String apiKey = getenvOrDefault("CLOUDINARY_API_KEY", dotenv);
        String apiSecret = getenvOrDefault("CLOUDINARY_API_SECRET", dotenv);

        if (cloudName == null || apiKey == null || apiSecret == null) {
            throw new IllegalStateException("Cloudinary credentials are not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.");
        }

        Map<String, Object> config = new HashMap<>();
        config.put("cloud_name", cloudName);
        config.put("api_key", apiKey);
        config.put("api_secret", apiSecret);
        config.put("secure", true);

        return new Cloudinary(config);
    }

    private String getenvOrDefault(String key, Dotenv dotenv) {
        String fromEnv = System.getenv(key);
        if (fromEnv != null && !fromEnv.isBlank()) {
            return fromEnv;
        }
        String fromDotEnv = dotenv.get(key);
        if (fromDotEnv != null && !fromDotEnv.isBlank()) {
            return fromDotEnv;
        }
        return null;
    }
}

