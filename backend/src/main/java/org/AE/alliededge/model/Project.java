package org.AE.alliededge.model;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "project")
public class Project {

    @Transient
    private static final ObjectMapper JSON = new ObjectMapper().findAndRegisterModules();

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    // Frontend uses summary/description; keep legacy 'description' but persist the richer fields too.
    @Column(length = 1000)
    private String summary;

    @Column(length = 1000)
    private String description;

    @Column(length = 64)
    private String status;

    @Column(length = 2000)
    private String problem;

    @Column(length = 2000)
    private String built;

    @Column(length = 255)
    private String role;

    @Column(name = "tech_stack_json", columnDefinition = "TEXT")
    private String techStackJson;

    @Column(name = "proof_links_json", columnDefinition = "TEXT")
    private String proofLinksJson;

    // Legacy URL field (used by older parts of the app)
    @Column(name = "project_url", length = 500)
    private String projectUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Constructors
    public Project() {
    }

    public Project(String title, String description, String projectUrl, User user) {
        this.title = title;
        this.description = description;
        this.projectUrl = projectUrl;
        this.user = user;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getProblem() {
        return problem;
    }

    public void setProblem(String problem) {
        this.problem = problem;
    }

    public String getBuilt() {
        return built;
    }

    public void setBuilt(String built) {
        this.built = built;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public List<String> getTechStack() {
        if (techStackJson == null || techStackJson.isBlank()) return Collections.emptyList();
        try {
            return JSON.readValue(techStackJson, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    public void setTechStack(List<String> techStack) {
        try {
            this.techStackJson = techStack == null ? null : JSON.writeValueAsString(techStack);
        } catch (Exception e) {
            this.techStackJson = null;
        }
    }

    public Map<String, Object> getProofLinks() {
        if (proofLinksJson == null || proofLinksJson.isBlank()) return Collections.emptyMap();
        try {
            return JSON.readValue(proofLinksJson, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }

    public void setProofLinks(Map<String, Object> proofLinks) {
        try {
            this.proofLinksJson = proofLinks == null ? null : JSON.writeValueAsString(proofLinks);
        } catch (Exception e) {
            this.proofLinksJson = null;
        }
    }

    public String getProjectUrl() {
        return projectUrl;
    }

    public void setProjectUrl(String projectUrl) {
        this.projectUrl = projectUrl;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
