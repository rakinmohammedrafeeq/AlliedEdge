package org.AE.alliededge.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // Local filesystem handlers for /uploads and /profile-uploads have been removed.
    // All media is now served directly from Cloudinary URLs, so no ResourceHandler is needed here.

}
