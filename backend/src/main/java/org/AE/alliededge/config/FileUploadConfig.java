package org.AE.alliededge.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class FileUploadConfig implements WebMvcConfigurer {
    // This configuration class is now obsolete because all media files are served from Cloudinary.
    // It is kept as an empty shell to avoid bean resolution issues if referenced, but does nothing.
}
