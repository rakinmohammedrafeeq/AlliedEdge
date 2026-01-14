package org.AE.alliededge.service;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {
    private final byte[] secret;
    private final long expirationSeconds;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expirationSeconds:86400}") long expirationSeconds
    ) {
        this.secret = secret.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        this.expirationSeconds = expirationSeconds;
    }

    public String sign(String subject, Map<String, Object> claims) {
        try {
            Instant now = Instant.now();
            Instant exp = now.plusSeconds(expirationSeconds);
            JWTClaimsSet.Builder cb = new JWTClaimsSet.Builder()
                    .subject(subject)
                    .issueTime(Date.from(now))
                    .expirationTime(Date.from(exp));
            if (claims != null) {
                claims.forEach(cb::claim);
            }
            JWTClaimsSet claimSet = cb.build();
            SignedJWT signedJWT = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claimSet);
            signedJWT.sign(new MACSigner(secret));
            return signedJWT.serialize();
        } catch (Exception e) {
            throw new RuntimeException("Failed to sign JWT", e);
        }
    }
}
