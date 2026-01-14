package org.AE.alliededge.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Enable a simple in-memory message broker to send messages to clients
        registry.enableSimpleBroker("/topic");
        // Set application destination prefix for messages from clients
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register /ws/chat endpoint with SockJS fallback
        registry.addEndpoint("/ws/chat")
                .setAllowedOriginPatterns("http://localhost:5173", "http://127.0.0.1:5173")
                .withSockJS();

        // Realtime post stats (likes/comments)
        registry.addEndpoint("/ws/posts")
                .setAllowedOriginPatterns("http://localhost:5173", "http://127.0.0.1:5173")
                .withSockJS();
    }
}
