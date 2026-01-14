package org.AE.alliededge.service;

import org.AE.alliededge.model.User;
import org.AE.alliededge.repository.UserRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;
import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        String storedRole = user.getRole();
        // DB role values are stored like ROLE_AUTHOR / ROLE_ADMIN.
        // Avoid double-prefixing (ROLE_ROLE_AUTHOR), which breaks @PreAuthorize checks.
        String authority = (storedRole != null && storedRole.toUpperCase().startsWith("ROLE_"))
                ? storedRole.toUpperCase()
                : "ROLE_" + String.valueOf(storedRole).toUpperCase();

        List<GrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(authority));

        return new CustomUserDetails(user, authorities);
    }

    /**
     * Custom UserDetails implementation that exposes the underlying User entity
     * and the profileImageUrl field for use in Thymeleaf templates (e.g. navbar avatar).
     */
    public static class CustomUserDetails implements UserDetails {
        private final User user;
        private final List<GrantedAuthority> authorities;

        public CustomUserDetails(User user, List<GrantedAuthority> authorities) {
            this.user = user;
            this.authorities = authorities;
        }

        public User getUser() {
            return user;
        }

        public String getProfileImageUrl() {
            return user.getProfileImageUrl();
        }

        @Override
        public Collection<? extends GrantedAuthority> getAuthorities() {
            return authorities;
        }

        @Override
        public String getPassword() {
            return user.getPassword();
        }

        @Override
        public String getUsername() {
            return user.getUsername();
        }

        @Override
        public boolean isAccountNonExpired() {
            return true;
        }

        @Override
        public boolean isAccountNonLocked() {
            return true;
        }

        @Override
        public boolean isCredentialsNonExpired() {
            return true;
        }

        @Override
        public boolean isEnabled() {
            return !user.isBanned();
        }
    }
}
